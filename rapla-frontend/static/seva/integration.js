/* The SEVA entry points are intentionally scoped to SEVA time blocks/routine. */
(function () {
  let dialog, frame;
  window.openSevaTasks = function () {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'seva-tasks-dialog'; dialog.setAttribute('aria-label', 'SEVA-K Aufgaben');
      dialog.style.cssText = 'padding:0;border:0;border-radius:20px;width:min(1080px,96vw);height:92dvh;max-height:96dvh;background:#f5f6f1;';
      frame = document.createElement('iframe'); frame.src = '/seva/?embedded=1'; frame.title = 'SEVA-K Aufgaben'; frame.allow = 'microphone';
      frame.style.cssText = 'width:100%;height:100%;border:0;display:block;'; dialog.appendChild(frame); document.body.appendChild(dialog);
      dialog.addEventListener('close', () => frame.contentWindow.postMessage({ type: 'seva-hidden' }, location.origin));
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    }
    dialog.showModal();
  };
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame?.contentWindow && event.data?.type === 'seva-close') dialog.close();
  });
})();
