import { test } from '@playwright/test'

// Visual regression reference for Schedule time-of-day atmosphere.
// Events are not seeded here because Schedule reads from IndexedDB via
// EventService, not from localStorage. Add events through the UI before
// running this test to capture event-card gradient styling.

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
