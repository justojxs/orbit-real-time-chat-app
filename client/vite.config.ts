import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Split large dependencies into separate cached chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk — cached separately from app code (changes rarely)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-socket': ['socket.io-client'],
          'vendor-utils': ['axios', 'zustand'],
        }
      }
    },
    // Increase chunk size warning threshold (our chunks are intentionally split)
    chunkSizeWarningLimit: 600,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
  }
})
