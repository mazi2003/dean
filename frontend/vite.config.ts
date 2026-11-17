import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const backendProxyTarget = process.env.VITE_BACKEND_PROXY || 'http://127.0.0.1:3000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
    },
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
