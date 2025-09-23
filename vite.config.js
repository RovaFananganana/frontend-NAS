import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to backend
      '/auth': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/admin': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/users': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/files': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/folders': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/permissions': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/nas': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/metrics': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

