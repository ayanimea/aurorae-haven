import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point uuid to its Node entry to avoid CJS/ESM interop issues in tests
      uuid: fileURLToPath(
        new URL('./node_modules/uuid/dist-node/index.js', import.meta.url)
      )
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/index.jsx', 'src/serviceWorkerRegistration.js']
    },
    css: true,
    server: {
      deps: {
        inline: [
          'marked',
          'dompurify',
          'react-router',
          'react-router-dom',
          '@fullcalendar'
        ]
      }
    }
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  }
})
