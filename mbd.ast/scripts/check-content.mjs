/**
 * Content invariants.
 *
 * These are the rules the posts have to keep, checked so that breaking one is
 * a failed build rather than a silently wrong page. Every rule here exists
 * because it was broken at least once:
 *
 *   - one H1 per post, because 2019 had a second one for its first month and
 *     the sidebar rendered the title as if it were a month;
 *   - month headings are real months, because 2020 kept "NOV 2020" as plain
 *     text and those months never reached navigation;
 *   - no bare URLs, because they render as raw text with no label;
 *   - no `[x](null)`, because that is a real link to the string "null" --
 *     it builds cleanly, ships a dead href, and costs the entry its row;
 *   - no <br> and no tabs, because they stopped entries sharing a line and
 *     the release-row pass then had nothing to split on;
 *   - an entry paragraph holds nothing but entry links, because rehype-release
 *     matches on paragraph shape and rejects the WHOLE paragraph otherwise --
 *     one bare-text entry takes its neighbours' rows down with it, silently;
 *   - an entry in To Do that is also on another page comes off the To Do page,
 *     because that is what "already listened to" looks like;
 *   - the artwork cache parses, because the row plugin reads it at build time
 *     and a malformed one degrades every thumbnail to a monogram.
 *
 * The heading rules come from CONTENT-STRUCTURE.md at the repo root. That
 * document is the specification; this file is its enforcement, and the two
 * must be changed together.
 *
 * Page type is decided by FILENAME. It used to be decided by content -- "does
 * this file contain a bare-year H2" -- which meant that editing headings could
 * silently switch a file to a different ruleset. See TODO_LEGACY_H2.
 *
 * Run: node scripts/check-content.mjs   (exit code 1 on any failure)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BLOG = path.join(ROOT, 'src', 'content', 'blog')
const ARTWORK = path.join(ROOT, 'src', 'data', 'artwork.json')

const MONTHS = new Set([
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
])

/** H3 sections, per CONTENT-STRUCTURE.md section 4. */
const SECTIONS = new Set([
  'albums', 'artists', 'tracks', 'lists', 'labels', 'to do', 'listen again',
])
/** Sections only the To Do page uses -- the owner's own groupings. */
const TODO_ONLY_SECTIONS = new Set(['metal/hardcore'])
/** 2017.md is the backlog page: no months, so its H2s are sections. */
const BACKLOG_H2 = new Set(['albums', 'tracks', 'lists'])
/** Never sections. They were notes beside entries, not categories. */
const BANNED_SECTIONS = new Set([
  'hip hop', 'noise', 'similar artists', 'new albums to listen', 'explore',
  'playlists', // maps to Lists; see CONTENT-STRUCTURE.md section 4
])

/**
 * Heading forms on the To Do page that the restructure will remove. They are
 * reported as pending, not failed, so the build stays green while the
 * migration is outstanding and the countdown stays visible.
 *
 * The bare years (## 2017, ## 2021) are NOT here: they are legal under the
 * spec too, where only the year is known.
 */
const TODO_LEGACY_H2 = new Set(['catching up', 'older'])

/**
 * Navigation order for posts that are not years: years descending, then
 * `older`, then `to-do`. See `byYearDesc` in src/lib/entries.ts and
 * CONTENT-STRUCTURE.md §1.
 *
 * This does NOT re-sort — a copy of the comparator here would be free to drift
 * from the real one, which is the exact failure this repo keeps hitting. It
 * guards the *input* instead: a new non-year post that nobody gave a rank
 * sorts to the end of everything, silently. That is the case worth catching.
 */
const NON_YEAR_ORDER = ['older', 'to-do'];

/**
 * An entry line: a link, optionally followed by a tracking annotation. */
