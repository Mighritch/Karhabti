// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,               // port frontend habituel (optionnel)

    proxy: {
      // Tout ce qui commence par /api est redirigé vers le backend
      '/api': {
        target: 'http://localhost:5000',     // ← ton port backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')   // garde /api dans l'URL backend
      }
    }
  }
})