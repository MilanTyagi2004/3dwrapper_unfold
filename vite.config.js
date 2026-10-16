import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))

// Runs the Vercel-style /api/*.js functions inside `npm run dev`
// so local development matches production. Never part of the build.
function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const route = req.url.split('?')[0].replace(/\/+$/, '')
        const file = path.join(root, `${route}.js`)
        if (route.includes('..') || route.includes('/_') || !existsSync(file)) {
          res.statusCode = 404
          return res.end()
        }
        try {
          const mod = await server.ssrLoadModule(file)
          await mod.default(req, res)
        } catch (err) {
          server.config.logger.error(err?.stack || String(err))
          if (!res.headersSent) res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Expose .env values to the dev API functions via process.env (server side only)
  Object.assign(process.env, loadEnv(mode, root, ''))
  return {
    plugins: [react(), devApi()],
    build: {
      sourcemap: false,
    },
  }
})