const ENTRY_LINE = /^\[(.+)\]\((https?:\/\/[^)]+)\)(\s*\*[^*]+\*)?\s*$/
/**
 * An annotation that means "this one stays listed" — the mark mechanism in
 * CONTENT-STRUCTURE.md §7. Deliberately wider than TRACKED in
 * rehype-track.mjs: that plugin's class never reaches a release row (it runs
 * first and rehype-release then replaces the paragraph, so .mbd-row__note is
 * what styles a note on the page). So this list tracks the annotation
 * *vocabulary*, not the renderer, and "listened" belongs here even though it
 * is not in TRACKED.
 */
const KEEPS_ENTRY = /^\*?\s*(added|heard|listened|todo|to do)\b/i

const failures = []
const pending = []
const fail = (file, line, rule, detail) => failures.push({ file, line, rule, detail })
const note = (file, line, rule, detail) => pending.push({ file, line, rule, detail })

/**
 * Frontmatter keys the collection schema accepts. z.object() STRIPS unknown
 * keys silently rather than rejecting them, so a stray `imgUrl:` or a typo
 * produces a clean build and an entry that quietly loses the field. That is
 * the same silent failure as everything else here, so it is checked here.
 */
const FRONTMATTER_KEYS = new Set([
  'title', 'description', 'pubDate', 'draft', 'tags', 'buttonLabel',
])

/** `layout:` is the one key that must NEVER appear. */
const BANNED_FRONTMATTER_KEYS = new Set(['layout'])

/** Strip an HTML comment so its prose is never mistaken for content. */
function withoutComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
}

/** Page type by filename. Never by content -- see the header comment. */
function pageKind(file) {
  if (/^to-do\.md$/i.test(file)) return 'todo'
  if (/^older\.md$/i.test(file)) return 'older'
  if (/^2017\.md$/i.test(file)) return 'backlog'
  if (/^(19|20)\d{2}\.md$/.test(file)) return 'year'
  return 'unknown'
}

