import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  integrations: [solidJs(), tailwind()],
  server: {
    port: 3001
  },
  vite: {
    envDir: '../../'
  }
});
