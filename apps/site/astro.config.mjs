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
    envDir: '../../',
    plugins: [
      {
        name: 'token-rewrite-dev',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && !req.url.startsWith('/driver') && /^\/[a-zA-Z0-9]{6,64}(\?.*)?$/.test(req.url)) {
              const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
              req.url = '/' + query;
            }
            next();
          });
        }
      }
    ]
  }
});
