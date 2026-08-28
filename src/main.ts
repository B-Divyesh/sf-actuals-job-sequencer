import './style.css';
import { loadData, saveData } from './db';
import { checkoutUrl, initialLicense, storeLicense, verifyLicense, type LicenseState } from './license';
import { formatDate, isIsoDate, scheduleJob, todayIso } from './schedule';
import type { AppData, HistoryEntry, Job, ScheduleSettings, Step } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const path = window.location.pathname.replace(/\/$/, '') || '/';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderLegal(page: 'privacy' | 'terms'): void {
  const privacy = `
    <p><strong>Effective 28 August 2026.</strong> This app is private by default.</p>
    <h2>What stays on your device</h2>
    <p>Job names, client names, steps, actual finish dates, schedule settings, and history are stored in IndexedDB in your browser. We do not receive or sync this job data. Your exports are created locally.</p>
    <h2>License checks</h2>
    <p>If you buy or restore Crew edition, the license token is stored in localStorage and sent to the Sociobot billing API no more than once per day for verification. The billing service receives the token and routine request data such as IP address. Sociobot/Dodo is merchant of record for checkout.</p>
    <h2>Analytics and location</h2>
    <p>There is no analytics, advertising, GPS, or location tracking. The app does not load third-party fonts or scripts. Your selected timezone is used only for labels and exports.</p>
    <h2>Your control</h2>
    <p>Use Settings → Export JSON to keep a copy. Clearing this site's browser data removes local jobs and the saved license token. Contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> about billing records.</p>`;
  const terms = `
    <p><strong>Effective 28 August 2026.</strong> These terms apply to Actuals Job Sequencer.</p>
    <h2>Forecasts are estimates</h2>
    <p>The app recalculates dates from durations, working days, holidays, and actual finish dates that you enter. Forecast dates are estimates—not guarantees, contracts, or professional advice. Check every client message before sending it.</p>
    <h2>Your responsibilities</h2>
    <p>You are responsible for accurate inputs, lawful use of client information, backups, and the promises you make. Do not rely on the app as the only record for safety-critical work.</p>
    <h2>Purchase and license</h2>
    <p>Crew edition is a one-time purchase for the features described at checkout. Sociobot/Dodo is merchant of record. Refunds are handled there and revoke the associated license. A license may be restored on devices you control; do not resell or publish tokens.</p>
    <h2>Availability and liability</h2>
    <p>The software is provided “as is” without warranties. To the extent allowed by law, Sociobot is not liable for lost data, missed dates, or indirect damages. These terms do not limit rights that cannot legally be limited.</p>
    <h2>Contact</h2><p>Questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`;
  app.innerHTML = `<div class="legal-shell">
    <header class="legal-header"><p>Actuals Job Sequencer · field notice</p><h1>${page === 'privacy' ? 'Privacy' : 'Terms of use'}</h1></header>
    <main id="main" class="legal-main">${page === 'privacy' ? privacy : terms}</main>
    <footer class="legal-footer"><a href="/">← Return to the job sheet</a></footer>
  </div>`;
}

function browserTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

function emptyData(): AppData {
  return {
    version: 1,
    settings: { timezone: browserTimezone(), workdays: [1, 2, 3, 4, 5], holidays: [] },
    jobs: []
  };
}

let data = emptyData();
let license: LicenseState;
let persistenceError = '';
let railMode: 'active' | 'archived' = 'active';
let toastTimer = 0;

if (path === '/privacy' || path === '/terms') {
  renderLegal(path === '/privacy' ? 'privacy' : 'terms');
} else {
  void startApp();
}

async function startApp(): Promise<void> {
  license = initialLicense();
  try {
    const stored = await loadData();
    if (stored && validateData(stored)) data = stored;
  } catch {
    persistenceError = 'Local storage could not be opened. Changes will last only until this tab closes; export a copy before leaving.';
  }
  ensureSelection();
  render();
  bindGlobalEvents();
  registerServiceWorker();
  if (license.token) {
    license = await verifyLicense(license);
    render();
  }
}

function ensureSelection(): void {
  if (!data.jobs.some((job) => job.id === data.selectedJobId)) {
    data.selectedJobId = data.jobs.find((job) => job.status === 'active')?.id ?? data.jobs[0]?.id;
  }
}

