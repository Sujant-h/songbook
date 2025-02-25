import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  trailingSlash: 'always', // Add this
  site: 'https://sujant-h.github.io',
  base: '/songbook/',
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
        name: 'Tamil Songbook',
        short_name: 'Songbook',
        start_url: '/songbook/',
        scope: '/songbook/',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/songbook/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/songbook/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Add the manifest to glob patterns
        globPatterns: [
          '**/*.{css,js,html,svg,png,ico,txt,webmanifest}'
        ],
        // Update navigateFallback
        navigateFallback: '/songbook/',
        // Add runtime caching for your base path
        runtimeCaching: [{
          urlPattern: ({request}) => request.destination === 'document',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            }
          }
        }]
      }
    })
  ]
});