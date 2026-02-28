import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7171',
        changeOrigin: true
      },
      '/delete-instance': {
        target: 'http://localhost:7171',
        changeOrigin: true
      },
      '/delete-deployment-instances': {
        target: 'http://localhost:7171',
        changeOrigin: true
      },
      '/delete-all-deployments': {
        target: 'http://localhost:7171',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
