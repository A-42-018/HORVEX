import { existsSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `vite preview` serves pages like Vercel (vercel.json): a prerendered
// <route>/index.html (also without the trailing slash), else dist/app.html, the
// shell without home's hero preload (scripts/prerender.mjs).
const appShellFallback = {
  name: 'app-shell-fallback',
  configurePreviewServer(server) {
    const dist = path.resolve(server.config.root, server.config.build.outDir)
    server.middlewares.use((req, _res, next) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname)
      const isPage = req.headers.accept?.includes('text/html') && pathname !== '/' && !path.extname(pathname)
      if (isPage) {
        const prerendered = existsSync(path.join(dist, pathname, 'index.html'))
        if (prerendered) req.url = path.posix.join(pathname, 'index.html')
        else if (existsSync(path.join(dist, 'app.html'))) req.url = '/app.html'
      }
      next()
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appShellFallback],
})