function activeJob(): Job | undefined {
  return data.jobs.find((job) => job.id === data.selectedJobId);
}

function jobList(): Job[] {
  return data.jobs.filter((job) => job.status === railMode).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function activeLimit(): number { return license.unlocked ? 5 : 1; }

function render(): void {
  ensureSelection();
  const job = activeJob();
  const jobs = jobList();
  const editionDate = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  app.innerHTML = `
    <header class="site-header">
      <div class="masthead">
        <div><p class="edition">Working edition · ${escapeHtml(editionDate)}</p><h1>Actuals Job Sequencer</h1></div>
        <div class="header-tools">
          <span class="network ${navigator.onLine ? '' : 'offline'}" aria-live="polite">${navigator.onLine ? 'Saved on device' : 'Offline · saving locally'}</span>
          <button class="button" data-action="settings">Settings &amp; data</button>
        </div>
      </div>
    </header>
    ${persistenceError ? `<div class="banner" role="alert">${escapeHtml(persistenceError)}</div>` : ''}
    ${license.notice ? `<div class="banner" role="status">${escapeHtml(license.notice)}</div>` : ''}
    <div class="app-shell">
      <aside class="job-rail" aria-labelledby="jobs-heading">
        <div class="rail-head"><h2 id="jobs-heading">Job ledger</h2><span>${data.jobs.filter((item) => item.status === 'active').length}/${activeLimit()}</span></div>
        <div class="mode-tabs" aria-label="Job status">
          <button data-action="rail-mode" data-mode="active" aria-pressed="${railMode === 'active'}">Active</button>
          <button data-action="rail-mode" data-mode="archived" aria-pressed="${railMode === 'archived'}">Archived</button>
        </div>
        ${jobs.length ? `<ul class="job-list">${jobs.map((item) => renderJobPick(item)).join('')}</ul>` : `<p class="all-clear">No ${railMode} jobs.</p>`}
        <div class="rail-actions">
          <button class="button primary" data-action="add-job">Add job</button>
          <button class="button" data-action="settings">Export / import</button>
        </div>
      </aside>
      <main id="main" class="workspace" tabindex="-1">
        ${job ? renderJob(job) : renderEmpty()}
      </main>
    </div>
    <footer class="site-footer"><div class="footer-inner">
      <span>Local-first. No tracking or GPS. Generated editorial image disclosed in the design record.</span>
      <nav class="footer-links" aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-actuals-job-sequencer">Source</a></nav>
    </div></footer>
    <div id="toast-root" aria-live="polite"></div>`;
}

function renderJobPick(job: Job): string {
  const complete = job.steps.filter((step) => step.actualFinish).length;
  return `<li><button class="job-pick" data-action="select-job" data-id="${job.id}" aria-current="${job.id === data.selectedJobId}">
    <strong>${escapeHtml(job.name)}</strong><span>${complete}/${job.steps.length} actual · ${escapeHtml(job.client || 'No client')}</span>
  </button></li>`;
}

function renderEmpty(): string {
  return `<section class="empty" aria-labelledby="empty-heading">
    <picture><source media="(max-width: 720px)" srcset="/assets/dependency-still-life-720.webp"><img class="empty-image" src="/assets/dependency-still-life-1200.webp" width="1200" height="800" fetchpriority="high" decoding="async" alt="Five blank job slips follow a folding rule across a paper calendar, like a chain of dependencies."></picture>
    <div class="empty-copy"><h2 id="empty-heading">When one date moves, the promises after it should move too.</h2><div><p>Start a job, add its ordered steps and estimates, then record actual finish dates. The sequencer skips non-working days and writes the client update.</p><button class="button primary" data-action="add-job">Start the first job</button></div></div>
  </section>`;
}

function renderJob(job: Job): string {
  let scheduled;
  try { scheduled = scheduleJob(job, data.settings); }
  catch (error) { return `<div class="banner" role="alert">${escapeHtml(error instanceof Error ? error.message : 'The schedule could not be calculated.')} Open settings to repair the working calendar.</div>`; }
  const moved = scheduled.filter((step) => !step.actualFinish && (step.startMoved || step.finishMoved));
  const message = makeClientMessage(job, scheduled);
  return `<section aria-labelledby="job-heading">
    <header class="workspace-head">
      <div><p class="folio">Job ${String(data.jobs.indexOf(job) + 1).padStart(2, '0')} · ${escapeHtml(job.status)}</p><h2 id="job-heading">${escapeHtml(job.name)}</h2><p class="dek">${escapeHtml(job.client || 'No client name')} · starts ${formatDate(job.startDate, 'long')} · ${escapeHtml(data.settings.timezone)}</p></div>
      <div class="head-actions"><button class="button" data-action="edit-job">Edit job</button><button class="button" data-action="archive-job">${job.status === 'active' ? 'Archive' : 'Restore'}</button></div>
    </header>
    <p class="forecast-note"><strong>Forecast notice:</strong> dates are estimates from your entered durations, working calendar, and actual finishes—not guaranteed appointment dates.</p>
    <div class="schedule" aria-label="Ordered job steps">
      <div class="schedule-head" aria-hidden="true"><span>No.</span><span>Step</span><span>Original promise</span><span>Current forecast</span><span>Actions</span></div>
      ${scheduled.length ? scheduled.map((step, index) => renderStep(step, index)).join('') : `<p class="all-clear">No steps yet. Add the first piece of work to start the sequence.</p>`}
      <div class="schedule-foot"><button class="button primary" data-action="add-step">Add next step</button>${scheduled.length ? '<button class="button" data-action="print">Print job sheet</button>' : ''}</div>
    </div>
    <div class="notice-grid">
      <section class="client-notice" aria-labelledby="notice-heading"><h3 id="notice-heading">Client notice</h3>
        ${moved.length ? `<div class="message-paper" id="client-message">${escapeHtml(message)}</div><div class="message-actions"><button class="button signal" data-action="copy-message">Copy update</button>${'share' in navigator ? '<button class="button" data-action="share-message">Share update</button>' : ''}</div>` : `<p class="all-clear"><strong>No promised dates changed.</strong><br>Record an actual finish. If it differs from the estimate, every unfinished step after it will reflow here.</p>`}
      </section>
      <section class="history" aria-labelledby="history-heading"><h3 id="history-heading">Change notes</h3>${job.history.length ? `<ol class="history-list">${job.history.slice(0, 6).map((entry) => `<li><time datetime="${entry.at}">${formatTimestamp(entry.at)}</time>${escapeHtml(entry.message)}</li>`).join('')}</ol>` : '<p class="all-clear">Actual finishes and order changes will be noted here.</p>'}</section>
    </div>
  </section>`;
}

function renderStep(step: ReturnType<typeof scheduleJob>[number], index: number): string {
  const moved = !step.actualFinish && (step.startMoved || step.finishMoved);
  const baseline = `${formatDate(step.baselineStart)} – ${formatDate(step.baselineFinish)}`;
  const forecast = `${formatDate(step.forecastStart)} – ${formatDate(step.forecastFinish)}`;
  return `<article class="step-row ${moved ? 'moved' : ''}" data-step-id="${step.id}">
    <span class="step-no">${String(index + 1).padStart(2, '0')}</span>
    <div class="step-name"><strong>${escapeHtml(step.name)}</strong><span>${step.duration} working ${step.duration === 1 ? 'day' : 'days'}</span></div>
    <div class="date-block"><span class="label">Original</span><strong>${baseline}</strong></div>
    <div class="date-block"><span class="label">${step.actualFinish ? 'Actual finish' : 'Forecast'}</span>${moved ? `<del>${baseline}</del>` : ''}<strong class="${moved ? 'moved-date' : ''}">${step.actualFinish ? formatDate(step.actualFinish, 'long') : forecast}</strong>${step.actualFinish ? '<span class="slug actual">ACTUAL</span>' : moved ? '<span class="slug">MOVED</span>' : ''}</div>
    <div class="row-actions">
      <button class="icon-button" data-action="move-up" data-id="${step.id}" aria-label="Move ${escapeHtml(step.name)} earlier" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button class="icon-button" data-action="step-menu" data-id="${step.id}" aria-label="Edit or finish ${escapeHtml(step.name)}">•••</button>
    </div>
  </article>`;
}

function makeClientMessage(job: Job, steps = scheduleJob(job, data.settings)): string {
  const moved = steps.filter((step) => !step.actualFinish && (step.startMoved || step.finishMoved));
  const finish = [...steps].reverse().find((step) => !step.actualFinish)?.forecastFinish ?? steps.at(-1)?.forecastFinish;
  const greeting = job.client ? `Hello ${job.client}` : 'Hello';
  const lines = moved.map((step) => `• ${step.name}: ${formatDate(step.baselineStart)} → ${formatDate(step.forecastStart)}; finish ${formatDate(step.forecastFinish)}`);
  return `${greeting} — a quick date update for ${job.name}.\n\n${lines.join('\n')}\n\nCurrent estimated job finish: ${finish ? formatDate(finish, 'long') : 'to be confirmed'}. These are forecasts based on current estimates and working days. Please reply if you need to talk it through.`;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function bindGlobalEvents(): void {
  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!button) return;
    void handleAction(button.dataset.action || '', button);
  });
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
}

