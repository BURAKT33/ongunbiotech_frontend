import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Vercel production config:
// - No custom base path (served from domain root)
// - Standard Vite React SPA with Tailwind
// - Dev: `/api/*` → backend (varsayılan http://127.0.0.1:8080), `VITE_DEV_BACKEND_URL` ile değiştirilebilir
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devBackend = env.VITE_DEV_BACKEND_URL || 'http://127.0.0.1:8080'

  return {
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    proxy: {
      '/api': {
        target: devBackend,
        changeOrigin: true,
      },
    },
  },
  }
})
