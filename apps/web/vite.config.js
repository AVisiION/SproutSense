import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
            return 'react-vendor'
          }

          if (id.includes('/framer-motion/')) return 'motion-vendor'
          if (id.includes('/recharts/')) return 'charts-vendor'
          if (id.includes('/@fortawesome/')) return 'icons-vendor'
          if (id.includes('/date-fns/')) return 'date-vendor'
          if (id.includes('/axios/')) return 'axios-vendor'
          if (id.includes('/react-hot-toast/')) return 'toast-vendor'
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',      // expose on all network interfaces (IPv4 included)
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true
      }
    }
  }
})