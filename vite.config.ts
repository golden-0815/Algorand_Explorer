import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom', 'numeral', 'clsx', 'tailwind-merge'],
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          utils: ['numeral', 'clsx', 'tailwind-merge'],
          charts: ['recharts'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    proxy: {
      '/api/asastats': {
        target: 'https://www.asastats.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/asastats\/([^?]+)(\?.*)?$/, '/api/v2/$1/'),
      },
      '/api/token/refresh': {
        target: 'https://www.asastats.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/token\/refresh/, '/api/v2/token/refresh'),
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
});
