import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point uuid to its Node ESM build to avoid CJS/ESM wrapper.mjs interop issue
      uuid: new URL('./node_modules/uuid/dist/esm-node/index.js', import.meta.url)
        .pathname,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/index.jsx', 'src/serviceWorkerRegistration.js'],
    },
    css: true,
    server: {
      deps: {
        inline: [
          'marked',
          'dompurify',
          'react-router',
          'react-router-dom',
          '@fullcalendar',
        ],
      },
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
})