async function handleAction(action: string, element: HTMLElement): Promise<void> {
  const job = activeJob();
  if (action === 'settings') return openSettings();
  if (action === 'add-job') return addJob();
  if (action === 'rail-mode') { railMode = element.dataset.mode as typeof railMode; render(); return; }
  if (action === 'select-job') { data.selectedJobId = element.dataset.id; await persist(); render(); return; }
  if (action === 'close-dialog') { element.closest('dialog')?.close(); return; }
  if (action === 'reload') { window.location.reload(); return; }
  if (!job) return;
  if (action === 'edit-job') return editJob(job);
  if (action === 'archive-job') return toggleArchive(job);
  if (action === 'add-step') return editStep(job);
  if (action === 'step-menu') return stepMenu(job, element.dataset.id || '');
  if (action === 'move-up') return moveStepUp(job, element.dataset.id || '');
  if (action === 'copy-message') return copyMessage(job);
  if (action === 'share-message') return shareMessage(job);
  if (action === 'print') { window.print(); return; }
}

function openDialog(title: string, body: string): HTMLDialogElement {
  document.querySelector('dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `<div class="dialog-head"><h2>${escapeHtml(title)}</h2><button class="icon-button" type="button" data-action="close-dialog" aria-label="Close dialog">×</button></div><div class="dialog-body">${body}</div>`;
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
  queueMicrotask(() => dialog.querySelector<HTMLElement>('input, button, select, textarea')?.focus());
  return dialog;
}

function addJob(): void {
  const activeCount = data.jobs.filter((job) => job.status === 'active').length;
  if (activeCount >= activeLimit()) {
    openSettings('license');
    showToast(license.unlocked ? 'Five active jobs is the product limit. Archive one to add another.' : 'Free edition includes one active job. Crew edition opens five.');
    return;
  }
  const dialog = openDialog('Start a job', `<form id="job-form" novalidate>
    <div class="field"><label for="job-name">Job name</label><input id="job-name" name="name" required maxlength="80" autocomplete="off"><p class="field-hint">Use the name you would say on the phone.</p></div>
    <div class="field"><label for="client-name">Client name <span aria-hidden="true">(optional)</span></label><input id="client-name" name="client" maxlength="80" autocomplete="name"></div>
    <div class="field"><label for="start-date">First estimated start</label><input id="start-date" name="startDate" type="date" required value="${todayIso()}"><p class="field-hint">If this falls on a non-working day, it rolls forward.</p></div>
    <p class="field-error" role="alert"></p><div class="form-actions"><button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Create job</button></div>
  </form>`);
  dialog.querySelector<HTMLFormElement>('#job-form')!.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget as HTMLFormElement);
    const name = String(values.get('name') || '').trim();
    const startDate = String(values.get('startDate') || '');
    if (!name || !isIsoDate(startDate)) return setDialogError(dialog, 'Enter a job name and a valid first start date.');
    const now = new Date().toISOString();
    const newJob: Job = { id: crypto.randomUUID(), name, client: String(values.get('client') || '').trim(), startDate, status: 'active', createdAt: now, updatedAt: now, steps: [], history: [] };
    data.jobs.push(newJob); data.selectedJobId = newJob.id; railMode = 'active'; await persist(); dialog.close(); render(); showToast('Job created. Add its first step.');
  });
}

