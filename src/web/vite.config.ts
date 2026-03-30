import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: __dirname,
  build: {
    outDir: '../../dist/web',
    emptyOutDir: false,
  },
  server: {
    port: 52101,
    proxy: {
      '/api': 'http://localhost:52101',
    },
  },
});
