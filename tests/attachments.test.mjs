import test from 'node:test';
import assert from 'node:assert/strict';
import { remarkAttachments } from '../src/lib/remark-attachments.mjs';

const link = (url, label) => ({ type: 'link', url, children: [{ type: 'text', value: label }] });
const paragraph = (...children) => ({ type: 'paragraph', children });
const transform = (...children) => { const tree = { type: 'root', children }; remarkAttachments({ base: '/winston-notebook' })(tree); return tree; };

test('standalone repository PDFs are embedded with the Pages base and a direct link', () => {
  const tree = transform(paragraph(link('/files/notes.pdf?download=0', '课程讲义')));
  assert.equal(tree.children[0].type, 'html');
  assert.match(tree.children[0].value, /class="pdf-viewer"/);
  assert.match(tree.children[0].value, /data-pdf-url="\/winston-notebook\/files\/notes\.pdf\?download=0"/);
  assert.match(tree.children[0].value, /href="\/winston-notebook\/files\/notes\.pdf\?download=0"/);
});
test('external PDF links and extensionless explicit PDFs embed, including query strings', () => {
  const tree = transform(paragraph(link('https://example.org/paper.PDF?version=2', '论文')), paragraph(link('https://example.org/render?id=1', 'PDF: 下载页面')));
  assert.equal(tree.children.filter(node => node.value.includes('class="pdf-viewer"')).length, 2);
});
test('other attachments become links, but ordinary and inline links remain ordinary', () => {
  const tree = transform(paragraph(link('/files/data.zip', '数据')), paragraph(link('https://example.org/', '首页')), paragraph({ type: 'text', value: '阅读 ' }, link('/files/notes.pdf', '讲义')));
  assert.match(tree.children[0].value, /文件附件/);
  assert.doesNotMatch(tree.children[0].value, /pdf-viewer/);
  assert.equal(tree.children[1].type, 'paragraph');
  assert.equal(tree.children[2].children[1].url, '/winston-notebook/files/notes.pdf');
});
test('images still use the correct base and unsafe links are never embedded', () => {
  const img = { type: 'image', url: '/images/example.png', alt: 'example' };
  const tree = transform(paragraph(img), paragraph(link('javascript:alert(1).pdf', 'PDF: unsafe')));
  assert.equal(img.url, '/winston-notebook/images/example.png');
  assert.equal(tree.children[1].type, 'paragraph');
});
test('attachment labels and query strings cannot inject HTML attributes', () => {
  const tree = transform(paragraph(link('https://example.org/file.pdf?x=1&y=2', '<script>')));
  assert.match(tree.children[0].value, /&lt;script&gt;/);
  assert.match(tree.children[0].value, /\?x=1&amp;y=2/);
  assert.doesNotMatch(tree.children[0].value, /<script>/);
});
