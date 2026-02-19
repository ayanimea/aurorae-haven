import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
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
          'uuid',
          '@fullcalendar',
        ],
      },
    },
    environmentOptions: {
      node: {
        experimentalVmModules: true,
      },
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
})
