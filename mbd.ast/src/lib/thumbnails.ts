/**
 * Thumbnail resolution for the compact release rows.
 *
 * Two sources, no build-time network access for either:
 *
 *   YouTube   the thumbnail URL is derivable from the video id, so nothing has
 *             to be fetched. `?v=`/`youtu.be`/`/shorts/`/`/embed` all parse.
 *   Anything  else reads the committed artwork cache produced by
 *   `scripts/enrich.mjs`, keyed by the link that is already in the post.
 *
 * Anything unrecognised falls back to a text monogram rather than an image, so
 * a row never collapses or shows a broken image.
 */

import { artwork } from './artwork';

export type Thumb =
  | { kind: 'image'; src: string; width: number; height: number }
  | { kind: 'monogram'; letter: string };

const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/** Extract the 11-character YouTube video id from any of its URL shapes. */
export function youtubeId(url: string): string | null {
  const m = url.match(YOUTUBE_ID);
  return m ? m[1] : null;
}

/** First letter of the artist, uppercased, for the no-image fallback. */
function monogram(text: string): Thumb {
  const letter = (text.trim()[0] ?? '?').toUpperCase();
  return { kind: 'monogram', letter };
}

export function resolveThumb(url: string, label = ''): Thumb {
  const yt = youtubeId(url);
  if (yt) {
    // mqdefault is 320x180 and always present; maxresdefault is HD but only
    // exists for videos that have it, so stay on the safe one at this size.
    return { kind: 'image', src: `https://i.ytimg.com/vi/${yt}/mqdefault.jpg`, width: 320, height: 180 };
  }

  const cached = artwork[url]?.art;
  if (cached) return { kind: 'image', src: cached, width: 600, height: 600 };

  return monogram(label);
}