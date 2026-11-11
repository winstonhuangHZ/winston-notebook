import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

const maxBytes = 25 * 1024 * 1024;
const parser = unified().use(remarkParse);

export function isGithubPdfAttachment(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && /^\/user-attachments\/files\/\d+\/[^/]+\.pdf$/i.test(url.pathname);
  } catch { return false; }
}
function isPdf(bytes) { return bytes.subarray(0, 1024).indexOf(Buffer.from('%PDF-')) !== -1; }
function attachmentName(url) { return `${createHash('sha256').update(url).digest('hex').slice(0, 24)}.pdf`; }

async function downloadPdf(source, fetchImpl = fetch) {
  let url = source;
  for (let count = 0; count < 4; count++) {
    const current = new URL(url);
    if (current.protocol !== 'https:' || !['github.com', 'objects.githubusercontent.com'].includes(current.hostname)) throw new Error('附件跳转到了不受支持的网站');
    const response = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'winston-notebook-build' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('附件跳转缺少地址');
      url = new URL(location, url).href;
      continue;
    }
    if (!response.ok || !response.body) throw new Error(`附件请求失败（HTTP ${response.status}）`);
    const length = Number(response.headers.get('content-length'));
    if (length > maxBytes) throw new Error('附件超过 25 MB');
    const chunks = [];
    let total = 0;
    for await (const chunk of response.body) {
      total += chunk.length;
      if (total > maxBytes) throw new Error('附件超过 25 MB');
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    if (!isPdf(bytes)) throw new Error('附件不是有效的 PDF');
    return bytes;
  }
  throw new Error('附件跳转次数过多');
}

// Only the current owner's public Discussion uploads are copied into Pages.
// Other remote URLs stay remote and must permit CORS for PDF.js previews.
export async function mirrorGithubPdfs(markdown, { directory, fetchImpl = fetch } = {}) {
  const tree = parser.parse(markdown);
  const links = [];
  visit(tree, 'link', node => {
    if (isGithubPdfAttachment(node.url) && node.position?.start?.offset != null && node.position?.end?.offset != null) links.push(node);
  });
  await mkdir(directory, { recursive: true });
  const cache = new Map();
  const warnings = [];
  const assets = new Set();
  for (const node of links) {
    if (cache.has(node.url)) continue;
    const name = attachmentName(node.url);
    try {
      let bytes;
      try { bytes = await readFile(join(directory, name)); if (!isPdf(bytes) || bytes.length > maxBytes) throw new Error('invalid cache'); }
      catch { bytes = await downloadPdf(node.url, fetchImpl); await writeFile(join(directory, name), bytes); }
      cache.set(node.url, `/files/_discussion/${name}`);
      assets.add(name);
    } catch (error) {
      warnings.push(`GitHub PDF 附件暂时无法同步：${error.message}`);
    }
  }
  const edits = [];
  for (const node of links) {
    const replacement = cache.get(node.url);
    if (!replacement) continue;
    const start = node.position.start.offset;
    const end = node.position.end.offset;
    const snippet = markdown.slice(start, end);
    const destination = snippet.lastIndexOf('](');
    const offset = snippet.indexOf(node.url, destination < 0 ? 0 : destination + 2);
    if (offset >= 0) edits.push({ start: start + offset, end: start + offset + node.url.length, replacement });
  }
  for (const edit of edits.sort((a, b) => b.start - a.start)) markdown = markdown.slice(0, edit.start) + edit.replacement + markdown.slice(edit.end);
  return { markdown, assets: [...assets], warnings };
}

// Prune only generated hashed PDFs recorded in our own manifest.
export async function pruneMirroredPdfs(directory, keepNames) {
  await mkdir(directory, { recursive: true });
  const manifest = join(directory, '.notebook-manifest.json');
  let old = [];
  try { old = JSON.parse(await readFile(manifest, 'utf8')); if (!Array.isArray(old)) old = []; } catch {}
  const keep = new Set(keepNames);
  for (const name of old) if (typeof name === 'string' && /^[a-f0-9]{24}\.pdf$/.test(name) && !keep.has(name)) await unlink(join(directory, name)).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await writeFile(manifest, JSON.stringify([...keep].sort()) + '\n');
}