function editJob(job: Job): void {
  const dialog = openDialog('Edit job', `<form id="job-form" novalidate>
    <div class="field"><label for="job-name">Job name</label><input id="job-name" name="name" required maxlength="80" value="${escapeHtml(job.name)}"></div>
    <div class="field"><label for="client-name">Client name <span aria-hidden="true">(optional)</span></label><input id="client-name" name="client" maxlength="80" value="${escapeHtml(job.client)}"></div>
    <div class="field"><label for="start-date">First estimated start</label><input id="start-date" name="startDate" type="date" required value="${job.startDate}"></div>
    <p class="field-error" role="alert"></p><div class="form-actions"><button type="button" class="button signal" id="delete-job">Delete job</button><button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Save job</button></div>
  </form>`);
  dialog.querySelector('#delete-job')!.addEventListener('click', async () => {
    if (!window.confirm(`Delete “${job.name}” and all ${job.steps.length} steps? This cannot be undone.`)) return;
    data.jobs = data.jobs.filter((item) => item.id !== job.id); ensureSelection(); await persist(); dialog.close(); render(); showToast('Job deleted.');
  });
  dialog.querySelector<HTMLFormElement>('#job-form')!.addEventListener('submit', async (event) => {
    event.preventDefault(); const values = new FormData(event.currentTarget as HTMLFormElement); const name = String(values.get('name') || '').trim(); const startDate = String(values.get('startDate') || '');
    if (!name || !isIsoDate(startDate)) return setDialogError(dialog, 'Enter a job name and a valid first start date.');
    job.name = name; job.client = String(values.get('client') || '').trim(); job.startDate = startDate; touch(job, 'Job details updated; forecast recalculated.'); await persist(); dialog.close(); render();
  });
}

