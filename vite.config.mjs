import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Cada compilación precarga únicamente su propio conjunto de archivos.
export default defineConfig({
  base: './',
  plugins: [{
    name: 'aldea-viva-offline',
    apply: 'build',
    generateBundle: { order: 'post', async handler(_options, bundle) {
      if (!bundle['index.html']) throw new Error('Falta la entrada HTML para preparar el modo sin conexión.');
      const publicFiles = ['favicon.svg', 'orchard.svg', 'warehouse.svg', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
      const hash = createHash('sha256');
      hash.update(await readFile(new URL(import.meta.url)));
      for (const name of Object.keys(bundle).sort()) {
        const entry = bundle[name];
        hash.update(name).update(entry.type === 'chunk' ? entry.code : entry.source);
      }
      for (const name of publicFiles) hash.update(await readFile(new URL(`./public/${name}`, import.meta.url)));
      const version = hash.digest('hex').slice(0, 16);
      const paths = [...Object.keys(bundle).filter((name) => !name.endsWith('.map')), ...publicFiles];
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const PREFIX = 'aldea-viva-shell-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + '${version}';
const URLS = ${JSON.stringify(paths)}.map(path => new URL(path, self.registration.scope).href);
const SHELL = new URL('index.html', self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(URLS.map(url => new Request(url, {cache: 'reload'})));
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Los otros clientes pueden seguir ejecutando la compilación anterior.
  const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
  if (clients.length <= 1) {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
  }
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    // Pages redirige index.html a /. Una navegación no admite devolver
    // directamente esa respuesta redirigida desde el service worker.
    event.respondWith(caches.open(CACHE).then(cache => cache.match(SHELL)).then(response =>
      response?.redirected
        ? new Response(response.body, {status: response.status, statusText: response.statusText, headers: response.headers})
        : response || fetch(event.request)));
  } else if (URLS.includes(url.href)) {
    // Vite puede responder Vary: Origin. Los módulos envían Origin y la
    // precarga no; estos archivos públicos propios tienen idéntico contenido.
    event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, {ignoreVary: true})).then(response => response || fetch(event.request)));
  }
});` });
    } },
  }],
});
