type PdfDocument = Awaited<ReturnType<(typeof import('pdfjs-dist/legacy/build/pdf.mjs'))['getDocument']>['promise']>;
const viewers = document.querySelectorAll<HTMLElement>('.pdf-viewer[data-pdf-url]');

if (viewers.length) {
  let library: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> | undefined;
  const loadLibrary = () => library ??= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]).then(([pdfjs, worker]) => { pdfjs.GlobalWorkerOptions.workerSrc = worker.default; return pdfjs; });
  const assetBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/pdfjs/`;

  const startViewer = async (viewer: HTMLElement) => {
    const url = viewer.dataset.pdfUrl;
    const canvas = viewer.querySelector<HTMLCanvasElement>('.pdf-canvas');
    const stage = viewer.querySelector<HTMLElement>('.pdf-stage');
    const status = viewer.querySelector<HTMLElement>('.pdf-status');
    const controls = viewer.querySelector<HTMLElement>('.pdf-controls');
    const pageLabel = viewer.querySelector<HTMLElement>('.pdf-page');
    const previous = viewer.querySelector<HTMLButtonElement>('.pdf-previous');
    const next = viewer.querySelector<HTMLButtonElement>('.pdf-next');
    const zoomOut = viewer.querySelector<HTMLButtonElement>('.pdf-zoom-out');
    const zoomIn = viewer.querySelector<HTMLButtonElement>('.pdf-zoom-in');
    const zoomLabel = viewer.querySelector<HTMLElement>('.pdf-zoom');
    const nativeButton = viewer.querySelector<HTMLButtonElement>('.pdf-native-button');
    const nativeFrame = viewer.querySelector<HTMLIFrameElement>('.pdf-native');
    if (!url || !canvas || !stage || !status || !controls || !pageLabel || !previous || !next || !zoomOut || !zoomIn || !zoomLabel || !nativeButton || !nativeFrame) return;
    let pdf: PdfDocument | undefined;
    let currentPage = 1;
    let zoom = 1;
    let rendering = false;
    let rerender = false;

    const draw = async () => {
      if (!pdf) return;
      if (rendering) { rerender = true; return; }
      rendering = true;
      previous.disabled = true;
      next.disabled = true;
      try {
        const page = await pdf.getPage(currentPage);
        const initial = page.getViewport({ scale: 1 });
        const available = Math.max(120, stage.clientWidth - 28);
        const viewport = page.getViewport({ scale: available * zoom / initial.width });
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * scale);
        canvas.height = Math.floor(viewport.height * scale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.setAttribute('aria-label', `PDF 第 ${currentPage} 页，共 ${pdf.numPages} 页；可通过打开链接访问原文件`);
        await page.render({ canvas, viewport, transform: scale === 1 ? null : [scale, 0, 0, scale, 0, 0] }).promise;
        canvas.hidden = false;
        status.hidden = true;
        controls.hidden = false;
        pageLabel.textContent = `${currentPage} / ${pdf.numPages}`;
        zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      } catch {
        status.textContent = '这一页暂时无法预览，请通过上方链接打开文件。';
        status.hidden = false;
        canvas.hidden = true;
        controls.hidden = true;
        nativeButton.hidden = false;
      } finally {
        rendering = false;
        previous.disabled = currentPage <= 1;
        next.disabled = !pdf || currentPage >= pdf.numPages;
        zoomOut.disabled = zoom <= 1;
        zoomIn.disabled = zoom >= 2.5;
        if (rerender) { rerender = false; void draw(); }
      }
    };
    nativeButton.addEventListener('click', () => {
      nativeFrame.src = url;
      nativeFrame.hidden = false;
      nativeButton.hidden = true;
      status.textContent = '如果浏览器未显示预览，请使用上方“打开”链接。';
    });
    try {
      const pdfjs = await loadLibrary();
      pdf = await pdfjs.getDocument({ url, cMapUrl: `${assetBase}cmaps/`, cMapPacked: true, standardFontDataUrl: `${assetBase}standard_fonts/`, wasmUrl: `${assetBase}wasm/` }).promise;
      await draw();
      previous.addEventListener('click', () => { if (currentPage > 1 && !rendering) { currentPage--; void draw(); } });
      next.addEventListener('click', () => { if (pdf && currentPage < pdf.numPages && !rendering) { currentPage++; void draw(); } });
      zoomOut.addEventListener('click', () => { if (zoom > 1 && !rendering) { zoom = Math.max(1, zoom - 0.25); void draw(); } });
      zoomIn.addEventListener('click', () => { if (zoom < 2.5 && !rendering) { zoom = Math.min(2.5, zoom + 0.25); void draw(); } });
      if ('ResizeObserver' in window) new ResizeObserver(() => { void draw(); }).observe(stage);
    } catch {
      status.textContent = '无法在线加载此 PDF：文件可能不可访问，或外部网站不允许跨域预览。';
      nativeButton.hidden = false;
      controls.hidden = true;
    }
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { observer.unobserve(entry.target); void startViewer(entry.target as HTMLElement); }
    }), { rootMargin: '300px' });
    viewers.forEach(viewer => observer.observe(viewer));
  } else viewers.forEach(viewer => { void startViewer(viewer); });
}
