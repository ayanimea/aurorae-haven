import { test } from '@playwright/test'

test.describe('Routine Workflow', () => {
  test('Complete routine workflow: select, start, pause, advance, finish', async ({
    page
  }) => {
    // Step 1: Navigate and select a routine from Library
    // eslint-disable-next-line no-console
    console.log('Step 1: Selecting a routine from Library...')
    await page.goto('library')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Take screenshot of Library view
    await page.screenshot({
      path: 'playwright-screenshots/01-library-view.png',
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot 1: Library view')

    // Find and click the first routine's Start button
    const routineCards = await page.locator('article').all()
    let routineStarted = false

    for (const card of routineCards) {
      const startButton = card.locator('button:has-text("Start")')
      if (await startButton.isVisible()) {
        await startButton.click()
        routineStarted = true
        break
      }
    }

    if (!routineStarted) {
      // eslint-disable-next-line no-console
      console.log(
        'No routine found with Start button, checking if routines loaded...'
      )
      await page.screenshot({
        path: 'playwright-screenshots/01b-no-routines-found.png',
        fullPage: true
      })
    }

    await page.waitForTimeout(1000)
    await page.screenshot({
      path: 'playwright-screenshots/02-routine-selected.png',
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot 2: Routine selected')

    // Step 2: Navigate to Routines tab to start execution
    // eslint-disable-next-line no-console
    console.log('Step 2: Starting the routine...')
    await page.click('text=Routines')
    await page.waitForTimeout(2000)
    await page.screenshot({
      path: 'playwright-screenshots/03-routine-started.png',
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot 3: Routine started')

    // Step 3: Pause the routine
    // eslint-disable-next-line no-console
    console.log('Step 3: Pausing the routine...')
    const pauseButton = page.locator('button:has-text("Pause")')

    if (await pauseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pauseButton.click()
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: 'playwright-screenshots/04-routine-paused.png',
        fullPage: true
      })
      // eslint-disable-next-line no-console
      console.log('✓ Screenshot 4: Routine paused')
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠ Pause button not visible - routine may not be running')
      await page.screenshot({
        path: 'playwright-screenshots/04-pause-not-available.png',
        fullPage: true
      })
    }

    // Step 4: Advance to next step (Complete current step)
    // eslint-disable-next-line no-console
    console.log('Step 4: Advancing to next step...')
    const completeButton = page.locator('button:has-text("Complete")')

    if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeButton.click()
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: 'playwright-screenshots/05-next-step.png',
        fullPage: true
      })
      // eslint-disable-next-line no-console
      console.log('✓ Screenshot 5: Advanced to next step')
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠ Complete button not visible')
      await page.screenshot({
        path: 'playwright-screenshots/05-complete-not-available.png',
        fullPage: true
      })
    }

    // Step 5: Finish the routine (complete all remaining steps)
    // eslint-disable-next-line no-console
    console.log('Step 5: Finishing the routine...')

    // Complete steps until routine is finished or no more Complete button
    for (let i = 0; i < 10; i++) {
      const completeBtn = page.locator('button:has-text("Complete")')
      const isVisible = await completeBtn
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      if (isVisible) {
        await completeBtn.click()
        await page.waitForTimeout(500)
      } else {
        break
      }
    }

    await page.waitForTimeout(2000)
    await page.screenshot({
      path: 'playwright-screenshots/06-routine-completed.png',
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot 6: Routine completed')

    // eslint-disable-next-line no-console
    console.log(
      '\\n✓ Workflow test completed! All screenshots saved to playwright-screenshots/'
    )
  })
})
