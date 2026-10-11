/**
 * The compact release row, as an HTML string.
 *
 * Single source of truth for the markup. Two consumers:
 *
 *   - rehype-release.mjs, which turns entry paragraphs in the markdown into
 *     these rows so the real blog pages render them.
 *   - Release.astro, for anywhere the row is used directly.
 *
 * Having both emit the same string means the component and the live pages
 * cannot drift apart.
 */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/

/** Split "Artist - Album" into its parts; an entry with no album is artist-only. */
export function splitLabel(label) {
  const sep = label.indexOf(' - ')
  if (sep === -1) return { artist: label, album: '' }
  return { artist: label.slice(0, sep), album: label.slice(sep + 3) }
}

/**
 * Pick a thumbnail. YouTube derives from the video id without any request;
 * everything else comes from the committed artwork cache.
 */
export function resolveThumb(url, label, artwork = {}) {
  const yt = url.match(YOUTUBE_ID)
  if (yt) {
    return { kind: 'image', src: `https://i.ytimg.com/vi/${yt[1]}/mqdefault.jpg`, width: 320, height: 180 }
  }
  const cached = artwork[url]?.art
  if (cached) return { kind: 'image', src: cached, width: 600, height: 600 }
  return { kind: 'monogram', letter: (String(label || '?').trim()[0] ?? '?').toUpperCase() }
}

function thumbHtml(thumb) {
  if (thumb.kind === 'image') {
    return (
      `<img class="mbd-row__thumb" src="${esc(thumb.src)}" alt="" ` +
      `width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async">`
    )
  }
  return `<span class="mbd-row__thumb flex items-center justify-center font-bold" aria-hidden="true">${esc(thumb.letter)}</span>`
}

/**
 * @param {{url:string, label?:string, artist?:string, album?:string,
 *          note?:string, border?:'plain'|'offset', artwork?:object}} opts
 */
export function rowHtml(opts) {
  const { url, note, border = 'plain', artwork = {} } = opts
  const { artist, album } =
    opts.artist !== undefined ? { artist: opts.artist, album: opts.album ?? '' } : splitLabel(opts.label ?? '')

  const thumb = resolveThumb(url, artist || album || url, artwork)

  const label = []
  if (artist) label.push(`<strong>${esc(artist)}</strong>`)
  if (artist && album) label.push('<span class="font-normal"> — </span>')
  if (album) label.push(esc(album))
  if (!artist && !album) label.push(`<span class="break-all">${esc(url)}</span>`)

  const parts = [
    `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="mbd-row${
      border === 'offset' ? ' mbd-row--offset' : ''
    }">`,
    thumbHtml(thumb),
    `<span class="mbd-row__label">${label.join('')}</span>`,
  ]
  if (note) parts.push(`<span class="mbd-row__note">${esc(note)}</span>`)
  parts.push('</a>')

  return parts.join('')
}