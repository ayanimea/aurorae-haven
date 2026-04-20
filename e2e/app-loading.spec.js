// Playwright integration tests: application loading and main view
// Covers the "Navigating to the application and loading the main view" scenario
// from the integration test requirements.
//
// Compatible with both local development (VITE_BASE_URL=/) and
// CI/GitHub Pages deployments (VITE_BASE_URL=/aurorae-haven/).

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

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
    // Navigate to the app root (resolved against baseURL from playwright.config.js)
    await page.goto('.')
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

  // Verify the primary navigation tabs are rendered and keyboard-accessible.
  // Locators are scoped to nav[aria-label="Main"] to avoid false positives
  // from page headings or card content that may share the same words.
  test('Primary navigation tabs are visible and accessible', async ({
    page
  }) => {
    const nav = page.locator('nav[aria-label="Main"]')
    await expect(nav).toBeVisible()

    // Use role-based locators scoped to the main nav so we're testing the
    // actual navigation tabs, not any other text on the page.
    await expect(nav.getByRole('tab', { name: 'Tasks' })).toBeVisible()
    await expect(nav.getByRole('tab', { name: 'Routines' })).toBeVisible()
    await expect(nav.getByRole('tab', { name: 'Schedule' })).toBeVisible()
    await expect(nav.getByRole('tab', { name: 'Habits' })).toBeVisible()

    // Screenshot: navigation tabs visible
    await page.screenshot({
      path: path.join(screenshotDir, 'app-02-navigation.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: primary navigation tabs visible')
  })

  // Verify that clicking the Routines tab navigates to the Routines page.
  // The click is scoped to the main nav; the active-state assertion checks
  // aria-selected on the specific tab element rather than a global class match.
  test('Clicking Routines tab navigates to the Routines page', async ({
    page
  }) => {
    const nav = page.locator('nav[aria-label="Main"]')
    const routinesTab = nav.getByRole('tab', { name: 'Routines' })

    await routinesTab.click()
    await page.waitForLoadState('networkidle')

    // The Routines tab should now carry aria-selected="true"
    await expect(routinesTab).toHaveAttribute('aria-selected', 'true')

    // Screenshot: Routines page
    await page.screenshot({
      path: path.join(screenshotDir, 'app-03-routines-page.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: Routines page loaded')
  })

  // Verify that clicking the Tasks tab navigates to the Tasks page.
  test('Clicking Tasks tab navigates to the Tasks page', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main"]')
    const tasksTab = nav.getByRole('tab', { name: 'Tasks' })

    await tasksTab.click()
    await page.waitForLoadState('networkidle')

    // The Tasks tab should now carry aria-selected="true"
    await expect(tasksTab).toHaveAttribute('aria-selected', 'true')

    // Screenshot: Tasks page
    await page.screenshot({
      path: path.join(screenshotDir, 'app-04-tasks-page.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: Tasks page loaded')
  })

  // Verify the app loads and renders correctly with the prefers-reduced-motion media feature.
  // (Complements TAB-RTN-45 in routine-features.spec.js which tests this during routine execution.)
  test('App loads correctly with prefers-reduced-motion: reduce', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('.')
    await page.waitForLoadState('networkidle')

    // The document title must be correct
    const title = await page.title()
    expect(title).toBe('Aurorae Haven')

    // The on-screen brand name in the header must also be visible
    const brandElement = page.locator('.figma-brand-text')
    await expect(brandElement).toBeVisible()
    await expect(brandElement).toHaveText('AURORAE HAVEN')

    // Navigation must still be fully functional
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
