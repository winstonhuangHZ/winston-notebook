import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';
import { mirrorGithubPdfs, pruneMirroredPdfs } from './discussion-attachments.mjs';

const owner = 'winstonhuangHZ';
const repository = 'winston-notebook';
const categoryName = 'Announcements';
const output = new URL('../src/content/blog/generated/', import.meta.url);
const attachmentDirectory = fileURLToPath(new URL('../public/files/_discussion/', import.meta.url));
if (process.env.SKIP_DISCUSSIONS === '1') {
  console.log('Skipping Discussions sync (SKIP_DISCUSSIONS=1).');
  process.exit(0);
}
let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  try { token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { throw new Error('请先运行 gh auth login，或设置 GITHUB_TOKEN，再同步 Discussions。'); }
}
async function graphql(query, variables) {
  const response = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'winston-notebook-build' }, body: JSON.stringify({ query, variables }) });
  if (!response.ok) throw new Error(`GitHub GraphQL 请求失败：HTTP ${response.status}`);
  const data = await response.json();
  if (data.errors?.length) throw new Error(`GitHub GraphQL 错误：${data.errors.map(e => e.message).join('; ')}`);
  return data.data;
}
const categories = await graphql(`query($owner:String!,$repo:String!){repository(owner:$owner,name:$repo){discussionCategories(first:100){nodes{id name}}}}`, { owner, repo: repository });
const category = categories.repository?.discussionCategories.nodes.find(c => c.name === categoryName);
if (!category) throw new Error(`找不到 Discussions 分类 ${categoryName}，为防止误清空文章，构建已停止。`);
let cursor = null;
const discussions = [];
do {
  const data = await graphql(`query($owner:String!,$repo:String!,$category:ID!,$after:String){repository(owner:$owner,name:$repo){discussions(first:100,after:$after,categoryId:$category,orderBy:{field:CREATED_AT,direction:DESC}){pageInfo{hasNextPage endCursor} nodes{number title body createdAt updatedAt url author{login} labels(first:30){nodes{name}}}}}}`, { owner, repo: repository, category: category.id, after: cursor });
  const page = data.repository.discussions;
  discussions.push(...page.nodes.filter(d => d.author?.login?.toLowerCase() === owner.toLowerCase()));
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (cursor);

// Fully parse first; failed syncs must not deploy an empty or partial snapshot.
const files = [];
for (const d of discussions) {
  const parsed = matter(d.body || '');
  const metadata = parsed.data;
  if (metadata.draft === true) continue;
  if (metadata.tags !== undefined && (!Array.isArray(metadata.tags) || !metadata.tags.every(t => typeof t === 'string'))) throw new Error(`Discussion #${d.number}: tags 必须是字符串数组。`);
  for (const key of ['description','cover','coverAlt']) if (metadata[key] !== undefined && typeof metadata[key] !== 'string') throw new Error(`Discussion #${d.number}: ${key} 必须是字符串。`);
  const plain = parsed.content.replace(/```[\s\S]*?```/g, ' ').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*_`~|\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
  const front = {
    title: d.title,
    description: metadata.description || plain.slice(0, 110),
    pubDate: d.createdAt,
    updatedDate: d.updatedAt,
    tags: metadata.tags || d.labels.nodes.map(label => label.name),
    discussionUrl: d.url,
  };
  if (metadata.cover) front.cover = metadata.cover;
  if (metadata.coverAlt) front.coverAlt = metadata.coverAlt;
  const yaml = Object.entries(front).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
  const mirrored = await mirrorGithubPdfs(parsed.content, { directory: attachmentDirectory });
  for (const warning of mirrored.warnings) console.warn(`Discussion #${d.number}: ${warning}`);
  files.push({ name: `discussion-${d.number}.md`, content: `---\n${yaml}\n---\n${mirrored.markdown.trim()}\n`, assets: mirrored.assets });
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map(file => writeFile(new URL(file.name, output), file.content, 'utf8')));
await pruneMirroredPdfs(attachmentDirectory, files.flatMap(file => file.assets));
console.log(`已同步 ${files.length} 篇 Discussions 文章。`);
