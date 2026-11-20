/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
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
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg}'], // library photos are cached on first view, not precached
        runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith('/library/'), handler: 'CacheFirst', options: { cacheName: 'library-images', expiration: { maxEntries: 120 } } }],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'] },
})
