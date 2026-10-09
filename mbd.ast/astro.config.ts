import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import UnoCSS from 'unocss/astro';

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
  vite: {
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
  },
});
