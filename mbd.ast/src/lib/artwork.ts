/**
 * Artwork / metadata lookups for blog entries.
 *
 * The JSON this reads is produced by `scripts/enrich.mjs` and committed to the
 * repo, so rendering never makes a network request. Entries are keyed by the
 * URL that already appears in the markdown, which means content edits that do
 * not change the link need no re-enrichment.
 */

import cache from '../data/artwork.json';

export interface ArtworkMatch {
  source: 'itunes' | 'deezer' | 'coverartarchive';
  artist: string | null;
  album: string | null;
  year: number | null;
  genre: string | null;
  link: string | null;
  score: number | null;
}

export interface ArtworkEntry {
  url: string;
  artist: string;
  album: string;
  year: number | null;
  art: string | null;
  audio: string | null;
  match: ArtworkMatch | null;
  status: string;
}

export const artwork = cache as Record<string, ArtworkEntry>;

/** Look up a single entry by its source URL. Always returns something. */
export function getArtwork(url: string): ArtworkEntry | undefined {
  return artwork[url];
}