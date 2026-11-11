import { getCollection, type CollectionEntry } from 'astro:content';

export const site = {
  title: "Winston’s Notebook",
  description: '记录问题，也记录寻找答案的过程。',
  author: 'Winston',
  github: 'https://github.com/winstonhuangHZ',
  discussions: 'https://github.com/winstonhuangHZ/winston-notebook/discussions',
};

export function pathFor(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
export function imageUrl(path?: string) {
  if (!path) return pathFor('images/cover-notes.svg');
  return path.startsWith('/images/') ? pathFor(path.slice(1)) : path;
}
export function postUrl(post: CollectionEntry<'blog'>) { return pathFor(`posts/${post.id}/`); }
export async function publishedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}
export function readingTime(body = '') {
  const cjk = (body.match(/[\u3400-\u9fff]/g) || []).length;
  const words = (body.replace(/[\u3400-\u9fff]/g, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
  return Math.max(1, Math.ceil(cjk / 400 + words / 200));
}
