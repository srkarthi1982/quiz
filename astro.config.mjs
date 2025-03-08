import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import alpinejs from '@astrojs/alpinejs';
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  adapter: vercel(),
  output: "server",
  integrations: [tailwind(), alpinejs()],
});