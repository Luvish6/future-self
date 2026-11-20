// Cloudflare Worker: the canonical site is GitHub Pages. Redirect every path there (301),
// except /sw.js, which returns a self-unregistering service worker so browsers that installed
// the old copy stop serving it from cache and follow the redirect instead.
const TARGET = 'https://luvish6.github.io/future-self'

const KILL_SW = `self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k)
  await self.registration.unregister()
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url)
})()))`

export default {
  fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/sw.js')
      return new Response(KILL_SW, { headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } })
    return Response.redirect(TARGET + (url.pathname === '/' ? '/' : url.pathname) + url.search, 301)
  },
}
