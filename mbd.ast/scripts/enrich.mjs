/**
 * Build-time artwork/metadata enrichment.
 *
 * Bandcamp is asked first, because it is the source of truth for the link in
 * the post and the only provider that can see Bandcamp-only releases. It is
 * reachable from this machine: Node's `fetch` gets the page normally and the
 * `og:image` / `og:title` meta tags come straight back. (The oEmbed endpoint
 * returns "bad function" and is not used.)
 *
 * When the post does not link to Bandcamp, or Bandcamp has no art, fall back to
 * catalogues that allow anonymous server-side requests:
 *
 *   iTunes Search API   metadata, 600x600 art, 30s .m4a previews   (no key)
 *   Deezer API          largest catalogue, 1000x1000 art, previews   (no key)
 *   Cover Art Archive   highest-resolution scans, needs polite UA    (no key)
 *
 * Results are cached to src/data/artwork.json keyed by the source URL. The site
 * only ever reads that cache, so builds never touch the network and a flaky
 * lookup can never break a deploy.
 *
 * Usage:
 *   node scripts/enrich.mjs            enrich anything not already cached
 *   node scripts/enrich.mjs --force    re-fetch everything
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CACHE = path.join(ROOT, 'src', 'data', 'artwork.json')

const FORCE = process.argv.includes('--force')
const UA = 'MbD-site/1.0 (https://github.com/MbD-Record/MbD; enrichment build script)'

/* ---------------------------------------------------------------------------
 * Seed list for the test page. In production this is parsed out of the blog
 * markdown instead; the shape is the same: the URL that is already in the post
 * plus the artist and album text written next to it.
 * ------------------------------------------------------------------------- */
const SEED = [
  { url: 'https://dancewiththedead.bandcamp.com/album/the-shape', artist: 'Dance With the Dead', album: 'The Shape', year: 2019 },
  { url: 'https://chontheband.bandcamp.com/album/chon', artist: 'CHON', album: 'CHON', year: 2019 },
  { url: 'https://teethofthesea.bandcamp.com/album/wraith', artist: 'Teeth of the Sea', album: 'Wraith', year: 2019 },
  { url: 'https://bloodincantation.bandcamp.com/album/absolute-truth', artist: 'Blood Incantation', album: 'Absolute Truth', year: 2019 },
  { url: 'https://fievelisglauque.bandcamp.com/album/flaming-swords', artist: 'Fievel Is Glauque', album: 'Flaming Swords', year: 2024 },
  { url: 'https://www.daily.bandcamp.com', artist: 'Cool Pulses', album: 'DEEP DARK', year: 2024 },
  { url: 'https://desperatejournalist.bandcamp.com/album/desperate-journalist', artist: 'Desperate Journalist', album: '', year: 2019 },
  { url: 'https://quanta-dub.bandcamp.com/album/fragmented', artist: 'Quanta', album: 'Fragmented', year: 2019 },

  // Used by the compact-row demo so the lab renders with real covers.
  { url: 'https://soulglophl.bandcamp.com/album/live-wkdu', artist: 'Soul Glo', album: 'Live @ WKDU', year: 2021 },
  { url: 'https://wakegrind.bandcamp.com/album/devouring-ruin', artist: 'Wake', album: 'Devouring Ruin', year: 2021 },
  { url: 'https://elephant-gym.bandcamp.com/album/underwater', artist: 'Elephant Gym', album: 'Underwater', year: 2021 },
  { url: 'https://kryptox-music.bandcamp.com/album/mathias-modica-presents-kraut-jazz-futurism-vol-2', artist: 'Mathias Modica', album: 'Kraut Jazz Futurism Vol. 2', year: 2021 },
  { url: 'https://contrasttrio.bandcamp.com/album/letila-zozulya', artist: 'Contrast Trio', album: 'Letila Zozulya', year: 2021 },
  { url: 'https://slothrust.bandcamp.com/album/parallel-timeline', artist: 'Slothrust', album: 'Parallel Timeline', year: 2021 },
  { url: 'https://kinkajous.bandcamp.com/album/nothing-will-disappear', artist: 'Kinkajous', album: 'Nothing Will Disappear', year: 2024 },
  { url: 'https://keygenchurch.bandcamp.com/album/tenebre-rosso-sangue', artist: 'Keygen Church', album: 'Tenebre Rosso Sangue', year: 2024 },
]

