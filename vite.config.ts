import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// stamps a unique id into the service worker on every build → "new version" detection
const stampServiceWorker = () => ({
  name: 'stamp-sw',
  apply: 'build' as const,
  closeBundle() {
    const f = 'dist/sw.js'
    writeFileSync(f, readFileSync(f, 'utf8').replaceAll('__BUILD__', Date.now().toString(36)))
  },
})

export default defineConfig({
  plugins: [react(), stampServiceWorker()],
})
