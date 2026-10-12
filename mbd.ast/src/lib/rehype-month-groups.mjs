/**
 * Group each month into a single container.
 *
 * Markdown posts are flat: the H1 title, then the months as siblings of their
 * own content. To give a month a real outline -- one bounded area holding its
 * Albums, Tracks and To Do -- the H2 and everything after it up to the next H2
 * have to be wrapped in an element. That is a tree transform; CSS alone cannot
 * join siblings.
 *
 * The H1 and anything before the first H2 stay outside every group, so the
 * title is never inside a month box.
 *
 * The wrapper carries `mbd-card` plus a rotating `mbd-card--N`, which is where
 * the card treatment comes from. Those classes used to be defined on a
 * `2026-test.astro` lab page that previewed this layout; the lab pages are
 * gone and the live pages are the only consumer, so if you change the card
 * styling, change it in global.css and check a real post.
 */

// Tile rotation. Month index 0 draws the first.
const TILES = ['mbd-card--1', 'mbd-card--2', 'mbd-card--3', 'mbd-card--4', 'mbd-card--5']

export default function rehypeMonthGroups() {
  const isSection = (n) =>
    n?.type === 'element' &&
    Array.isArray(n.properties?.className) &&
    n.properties.className.includes('mbd-month')

  const group = (node) => {
    if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return

    const out = []
    let current = null
    let monthIndex = -1
    for (const child of node.children) {
      const isH2 = child.type === 'element' && child.tagName === 'h2'
      if (isH2) {
        if (current) out.push(current)
        monthIndex++
        current = {
          type: 'element',
          tagName: 'section',
          properties: {
            className: ['mbd-month', 'mbd-card', TILES[monthIndex % TILES.length]],
          },
          children: [child],
        }
        continue
      }
      if (current) current.children.push(child)
      else out.push(child)
    }
    if (current) out.push(current)
    node.children = out

    // Recurse, but not into a group just created: its leading child is itself
    // an h2, and grouping again there would nest a second month inside it.
    for (const child of node.children) {
      if (isSection(child)) continue
      group(child)
    }
  }

  return (tree) => group(tree)
}
