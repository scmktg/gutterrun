import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// Hybrid: pages are prerendered (static) by default;
// the booking API route opts into SSR via `export const prerender = false`.
// Swap @astrojs/node for @astrojs/vercel or @astrojs/cloudflare at deploy.
export default defineConfig({
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [tailwind({ applyBaseStyles: false })],
  server: { host: true, port: 4321 },
});