function editStep(job: Job, step?: Step): void {
  const dialog = openDialog(step ? 'Edit step' : 'Add next step', `<form id="step-form" novalidate>
    <div class="field"><label for="step-name">Step name</label><input id="step-name" name="name" required maxlength="80" value="${escapeHtml(step?.name || '')}" autocomplete="off"><p class="field-hint">For example: Rough-in, inspection, or fit-off.</p></div>
    <div class="field"><label for="duration">Estimated working days</label><input id="duration" name="duration" type="number" inputmode="numeric" min="1" max="120" required value="${step?.duration ?? 1}"></div>
    <p class="field-error" role="alert"></p><div class="form-actions">${step ? '<button type="button" class="button signal" id="delete-step">Delete step</button>' : ''}<button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">${step ? 'Save step' : 'Add step'}</button></div>
  </form>`);
  dialog.querySelector('#delete-step')?.addEventListener('click', async () => {
    if (!window.confirm(`Delete “${step!.name}”? Later dates will be recalculated.`)) return;
    job.steps = job.steps.filter((item) => item.id !== step!.id); touch(job, `${step!.name} deleted; later dates recalculated.`); await persist(); dialog.close(); render();
  });
  dialog.querySelector<HTMLFormElement>('#step-form')!.addEventListener('submit', async (event) => {
    event.preventDefault(); const values = new FormData(event.currentTarget as HTMLFormElement); const name = String(values.get('name') || '').trim(); const duration = Number(values.get('duration'));
    if (!name || !Number.isInteger(duration) || duration < 1 || duration > 120) return setDialogError(dialog, 'Enter a step name and a duration from 1 to 120 working days.');
    if (step) { step.name = name; step.duration = duration; touch(job, `${name} estimate updated to ${duration} working day${duration === 1 ? '' : 's'}.`); }
    else { job.steps.push({ id: crypto.randomUUID(), name, duration }); touch(job, `${name} added as step ${job.steps.length}.`); }
    await persist(); dialog.close(); render();
  });
}

