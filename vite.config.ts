import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const host = process.env.VITE_HOST || '127.0.0.1';
const port = Number.parseInt(process.env.VITE_PORT || '3000', 10);
const autoOpen = (process.env.VITE_OPEN ?? 'true') !== 'false';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port,
    strictPort: false,
    open: autoOpen,
  },
});
