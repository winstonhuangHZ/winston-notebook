import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { publishedPosts, site, postUrl, pathFor } from '../lib/site';
export async function GET(context: APIContext) {
  const posts = await publishedPosts();
  return rss({ title: site.title, description: site.description, site: new URL(pathFor(), context.site!), items: posts.map(post => ({ title: post.data.title, pubDate: post.data.pubDate, description: post.data.description, link: postUrl(post) })) });
}
