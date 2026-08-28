import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/');
  await page.evaluate(async () => {
    indexedDB.deleteDatabase('actuals-job-sequencer');
    localStorage.clear();
  });
  await page.reload();
});

test('creates a job, reflows dates from an actual, and drafts a client update', async ({ page }) => {
  await page.getByRole('button', { name: 'Start the first job' }).click();
  await page.getByLabel('Job name').fill('Patel kitchen');
  await page.getByLabel(/Client name/).fill('Asha');
  await page.getByLabel('First estimated start').fill('2026-09-03');
  await page.getByRole('button', { name: 'Create job' }).click();

  await page.getByRole('button', { name: 'Add next step' }).click();
  await page.getByLabel('Step name').fill('Strip out');
  await page.getByLabel('Estimated working days').fill('2');
  await page.getByRole('button', { name: 'Add step' }).click();

  await page.getByRole('button', { name: 'Add next step' }).click();
  await page.getByLabel('Step name').fill('Rough-in');
  await page.getByLabel('Estimated working days').fill('3');
  await page.getByRole('button', { name: 'Add step' }).click();

  await page.getByRole('button', { name: 'Edit or finish Strip out' }).click();
  await page.getByRole('button', { name: 'Record actual finish' }).click();
  await page.getByLabel('Actual finish date').fill('2026-09-09');
  await page.getByRole('button', { name: 'Recalculate dates' }).click();

  await expect(page.getByText('MOVED', { exact: true })).toBeVisible();
  await expect(page.locator('#client-message')).toContainText('Rough-in');
  await expect(page.locator('#client-message')).toContainText('Current estimated job finish');
});

test('has no serious accessibility violations on empty and populated states', async ({ page }) => {
  const emptyResults = await new AxeBuilder({ page }).analyze();
  expect(emptyResults.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);

  await page.getByRole('button', { name: 'Start the first job' }).click();
  await page.getByLabel('Job name').fill('Boiler service');
  await page.getByLabel('First estimated start').fill('2026-09-03');
  await page.getByRole('button', { name: 'Create job' }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('reloads the installed app while offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Actuals Job Sequencer' })).toBeVisible();
  await expect(page.getByText(/Offline · saving locally/)).toBeVisible();
});
