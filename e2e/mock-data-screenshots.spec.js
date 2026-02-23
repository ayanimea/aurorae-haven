// Playwright integration tests: mock-data screenshots for Tasks, Routines, Schedule
//
// This spec seeds realistic mock data directly into the browser's storage
// (localStorage for tasks via addInitScript, IndexedDB for routines and
// schedule events via page.evaluate after the app has initialised the DB)
// then captures full-page screenshots for each tab.
//
// Seeding strategy
// ─────────────────
// • Tasks      → localStorage ("aurorae_tasks") via addInitScript.
//                Runs before the app's first render so React picks it up
//                on mount without an extra reload.
// • Routines   → IndexedDB store "routines" via page.evaluate.
//                Called after the app has loaded the Routines page, which
//                guarantees the "aurorae_haven_db" schema (version 3) is
//                already in place.  Same connection also seeds schedule.
// • Schedule   → IndexedDB store "schedule" (same evaluate as routines).
//
// Screenshots are written to playwright-screenshots/ following the suite convention.

import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const screenshotDir = path.resolve('playwright-screenshots')

// ---------------------------------------------------------------------------
// Mock data definitions (passed as serialisable JSON into page.evaluate)
// ---------------------------------------------------------------------------

function buildMockTasks() {
  const now = new Date().toISOString()
  return {
    urgent_important: [
      {
        id: 'mock-task-1',
        text: 'Submit project report by end of day',
        completed: false,
        createdAt: now,
        dueDate: null,
        completedAt: null
      },
      {
        id: 'mock-task-2',
        text: 'Fix critical login bug in production',
        completed: false,
        createdAt: now,
        dueDate: null,
        completedAt: null
      }
    ],
    not_urgent_important: [
      {
        id: 'mock-task-3',
        text: 'Plan next sprint roadmap',
        completed: false,
        createdAt: now,
        dueDate: null,
        completedAt: null
      },
      {
        id: 'mock-task-4',
        text: 'Review design system updates',
        completed: true,
        createdAt: now,
        dueDate: null,
        completedAt: now
      }
    ],
    urgent_not_important: [
      {
        id: 'mock-task-5',
        text: 'Reply to team Slack messages',
        completed: false,
        createdAt: now,
        dueDate: null,
        completedAt: null
      }
    ],
    not_urgent_not_important: [
      {
        id: 'mock-task-6',
        text: 'Reorganise bookmarks folder',
        completed: false,
        createdAt: now,
        dueDate: null,
        completedAt: null
      }
    ]
  }
}

function buildMockRoutines() {
  const now = Date.now()
  const createdAt = new Date(now).toISOString()
  return [
    {
      id: 'routine_mock_1',
      name: 'Morning Wake-Up',
      tags: ['morning', 'energy'],
      estimatedDuration: 1800,
      totalDuration: 1800,
      steps: [
        { id: 'step_m1', label: 'Drink a glass of water', duration: 60 },
        { id: 'step_m2', label: 'Light stretches', duration: 300 },
        { id: 'step_m3', label: 'Cold shower', duration: 300 },
        { id: 'step_m4', label: 'Healthy breakfast', duration: 600 },
        { id: 'step_m5', label: 'Review daily goals', duration: 540 }
      ],
      timestamp: now,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'routine_mock_2',
      name: 'Focus Work Block',
      tags: ['productivity', 'deep-work'],
      estimatedDuration: 5400,
      totalDuration: 5400,
      steps: [
        { id: 'step_f1', label: 'Clear desk & set intention', duration: 300 },
        { id: 'step_f2', label: 'Deep work (Pomodoro 1)', duration: 1500 },
        { id: 'step_f3', label: 'Short break', duration: 300 },
        { id: 'step_f4', label: 'Deep work (Pomodoro 2)', duration: 1500 },
        { id: 'step_f5', label: 'Short break', duration: 300 },
        { id: 'step_f6', label: 'Review & wrap-up notes', duration: 1500 }
      ],
      timestamp: now + 1,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'routine_mock_3',
      name: 'Wind-Down Evening',
      tags: ['evening', 'calm'],
      estimatedDuration: 2700,
      totalDuration: 2700,
      steps: [
        {
          id: 'step_e1',
          label: 'Put phone on Do Not Disturb',
          duration: 60
        },
        { id: 'step_e2', label: 'Light yoga / stretches', duration: 600 },
        { id: 'step_e3', label: 'Journalling', duration: 600 },
        { id: 'step_e4', label: 'Read fiction (no screens)', duration: 900 },
        { id: 'step_e5', label: 'Lights out', duration: 540 }
      ],
      timestamp: now + 2,
      createdAt,
      updatedAt: createdAt
    }
  ]
}

