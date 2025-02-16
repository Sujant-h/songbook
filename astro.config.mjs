// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://sujant-h.github.io', // Full URL with trailing slash
  base: 'songbook',                   // Your base folder
  vite: {
    logLevel: 'info',
    define: {
      __DATE__: `'${new Date().toISOString()}'`,
    },
    server: {
      fs: {
        // Allow serving files from hoisted root node_modules
        allow: ['../..']
      }
    },
    plugins: [tailwindcss()]
  },
  integrations: [
    AstroPWA({
      mode: 'development',
      // Update the base and scope to match your Astro base
      base: '/songbook/',
      scope: '/songbook/',
      // Ensure assets are referenced with the base path
      includeAssets: ['/songbook/favicon.svg'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Astro PWA',
        short_name: 'Astro PWA',
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
        // Update the navigateFallback so it points to your base path
        navigateFallback: '/songbook/',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}'],
      },
      devOptions: {
        enabled: false,
        navigateFallbackAllowlist: [/^\//],
      },
      experimental: {
        directoryAndTrailingSlashHandler: true,
      }
    }),
  ],
});
