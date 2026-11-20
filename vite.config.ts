/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

declare const process: { env: Record<string, string | undefined> } // avoid a @types/node dependency
// BASE_PATH=/future-self/ for GitHub Pages; default "/" (Cloudflare). SITE_URL feeds canonical/OG tags.
const base = process.env.BASE_PATH ?? '/'
const site = (process.env.SITE_URL ?? 'https://future-self.luvish612.workers.dev').replace(/\/$/, '')

export default defineConfig({
  base,
  plugins: [
    { name: 'site-url', transformIndexHtml: (html) => html.split('__SITE_URL__').join(site) },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Future Self',
        short_name: 'Future Self',
        description: 'A free, private personal growth companion.',
        theme_color: '#8b7cf6',
        background_color: '#14131a',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        globPatterns: ['**/*.{js,css,html,svg}'], // library photos are cached on first view, not precached
        runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.includes('/library/'), handler: 'CacheFirst', options: { cacheName: 'library-images', expiration: { maxEntries: 120 } } }],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'] },
})