function stepMenu(job: Job, id: string): void {
  const step = job.steps.find((item) => item.id === id); if (!step) return;
  const dialog = openDialog(step.name, `<p>${step.actualFinish ? `Recorded actual finish: <strong>${formatDate(step.actualFinish, 'long')}</strong>.` : 'Record the day this step actually finished. Every later forecast will move from it.'}</p>
    <div class="form-actions"><button class="button" id="edit-step">Edit estimate</button>${step.actualFinish ? '<button class="button signal" id="remove-actual">Remove actual</button>' : '<button class="button primary" id="finish-step">Record actual finish</button>'}</div>`);
  dialog.querySelector('#edit-step')!.addEventListener('click', () => { dialog.close(); editStep(job, step); });
  dialog.querySelector('#finish-step')?.addEventListener('click', () => { dialog.close(); finishStep(job, step); });
  dialog.querySelector('#remove-actual')?.addEventListener('click', async () => { delete step.actualFinish; touch(job, `${step.name} actual finish removed; forecast reset to estimate.`); await persist(); dialog.close(); render(); showToast('Actual removed and later dates recalculated.'); });
}

function finishStep(job: Job, step: Step): void {
  const dialog = openDialog('Record actual finish', `<form id="finish-form" novalidate><p>When did <strong>${escapeHtml(step.name)}</strong> actually finish?</p>
    <div class="field"><label for="actual-date">Actual finish date</label><input id="actual-date" name="actual" type="date" required value="${todayIso()}"></div>
    <p class="field-error" role="alert"></p><div class="form-actions"><button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Recalculate dates</button></div></form>`);
  dialog.querySelector<HTMLFormElement>('#finish-form')!.addEventListener('submit', async (event) => {
    event.preventDefault(); const actual = String(new FormData(event.currentTarget as HTMLFormElement).get('actual') || ''); if (!isIsoDate(actual)) return setDialogError(dialog, 'Enter a valid actual finish date.');
    step.actualFinish = actual; const changed = scheduleJob(job, data.settings).filter((item) => !item.actualFinish && (item.startMoved || item.finishMoved)).length; touch(job, `${step.name} finished ${formatDate(actual)}; ${changed} later ${changed === 1 ? 'date' : 'dates'} moved.`); await persist(); dialog.close(); render(); showToast(changed ? `${changed} later ${changed === 1 ? 'step has' : 'steps have'} new dates.` : 'Actual saved; no later promise moved.');
  });
}

async function moveStepUp(job: Job, id: string): Promise<void> {
  const index = job.steps.findIndex((step) => step.id === id); if (index <= 0) return;
  const [step] = job.steps.splice(index, 1); job.steps.splice(index - 1, 0, step!); touch(job, `${step!.name} moved to step ${index}.`); await persist(); render(); showToast('Step order updated.');
}

async function toggleArchive(job: Job): Promise<void> {
  if (job.status === 'archived' && data.jobs.filter((item) => item.status === 'active').length >= activeLimit()) {
    showToast(license.unlocked ? 'Archive an active job before restoring this one.' : 'Crew edition opens up to five active jobs.'); return;
  }
  job.status = job.status === 'active' ? 'archived' : 'active'; touch(job, `Job ${job.status}.`); railMode = job.status; await persist(); render(); showToast(`Job ${job.status}.`);
}

async function copyMessage(job: Job): Promise<void> {
  try { await navigator.clipboard.writeText(makeClientMessage(job)); showToast('Client update copied.'); }
  catch { showToast('Copy was blocked. Select the message text and copy it manually.'); }
}

async function shareMessage(job: Job): Promise<void> {
  try { await navigator.share({ title: `${job.name} date update`, text: makeClientMessage(job) }); }
  catch (error) { if ((error as DOMException).name !== 'AbortError') showToast('Sharing was unavailable. Copy the update instead.'); }
}

