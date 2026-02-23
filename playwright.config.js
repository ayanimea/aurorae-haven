// Playwright configuration for browser-based testing
import { defineConfig, devices } from '@playwright/test'

// Resolve the app's base path from the same env var used by Vite.
// - Local development: VITE_BASE_URL=/ (see .env)
// - CI / GitHub Pages: VITE_BASE_URL=/aurorae-haven/ (see .env.production)
const APP_BASE_PATH = process.env.VITE_BASE_URL || '/'
const BASE_URL = `http://localhost:4173${APP_BASE_PATH}`

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
