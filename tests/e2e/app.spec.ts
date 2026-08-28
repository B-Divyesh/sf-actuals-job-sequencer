import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function clearBrowserState(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    await Promise.all(['actuals-job-sequencer', 'demo:actuals-job-sequencer'].map((name) => new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve(); request.onerror = () => resolve(); request.onblocked = () => resolve();
    })));
  });
}

async function openFreshDemo(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo/');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
}

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await clearBrowserState(page);
});

test('@claim:demo-isolation sample data is one click away, resettable, and separate from real jobs', async ({ page }) => {
  await page.getByRole('button', { name: 'Start your first job' }).first().click();
  await page.getByLabel('Job name').fill('Real boiler service');
  await page.getByLabel('First forecast start').fill('2026-09-03');
  await page.getByRole('button', { name: 'Create job' }).click();

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page).toHaveTitle('Demo — Actuals Job Sequencer');
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
  await expect(page.getByText('Real boiler service')).toHaveCount(0);

  await page.getByRole('button', { name: 'Edit job' }).click();
  await page.getByLabel('Job name').fill('Changed sample job');
  await page.getByRole('button', { name: 'Save job' }).click();
  await expect(page.getByRole('heading', { name: 'Changed sample job' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Real boiler service' })).toBeVisible();
  await expect(page.getByText('Mercer kitchen fit')).toHaveCount(0);
});

test('@claim:dependency-reflow late actuals move later forecasts and impossible actual order is rejected', async ({ page }) => {
  await openFreshDemo(page);
  const handover = page.locator('[data-step-id="demo-handover"]');
  await expect(handover.getByText('MOVED')).toBeVisible();
  await expect(handover).toContainText('Sep 16, 2026 – Sep 17, 2026');

  await page.getByRole('button', { name: 'Edit or finish Rough-in' }).click();
  await page.getByRole('button', { name: 'Remove actual finish' }).click();
  await expect(page.getByText('Actual finish removed. Later forecast dates recalculated.')).toBeVisible();
  const notesBefore = await page.locator('.history-list li').count();
  const updateBefore = await page.locator('.client-notice').innerText();
  await page.getByRole('button', { name: 'Edit or finish Rough-in' }).click();
  await page.getByRole('button', { name: 'Record actual finish' }).click();
  await page.getByLabel('Actual finish date').fill('2026-09-03');
  await page.getByRole('button', { name: 'Save actual and recalculate' }).click();
  await expect(page.getByRole('alert')).toContainText('Rough-in cannot finish');
  await expect(page.getByRole('alert')).toContainText('Strip out finished on Tue, Sep 8, 2026');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  expect(await page.locator('.history-list li').count()).toBe(notesBefore);
  expect(await page.locator('.client-notice').innerText()).toBe(updateBefore);
  await page.reload();
  await page.getByRole('button', { name: 'Edit or finish Rough-in' }).click();
  await expect(page.getByRole('button', { name: 'Record actual finish' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const invalid = {
    version: 1, settings: { timezone: 'UTC', workdays: [1, 2, 3, 4, 5], holidays: [] },
    jobs: [{ id: 'bad', name: 'Impossible order', client: '', startDate: '2026-09-03', status: 'active', createdAt: '', updatedAt: '', history: [], steps: [
      { id: 'one', name: 'First', duration: 1, actualFinish: '2026-09-09' },
      { id: 'two', name: 'Second', duration: 1, actualFinish: '2026-09-03' }
    ] }]
  };
  const nodeBuffer = (globalThis as unknown as { Buffer: { from(value: string): unknown } }).Buffer.from(JSON.stringify(invalid));
  await page.getByLabel('Import JSON').setInputFiles({ name: 'impossible.json', mimeType: 'application/json', buffer: nodeBuffer as never });
  await expect(page.getByRole('alert')).toContainText('invalid jobs, dates, or step order');
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
});

test('@claim:client-update sample late finish produces a ready-to-copy client update', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openFreshDemo(page);
  const update = page.locator('#client-message');
  await expect(update).toContainText('Hello Rina Mercer');
  await expect(update).toContainText('Fit and handover: Sep 11, 2026 → Sep 16, 2026');
  await expect(update).toContainText('Current forecast job finish: Thu, Sep 17, 2026');
  await page.getByRole('button', { name: 'Copy client update' }).click();
  await expect(page.getByText('Client update copied.')).toBeVisible();
});

test('@claim:csv-export CSV contains every sample step and calendar settings', async ({ page }) => {
  await openFreshDemo(page);
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let csv = ''; for await (const chunk of stream) csv += chunk.toString();
  expect(csv.split('\r\n')).toHaveLength(4);
  expect(csv).toContain('"forecast_start"');
  expect(csv).toContain('"Mercer kitchen fit"');
  expect(csv).toContain('"Europe/London"');
  expect(csv).toContain('"2026-09-15"');
});

test('@claim:json-backup JSON exports and restores the complete sample job', async ({ page }) => {
  await openFreshDemo(page);
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Edit job' }).click();
  await page.getByLabel('Job name').fill('Temporary name');
  await page.getByRole('button', { name: 'Save job' }).click();
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Import JSON').setInputFiles(path!);
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
  await expect(page.locator('[data-step-id="demo-handover"]')).toContainText('Sep 17, 2026');
});

test('@claim:local-only editing the sample sends no job data off origin', async ({ page }) => {
  const offOrigin: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition: () => { (window as unknown as { geoCalls: number }).geoCalls += 1; },
      watchPosition: () => { (window as unknown as { geoCalls: number }).geoCalls += 1; return 1; },
      clearWatch: () => undefined
    } });
    (window as unknown as { geoCalls: number }).geoCalls = 0;
  });
  page.on('request', (request) => { if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') offOrigin.push(request.url()); });
  await openFreshDemo(page);
  await page.getByRole('button', { name: 'Edit job' }).click();
  await page.getByLabel('Client name').fill('Private sample client');
  await page.getByRole('button', { name: 'Save job' }).click();
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  await downloadPromise;
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(offOrigin).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { geoCalls: number }).geoCalls)).toBe(0);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').every((entry) => new URL(entry.name).origin === location.origin))).toBe(true);
});

