import { test } from '@playwright/test';

const tasks = [
  { id: '1', text: 'Morning Routine',   date: '2026-02-20', startTime: '07:30', endTime: '08:00', completed: false, color: '#f5a623' },
  { id: '2', text: 'Deep Work',         date: '2026-02-20', startTime: '09:00', endTime: '11:30', completed: false, color: '#4a9eff' },
  { id: '3', text: 'Team Standup',      date: '2026-02-20', startTime: '11:30', endTime: '12:00', completed: false, color: '#9b59b6' },
  { id: '4', text: 'Lunch Break',       date: '2026-02-20', startTime: '12:00', endTime: '13:00', completed: false, color: '#27ae60' },
  { id: '5', text: 'Project Review',    date: '2026-02-20', startTime: '14:00', endTime: '14:30', completed: false, color: '#e74c3c' },
  { id: '6', text: 'Feature Dev',       date: '2026-02-20', startTime: '15:00', endTime: '17:00', completed: false, color: '#4a9eff' },
  { id: '7', text: 'Gym Workout',       date: '2026-02-20', startTime: '18:00', endTime: '19:30', completed: false, color: '#e67e22' },
  { id: '8', text: 'Evening Reading',   date: '2026-02-20', startTime: '20:00', endTime: '21:00', completed: false, color: '#9b59b6' },
];

test('desktop', async ({ page }) => {
  await page.addInitScript((t) => { localStorage.setItem('aurorae_tasks', JSON.stringify(t)); }, tasks);
  await page.goto('/aurorae-haven/');
  await page.waitForLoadState('networkidle');
  try { await page.click('text=Schedule', { timeout: 3000 }); } catch {}
  await page.waitForSelector('.fc-timegrid-slot', { timeout: 5000 }).catch(() => {});
  await page.screenshot({ path: '/tmp/schedule_desktop.png', fullPage: false });
});

test('mobile', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { localStorage.setItem('aurorae_tasks', JSON.stringify(t)); }, tasks);
  await page.goto('/aurorae-haven/');
  await page.waitForLoadState('networkidle');
  try { await page.click('text=Schedule', { timeout: 3000 }); } catch {}
  await page.waitForSelector('.fc-timegrid-slot', { timeout: 5000 }).catch(() => {});
  await page.screenshot({ path: '/tmp/schedule_mobile.png', fullPage: false });
  await ctx.close();
});
