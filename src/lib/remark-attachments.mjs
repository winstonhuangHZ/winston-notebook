import { visit } from 'unist-util-visit';

const attachmentExtensions = new Set(['zip', 'gz', 'tgz', '7z', 'rar', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'txt', 'md', 'json', 'epub']);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const textOf = node => node.value ?? (node.children || []).map(textOf).join('');

// A plain Markdown link on its own line becomes a preview (PDF) or file card.
// Markdown remains readable in GitHub, including when preview is unavailable.
export function remarkAttachments({ base = '/' } = {}) {
  const prefix = base === '/' ? '' : `/${base.replace(/^\/+|\/+$/g, '')}`;
  const resolveRepositoryPath = url => /^\/(images|files)\//.test(url) ? `${prefix}${url}` : url;
  const safeUrl = url => {
    if (url.startsWith('/') && !url.startsWith('//')) return true;
    try { return ['https:', 'http:'].includes(new URL(url).protocol); } catch { return false; }
  };
  return tree => {
    visit(tree, node => node.type === 'image' || node.type === 'link', node => {
      if (typeof node.url === 'string') node.url = resolveRepositoryPath(node.url);
    });
    visit(tree, 'paragraph', node => {
      if (node.children.length !== 1 || node.children[0].type !== 'link') return;
      const link = node.children[0];
      if (!safeUrl(link.url)) return;
      const label = textOf(link).trim();
      const forcedPdf = /^pdf\s*[:：]/i.test(label);
      const forcedFile = /^(file|附件)\s*[:：]/i.test(label);
      const displayName = label.replace(/^(?:pdf|file|附件)\s*[:：]\s*/i, '').trim() || '未命名文件';
      const pathname = new URL(link.url, 'https://example.invalid').pathname;
      const extension = pathname.split('.').pop()?.toLowerCase();
      const isPdf = forcedPdf || extension === 'pdf';
      if (!isPdf && !forcedFile && !attachmentExtensions.has(extension)) return;
      const url = escapeHtml(link.url);
      const name = escapeHtml(displayName);
      const badge = isPdf ? 'PDF' : escapeHtml((extension && attachmentExtensions.has(extension) ? extension : 'FILE').toUpperCase());
      const preview = isPdf ? `<div class="pdf-viewer" data-pdf-url="${url}" aria-label="PDF 预览：${name}"><div class="pdf-stage"><p class="pdf-status" role="status" aria-live="polite">正在准备 PDF 预览…</p><canvas class="pdf-canvas" role="img" aria-label="PDF 页面预览" hidden></canvas><iframe class="pdf-native" title="浏览器 PDF 预览：${name}" loading="lazy" referrerpolicy="no-referrer" hidden></iframe></div><div class="pdf-controls" hidden><button type="button" class="pdf-previous" aria-label="上一页">← 上一页</button><span class="pdf-page" aria-live="polite"></span><button type="button" class="pdf-next" aria-label="下一页">下一页 →</button><span class="pdf-control-divider" aria-hidden="true"></span><button type="button" class="pdf-zoom-out" aria-label="缩小 PDF">−</button><span class="pdf-zoom" aria-live="polite">100%</span><button type="button" class="pdf-zoom-in" aria-label="放大 PDF">+</button></div><button type="button" class="pdf-native-button" hidden>尝试浏览器预览</button><noscript><p class="pdf-noscript">启用 JavaScript 后可在线预览，或通过上方链接打开。</p></noscript></div><p class="attachment-help">无法预览？可以通过上方链接打开文件。</p>` : '';
      node.type = 'html';
      node.value = `<section class="attachment-card${isPdf ? ' is-pdf' : ''}" aria-label="${isPdf ? 'PDF 文件' : '文件附件'}：${name}"><div class="attachment-top"><span class="attachment-badge" aria-hidden="true">${badge}</span><div class="attachment-info"><strong>${name}</strong><span>${isPdf ? 'PDF 文档 · 在线预览' : '文件附件'}</span></div><a class="attachment-open" href="${url}" target="_blank" rel="noopener noreferrer">打开 <span aria-hidden="true">↗</span></a></div>${preview}</section>`;
      delete node.children;
    });
  };
}
