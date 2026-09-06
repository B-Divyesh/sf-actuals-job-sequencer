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

function parseCsv(csv: string): string[][] {
  return csv.trimEnd().split('\r\n').map((line) => {
    const cells: string[] = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index]!;
      if (character === '"' && quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) { cells.push(cell); cell = ''; }
      else cell += character;
    }
    cells.push(cell);
    return cells;
  });
}

async function readDownload(download: import('@playwright/test').Download): Promise<string> {
  const stream = await download.createReadStream();
  let contents = '';
  for await (const chunk of stream) contents += chunk.toString();
  return contents;
}

function importBuffer(value: unknown): never {
  return (globalThis as unknown as { Buffer: { from(value: string): unknown } }).Buffer.from(JSON.stringify(value)) as never;
}

function backupWithActiveJobs(count: number): unknown {
  const timestamp = '2026-09-06T12:00:00.000Z';
  return {
    version: 1,
    settings: { timezone: 'Europe/London', workdays: [1, 2, 3, 4, 5], holidays: ['2026-12-25'] },
    jobs: Array.from({ length: count }, (_, index) => ({
      id: `import-job-${index + 1}`,
      name: `Imported job ${index + 1}`,
      client: '',
      startDate: '2026-09-07',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
      steps: [],
      history: []
    })),
    selectedJobId: 'import-job-1'
  };
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
    jobs: [{ id: 'bad', name: 'Impossible order', client: '', startDate: '2026-09-03', status: 'active', createdAt: '2026-09-03T08:00:00.000Z', updatedAt: '2026-09-09T08:00:00.000Z', history: [], steps: [
      { id: 'one', name: 'First', duration: 1, actualFinish: '2026-09-09' },
      { id: 'two', name: 'Second', duration: 1, actualFinish: '2026-09-03' }
    ] }], selectedJobId: 'bad'
  };
  await page.getByLabel('Import JSON').setInputFiles({ name: 'impossible.json', mimeType: 'application/json', buffer: importBuffer(invalid) });
  await expect(page.getByRole('alert')).toContainText('actual finishes out of step order');
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

test('@claim:csv-export CSV contains every step, zero-step job, forecast, actual finish, and calendar setting', async ({ page }) => {
  await openFreshDemo(page);
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job name').fill('Boundary job without steps');
  await page.getByLabel('Client name').fill('Owen Price');
  await page.getByLabel('First forecast start').fill('2026-09-18');
  await page.getByRole('button', { name: 'Create job' }).click();
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const rows = parseCsv(await readDownload(await downloadPromise));
  const header = ['job', 'client', 'status', 'step_order', 'step', 'duration_workdays', 'baseline_start', 'baseline_finish', 'forecast_start', 'forecast_finish', 'actual_finish', 'timezone', 'working_days', 'holidays'];
  expect(rows).toHaveLength(5);
  expect(rows[0]).toEqual(header);
  expect(rows.slice(1)).toEqual([
    ['Mercer kitchen fit', 'Rina Mercer', 'active', '1', 'Strip out', '2', '2026-09-07', '2026-09-08', '2026-09-07', '2026-09-08', '2026-09-08', 'Europe/London', 'Mon|Tue|Wed|Thu|Fri', '2026-09-15'],
    ['Mercer kitchen fit', 'Rina Mercer', 'active', '2', 'Rough-in', '2', '2026-09-09', '2026-09-10', '2026-09-09', '2026-09-14', '2026-09-14', 'Europe/London', 'Mon|Tue|Wed|Thu|Fri', '2026-09-15'],
    ['Mercer kitchen fit', 'Rina Mercer', 'active', '3', 'Fit and handover', '2', '2026-09-11', '2026-09-14', '2026-09-16', '2026-09-17', '', 'Europe/London', 'Mon|Tue|Wed|Thu|Fri', '2026-09-15'],
    ['Boundary job without steps', 'Owen Price', 'active', '', '', '', '', '', '', '', '', 'Europe/London', 'Mon|Tue|Wed|Thu|Fri', '2026-09-15']
  ]);
});

test('incomplete JSON import is announced and leaves the current jobs available after reload', async ({ page }) => {
  await openFreshDemo(page);
  const incomplete = backupWithActiveJobs(2) as { jobs: Array<Record<string, unknown>> };
  delete incomplete.jobs[1]!.updatedAt;
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  await page.getByLabel('Import JSON').setInputFiles({ name: 'incomplete.json', mimeType: 'application/json', buffer: importBuffer(incomplete) });
  await expect(page.getByRole('alert')).toContainText('job 2 is missing a valid updated date');
  await expect(page.getByRole('alert')).toContainText('current jobs were not changed');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
  await expect(page.getByText('Imported job 1')).toHaveCount(0);
});

test('an incomplete legacy record cannot hold a later app load on the loading screen', async ({ page }) => {
  const incomplete = backupWithActiveJobs(2) as { jobs: Array<Record<string, unknown>> };
  delete incomplete.jobs[0]!.updatedAt;
  await page.evaluate(async (record) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('actuals-job-sequencer', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('app');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction('app', 'readwrite');
      transaction.objectStore('app').put(record, 'current');
      transaction.oncomplete = () => { request.result.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }), incomplete);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Saved browser data is incomplete, so it was not opened');
  await expect(page.getByRole('heading', { name: 'Move forecast dates after actual finishes' })).toBeVisible();
  await expect(page.getByText('Loading your job sheet…')).toHaveCount(0);
});