/** "September / October" and "APR 2024" both count as month headings. */
function isMonthHeading(text) {
  const parts = text
    .toLowerCase()
    .replace(/\.\s*$/, '')
    .split(/[\/\-–&]/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (!parts.length) return false
  return parts.every((p) => MONTHS.has(p) || MONTHS.has(p.slice(0, 3)))
}

/** An H2 on the To Do page: <Month> <Year>, a bare year, or "Oldest". */
function isTodoH2(text) {
  const t = text.trim()
  if (/^(19|20)\d{2}$/.test(t)) return true
  if (/^oldest$/i.test(t)) return true
  const stripped = t.replace(/\b(19|20)\d{2}\b/g, ' ').trim()
  return stripped !== '' && isMonthHeading(stripped)
}

/** Every entry line in the content, for the cross-page checks. */
const allEntries = []

for (const file of fs.readdirSync(BLOG).filter((f) => f.endsWith('.md')).sort()) {
  const raw = fs.readFileSync(path.join(BLOG, file), 'utf8').replace(/^﻿/, '')
  const lines = raw.split(/\r?\n/)
  const body = withoutComments(raw).split(/\r?\n/)
  const kind = pageKind(file)

  // frontmatter, skipped for the content rules
  let start = 0
  const close = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
  if (close > 0) start = close + 1

  // ---- frontmatter invariants, checked on the raw lines ----
  //
  // `pubDate` is free text on purpose ("through 2024", "Ongoing", "In the
  // past"), and the schema coerces it with `new Date(str)`, so most values
  // become Invalid Date. That is fine and expected. What is NOT fine is a
  // value that looks like a date and is not -- "2024-13-45" or a typo in a
  // real date -- because nothing downstream complains and the feed prints
  // "Invalid Date". So only a date-shaped value is held to being a date.
  const frontmatter = new Map()
  for (let i = 1; i < close; i++) {
    const m = lines[i].match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    frontmatter.set(key, m[2].trim())
    if (BANNED_FRONTMATTER_KEYS.has(key)) {
      fail(file, i + 1, 'frontmatter-layout', `"${key}:" -- Astro 4 then renders an unstyled page with no error. [slug].astro applies the layout itself.`)
    } else if (!FRONTMATTER_KEYS.has(key)) {
      fail(file, i + 1, 'frontmatter-unknown-key', `"${key}:" is not in the schema, and z.object() strips unknown keys silently -- the field would just vanish`)
    }
  }
  const pub = frontmatter.get('pubDate')
  if (pub === undefined) {
    fail(file, 1, 'frontmatter-pubdate', 'no pubDate')
  } else if (!pub) {
    fail(file, 1, 'frontmatter-pubdate', 'pubDate is empty')
  } else if (/^\d{4}/.test(pub) && Number.isNaN(new Date(pub).getTime())) {
    fail(file, 1, 'frontmatter-pubdate', `"${pub}" looks like a date but does not parse to one`)
  }

  let h1 = 0
  const paragraph = []

  const flushParagraph = () => {
    if (paragraph.length > 1) {
      const entries = paragraph.filter((p) => ENTRY_LINE.test(p.s))
      const others = paragraph.filter((p) => !ENTRY_LINE.test(p.s))
      // A paragraph that mixes entry links with anything else is rejected whole
      // by the release-row transform, so every entry in it silently loses its
      // row. This is the 22-row bug: one bare-text entry beside five links.
      if (entries.length && others.length) {
        fail(
          file,
          others[0].i + 1,
          'paragraph-shape',
          `${others.length} non-entry line(s) mixed with ${entries.length} entry link(s) in one paragraph -- the whole paragraph loses its rows: "${others[0].s.slice(0, 60)}"`,
        )
      }
    }
    paragraph.length = 0
  }

  for (let i = 0; i < body.length; i++) {
    const s = body[i].trim()
    const rawLine = lines[i]
    if (i < start) continue

    // Checked before the heading branch, which `continue`s. A tab inside a
    // heading used to slip through entirely, and `##\tJanuary` matches the
    // heading regex, so the old ordering never saw it.
    if (rawLine.includes('\t')) fail(file, i + 1, 'tab-character', s)

    const h = s.match(/^(#{1,6})\s+(.+)$/)
    if (h) {
      flushParagraph()
      const depth = h[1].length
      const text = h[2].trim()
      const key = text.toLowerCase().replace(/\s+/g, ' ').trim()

      if (depth === 1) {
        h1++
        if (h1 > 1) fail(file, i + 1, 'single-h1', `second H1: "${text}"`)
      } else if (depth === 2) {
        if (kind === 'todo') {
          if (!isTodoH2(text)) {
            if (TODO_LEGACY_H2.has(key)) {
              note(file, i + 1, 'todo-legacy-h2', `"${text}" -- restructure pending`)
            } else {
              fail(file, i + 1, 'todo-heading', `"${text}" is neither "<Month> <Year>", a bare year, nor "Oldest"`)
            }
          }
        } else if (kind === 'backlog') {
          if (!BACKLOG_H2.has(key)) {
            fail(file, i + 1, 'month-heading', `"${text}" -- 2017.md has sections at H2, not months`)
          }
        } else if (!isMonthHeading(text)) {
          fail(file, i + 1, 'month-heading', `"${text}" is not a month`)
        }
      } else if (depth === 3) {
        if (kind === 'todo' && isMonthHeading(text)) {
          note(file, i + 1, 'todo-legacy-h3', `"${text}" is a month at H3 -- should be an H2 block -- restructure pending`)
        } else if (!SECTIONS.has(key) && !TODO_ONLY_SECTIONS.has(key)) {
          const banned = BANNED_SECTIONS.has(key) ? ' (banned: it was a note, not a section)' : ''
          fail(file, i + 1, 'section-heading', `unknown section "${text}"${banned}`)
        }
      }
      continue
    }

    if (!s) {
      flushParagraph()
      continue
    }
    if (/^https?:\/\//.test(s)) fail(file, i + 1, 'bare-url', s)
    if (/<br/i.test(s)) fail(file, i + 1, 'br-tag', s)
    // `[Label](null)` is a *valid* link whose target is the string "null". It
    // builds cleanly and ships a dead href, and rehype-release bails on it
    // (it only accepts http(s)), so the entry loses its row as well. An entry
    // with no known URL must be written as bare text instead.
    if (/\]\(\s*null\s*\)/i.test(s)) fail(file, i + 1, 'null-link', s)

    paragraph.push({ i, s })
    const entry = s.match(ENTRY_LINE)
    if (entry) {
      allEntries.push({
        file,
        line: i + 1,
        url: entry[2],
        note: (entry[3] || '').trim(),
        label: entry[1],
      })
    }
  }
  flushParagraph()

  if (h1 === 0) fail(file, 1, 'single-h1', 'no H1 at all')
  if (h1 > 1) fail(file, 1, 'single-h1', `${h1} H1 headings`)
}

/**
 * An entry listed on the To Do page and anywhere else has been recorded where
 * it is no longer pending, so the To Do copy goes. A tracking annotation is the
 * one thing that makes keeping it deliberate -- see CONTENT-STRUCTURE.md §7.
 *
 * Only link entries can be checked. A bare-text To-Do entry has no URL to
 * match on and is invisible to this rule.
 */
const urlKey = (u) => u.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase()
const elsewhere = new Map()
for (const e of allEntries) {
  if (e.file === 'To-Do.md') continue
  const k = urlKey(e.url)
  if (!elsewhere.has(k)) elsewhere.set(k, [])
  elsewhere.get(k).push(e)
}
for (const e of allEntries) {
  if (e.file !== 'To-Do.md') continue
  if (e.note && KEEPS_ENTRY.test(e.note)) continue
  const hits = elsewhere.get(urlKey(e.url))
  if (!hits) continue
  const where = hits.map((h) => `${h.file}:${h.line}`).join(', ')
  fail(
    e.file,
    e.line,
    'to-do-elsewhere',
    `"${e.label.slice(0, 50)}" is also at ${where} -- remove it from To Do, or annotate it if it is meant to stay`,
  )
}

/**
 * Every content file that is not a year must have an explicit place in the
 * navigation order. See NON_YEAR_ORDER above.
 */
for (const file of fs.readdirSync(BLOG).filter((f) => f.endsWith('.md')).sort()) {
  const slug = file.replace(/\.md$/, '').toLowerCase()
  if (/^(19|20)\d{2}$/.test(slug)) continue
  if (!NON_YEAR_ORDER.includes(slug)) {
    fail(file, 1, 'nav-order', `"${slug}" is not a year and is not in the navigation order list [${NON_YEAR_ORDER.join(', ')}] — byYearDesc would sort it after everything, silently`)
  }
}

try {
  const cache = JSON.parse(fs.readFileSync(ARTWORK, 'utf8'))
  if (!cache || typeof cache !== 'object' || Array.isArray(cache)) throw new Error('not an object')
} catch (e) {
  fail('src/data/artwork.json', 0, 'artwork-cache', `unparseable: ${e.message}`)
}

if (pending.length) {
  console.log(`${pending.length} heading(s) still on the pre-restructure form (not failing):`)
  const byRule = pending.reduce((acc, p) => ((acc[p.rule] = (acc[p.rule] || 0) + 1), acc), {})
  for (const [rule, n] of Object.entries(byRule)) console.log(`  ${rule}: ${n}`)
  console.log('  see CONTENT-STRUCTURE.md §3 and MIGRATION-PLAN.md\n')
}

if (failures.length === 0) {
  console.log('content checks passed')
} else {
  const byRule = failures.reduce((acc, f) => ((acc[f.rule] = (acc[f.rule] || 0) + 1), acc), {})
  console.error(`content checks failed: ${failures.length}\n`)
  for (const [rule, n] of Object.entries(byRule)) console.error(`  ${rule}: ${n}`)
  console.error('')
  for (const f of failures.slice(0, 40)) {
    console.error(`  ${f.file}:${f.line}  [${f.rule}]  ${f.detail}`)
  }
  if (failures.length > 40) console.error(`  ... and ${failures.length - 40} more`)
  process.exit(1)
}