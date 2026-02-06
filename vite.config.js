import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { DEFAULT_GITHUB_PAGES_BASE_PATH } from './src/utils/configConstants.js'
import {
  THEME_COLOR_PRIMARY,
  THEME_COLOR_BACKGROUND,
  PWA_ICON_SIZE_SMALL,
  PWA_ICON_SIZE_LARGE,
  CACHE_MAX_ENTRIES,
  CACHE_MAX_AGE_DAYS
} from './src/utils/themeConstants.js'
import { DIST_DIR } from './scripts/buildConstants.js'

// Cache age in seconds (30 days)
const CACHE_MAX_AGE_SECONDS = CACHE_MAX_AGE_DAYS * 24 * 60 * 60

// PWA icon file paths
const PWA_ICON_SMALL = 'icon-192x192.svg'
const PWA_ICON_LARGE = 'icon-512x512.svg'

// Development server configuration
const DEV_SERVER_PORT = 3000
const PREVIEW_SERVER_PORT = 4173

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd())
  // Use environment variable from process.env (set by CI) or .env file or default
  // Priority: process.env.VITE_BASE_URL > .env file > default
  const base =
    process.env.VITE_BASE_URL ||
    env.VITE_BASE_URL ||
    DEFAULT_GITHUB_PAGES_BASE_PATH

  return {
    base,
    // Define compile-time constants for secure environment detection
    // Replaces __DEV__ with true/false during build (no runtime eval needed)
    define: {
      __DEV__: mode === 'development'
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Automatically inject service worker registration code into the build
        // This ensures immediate SW registration when the page loads, which is
        // critical for fixing 404 refresh errors. The 'auto' mode generates
        // registerSW.js that registers the service worker on page load, allowing
        // subsequent page refreshes to be intercepted by the SW and served from cache.
        injectRegister: 'auto',
        includeAssets: [PWA_ICON_SMALL, PWA_ICON_LARGE],
        manifest: {
          name: 'Aurorae Haven',
          short_name: 'Aurorae',
          description:
            'A calm, astro-themed productivity app designed for neurodivergent users.',
          theme_color: THEME_COLOR_PRIMARY,
          background_color: THEME_COLOR_BACKGROUND,
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: PWA_ICON_SMALL,
              sizes: PWA_ICON_SIZE_SMALL,
              type: 'image/svg+xml'
            },
            {
              src: PWA_ICON_LARGE,
              sizes: PWA_ICON_SIZE_LARGE,
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          // Cache all static assets
          globPatterns: [
            '**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2}'
          ],
          // Ensure service worker activates immediately and takes control of clients
          skipWaiting: true,
          clientsClaim: true,
          // Configure navigation fallback to serve index.html for all navigation requests
          // This fixes the 404 issue when refreshing non-root pages
          // CRITICAL: Use simple 'index.html' to match the precached URL exactly
          // Workbox's createHandlerBoundToURL() requires the exact precached URL
          // The service worker's scope (e.g., DEFAULT_GITHUB_PAGES_BASE_PATH) handles base path resolution
          // Both production (DEFAULT_GITHUB_PAGES_BASE_PATH) and offline (./) builds use 'index.html'
          navigateFallback: 'index.html', // See above: must match precached URL exactly
          // Allow all navigation requests to be handled by the fallback
          // This works for both production (DEFAULT_GITHUB_PAGES_BASE_PATH/*) and offline (/*) because
          // the service worker is registered with the correct scope
          navigateFallbackAllowlist: [/.*/],
          // Deny list for URLs that should not use the fallback (e.g., API endpoints)
          navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
          // Runtime caching for external resources
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'jsdelivr-cache',
                expiration: {
                  maxEntries: CACHE_MAX_ENTRIES,
                  maxAgeSeconds: CACHE_MAX_AGE_SECONDS
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    build: {
      outDir: DIST_DIR,
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split vendor code for better caching
            if (
              id.includes('node_modules/@fullcalendar/core') ||
              id.includes('node_modules/@fullcalendar/daygrid')
            ) {
              return 'calendar-vendor'
            }
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')
            ) {
              return 'react-vendor'
            }
            if (
              id.includes('node_modules/marked') ||
              id.includes('node_modules/dompurify')
            ) {
              return 'markdown-vendor'
            }
          }
        }
      }
    },
    server: {
      port: DEV_SERVER_PORT,
      open: true
    },
    preview: {
      port: PREVIEW_SERVER_PORT
    },
    // Resolve configuration
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
})
