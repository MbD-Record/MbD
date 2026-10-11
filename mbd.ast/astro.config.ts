import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import UnoCSS from 'unocss/astro';
import trackAnnotations from './src/lib/rehype-track.mjs';
import releaseRows from './src/lib/rehype-release.mjs';

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
    rehypePlugins: [trackAnnotations, releaseRows],
  },
  vite: {
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
  },
});