function openSettings(focus = ''): void {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const zones = [...new Set([data.settings.timezone, 'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Australia/Sydney'])];
  const dialog = openDialog('Settings & data', `<form id="settings-form" novalidate>
    <section class="settings-section"><h3>Working calendar</h3><fieldset class="days"><legend>Working days</legend>${weekdays.map((day, index) => `<label class="day-check"><input type="checkbox" name="workday" value="${index}" ${data.settings.workdays.includes(index) ? 'checked' : ''}><span>${day}</span></label>`).join('')}</fieldset>
      <div class="field"><label for="timezone">Timezone</label><input id="timezone" name="timezone" list="timezones" required value="${escapeHtml(data.settings.timezone)}"><datalist id="timezones">${zones.map((zone) => `<option value="${escapeHtml(zone)}"></option>`).join('')}</datalist><p class="field-hint">Stored in every export. Dates remain calendar dates and never shift silently.</p></div>
      <div class="field"><label for="holidays">Non-working dates</label><textarea id="holidays" name="holidays" placeholder="2026-12-25\n2026-12-26">${escapeHtml(data.settings.holidays.join('\n'))}</textarea><p class="field-hint">One YYYY-MM-DD date per line.</p></div><p class="field-error" role="alert"></p><button class="button primary" type="submit">Save calendar</button>
    </section>
    <section class="settings-section"><h3>Your data</h3><p>Jobs live only in this browser. JSON is a complete backup; CSV opens in a spreadsheet and includes timezone, working days, and holidays on every row.</p><div class="message-actions"><button type="button" class="button" id="export-json">Export JSON</button><button type="button" class="button" id="export-csv">Export CSV</button><label class="button" for="import-json">Import JSON</label><input id="import-json" type="file" accept="application/json,.json" hidden></div>
    </section>
    <section class="settings-section" id="license-section"><h3>Crew edition</h3><p><span class="price">$29 one time</span><br>Keep up to five active jobs instead of one. Core scheduling, offline use, accessibility, and all exports stay available in the free edition.</p>
      ${license.unlocked ? '<p><strong>✓ Crew edition is active on this device.</strong></p>' : `<a class="button signal" href="${checkoutUrl()}">Buy Crew edition</a><p>Sociobot/Dodo is the merchant of record. Refunds are handled there and revoke the license automatically.</p>`}
      <div class="license-row"><div class="field"><label for="license-token">Have a license? Paste it</label><input id="license-token" type="text" autocomplete="off" spellcheck="false" value="${escapeHtml(license.token)}"></div><button type="button" class="button" id="restore-license">Verify license</button></div><p id="license-note" class="field-hint" aria-live="polite">${escapeHtml(license.checking ? 'Checking license…' : license.notice)}</p><p><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
    </section>
  </form>`);
  if (focus === 'license') queueMicrotask(() => dialog.querySelector('#license-section')?.scrollIntoView({ block: 'start' }));
  dialog.querySelector<HTMLFormElement>('#settings-form')!.addEventListener('submit', async (event) => {
    event.preventDefault(); const values = new FormData(event.currentTarget as HTMLFormElement); const workdays = values.getAll('workday').map(Number).sort(); const timezone = String(values.get('timezone') || '').trim(); const holidayLines = String(values.get('holidays') || '').split(/\s+/).filter(Boolean); const invalid = holidayLines.find((date) => !isIsoDate(date));
    if (!workdays.length) return setDialogError(dialog, 'Choose at least one working day.');
    try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); } catch { return setDialogError(dialog, 'Enter a valid IANA timezone, such as Europe/London.'); }
    if (invalid) return setDialogError(dialog, `“${invalid}” is not a valid YYYY-MM-DD date.`);
    data.settings = { timezone, workdays, holidays: [...new Set(holidayLines)].sort() }; await persist(); dialog.close(); render(); showToast('Working calendar saved; every forecast recalculated.');
  });
  dialog.querySelector('#export-json')!.addEventListener('click', () => exportJson());
  dialog.querySelector('#export-csv')!.addEventListener('click', () => exportCsv());
  dialog.querySelector<HTMLInputElement>('#import-json')!.addEventListener('change', (event) => void importJson(((event.currentTarget as HTMLInputElement).files || [])[0], dialog));
  dialog.querySelector('#restore-license')!.addEventListener('click', async () => {
    const token = dialog.querySelector<HTMLInputElement>('#license-token')!.value.trim(); if (!token) { dialog.querySelector('#license-note')!.textContent = 'Paste the token from your receipt first.'; return; }
    license = storeLicense(token); dialog.querySelector('#license-note')!.textContent = 'Checking this license…'; license = await verifyLicense(license, true); dialog.close(); render(); showToast(license.notice || 'License checked.');
  });
}

