/**
 * Turns entry paragraphs in the blog markdown into compact release rows.
 *
 * An "entry" is a paragraph whose entire content is one link, optionally
 * followed by a tracking annotation:
 *
 *     [Artist - Album](url)
 *     [Artist - Album](url) *heard Oct 2026*
 *
 * Markdown renders each of those as a single <p> holding an <a> and maybe an
 * <em>. Anything else -- prose, a bare URL, a heading, a multi-link
 * paragraph -- is left completely alone, so a post that ever mixes prose and
 * lists still renders correctly.
 *
 * Astro components cannot be injected into markdown output, so this emits the
 * row markup directly. It shares rowHtml() with Release.astro, so the live
 * pages and the component can never drift apart.
 */

import fs from 'node:fs';
import path from 'node:path';
import { rowHtml } from './release-row.mjs';

const ART = path.resolve(process.cwd(), 'src/data/artwork.json');
let artworkCache = null;
function artwork() {
  if (artworkCache) return artworkCache;
  try {
    artworkCache = JSON.parse(fs.readFileSync(ART, 'utf8'));
  } catch {
    artworkCache = {};
  }
  return artworkCache;
}

const isSpace = (n) => n.type === 'text' && !n.value.trim()
const tagOf = (n) => (n.type === 'element' ? n.tagName : null)

/** Collect the text of a subtree. */
function textOf(node) {
  if (typeof node.value === 'string') return node.value
  if (!node.children) return ''
  return node.children.map(textOf).join('')
}

/** Build the hast replacement for one paragraph, or null if it is not entries.
 *
 * A paragraph can hold several entries: markdown joins consecutive source
 * lines into one paragraph with soft breaks, so a run of entries arrives here
 * as one <p> containing many <a>. Each link starts a row and a following <em>
 * attaches to the row it trails. Anything else -- prose, a stray text node --
 * means the paragraph is not a list, and is left alone.
 */
function convert(node) {
  const kids = node.children.filter((n) => !isSpace(n))
  if (!kids.length) return null

  const rows = []
  let current = null

  for (const k of kids) {
    const tag = tagOf(k)
    if (tag === 'a') {
      const href = k.properties?.href ?? ''
      if (!/^\s*https?:\/\//.test(href)) return null
      current = { url: href, label: textOf(k).trim() }
      rows.push(current)
      continue
    }
    if (tag === 'em' && current) {
      current.note = textOf(k).trim()
      continue
    }
    return null // prose, or text that is not an annotation
  }

  if (!rows.length) return null

  const art = artwork()
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['mbd-rows'] },
    children: rows.map((r) => ({
      type: 'raw',
      value: rowHtml({ url: r.url, label: r.label, note: r.note || undefined, artwork: art }),
    })),
  }
}

export default function rehypeReleaseRows() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return
      if (!Array.isArray(node.children)) return

      const out = []
      for (const child of node.children) {
        if (child.type === 'element' && child.tagName === 'p') {
          const replacement = convert(child)
          if (replacement) {
            out.push(replacement)
            continue
          }
        }
        walk(child)
        out.push(child)
      }
      node.children = out
    }
    walk(tree)
  }
}