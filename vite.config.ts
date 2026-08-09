import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/tools': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/setup.sh': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/setup.ps1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
