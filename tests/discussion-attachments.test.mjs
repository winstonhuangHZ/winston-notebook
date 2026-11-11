import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isGithubPdfAttachment, mirrorGithubPdfs, pruneMirroredPdfs } from '../scripts/discussion-attachments.mjs';

const url = 'https://github.com/user-attachments/files/1234/example.pdf';
const pdf = Buffer.from('%PDF-1.4\nExample\n%%EOF');
async function temporary(t) {
  const dir = await mkdtemp(join(tmpdir(), 'notebook-attachments-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('only GitHub PDF attachment URLs are mirrored', () => {
  assert.equal(isGithubPdfAttachment(url), true);
  assert.equal(isGithubPdfAttachment('https://example.com/user-attachments/files/1/file.pdf'), false);
  assert.equal(isGithubPdfAttachment('https://github.com/user-attachments/files/1/file.zip'), false);
});
test('rewrites actual links, preserves code examples, and caches the file', async t => {
  const directory = await temporary(t);
  let calls = 0;
  const fetchImpl = async location => {
    calls++;
    if (location === url) return new Response(null, { status: 302, headers: { location: 'https://objects.githubusercontent.com/example' } });
    return new Response(pdf, { status: 200, headers: { 'content-type': 'application/pdf' } });
  };
  const source = `[讲义](${url})\n\n\`\`\`markdown\n[示例](${url})\n\`\`\``;
  const first = await mirrorGithubPdfs(source, { directory, fetchImpl });
  assert.equal(first.assets.length, 1);
  assert.match(first.markdown, /\[讲义\]\(\/files\/_discussion\/[a-f0-9]{24}\.pdf\)/);
  assert.ok(first.markdown.includes(`[示例](${url})`));
  assert.deepEqual(await readFile(join(directory, first.assets[0])), pdf);
  await mirrorGithubPdfs(source, { directory, fetchImpl });
  assert.equal(calls, 2);
});
test('unsafe redirects and oversized responses keep the original usable link', async t => {
  const directory = await temporary(t);
  const source = `[PDF](${url})`;
  for (const fetchImpl of [
    async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } }),
    async () => new Response(pdf, { status: 200, headers: { 'content-length': String(26 * 1024 * 1024) } }),
  ]) {
    const result = await mirrorGithubPdfs(source, { directory, fetchImpl });
    assert.equal(result.markdown, source);
    assert.equal(result.warnings.length, 1);
    assert.equal(result.assets.length, 0);
  }
});
test('cleanup removes only files in the generated manifest', async t => {
  const directory = await temporary(t);
  const stale = 'a'.repeat(24) + '.pdf';
  await writeFile(join(directory, stale), pdf);
  await writeFile(join(directory, 'personal.pdf'), pdf);
  await writeFile(join(directory, '.notebook-manifest.json'), JSON.stringify([stale, '../personal.pdf']));
  await pruneMirroredPdfs(directory, []);
  await assert.rejects(access(join(directory, stale)));
  await access(join(directory, 'personal.pdf'));
});
test('a URL repeated as link label only replaces the destination', async t => {
  const directory = await temporary(t);
  const source = `[${url}](${url})`;
  const fetchImpl = async () => new Response(pdf, { status: 200 });
  const { markdown } = await mirrorGithubPdfs(source, { directory, fetchImpl });
  assert.match(markdown, /^\[https:\/\/github\.com\/user-attachments\/files\/1234\/example\.pdf\]\(\/files\/_discussion\//);
});
