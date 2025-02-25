import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  trailingSlash: 'always', // Add this
  site: 'https://sujant-h.github.io',
  base: '/songbook',
  vite: {
    logLevel: 'info',
    define: {
      __DATE__: `'${new Date().toISOString()}'`,
    },
    server: {
      fs: {
        allow: ['../..']
      }
    },
    plugins: [tailwindcss()]
  },
  integrations: [
    AstroPWA({
      mode: 'production',
      base: '/songbook',
      scope: '/songbook/',
      includeAssets: [
        'favicon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'fonts/*.woff2'
      ],
      registerType: 'autoUpdate',
      manifest: {
        id: '/songbook/',
        name: 'Tamil Christian Songs',
        short_name: 'TamilSongs',
        description: 'Tamil Christian worship songs collection',
        start_url: '/songbook/',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/songbook/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/songbook/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/songbook/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/songbook/index.html',
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,txt,webmanifest,woff2}'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
      },
      devOptions: {
        enabled: false,
        type: 'module',
        navigateFallback: 'index.html'
      },
      experimental: {
        directoryAndTrailingSlashHandler: true
      }
    })
  ]
});