import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

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
          cert: fs.readFileSync(
            path.resolve(process.cwd(), 'certs/petshop.crt')
          ),
          key: fs.readFileSync(
            path.resolve(process.cwd(), 'certs/petshop.key')
          ),
        }
        : undefined,

    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },

      '/pets': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})