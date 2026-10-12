import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

/**
 * Posts that are not years, in their fixed place at the end of the
 * navigation. The order is CONTENT-STRUCTURE.md §1: years newest-first, then
 * `older`, then `to-do`.
 *
 * This is written out rather than left to `localeCompare`, which happens to
 * produce the same answer today because `older` < `to-do` alphabetically --
 * and would keep doing so silently right up until someone added a third
 * non-year post whose name did not sort between them.
 */
const NON_YEAR_ORDER = ['older', 'to-do'];

/** 0 for a year, 1..n for a ranked non-year, n+1 for an unranked one. */
function rank(slug: string): number {
  const year = Number(slug);
  if (!Number.isNaN(year)) return 0;
  const i = NON_YEAR_ORDER.indexOf(slug);
  return i === -1 ? NON_YEAR_ORDER.length + 1 : i + 1;
}

/**
 * Newest year first, with non-year posts pinned after them in the fixed order
 * above. Slugs are the source of truth for ordering, so this has to tolerate
 * `Number(slug)` being NaN.
 */
export function byYearDesc(a: BlogEntry, b: BlogEntry): number {
  const rankA = rank(a.slug);
  const rankB = rank(b.slug);
  if (rankA !== rankB) return rankA - rankB;
  if (rankA !== 0) return 0;
  return Number(b.slug) - Number(a.slug);
}