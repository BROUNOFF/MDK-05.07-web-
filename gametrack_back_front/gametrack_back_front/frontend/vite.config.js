import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // сразу открываем браузер при npm run dev
    // запросы /api/... во время разработки пересылаются на бэкенд (npm run dev в папке backend)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
