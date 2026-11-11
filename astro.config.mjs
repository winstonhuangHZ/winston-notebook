import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkAttachments } from './src/lib/remark-attachments.mjs';

export default defineConfig({
  site: 'https://winstonhuanghz.github.io',
  base: '/winston-notebook',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { remarkPlugins: [[remarkAttachments, { base: '/winston-notebook' }], remarkMath], rehypePlugins: [rehypeKatex], shikiConfig: { theme: 'github-dark' } },
});
