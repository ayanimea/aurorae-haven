import { test, expect } from '@playwright/test';

test('Verify routine templates are created as routines, not tasks', async ({ page, context }, testInfo) => {
  // Enable console logging for debugging
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER:', text);
    logs.push(text);
  });

  // Step 1: Navigate to the app
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Step 2: Go to Library tab directly
  console.log('\n=== Going to Library tab ===');
  await page.click('text=Library');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot using Playwright's test info for proper path handling
  await page.screenshot({ 
    path: testInfo.outputPath('01-library-page.png'), 
    fullPage: true 
  });

  // Step 3: Find and verify routines section exists
  console.log('\n=== Looking for routine templates ===');
  
  const routinesHeading = page.locator('h2:has-text("Routines")');
  await expect(routinesHeading).toBeVisible({ timeout: 5000 });
  console.log('✓ Found Routines section');
  
  // Count routine templates
  const routineSection = routinesHeading.locator('..').locator('..');
  const routineCards = routineSection.locator('.template-card');
  const cardCount = await routineCards.count();
  console.log(`Found ${cardCount} routine template cards`);
  expect(cardCount).toBeGreaterThan(0);
  
  // Step 4: Get routine info before clicking
  const firstCard = routineCards.first();
  const routineTitle = await firstCard.locator('.template-title').textContent();
  const routineType = await firstCard.locator('.template-type').textContent();
  console.log('Routine title:', routineTitle);
  console.log('Routine type badge:', routineType);
  
  // Verify the type badge shows 'routine'
  expect(routineType?.toLowerCase()).toBe('routine');
  
  // Step 5: Click the "Use" button
  const useButton = firstCard.locator('button:has-text("Use")');
  await expect(useButton).toBeVisible({ timeout: 2000 });
  console.log('\n=== Clicking Use button on routine ===');
  
  await useButton.click();
  
  // Step 6: Wait for and verify the toast message
  const toast = page.locator('.toast, [role="alert"], .notification');
  await expect(toast).toBeVisible({ timeout: 5000 });
  
  const toastText = await toast.textContent();
  console.log('\nToast message:', toastText);
  
  // Take screenshot after action
  await page.screenshot({ 
    path: testInfo.outputPath('02-after-use-click.png'), 
    fullPage: true 
  });
  
  // ASSERTION: Verify toast says "Routine created", not "Task created"
  expect(toastText).toContain('Routine created');
  expect(toastText).not.toContain('Task created');
  console.log('✅ CORRECT: Toast says "Routine created"');
  
  // Step 7: Check debug logs if available
  console.log('\n=== Checking for debug logs ===');
  const handleUseTemplateLogs = logs.filter(l => 
    l.includes('handleUseTemplate') || l.includes('Template type:')
  );
  if (handleUseTemplateLogs.length > 0) {
    console.log('Debug logs found:');
    handleUseTemplateLogs.forEach(log => console.log('  ', log));
  }
  
  // Step 8: Verify routine is NOT in localStorage tasks
  const localStorageTasks = await page.evaluate(() => {
    const tasks = localStorage.getItem('aurorae_tasks');
    return tasks ? JSON.parse(tasks) : null;
  });
  
  if (localStorageTasks) {
    const allTasks = [
      ...(localStorageTasks.urgent_important || []),
      ...(localStorageTasks.not_urgent_important || []),
      ...(localStorageTasks.urgent_not_important || []),
      ...(localStorageTasks.not_urgent_not_important || [])
    ];
    console.log('\nTasks in localStorage:', allTasks.length);
    
    // ASSERTION: Routine should NOT appear in tasks
    const routineInTasks = allTasks.some(task => 
      (task.text || task.title || '').includes(routineTitle || '')
    );
    expect(routineInTasks).toBe(false);
    console.log('✅ CORRECT: Routine NOT found in localStorage tasks');
  }
  
  // Step 9: Verify routine IS in IndexedDB
  const routinesData = await page.evaluate(async () => {
    return new Promise((resolve) => {
      // NOTE: Database name must match the application's IndexedDB name.
      // Defined in src/utils/indexedDBManager.js as DB_NAME = 'aurorae_haven_db'
      // We omit the explicit version parameter to open the current version,
      // making the test more resilient to future schema version changes.
      const request = indexedDB.open('aurorae_haven_db');
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['routines'], 'readonly');
        const store = transaction.objectStore('routines');
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };
        getAllRequest.onerror = () => resolve([]);
      };
      request.onerror = () => resolve([]);
    });
  });
  
  console.log('Routines in IndexedDB:', routinesData.length);
  
  // ASSERTION: At least one routine should exist in IndexedDB
  expect(routinesData.length).toBeGreaterThan(0);
  
  // ASSERTION: The routine we just created should be in IndexedDB
  const createdRoutine = routinesData.find(r => 
    (r.name || r.title || '').includes(routineTitle || '')
  );
  expect(createdRoutine).toBeDefined();
  console.log('✅ CORRECT: Routine found in IndexedDB:', createdRoutine?.name);
});