test('@claim:json-backup JSON exports and restores every sample job field and calendar setting', async ({ page }) => {
  await openFreshDemo(page);
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const stream = await download.createReadStream();
  let json = ''; for await (const chunk of stream) json += chunk.toString();
  const backup = JSON.parse(json) as { version: number; settings: unknown; jobs: unknown; selectedJobId: string };
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Edit job' }).click();
  await page.getByLabel('Job name').fill('Temporary name');
  await page.getByLabel('Client name').fill('Temporary client');
  await page.getByLabel('First forecast start').fill('2026-10-01');
  await page.getByRole('button', { name: 'Save job' }).click();
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  await page.getByLabel('Timezone').fill('America/Chicago');
  await page.locator('input[name="workday"][value="5"]').uncheck();
  await page.getByLabel('Non-working dates').fill('2026-10-02\n2026-10-05');
  await page.getByRole('button', { name: 'Save working calendar' }).click();
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Import JSON').setInputFiles(path!);
  await expect(page.getByRole('heading', { name: 'Mercer kitchen fit' })).toBeVisible();
  await expect(page.locator('[data-step-id="demo-handover"]')).toContainText('Sep 17, 2026');
  const restored = await page.evaluate(async () => new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open('demo:actuals-job-sequencer');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction('app', 'readonly');
      const get = transaction.objectStore('app').get('current');
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => reject(get.error);
    };
  }));
  expect(restored).toMatchObject({ version: backup.version, settings: backup.settings, jobs: backup.jobs, selectedJobId: backup.selectedJobId });
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
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  await page.getByLabel('Timezone').fill('Asia/Kolkata');
  await page.getByLabel('Non-working dates').fill('2026-10-02');
  await page.getByRole('button', { name: 'Save working calendar' }).click();
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
  const exportDownload = await exportPromise;
  expect(exportDownload.suggestedFilename()).toMatch(/\.csv$/);
  const rows = parseCsv(await readDownload(exportDownload));
  expect(rows).toHaveLength(6);
  expect(rows.slice(1).map((row) => row[0])).toEqual(['Job 1', 'Job 2', 'Job 3', 'Job 4', 'Job 5']);
  for (const row of rows.slice(1)) {
    expect(row.slice(3, 11)).toEqual(['', '', '', '', '', '', '', '']);
    expect(row.slice(11)).toEqual(['Asia/Kolkata', 'Mon|Tue|Wed|Thu|Fri', '2026-10-02']);
  }

  await page.getByLabel('Import JSON').setInputFiles({ name: 'six-active.json', mimeType: 'application/json', buffer: importBuffer(backupWithActiveJobs(6)) });
  await expect(page.getByRole('alert')).toContainText('more than five active jobs');
  await expect(page.getByRole('alert')).toContainText('current jobs were not changed');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.rail-head')).toContainText('5/5');
  await page.reload();
  await expect(page.locator('.rail-head')).toContainText('5/5');
  await expect(page.getByRole('button', { name: 'Job 1' })).toBeVisible();
  await expect(page.getByText('Imported job 1')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add a job' }).click();
  await expect(page.getByText('Five active jobs is the limit. Archive one to add another.')).toBeVisible();
});

test('@claim:archive-restore archived jobs free a slot and restore with their steps', async ({ page }) => {
  await openFreshDemo(page);
  await page.getByRole('button', { name: 'Start for real' }).click();
  for (let index = 1; index <= 5; index += 1) {
    await page.getByRole('button', { name: index === 1 ? 'Start your first job' : 'Add a job' }).first().click();
    await page.getByLabel('Job name').fill(`Job ${index}`);
    await page.getByLabel('First forecast start').fill('2026-09-03');
    await page.getByRole('button', { name: 'Create job' }).click();
  }
  await page.getByRole('button', { name: 'Add next step' }).click();
  await page.getByLabel('Step name').fill('Keep this step');
  await page.getByRole('button', { name: 'Add step' }).click();
  await page.getByRole('button', { name: 'Archive job' }).click();
  await expect(page.getByRole('button', { name: 'Show archived jobs' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Job 5' })).toBeVisible();
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job name').fill('Replacement job');
  await page.getByLabel('First forecast start').fill('2026-09-03');
  await page.getByRole('button', { name: 'Create job' }).click();
  await page.getByRole('button', { name: 'Archive job' }).click();
  await page.getByRole('button', { name: 'Job 5' }).click();
  await page.getByRole('button', { name: 'Restore job' }).click();
  await expect(page.getByRole('heading', { name: 'Job 5' })).toBeVisible();
  await expect(page.getByText('Keep this step', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show active jobs' })).toHaveAttribute('aria-pressed', 'true');
});

test('first screen uses forecast-date language and clear job-list filter verbs', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Actuals Job Sequencer — move forecast dates');
  await expect(page.getByRole('heading', { name: 'Move forecast dates after actual finishes' })).toBeVisible();
  await expect(page.getByText('Forecast dates · built for small trade crews')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show active jobs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show archived jobs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Track up to five active jobs' })).toBeVisible();
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
    const navigationTargets = await page.locator('.site-nav a, .footer-links a').evaluateAll((links) => links.map((link) => {
      const box = link.getBoundingClientRect();
      return { label: link.textContent?.trim(), width: box.width, height: box.height };
    }));
    expect(navigationTargets.length).toBeGreaterThan(0);
    for (const target of navigationTargets) {
      expect(target.width, `${route} ${target.label} width`).toBeGreaterThanOrEqual(44);
      expect(target.height, `${route} ${target.label} height`).toBeGreaterThanOrEqual(44);
    }
  }
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole('heading', { name: 'Move forecast dates after actual finishes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
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
