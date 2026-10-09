import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import { legacyAdmonitions } from './scripts/remark-legacy.mjs';

export default defineConfig({
  site: 'https://blog.bcsdlab.com',
  publicDir: './static',
  output: 'static',
  trailingSlash: 'never',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [mdx(), sitemap()],
  vite: {
    resolve: {
      alias: {
        '@images': fileURLToPath(new URL('./static/img', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      },
    },
  },
  markdown: {
    processor: unified({ remarkPlugins: [remarkDirective, legacyAdmonitions] }),
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
