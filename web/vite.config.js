import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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