function buildMockEvents(todayStr) {
  const now = Date.now()
  const createdAt = new Date(now).toISOString()
  return [
    {
      id: 'schedule_mock_1',
      title: 'Morning Wake-Up Routine',
      type: 'routine',
      day: todayStr,
      startTime: '07:00',
      endTime: '07:30',
      duration: 30,
      travelTime: 0,
      preparationTime: 0,
      isExternal: false,
      externalCalendarId: null,
      timestamp: now + 10,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'schedule_mock_2',
      title: 'Team stand-up',
      type: 'meeting',
      day: todayStr,
      startTime: '09:00',
      endTime: '09:30',
      duration: 30,
      travelTime: 0,
      preparationTime: 0,
      isExternal: false,
      externalCalendarId: null,
      timestamp: now + 11,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'schedule_mock_3',
      title: 'Focus Work Block',
      type: 'routine',
      day: todayStr,
      startTime: '10:00',
      endTime: '11:30',
      duration: 90,
      travelTime: 0,
      preparationTime: 0,
      isExternal: false,
      externalCalendarId: null,
      timestamp: now + 12,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'schedule_mock_4',
      title: 'Submit project report',
      type: 'task',
      day: todayStr,
      startTime: '13:00',
      endTime: '14:00',
      duration: 60,
      travelTime: 0,
      preparationTime: 0,
      isExternal: false,
      externalCalendarId: null,
      timestamp: now + 13,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'schedule_mock_5',
      title: 'Lunch break',
      type: 'break',
      day: todayStr,
      startTime: '12:00',
      endTime: '13:00',
      duration: 60,
      travelTime: 0,
      preparationTime: 0,
      isExternal: false,
      externalCalendarId: null,
      timestamp: now + 14,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'schedule_mock_6',
      title: 'Wind-Down Evening Routine',
      type: 'routine',
      day: todayStr,
      startTime: '20:00',
      endTime: '20:45',
      duration: 45,
      travelTime: 0,
      preparationTime: 0,
      isExternal: false,
      externalCalendarId: null,
      timestamp: now + 15,
      createdAt,
      updatedAt: createdAt
    }
  ]
}

// ---------------------------------------------------------------------------
// Helper: write routines + schedule into IndexedDB via page.evaluate.
//
// IMPORTANT: This must be called AFTER the app has already opened and
// upgraded "aurorae_haven_db" to version 3 (by visiting a page that uses
// IndexedDB, e.g. /routines).  Opening the DB without a version number
// attaches to the existing schema; if the DB doesn't exist yet, the open
// returns a version-1 DB with no stores and the subsequent transaction
// throws, causing the Promise to hang until the test timeout.
// ---------------------------------------------------------------------------
async function seedIndexedDB(page, routines, events) {
  await page.evaluate(
    async ({ routines: rList, events: eList }) => {
      await new Promise((resolve, reject) => {
        // Open without specifying a version — uses whatever version the app
        // has already created (currently 3).  onupgradeneeded will NOT fire.
        const req = indexedDB.open('aurorae_haven_db')

        req.onerror = () => reject(req.error)

        req.onsuccess = (evt) => {
          const db = evt.target.result

          // Write both stores in a single transaction for atomicity
          let tx
          try {
            tx = db.transaction(['routines', 'schedule'], 'readwrite')
          } catch (err) {
            reject(err)
            return
          }

          const routineStore = tx.objectStore('routines')
          const scheduleStore = tx.objectStore('schedule')

          rList.forEach((r) => routineStore.put(r))
          eList.forEach((e) => scheduleStore.put(e))

          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
          tx.onabort = () => reject(new Error('Transaction aborted'))
        }
      })
    },
    { routines, events }
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
test.describe('Mock-data screenshots: Tasks, Routines, Schedule', () => {
  test.beforeAll(() => {
    // Ensure screenshot directory exists before any test runs
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }
  })

  // ─── Tasks tab ────────────────────────────────────────────────────────────
  test('Tasks tab with mock data', async ({ page }) => {
    // Inject tasks into localStorage BEFORE the page loads so React picks
    // them up on first mount (addInitScript runs before any page script)
    const mockTasks = buildMockTasks()
    await page.addInitScript((tasks) => {
      localStorage.setItem('aurorae_tasks', JSON.stringify(tasks))
    }, mockTasks)

    await page.goto('tasks')
    await page.waitForLoadState('networkidle')

    // Wait for at least one task text to confirm the mock data was read
    await expect(
      page.locator('text=Submit project report by end of day')
    ).toBeVisible({ timeout: 8000 })

    await page.screenshot({
      path: path.join(screenshotDir, 'mock-01-tasks.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: Tasks tab with mock data')
  })

  // ─── Routines tab ─────────────────────────────────────────────────────────
  test('Routines tab with mock data', async ({ page }) => {
    // Step 1: Load the Routines page so the app creates the IndexedDB schema.
    // We wait for the "No routines yet" empty-state text to confirm the DB
    // is ready before we write our mock data.
    await page.goto('routines')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.empty-state-text')).toBeVisible({
      timeout: 8000
    })

    // Step 2: Seed IndexedDB with mock routines (and schedule events at the
    // same time, since both stores exist now).
    const todayStr = new Date().toISOString().slice(0, 10)
    await seedIndexedDB(page, buildMockRoutines(), buildMockEvents(todayStr))

    // Step 3: Reload the page so the Routines component re-fetches from IndexedDB
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Wait for the seeded routines to appear
    await expect(page.locator('text=Morning Wake-Up')).toBeVisible({
      timeout: 8000
    })

    await page.screenshot({
      path: path.join(screenshotDir, 'mock-02-routines.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: Routines tab with mock data')
  })

  // ─── Schedule tab ──────────────────────────────────────────────────────────
  test('Schedule tab with mock data', async ({ page }) => {
    // Step 1: Load the Routines page to initialise the IndexedDB schema
    // (same reason as in the Routines test above).
    await page.goto('routines')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.empty-state-text')).toBeVisible({
      timeout: 8000
    })

    // Step 2: Seed both stores
    const todayStr = new Date().toISOString().slice(0, 10)
    await seedIndexedDB(page, buildMockRoutines(), buildMockEvents(todayStr))

    // Step 3: Navigate to the Schedule tab
    await page.goto('schedule')
    await page.waitForLoadState('networkidle')

    // Wait for FullCalendar to render its time-grid
    await page.waitForSelector('.fc-timegrid-slot', { timeout: 10000 })

    // Give event cards time to appear after the calendar mounts
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(screenshotDir, 'mock-03-schedule.png'),
      fullPage: true
    })
    // eslint-disable-next-line no-console
    console.log('✓ Screenshot: Schedule tab with mock data')
  })
})