/* -------------------------------------------------------------------------- */

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Collapse a title to comparable form: lowercase, punctuation-free, no noise. */
function normalise(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\(.*?\)|\[.*?\]/g, '') // drop bracketed suffixes
    .replace(/\b(remaster(ed)?|reissue|version|edit|mix|ep|album|lp|expanded|deluxe|anniversary)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** 0..1 similarity, good enough to rank candidates and reject nonsense. */
function similarity(a, b) {
  a = normalise(a)
  b = normalise(b)
  if (!a || !b) return 0
  if (a === b) return 1
  const at = new Set(a.split(' '))
  const bt = new Set(b.split(' '))
  const shared = [...at].filter(w => bt.has(w)).length
  return shared / Math.max(at.size, bt.size)
}

async function getJSON(url, { headers = {}, timeout = 15000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, ...headers },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/* --- providers ------------------------------------------------------------ */

/**
 * Bandcamp first: it is the source of truth for the link in the post, and the
 * only one that can see Bandcamp-only releases.
 *
 * Fastly answers a challenged request with HTTP 200 and a ~3 KB "Client
 * Challenge" body, so `res.ok` alone proves nothing -- check the body for the
 * marker. Node's `fetch` is served normally and needs no special User-Agent;
 * PowerShell's `Invoke-WebRequest` is the client that gets challenged, so never
 * probe Bandcamp from PowerShell. See GOTCHAS.md section 12.
 *
 * The `_5` suffix is the 700px rendition, plenty for a 38px thumbnail and
 * always present. `_10` is 1200px but 404s when the upload is smaller.
 */
async function fromBandcamp(url) {
  if (!/^https?:\/\/[^/]+\.bandcamp\.com\//.test(url)) return null
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA_BROWSER,
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()
    if (/Client Challenge|_fs-ch/.test(html)) return null

    const img = html.match(/<meta property="og:image" content="([^"]*)"/)
    const title = html.match(/<meta property="og:title" content="([^"]*)"/)
    if (!img) return null

    return {
      source: 'bandcamp',
      artist: null,
      album: null,
      year: null,
      genre: null,
      art: img[1],
      audio: null,
      link: null,
      score: null,
      title: title ? decodeEntities(title[1].trim()) : null,
    }
  } catch {
    return null
  }
}

const UA_BROWSER =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/126.0.0.0 Safari/537.36'

