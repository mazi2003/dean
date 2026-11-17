import http from 'node:http';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function attachApiFallbackMiddleware(middlewares: Connect.Server): void {
  const targetUrl = new URL(process.env.VITE_BACKEND_PROXY || 'http://127.0.0.1:3000');

  middlewares.use((req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/')) {
      next();
      return;
    }

    const respondOfflineMock = () => {
      if (res.writableEnded) return;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-DemoTech-Offline-Mock', '1');
      res.end('{"offlineMock":true}');
    };

    const proxyReq = http.request(
      {
        hostname: targetUrl.hostname,
        port: Number(targetUrl.port) || 3000,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
        },
        timeout: 400,
      },
      proxyRes => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', respondOfflineMock);
    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      respondOfflineMock();
    });

    req.pipe(proxyReq);
  });
}

function deanOfficeApiPlugin(): Plugin {
  return {
    name: 'demotech-api-fallback-proxy',
    configureServer(server) {
      attachApiFallbackMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachApiFallbackMiddleware(server.middlewares);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), deanOfficeApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom)/ },
            { name: 'vendor-icons', test: /node_modules[\\/]lucide-react/ },
            { name: 'vendor-qr', test: /node_modules[\\/]qrcode/ },
          ],
        },
      },
    },
  },
});
