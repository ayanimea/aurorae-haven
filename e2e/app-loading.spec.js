// Playwright integration tests: application loading and main view
// Covers the "Navigating to the application and loading the main view" scenario
// from the integration test requirements.
//
// Compatible with both local development (VITE_BASE_URL=/) and
// CI/GitHub Pages deployments (VITE_BASE_URL=/aurorae-haven/).

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Resolve base path from environment to support both local and CI deployments
const BASE = process.env.VITE_BASE_URL || '/'

// Directory for key-state screenshots (mirrors convention used across e2e suite)
const screenshotDir = path.resolve('playwright-screenshots')

test.describe('App loading and main view', () => {
  test.beforeAll(() => {
    // Ensure screenshot directory exists before any test runs
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
  })

  // Verify the application loads successfully and shows the correct page title
  test('Application loads with correct page title', async ({ page }) => {
    const title = await page.title()
    expect(title).toBe('Aurorae Haven')

    // Screenshot: initial load state
    await page.screenshot({
      path: path.join(screenshotDir, 'app-01-initial-load.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: initial app load — title is "Aurorae Haven"')
  })

  // Verify the primary navigation tabs are rendered and keyboard-accessible
  test('Primary navigation tabs are visible and accessible', async ({
    page
  }) => {
    const nav = page.locator('nav[aria-label="Main"]')
    await expect(nav).toBeVisible()

    // Check all primary navigation tabs are present
    await expect(page.locator('text=Tasks')).toBeVisible()
    await expect(page.locator('text=Routines')).toBeVisible()
    await expect(page.locator('text=Schedule')).toBeVisible()
    await expect(page.locator('text=Habits')).toBeVisible()

    // Screenshot: navigation tabs visible
    await page.screenshot({
      path: path.join(screenshotDir, 'app-02-navigation.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: primary navigation tabs visible')
  })

  // Verify that clicking the Routines tab navigates to the Routines page
  test('Clicking Routines tab navigates to the Routines page', async ({
    page
  }) => {
    await page.click('text=Routines')
    await page.waitForLoadState('networkidle')

    // The Routines tab should now be marked active
    const activeTab = page.locator('.nav-tab.active')
    await expect(activeTab).toContainText('Routines')

    // Screenshot: Routines page
    await page.screenshot({
      path: path.join(screenshotDir, 'app-03-routines-page.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: Routines page loaded')
  })

  // Verify that clicking the Tasks tab navigates to the Tasks page
  test('Clicking Tasks tab navigates to the Tasks page', async ({ page }) => {
    await page.click('text=Tasks')
    await page.waitForLoadState('networkidle')

    // The Tasks tab should now be active
    const activeTab = page.locator('.nav-tab.active')
    await expect(activeTab).toContainText('Tasks')

    // Screenshot: Tasks page
    await page.screenshot({
      path: path.join(screenshotDir, 'app-04-tasks-page.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: Tasks page loaded')
  })

  // Verify the app loads and renders correctly with the prefers-reduced-motion media feature
  // (complements TAB-RTN-45 in routine-features.spec.js which tests this during routine execution)
  test('App loads correctly with prefers-reduced-motion: reduce', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    // The app should still load and show the correct title
    const title = await page.title()
    expect(title).toBe('Aurorae Haven')

    // Navigation should still be visible
    await expect(page.locator('nav[aria-label="Main"]')).toBeVisible()

    // Screenshot: reduced motion state on initial load
    await page.screenshot({
      path: path.join(screenshotDir, 'app-05-reduced-motion-load.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log(
      '✓ Screenshot: app loads correctly with prefers-reduced-motion: reduce'
    )
  })
})
