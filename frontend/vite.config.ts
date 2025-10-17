import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Генерировать source maps для production
    sourcemap: false,
    // Настройки для оптимизации cache-busting
    rollupOptions: {
      output: {
        // Генерировать уникальные имена файлов с хэшами
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
