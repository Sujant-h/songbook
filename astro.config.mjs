// @ts-check
import { defineConfig } from 'astro/config';


import tailwindcss from '@tailwindcss/vite';


// https://astro.build/config
export default defineConfig({
  site: 'https://sujat-h.github.io',
  base: 'astro-songbook',
  vite: {
    plugins: [tailwindcss()]
  }
});