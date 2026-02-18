import { test, expect } from '@playwright/test';

test('Reproduce routine bug: Click Use on routine template', async ({ page }) => {
  // Enable console logging
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER:', text);
    logs.push(text);
  });

  // Step 1: Navigate to the app
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(2000);

  // Step 2: Go to Library tab directly
  console.log('\n=== Going to Library tab ===');
  await page.click('text=Library');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/01-library-page.png', fullPage: true });

  // Step 3: Look for routine templates
  console.log('\n=== Looking for routine templates ===');
  
  // Find routines section
  const routinesHeading = await page.locator('h2:has-text("Routines")');
  if (await routinesHeading.isVisible({ timeout: 5000 })) {
    console.log('✓ Found Routines section');
    
    // Count routine templates
    const routineSection = routinesHeading.locator('..').locator('..');
    const routineCards = await routineSection.locator('.template-card').count();
    console.log(`Found ${routineCards} routine template cards`);
    
    // Find first "Use" button in routines section
    const useButton = routineSection.locator('button:has-text("Use")').first();
    
    if (await useButton.isVisible({ timeout: 2000 })) {
      console.log('\n=== Clicking Use button on routine ===');
      
      // Get the routine title before clicking
      const card = useButton.locator('../..');
      const routineTitle = await card.locator('.template-title').textContent();
      const routineType = await card.locator('.template-type').textContent();
      console.log('Routine title:', routineTitle);
      console.log('Routine type badge:', routineType);
      
      await useButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/02-after-use-click.png', fullPage: true });
      
      // Check what toast message appears
      const toast = page.locator('.toast, [role="alert"], .notification');
      if (await toast.isVisible({ timeout: 3000 })) {
        const toastText = await toast.textContent();
        console.log('\nToast message:', toastText);
        
        if (toastText.includes('Task created')) {
          console.log('\n❌ BUG CONFIRMED: Toast says "Task created" for routine!');
        } else if (toastText.includes('Routine created')) {
          console.log('\n✅ CORRECT: Toast says "Routine created"');
        }
      } else {
        console.log('No toast message found');
      }
      
      // Check console logs for our debug messages
      console.log('\n=== Checking for debug logs ===');
      const handleUseTemplateLogs = logs.filter(l => l.includes('handleUseTemplate') || l.includes('Template type:'));
      if (handleUseTemplateLogs.length > 0) {
        console.log('Debug logs found:');
        handleUseTemplateLogs.forEach(log => console.log('  ', log));
      }
      
      // Check localStorage for tasks
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
        const latestTask = allTasks[allTasks.length - 1];
        if (latestTask) {
          console.log('Latest task text:', latestTask.text || latestTask.title);
          if (latestTask.text && latestTask.text.includes(routineTitle)) {
            console.log('❌ BUG: Routine was saved as a TASK in localStorage!');
          }
        }
      }
      
      // Check IndexedDB for routines
      const routinesData = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('aurorae_haven_db', 3);
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
      if (routinesData.length > 0) {
        const latestRoutine = routinesData[routinesData.length - 1];
        console.log('Latest routine name:', latestRoutine.name);
      }
      
    } else {
      console.log('❌ No Use button found in Routines section');
    }
  } else {
    console.log('❌ Routines section not found');
  }
});
