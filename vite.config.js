import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-email-editor'],
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
  },
})
