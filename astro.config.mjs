// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://sujant-h.github.io/astro-songbook/',  // Full URL with trailing slash
  base: '/astro-songbook/',                            // Leading and trailing slashes
  trailingSlash: 'always',                             // Ensure all URLs end with a trailing slash
  vite: {
    plugins: [tailwindcss()]
  }
});
