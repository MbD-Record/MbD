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
 *     text and those months never reached the sidebar;
 *   - no bare URLs, because they render as raw text with no label;
 *   - no <br> and no tabs, because they stopped entries sharing a line and
 *     the release-row pass then had nothing to split on;
 *   - the artwork cache parses, because the row plugin reads it at build time
 *     and a malformed one degrades every thumbnail to a monogram.
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
const SECTIONS = new Set(['albums', 'tracks', 'lists', 'to do', 'listen again', 'playlists', 'similar artists'])

const failures = []
const fail = (file, line, rule, detail) => failures.push({ file, line, rule, detail })

/** Strip an HTML comment so its prose is never mistaken for content. */
function withoutComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
}

for (const file of fs.readdirSync(BLOG).filter((f) => f.endsWith('.md')).sort()) {
  const raw = fs.readFileSync(path.join(BLOG, file), 'utf8').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/)
  const body = withoutComments(raw).split(/\r?\n/)

  // Two shapes exist. Year posts go H1 > H2 month > H3 section. To-Do.md
  // groups by year instead, so its H3 is a month and its sections sit at H2.
  const groupedByYear = body.some((l) => /^##\s+(19|20)\d{2}\s*$/.test(l.trim()))

  // frontmatter, skipped for the content rules
  let start = 0
  const close = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
  if (close > 0) start = close + 1

  let h1 = 0
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
      const depth = h[1].length
      const text = h[2].trim()
      if (depth === 1) {
        h1++
        if (h1 > 1) fail(file, i + 1, 'single-h1', `second H1: "${text}"`)
      } else if (depth === 2) {
        if (groupedByYear) {
          // H2 here is a year bucket or one of the named groups.
          if (!/^(19|20)\d{2}$/.test(text.trim()) && !/^(catching up|to do old)$/i.test(text.trim())) {
            fail(file, i + 1, 'year-heading', `"${text}" is neither a year nor a known group`)
          }
          continue
        }
        // A month, or -- on backlog pages with no months, like 2017 -- one of
        // the standing sections. Anything else is a typo that would never
        // reach the sidebar.
        const key = text.toLowerCase().replace(/\s*\d{4}\s*$/, '').trim()
        const isMonth = key.split(/[\/\-–&]/).every((p) => MONTHS.has(p.trim()))
        const isSection = /^(albums|tracks|lists|listen again|to do)$/.test(key)
        if (!isMonth && !isSection) {
          fail(file, i + 1, 'month-heading', `"${text}" is neither a month nor a known section`)
        }
      } else if (depth === 3) {
        const key = text.toLowerCase().replace(/\s+/g, ' ')
        if (groupedByYear) {
          // a month, a standing section label, or one of the few fixed groups
          const label = SECTIONS.has(key) || /^(to do old|metal\/hardcore|labels|catching up)$/.test(key)
          if (!MONTHS.has(key) && !label) {
            fail(file, i + 1, 'section-heading', `unknown heading "${text}"`)
          }
          continue
        }
        const known =
          SECTIONS.has(key) ||
          /^(hip hop|noise|explore|new albums to listen|similar artists)$/.test(key)
        if (!known) fail(file, i + 1, 'section-heading', `unknown section "${text}"`)
      }
      continue
    }

    if (!s) continue
    if (/^https?:\/\//.test(s)) fail(file, i + 1, 'bare-url', s)
    if (/<br/i.test(s)) fail(file, i + 1, 'br-tag', s)
  }

  if (h1 === 0) fail(file, 1, 'single-h1', 'no H1 at all')
  if (h1 > 1) fail(file, 1, 'single-h1', `${h1} H1 headings`)
}

try {
  const cache = JSON.parse(fs.readFileSync(ARTWORK, 'utf8'))
  if (!cache || typeof cache !== 'object' || Array.isArray(cache)) throw new Error('not an object')
} catch (e) {
  fail('src/data/artwork.json', 0, 'artwork-cache', `unparseable: ${e.message}`)
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