import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const backend = 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: true,
    port: 5175,
    allowedHosts: true,

    https:
      fs.existsSync(path.resolve(process.cwd(), 'certs/petshop.crt')) &&
        fs.existsSync(path.resolve(process.cwd(), 'certs/petshop.key'))
        ? {
          cert: fs.readFileSync(path.resolve(process.cwd(), 'certs/petshop.crt')),
          key: fs.readFileSync(path.resolve(process.cwd(), 'certs/petshop.key')),
        }
        : undefined,

    proxy: {
      '/health': { target: backend, changeOrigin: true },
      '/auth': { target: backend, changeOrigin: true },
      '/pets': { target: backend, changeOrigin: true },
      '/products': { target: backend, changeOrigin: true },
      '/categories': { target: backend, changeOrigin: true },
      '/cart': { target: backend, changeOrigin: true },
      '/register': { target: backend, changeOrigin: true },
    },
  },
})
