// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jousttv0745-ops.github.io',
  base: '/personal-site',
  vite: {
    plugins: [tailwindcss()],
  },
});
