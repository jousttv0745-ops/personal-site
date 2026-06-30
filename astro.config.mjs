// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const isNetlify = process.env.NETLIFY === 'true';

export default defineConfig({
  site: isNetlify ? process.env.URL : 'https://jousttv0745-ops.github.io',
  base: isNetlify ? '/' : '/personal-site',
  vite: {
    plugins: [tailwindcss()],
  },
});
