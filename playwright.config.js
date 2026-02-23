// Playwright configuration for browser-based testing
import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

// Load env the same way Vite does so that .env / .env.production are respected
// even when running Playwright directly (Node processes don't auto-load .env files).
// Use 'production' mode in CI (matches how `vite preview` serves the built output)
// and 'development' locally. An explicit VITE_BASE_URL env var always takes precedence.
const mode =
  process.env.NODE_ENV || (process.env.CI ? 'production' : 'development')
const viteEnv = loadEnv(mode, process.cwd(), '')
const rawBasePath =
  process.env.VITE_BASE_URL ?? viteEnv.VITE_BASE_URL ?? '/'

/**
 * Normalise the VITE_BASE_URL value to a canonical absolute path with a
 * trailing slash.  Rejects relative values (e.g. './') that cannot be used
 * as a Playwright baseURL path component.
 */
function normalizeBasePath(base) {
  if (!base || base === '/') {
    return '/'
  }

  if (base.startsWith('.')) {
    throw new Error(
      'VITE_BASE_URL must be an absolute path starting with "/". ' +
        'Relative values like "./" are not supported in Playwright config.'
    )
  }

  if (!base.startsWith('/')) {
    throw new Error(
      'VITE_BASE_URL must start with "/". For example: "/aurorae-haven/".'
    )
  }

  // Ensure a single trailing slash for consistency with Vite base paths.
  return base.endsWith('/') ? base : base + '/'
}

// Resolve the app's base path from the same env var used by Vite.
// - Local development: VITE_BASE_URL=/ (see .env)
// - CI / GitHub Pages: VITE_BASE_URL=/aurorae-haven/ (see .env.production)
const APP_BASE_PATH = normalizeBasePath(rawBasePath)

// Define the local preview server origin and the full app URL. BASE_URL
// combines ORIGIN + APP_BASE_PATH and is used as Playwright's baseURL.
// NOTE: In Playwright, only relative paths without a leading slash
// (e.g. '.', 'tasks') are resolved under APP_BASE_PATH. Root-relative
// paths like '/' or '/foo' are resolved from the bare ORIGIN and ignore
// the base path component of baseURL.
const ORIGIN = 'http://localhost:4173'
const BASE_URL = `${ORIGIN}${APP_BASE_PATH}`

export default defineConfig({
  testDir: './e2e',
  // Directory for Playwright test artifacts (traces, videos, etc.)
  // Manual screenshots are written to playwright-screenshots/ by individual tests.
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // Set baseURL to the full app URL (origin + base path) so that relative
    // page.goto calls (e.g. 'tasks') resolve to the correct path regardless
    // of whether VITE_BASE_URL is '/' or '/aurorae-haven/'.
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run preview',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000
  }
})
