import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const origin = 'https://actuals-job-sequencer.sociobot.in';
const output = new URL('./live/', import.meta.url);
await mkdir(output, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function backupWithActiveJobs(count) {
  const timestamp = '2026-09-06T12:00:00.000Z';
  return {
    version: 1,
    settings: { timezone: 'Europe/London', workdays: [1, 2, 3, 4, 5], holidays: ['2026-12-25'] },
    jobs: Array.from({ length: count }, (_, index) => ({
      id: `live-import-${index + 1}`, name: `Live imported job ${index + 1}`, client: '', startDate: '2026-09-07', status: 'active',
      createdAt: timestamp, updatedAt: timestamp, steps: [], history: []
    })),
    selectedJobId: 'live-import-1'
  };
}

const browser = await chromium.launch();
const report = { errors: [], offOrigin: [], firstScreens: {}, boundaries: {}, routes: {}, offline: {} };

for (const [name, viewport] of Object.entries({ phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } })) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.errors.push(`${name}: ${message.text()}`); });
  page.on('pageerror', (error) => report.errors.push(`${name}: ${error.message}`));
  page.on('request', (request) => { if (new URL(request.url()).origin !== origin) report.offOrigin.push(request.url()); });
  await page.goto(origin, { waitUntil: 'networkidle' });
  const firstScreen = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    };
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim(),
      audience: document.querySelector('.hero-dek')?.textContent?.trim(),
      action: document.querySelector('.hero-actions a')?.textContent?.trim(),
      h1Box: box('h1'), audienceBox: box('.hero-dek'), actionBox: box('.hero-actions a'),
      scrollY: window.scrollY,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      navigationTargets: [...document.querySelectorAll('.site-nav a, .footer-links a')].map((link) => {
        const rect = link.getBoundingClientRect(); return { label: link.textContent.trim(), width: rect.width, height: rect.height };
      })
    };
  });
  assert(firstScreen.h1 === 'Move forecast dates after actual finishes', `${name} job is unclear`);
  assert(firstScreen.audience.includes('small trade crews'), `${name} audience is unclear`);
  assert(firstScreen.action === 'Try it with sample data', `${name} first action is unclear`);
  assert(firstScreen.actionBox.bottom <= viewport.height, `${name} first action is below the fold`);
  assert(!firstScreen.overflow && firstScreen.scrollY === 0, `${name} cold page overflows or starts scrolled`);
  assert(firstScreen.navigationTargets.every((target) => target.width >= 44 && target.height >= 44), `${name} has a navigation target below 44px`);
  report.firstScreens[name] = firstScreen;
  await page.screenshot({ path: new URL(`home-${name}.png`, output).pathname, fullPage: true });
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  report.routes.textResize = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    headlineVisible: Boolean(document.querySelector('h1')?.getBoundingClientRect().height),
    sampleActionVisible: Boolean(document.querySelector('.hero-actions a')?.getBoundingClientRect().height)
  }));
  assert(!report.routes.textResize.overflow && report.routes.textResize.headlineVisible && report.routes.textResize.sampleActionVisible, '200% text resize lost content or caused overflow');
  await page.screenshot({ path: new URL('text-200.png', output).pathname, fullPage: true });
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.errors.push(`flow: ${message.text()}`); });
  page.on('pageerror', (error) => report.errors.push(`flow: ${error.message}`));
  page.on('request', (request) => { if (new URL(request.url()).origin !== origin) report.offOrigin.push(request.url()); });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Start your first job' }).first().click();
  await page.getByLabel('Job name').fill('Live repair check');
  await page.getByLabel('First forecast start').fill('2026-09-07');
  await page.getByRole('button', { name: 'Create job' }).click();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.getByText('Demo — sample data, nothing is saved').waitFor();
  await page.getByRole('heading', { name: 'Mercer kitchen fit' }).waitFor();
  assert((await page.locator('[data-step-id="demo-handover"]').innerText()).includes('Sep 17, 2026'), 'sample handover did not move');
  assert((await page.locator('#client-message').innerText()).includes('Current forecast job finish: Thu, Sep 17, 2026'), 'sample client update is incomplete');
  await page.screenshot({ path: new URL('demo-phone.png', output).pathname, fullPage: true });

  await page.getByRole('button', { name: 'Edit job' }).click();
  await page.getByLabel('Job name').fill('Changed live sample');
  await page.getByRole('button', { name: 'Save job' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('heading', { name: 'Mercer kitchen fit' }).waitFor();

  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job name').fill('Boundary job without steps');
  await page.getByLabel('First forecast start').fill('2026-09-18');
  await page.getByRole('button', { name: 'Create job' }).click();
  await page.getByRole('button', { name: 'Open data settings' }).first().click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadEvent;
  const csv = await readFile(await download.path(), 'utf8');
  report.boundaries.zeroStepCsv = csv.includes('"Boundary job without steps"') && csv.includes('"Europe/London"') && csv.includes('"2026-09-15"');
  assert(report.boundaries.zeroStepCsv, 'CSV omitted the zero-step job or its calendar settings');

  const incomplete = backupWithActiveJobs(2);
  delete incomplete.jobs[1].updatedAt;
  await page.getByLabel('Import JSON').setInputFiles({ name: 'incomplete.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(incomplete)) });
  const incompleteError = await page.getByRole('alert').innerText();
  report.boundaries.incompleteRejected = incompleteError.includes('job 2 is missing a valid updated date') && incompleteError.includes('current jobs were not changed');
  assert(report.boundaries.incompleteRejected, 'incomplete backup was not rejected safely');

  await page.getByLabel('Import JSON').setInputFiles({ name: 'six-active.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backupWithActiveJobs(6))) });
  const limitError = await page.getByRole('alert').innerText();
  report.boundaries.sixActiveRejected = limitError.includes('more than five active jobs') && limitError.includes('current jobs were not changed');
  assert(report.boundaries.sixActiveRejected, 'six-active-job backup was not rejected safely');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.getByRole('heading', { name: 'Boundary job without steps' }).waitFor();

  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.getByRole('heading', { name: 'Live repair check' }).waitFor();
  assert(await page.getByText('Mercer kitchen fit').count() === 0, 'sample data reached the real workspace');
  report.boundaries.demoResetAndIsolation = true;
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${origin}/demo/`);
  const reduced = await page.locator('.button').first().evaluate((element) => getComputedStyle(element).transitionDuration);
  report.routes.reducedMotionDuration = reduced;
  assert(reduced === '1e-05s', 'reduced motion did not remove transitions');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  report.offline.cacheKeys = await page.evaluate(() => caches.keys());
  assert(report.offline.cacheKeys.some((key) => key.startsWith('actuals-v4-')), 'version 4 offline cache was not active');
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'Mercer kitchen fit' }).waitFor();
  report.offline.reloaded = await page.getByText('Offline · changes save here').isVisible();
  assert(report.offline.reloaded, 'offline demo reload failed');
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const [path, title] of [['/privacy/', 'Privacy — Actuals Job Sequencer'], ['/terms/', 'Terms — Actuals Job Sequencer']]) {
    await page.goto(`${origin}${path}`);
    assert(await page.title() === title, `${path} title is wrong`);
    assert(await page.locator('h1').count() === 1 && await page.locator('main').count() === 1, `${path} structure is wrong`);
  }
  const response = await page.goto(`${origin}/repair-check-not-found`);
  report.routes.notFoundStatus = response.status();
  report.routes.notFoundHeading = await page.locator('h1').innerText();
  assert(response.status() === 404 && report.routes.notFoundHeading === 'This page is not on the job sheet', 'designed 404 failed');
  await page.screenshot({ path: new URL('not-found.png', output).pathname, fullPage: true });
  await context.close();
}

assert(report.errors.length === 0, `browser errors: ${report.errors.join('; ')}`);
assert(report.offOrigin.length === 0, `off-origin requests: ${report.offOrigin.join('; ')}`);
await writeFile(new URL('live-check.json', output), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
