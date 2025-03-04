import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['robotjs']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['robotjs']
      }
    }
  },
  renderer: {
    plugins: [react()]
  }
})
