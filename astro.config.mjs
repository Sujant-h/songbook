import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  //trailingSlash: 'always', // Add this
  site: 'https://sujant-h.github.io',
  base: 'songbook',
  vite: {
    plugins: [tailwindcss()]
  }
});