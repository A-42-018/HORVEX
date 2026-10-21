import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `vite preview` serves pages like Cloudflare Pages (public/_redirects): a prerendered
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

// `vite preview` also sends the site-wide `/*` block of public/_headers (CSP etc.),
// so the production build is checked under the same policy locally.
const siteHeaders = Object.fromEntries(
  readFileSync(new URL('./public/_headers', import.meta.url), 'utf8')
    .split(/\n(?=\S)/)
    .find((block) => block.startsWith('/*\n'))
    .split('\n')
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const i = line.indexOf(':')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appShellFallback],
  preview: { headers: siteHeaders },
})
