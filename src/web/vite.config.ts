import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: '../../dist/web',
    emptyOutDir: true,
  },
  server: {
    port: 52101,
    proxy: {
      '/api': 'http://localhost:52101',
    },
  },
});
