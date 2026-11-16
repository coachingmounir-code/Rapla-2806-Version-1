const CACHE = 'zeitflow-seva-v36';
const ASSETS = ['/seva/ideas.js', '/seva/ideas.css', '/seva/seminars-data.js', '/seva/seminars.js', '/seva/seminars.css', '/seva/', '/seva/index.html', '/seva/model.js', '/seva/text.js', '/seva/store.js', '/seva/config.js', '/seva/ui.js', '/seva/workspace-tabs.js', '/seva/shiva-landing.js', '/seva/shiva-landing-v2.css', '/seva/workspace.css', '/seva/workspace.js', '/seva/assets/shiva-landing.jpg', '/seva/dictation.js', '/seva/style.css', '/seva/assets/ornament-band.svg', '/seva/assets/ornament-ambient.svg', '/seva/vendor/supabase.js', '/seva/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...ASSETS, '/seva/app-updates.js'])).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('zeitflow-seva-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith('/seva/')) return;
  // All app assets come from the same installed version. API/auth is never cached.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/seva/index.html')));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(hit => hit || fetch(event.request)));
});
