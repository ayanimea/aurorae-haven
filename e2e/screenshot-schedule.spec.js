import { test } from '@playwright/test'

// Visual regression reference — manual/local-only.
// These tests capture screenshots of the Schedule time-of-day atmosphere
// for visual comparison; they make no programmatic assertions and are
// intentionally skipped in CI. Run locally after adding events through
// the UI (Schedule reads from IndexedDB via EventService, not localStorage).
test.skip(!!process.env.CI, 'Screenshot-only visual reference — skipped in CI')

test('desktop', async ({ page }, testInfo) => {
  await page.goto('/aurorae-haven/')
  await page.waitForLoadState('networkidle')
  await page.click('text=Schedule')
  await page.waitForSelector('.fc-timegrid-slot')
  await page.screenshot({ path: testInfo.outputPath('schedule_desktop.png') })
})

test('mobile', async ({ browser }, testInfo) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }
  })
  const page = await ctx.newPage()
  await page.goto('/aurorae-haven/')
  await page.waitForLoadState('networkidle')
  await page.click('text=Schedule')
  await page.waitForSelector('.fc-timegrid-slot')
  await page.screenshot({ path: testInfo.outputPath('schedule_mobile.png') })
  await ctx.close()
})
