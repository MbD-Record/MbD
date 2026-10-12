/**
 * Print (or append) an artwork.json block for a Bandcamp URL.
 *
 * Adding an entry means adding its artwork to src/data/artwork.json, and the
 * block has to carry all seven `match` fields -- omit `year` or `genre` and the
 * inferred JSON type stops overlapping ArtworkMatch, so `astro check` fails
 * with "neither type sufficiently overlaps". That error is easy to misread as
 * "widen the cast", which would hide the real problem.
 *
 * So the block is built here rather than by hand.
 *
 * Usage:
 *   node scripts/og.mjs <url> [<url> ...]     print a block for each
 *   node scripts/og.mjs --write <url> ...     append them to artwork.json
 *
 * Bandcamp is reachable from this machine; the *client* is what gets
 * challenged, not the User-Agent. A challenged request returns HTTP 200 with a
 * ~3 KB body, so the status code proves nothing -- the length and the marker
 * are the test. See GOTCHAS.md section 12.
 *
 * `--write` is idempotent: a URL already in the cache is skipped.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTWORK = path.join(ROOT, 'src', 'data', 'artwork.json');

/** Match either attribute order, which Bandcamp uses inconsistently. */
const meta = (html, prop) =>
  new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html)?.[1] ??
  new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i').exec(html)?.[1];

const decode = (s) =>
  s == null ? null : s.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/**
 * "Pedro's Dream, by Héctor Lepe" -> { artist, album }.
 *
 * Split on the LAST ", by ". Splitting on the first comma is wrong: albums
 * contain commas ("Mechviruses, by Front Line Assembly" has only one, but
 * "St. Vincent, by St. Vincent" style titles do not, and titles like
 * "Blonde, by Frank Ocean" vs "Blonde, Frank Ocean, by Someone" do). Taking
 * everything before the last marker as the album is the right heuristic.
 */
function splitTitle(pageTitle) {
  const i = pageTitle.lastIndexOf(', by ')
  if (i === -1) return { artist: pageTitle, album: '' }
  return { album: pageTitle.slice(0, i), artist: pageTitle.slice(i + 5) }
}

async function fetchOne(url) {
  let normalised = url.trim()
  if (!/^https?:\/\//i.test(normalised)) normalised = 'https://' + normalised
  const res = await fetch(normalised, { signal: AbortSignal.timeout(20000) })
  const body = await res.text()
  const challenged = body.length < 8000 || /Client Challenge|_fs-ch/i.test(body)
  if (challenged) {
    return { url: normalised, error: `CHALLENGED (${body.length} bytes, status ${res.status})` }
  }
  const pageTitle = decode(meta(body, 'title'))
  if (!pageTitle) return { url: normalised, error: 'no og:title on the page' }
  const { artist, album } = splitTitle(pageTitle)
  return {
    url: normalised,
    block: {
      url: normalised,
      artist,
      album,
      year: null,
      art: meta(body, 'image') ?? null,
      audio: null,
      match: {
        source: 'bandcamp',
        artist,
        album,
        year: null,
        genre: null,
        link: normalised,
        score: null,
        pageTitle,
      },
      status: 'ok (bandcamp)',
    },
  }
}

const argv = process.argv.slice(2)
const write = argv.includes('--write')
const urls = argv.filter((a) => !a.startsWith('--'))
if (!urls.length) {
  console.error('usage: node scripts/og.mjs [--write] <url> [<url> ...]')
  process.exit(2)
}

const results = []
for (const url of urls) {
  try {
    results.push(await fetchOne(url))
  } catch (e) {
    results.push({ url, error: e.message })
  }
}

const ok = results.filter((r) => r.block)
const bad = results.filter((r) => r.error)
for (const r of ok) {
  console.log(`\n${r.url}`)
  console.log(`  artist  ${r.block.artist}`)
  console.log(`  album   ${r.block.album || '(none)'}`)
  console.log(`  art     ${r.block.art}`)
  console.log(`  title   ${r.block.match.pageTitle}`)
}
if (bad.length) {
  console.log(`\n${bad.length} failed:`)
  for (const r of bad) console.log(`  ${r.url}\n    ${r.error}`)
}

if (write) {
  const raw = fs.readFileSync(ARTWORK, 'utf8')
  const cache = JSON.parse(raw)
  const added = []
  const skipped = []
  for (const r of ok) {
    if (cache[r.url]) {
      skipped.push(r.url)
      continue
    }
    added.push([r.url, r.block])
  }
  if (!added.length) {
    console.log(`\nnothing to add (${skipped.length} already cached)`)
  } else {
    // Rebuild by text insertion so the rest of the file is not reformatted.
    // The cache is in enrichment-run order and is deliberately NOT sorted.
    const tail = raw.replace(/\s*$/, '')
    const insert = added
      .map(([url, b]) => `,\n  ${JSON.stringify(url, null, 2).replace(/\n/g, '\n  ')}: ${JSON.stringify(b, null, 2).split('\n').join('\n  ').trimStart()}`)
      .join('')
    fs.writeFileSync(ARTWORK, `${tail}${insert}\n}\n`)
    console.log(`\nappended ${added.length} entr${added.length > 1 ? 'ies' : 'y'} to artwork.json`)
    for (const [url] of added) console.log(`  + ${url}`)
  }
  if (skipped.length) {
    console.log(`skipped, already cached:`)
    for (const u of skipped) console.log(`  = ${u}`)
  }
}