function decodeEntities(s) {
  const map = { amp: '&', '#39': "'", '#039': "'", quot: '"', lt: '<', gt: '>' }
  return s.replace(/&([a-z#0-9]+);/gi, (m, k) => map[k] ?? map[k.toLowerCase()] ?? m)
}

async function fromItunes(artist, album) {
  const term = [artist, album].filter(Boolean).join(' ')
  const data = await getJSON(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=5`
  )
  if (!data?.results?.length) return null

  const ranked = data.results
    .map(r => ({
      source: 'itunes',
      artist: r.artistName,
      album: r.collectionName,
      year: r.releaseDate ? Number(r.releaseDate.slice(0, 4)) : null,
      genre: r.primaryGenreName,
      art: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : null,
      audio: null,
      link: r.collectionViewUrl,
      score:
        similarity(artist, r.artistName) * 0.6 +
        (album ? similarity(album, r.collectionName) * 0.4 : 0.4),
    }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0]
  return best.score >= 0.5 ? best : null
}

async function fromDeezer(artist, album) {
  const q = album ? `artist:"${artist}" album:"${album}"` : `artist:"${artist}"`
  const data = await getJSON(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`)
  if (!data?.data?.length) return null

  const ranked = data.data
    .map(r => ({
      source: 'deezer',
      artist: r.artist?.name,
      album: r.title,
      year: null,
      genre: null,
      art: r.cover_xl || r.cover_big || null,
      audio: r.preview || null,
      link: r.link,
      score:
        similarity(artist, r.artist?.name) * 0.6 +
        (album ? similarity(album, r.title) * 0.4 : 0.4),
    }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0]
  return best.score >= 0.5 ? best : null
}

async function fromCoverArtArchive(artist, album) {
  if (!artist || !album) return null
  const query = `release:"${album}" AND artist:"${artist}"`
  const mb = await getJSON(
    `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=1`
  )
  const release = mb?.releases?.[0]
  if (!release) return null
  if (similarity(artist, release['artist-credit']?.[0]?.name || '') < 0.5) return null

  // Cover Art Archive asks for no more than one request per second.
  await sleep(1100)
  const caa = await getJSON(`https://coverartarchive.org/release/${release.id}`)
  const front = caa?.images?.find(i => i.types?.includes('Front')) || caa?.images?.[0]
  if (!front) return null

  return {
    source: 'coverartarchive',
    artist,
    album,
    year: release.date ? Number(String(release.date).slice(0, 4)) : null,
    genre: null,
    art: front.thumbnails?.['1000'] || front.thumbnails?.['500'] || null,
    audio: null,
    link: null,
    score: null, // never wins on its own, only upgrades `art`
  }
}

/**
 * 30-second previews only appear on track-level results, never on album
 * results, so this is a separate lookup against the matched artist+album.
 * Returns one .m4a; the site uses it as a hover/click sample, not as the
 * release itself.
 */
async function findPreview(artist, album) {
  if (!artist) return null
  const term = [artist, album].filter(Boolean).join(' ')
  const data = await getJSON(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=8`
  )
  const tracks = (data?.results || []).filter(r => r.previewUrl)
  if (!tracks.length) return null

  // Prefer a track that is actually on the album we matched.
  const scored = tracks
    .map(t => ({ url: t.previewUrl, name: t.trackName, score: album ? similarity(album, t.collectionName) : 0.5 }))
    .sort((a, b) => b.score - a.score)

  return scored[0].url
}

/* --- driver --------------------------------------------------------------- */

function loadCache() {
  if (!fs.existsSync(CACHE)) return {}
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'))
  } catch {
    return {}
  }
}

async function enrichOne(entry) {
  // Bandcamp first: if the post links to a Bandcamp page, that page's own art
  // is the right answer, and it exists for releases no other catalogue has.
  const bc = await fromBandcamp(entry.url)
  if (bc?.art) {
    const audio = await findPreview(entry.artist, entry.album)
    return {
      ...entry,
      art: bc.art,
      audio: audio || null,
      match: {
        source: 'bandcamp',
        artist: entry.artist,
        album: entry.album,
        year: null,
        genre: null,
        link: entry.url,
        score: null,
        pageTitle: bc.title,
      },
      status: 'ok (bandcamp)',
    }
  }

  const candidates = []
  const [it, dz] = await Promise.all([
    fromItunes(entry.artist, entry.album),
    fromDeezer(entry.artist, entry.album),
  ])
  if (it) candidates.push(it)
  if (dz) candidates.push(dz)
  candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const best = candidates[0]
  const art = best?.art || null

  if (!best) return { ...entry, art: null, audio: null, match: null, status: 'no-match' }

  // Cover Art Archive only ever supplies a higher-resolution image.
  let hi = null
  if (art) {
    const caa = await fromCoverArtArchive(entry.artist, entry.album)
    if (caa?.art) hi = caa.art
  }

  const audio = best.audio || (await findPreview(best.artist || entry.artist, best.album || entry.album))

  return {
    ...entry,
    art: hi || art,
    audio: audio || null,
    match: {
      source: best.source,
      artist: best.artist,
      album: best.album,
      year: best.year,
      genre: best.genre,
      link: best.link,
      score: best.score,
    },
    status: hi ? 'ok (CAA art)' : 'ok',
  }
}

/**
 * Read entries straight out of the blog markdown: any line that is exactly
 * "[Artist - Album](url)" plus an optional tracking annotation. Keeps the
 * cache in step with the content instead of a hand-maintained list.
 *
 *   node scripts/enrich.mjs                 everything
 *   node scripts/enrich.mjs --file=2026.md  just one post
 */
function scanMarkdown() {
  const blogDir = path.join(ROOT, 'src', 'content', 'blog')
  const only = process.argv.find((a) => a.startsWith('--file='))
  const wanted = only ? only.slice('--file='.length) : null
  const out = []

  for (const f of fs.readdirSync(blogDir)) {
    if (!f.endsWith('.md')) continue
    if (wanted && f !== wanted) continue
    const text = fs.readFileSync(path.join(blogDir, f), 'utf8').replace(/^\uFEFF/, '')
    for (const line of text.split(/\r?\n/)) {
      const m = line
        .trim()
        .match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)(?:\s*\*[^*]+\*)?\s*$/)
      if (!m) continue
      const label = m[1]
      const sep = label.indexOf(' - ')
      out.push({
        url: m[2],
        artist: sep === -1 ? label : label.slice(0, sep),
        album: sep === -1 ? '' : label.slice(sep + 3),
        year: null,
      })
    }
  }
  return out
}

const cache = loadCache()
const scanned = scanMarkdown()

const seen = new Set()
const ALL = [...SEED, ...scanned].filter((s) => {
  if (seen.has(s.url)) return false
  seen.add(s.url)
  return true
})
console.log(`seed ${SEED.length} + scanned ${scanned.length} -> ${ALL.length} unique urls\n`)

const results = []

for (const seed of ALL) {
  if (!FORCE && cache[seed.url]?.status?.startsWith('ok')) {
    console.log(`cached   ${seed.artist} - ${seed.album}`)
    results.push(cache[seed.url])
    continue
  }
  process.stdout.write(`fetching ${seed.artist} - ${seed.album} ... `)
  const res = await enrichOne(seed)
  console.log(`${res.status}${res.art ? ' (art)' : ''}${res.audio ? ' (audio)' : ''}`)
  cache[seed.url] = res
  results.push(res)
  await sleep(400) // be polite between records
}

fs.mkdirSync(path.dirname(CACHE), { recursive: true })
fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2) + '\n')

const withArt = results.filter(r => r.art).length
console.log(
  `\n${withArt}/${results.length} matched with artwork -> ${path.relative(ROOT, CACHE)}`
)