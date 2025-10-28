import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  preview: {
    allowedHosts: [
      'localhost',
      '*.ondigitalocean.app', // Allow all DigitalOcean App Platform domains
      'heroes.bhmemorialpark.com', // Custom domain
    ],
    host: '0.0.0.0',
    port: 8080,
  },
});