test('@claim:offline-reload sample job reloads after the connection is turned off', async ({ page, context }) => {
  await openFreshDemo(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('Demo — Actuals Job Sequencer');
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
  await expect(page.getByText('Offline · changes save here')).toBeVisible();
});

test('@claim:five-job-limit five active jobs and exports work without an account', async ({ page }) => {
  await openFreshDemo(page);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByText('Five active jobs. No account.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Buy|checkout/i })).toHaveCount(0);
  for (let index = 1; index <= 5; index += 1) {
    await page.getByRole('button', { name: index === 1 ? 'Start your first job' : 'Add a job' }).first().click();
    await page.getByLabel('Job name').fill(`Job ${index}`);
    await page.getByLabel('First forecast start').fill('2026-09-03');
    await page.getByRole('button', { name: 'Create job' }).click();
  }
  await expect(page.locator('.rail-head')).toContainText('5/5');
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const exportPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await exportPromise).suggestedFilename()).toMatch(/\.csv$/);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Add a job' }).click();
  await expect(page.getByText('Five active jobs is the limit. Archive one to add another.')).toBeVisible();
});

test('routes set metadata, restore focus, and provide a designed not-found page', async ({ page }) => {
  await page.goto('/');
  const routes = [
    { name: 'Demo', title: 'Demo — Actuals Job Sequencer', path: '/demo/' },
    { name: 'Privacy', title: 'Privacy — Actuals Job Sequencer', path: '/privacy/' },
    { name: 'Terms', title: 'Terms — Actuals Job Sequencer', path: '/terms/' }
  ];
  for (const item of routes) {
    await page.getByRole('link', { name: item.name, exact: true }).first().click();
    await expect(page).toHaveURL(item.path);
    await expect(page).toHaveTitle(item.title);
    await expect(page.locator('h1')).toBeFocused();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://actuals-job-sequencer.sociobot.in${item.path}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.webp$/);
    await page.goBack();
  }
  await page.goto('/404/');
  await expect(page).toHaveTitle('Page not found — Actuals Job Sequencer');
  await expect(page.getByRole('heading', { name: 'This page is not on the job sheet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to your jobs' })).toBeVisible();
});

test('keyboard, mobile layout, dialogs, and all routes have no serious accessibility violations', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/404/']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  }
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to job schedule' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.getByRole('button', { name: 'Start your first job' }).first().click();
  await expect(page.getByLabel('Job name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Start your first job' }).first()).toBeFocused();
});
