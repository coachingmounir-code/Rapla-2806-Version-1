(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  let pending = false, reloading = false, pointerDown = false;
  const hadController = !!navigator.serviceWorker.controller;
  function busy() {
    return pointerDown || !!document.querySelector('dialog[open]') ||
      [...document.querySelectorAll('input, textarea')].some(field =>
        !field.closest('dialog') && field.type !== 'hidden' && field.type !== 'checkbox' &&
        field.type !== 'radio' && !field.readOnly && field.value && field.id !== 'search');
  }
  function refreshWhenSafe() {
    if (!pending || reloading || busy()) return;
    reloading = true;
    location.reload();
  }
  document.addEventListener('pointerdown', () => { pointerDown = true; });
  window.addEventListener('pointerup', () => { pointerDown = false; });
  window.addEventListener('pointercancel', () => { pointerDown = false; });
  window.addEventListener('blur', () => { pointerDown = false; });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    pending = true;
    const notice = document.createElement('p');
    notice.className = 'hint'; notice.setAttribute('role', 'status');
    notice.textContent = 'Neue Version bereit. Nach dem Speichern und Schließen deiner Bearbeitung wird sie automatisch geladen.';
    document.body.prepend(notice);
    refreshWhenSafe();
  });
  setInterval(refreshWhenSafe, 1500);
  navigator.serviceWorker.register('/seva/sw.js', { scope: '/seva/', updateViaCache: 'none' }).then(registration => {
    const check = () => { if (navigator.onLine) registration.update().catch(() => {}); };
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(() => { if (!document.hidden) check(); }, 60000);
    check();
  }).catch(() => {});
})();
