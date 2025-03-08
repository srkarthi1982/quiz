import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  adapter: vercel(),
  output: "server",
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [alpinejs()]
});