/**
 * Marks up queue-tracking annotations so they can be styled without catching
 * ordinary italics.
 *
 * Four forms are recognised, all written as trailing emphasis on an entry line:
 *
 *   [Artist - Album](url) *added Aug 2023*            <- still in the To Do list
 *   [Artist - Album](url) *todo Aug 2023 -> Oct 2026* <- promoted out of it
 *   [Artist - Album](url) *heard Oct 2026*            <- added date not known
 *   [Artist - Album](url) *To Do Old - heard Oct 2026* <- no date at all
 *
 * Any <em> inside a post whose text starts with "added", "heard", "todo" or
 * "to do" gets class="mbd-track". Deliberately hand-rolled rather than using
 * unist-util-visit, so this adds no dependency the project does not already
 * declare. Astro's markdown pipeline is unified-based and already accepts
 * plugins through `markdown.rehypePlugins` in astro.config.ts.
 *
 * ⚠ INERT FOR ENTRY NOTES. This plugin runs first in astro.config.ts, and
 * rehype-release then replaces the whole paragraph with generated row markup
 * that renders the note as `<span class="mbd-row__note">` — discarding the
 * annotated <em>. Measured: `mbd-track` occurs zero times in dist/. Entry
 * notes are styled by .mbd-row__note in global.css, which is what you are
 * looking at on the page. Do not add words to TRACKED expecting them to style a
 * row note; they will not. It only affects emphasis that survives outside a row.
 */

const TRACKED = /^(added|heard|todo|to do)\b/i

function textOf(node) {
  if (typeof node.value === 'string') return node.value
  if (!node.children) return ''
  return node.children.map(textOf).join('')
}

function walk(node) {
  if (!node || typeof node !== 'object') return
  if (node.type === 'element' && node.tagName === 'em') {
    if (TRACKED.test(textOf(node).trim())) {
      node.properties = node.properties || {}
      const existing = node.properties.className
      const classes = Array.isArray(existing) ? existing : existing ? String(existing).split(/\s+/) : []
      if (!classes.includes('mbd-track')) classes.push('mbd-track')
      node.properties.className = classes
    }
  }
  if (Array.isArray(node.children)) node.children.forEach(walk)
}

export default function rehypeTrackAnnotations() {
  return (tree) => walk(tree)
}