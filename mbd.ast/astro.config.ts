import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import UnoCSS from 'unocss/astro';
import trackAnnotations from './src/lib/rehype-track.mjs';
import releaseRows from './src/lib/rehype-release.mjs';
import monthGroups from './src/lib/rehype-month-groups.mjs';

export default defineConfig({
  // Cloudflare Pages sets CF_PAGES_URL for production deploys and
  // CF_PAGES_BRANCH_URL for preview deploys. Local dev falls back to the
  // dev server port so canonical URLs stay sane.
  site: process.env.CF_PAGES_URL
    ? `https://${process.env.CF_PAGES_URL}/`
    : process.env.CF_PAGES_BRANCH_URL
    ? `https://${process.env.CF_PAGES_BRANCH_URL}/`
    : 'http://localhost:4321/',
  trailingSlash: 'ignore',
  integrations: [sitemap(), UnoCSS({ injectReset: true })],
  markdown: {
    // Two rehype passes over the blog markdown:
    //   trackAnnotations - flags "added / to do / heard" annotations so CSS can
    //     style them without catching ordinary italics.
    //   releaseRows - turns "[Artist - Album](url)" paragraphs into compact
    //     release rows. Shares its markup with Release.astro, so the live pages
    //     and the component cannot drift apart.
    //   monthGroups - wraps each month and everything under it in one element,
    //     so the month can be outlined as a single bounded area. Runs last,
    //     after releaseRows has turned the paragraphs into rows.
    rehypePlugins: [trackAnnotations, releaseRows, monthGroups],
  },
  vite: {
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
  },
});
