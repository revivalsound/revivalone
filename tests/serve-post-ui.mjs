import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const server = await createServer({
  configFile: false, plugins: [react(), { name: 'isolated-post-fixture', enforce: 'pre', async load(id) {
    if (id.replaceAll('\\', '/').endsWith('/src/lib/supabase.ts')) return 'export * from "/tests/post-ui-client.ts"'
  } }], server: { host: '127.0.0.1', port: 5194, strictPort: true },
})
await server.listen()
server.printUrls()
