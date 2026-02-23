// Playwright configuration for browser-based testing
import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

// Load env the same way Vite does so that .env / .env.production are respected
// even when running Playwright directly (Node processes don't auto-load .env files).
// Priority: process.env override > .env.* files > default '/'
const viteEnv = loadEnv(process.env.NODE_ENV || 'test', process.cwd(), '')
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

// Keep baseURL as the origin so that page.goto('/') always resolves to the
// server root, matching Playwright's standard behaviour.  Tests that need to
// navigate into the app base path use relative paths (e.g. 'tasks') which
// Playwright resolves against baseURL + APP_BASE_PATH via the webServer URL.
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
