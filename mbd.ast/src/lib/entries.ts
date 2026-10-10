import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

/**
 * Newest year first, with any non-numeric entry (currently `To-Do`) pinned to
 * the end regardless of where it was filed. Slugs are the source of truth for
 * ordering, so this has to tolerate `Number(slug)` being NaN.
 */
export function byYearDesc(a: BlogEntry, b: BlogEntry): number {
  const yearA = Number(a.slug);
  const yearB = Number(b.slug);
  const isYearA = !Number.isNaN(yearA);
  const isYearB = !Number.isNaN(yearB);

  if (isYearA && isYearB) return yearB - yearA;
  if (isYearA) return -1;
  if (isYearB) return 1;
  return a.slug.localeCompare(b.slug);
}