function exportJson(): void {
  download(`actuals-jobs-${todayIso()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), product: 'actuals-job-sequencer', ...data }, null, 2), 'application/json'); showToast('Complete JSON backup exported.');
}

function csvCell(value: unknown): string { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

function exportCsv(): void {
  const header = ['job', 'client', 'status', 'step_order', 'step', 'duration_workdays', 'baseline_start', 'baseline_finish', 'forecast_start', 'forecast_finish', 'actual_finish', 'timezone', 'working_days', 'holidays'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rows = data.jobs.flatMap((job) => scheduleJob(job, data.settings).map((step, index) => [job.name, job.client, job.status, index + 1, step.name, step.duration, step.baselineStart, step.baselineFinish, step.forecastStart, step.forecastFinish, step.actualFinish || '', data.settings.timezone, data.settings.workdays.map((day) => dayNames[day]).join('|'), data.settings.holidays.join('|')]));
  download(`actuals-jobs-${todayIso()}.csv`, [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8'); showToast('Spreadsheet CSV exported with calendar settings.');
}

async function importJson(file: File | undefined, dialog: HTMLDialogElement): Promise<void> {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!validateData(parsed)) throw new Error('This is not a valid Actuals Job Sequencer backup.');
    const incoming = parsed as AppData;
    if (!window.confirm(`Replace this device’s ${data.jobs.length} jobs with the ${incoming.jobs.length} jobs in “${file.name}”?`)) return;
    data = incoming; ensureSelection(); await persist(); dialog.close(); render(); showToast('Backup imported.');
  } catch (error) { setDialogError(dialog, error instanceof Error ? error.message : 'The backup could not be read.'); }
}

function validateData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AppData>;
  if (item.version !== 1 || !Array.isArray(item.jobs) || !item.settings || typeof item.settings !== 'object') return false;
  if (!Array.isArray(item.settings.workdays) || !item.settings.workdays.length || !item.settings.workdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) return false;
  if (typeof item.settings.timezone !== 'string' || !Array.isArray(item.settings.holidays) || !item.settings.holidays.every(isIsoDate)) return false;
  return item.jobs.every((job) => job && typeof job.id === 'string' && typeof job.name === 'string' && isIsoDate(job.startDate) && ['active', 'archived'].includes(job.status) && Array.isArray(job.steps) && job.steps.every((step) => typeof step.id === 'string' && typeof step.name === 'string' && Number.isInteger(step.duration) && step.duration >= 1 && (!step.actualFinish || isIsoDate(step.actualFinish))) && Array.isArray(job.history));
}

function download(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function touch(job: Job, message: string): void {
  job.updatedAt = new Date().toISOString(); const entry: HistoryEntry = { id: crypto.randomUUID(), at: job.updatedAt, message }; job.history.unshift(entry); job.history = job.history.slice(0, 50);
}

async function persist(): Promise<void> {
  try { await saveData(data); persistenceError = ''; }
  catch { persistenceError = 'This change is visible now but could not be saved. Export a copy and check browser storage permissions.'; }
}

function setDialogError(dialog: HTMLDialogElement, message: string): void {
  const error = dialog.querySelector<HTMLElement>('.field-error'); if (error) { error.textContent = message; error.focus(); }
}

function showToast(message: string, reload = false): void {
  window.clearTimeout(toastTimer); const root = document.querySelector('#toast-root'); if (!root) return;
  root.innerHTML = `<div class="toast" role="status"><span>${escapeHtml(message)}</span>${reload ? '<button class="button" data-action="reload">Reload</button>' : ''}</div>`;
  toastTimer = window.setTimeout(() => { root.innerHTML = ''; }, reload ? 12000 : 4200);
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('A new field edition is ready.', true); });
    });
  }).catch(() => showToast('Offline setup did not complete. The app still works while connected.'));
  navigator.serviceWorker.addEventListener('message', (event) => { if (event.data?.type === 'UPDATE_AVAILABLE' && navigator.serviceWorker.controller) showToast('Offline edition ready.', true); });
}
