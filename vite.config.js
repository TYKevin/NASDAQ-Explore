import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fetchQqqSnapshot } from './api/qqq.js'

function qqqApiPlugin() {
  return {
    name: 'qqq-api',
    configureServer(server) {
      server.middlewares.use('/api/qqq', async (_request, response) => {
        try {
          const snapshot = await fetchQqqSnapshot()

          response.statusCode = 200
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(snapshot))
        } catch (error) {
          response.statusCode = 502
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({
            message: error instanceof Error ? error.message : 'Failed to fetch QQQ market data'
          }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), qqqApiPlugin()]
})
