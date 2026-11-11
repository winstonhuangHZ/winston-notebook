import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';

// Markdown can refer to repository images as /images/... even when Pages uses a subpath.
function remarkRepositoryImages() {
  return (tree) => visit(tree, 'image', (node) => {
    if (node.url?.startsWith('/images/')) node.url = `/winston-notebook${node.url}`;
  });
}

export default defineConfig({
  site: 'https://winstonhuanghz.github.io',
  base: '/winston-notebook',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { remarkPlugins: [remarkRepositoryImages, remarkMath], rehypePlugins: [rehypeKatex], shikiConfig: { theme: 'github-dark' } },
});
