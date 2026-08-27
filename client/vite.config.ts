import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SERVER_ORIGIN = 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // The client always talks to a relative URL, so in dev the socket and
      // health endpoints are proxied through to the API process.
      '/socket.io': { target: SERVER_ORIGIN, ws: true, changeOrigin: true },
      '/healthz': { target: SERVER_ORIGIN, changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
