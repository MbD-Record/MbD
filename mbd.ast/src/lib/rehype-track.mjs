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