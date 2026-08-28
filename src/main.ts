import './style.css';
import { deleteDemoData, loadData, saveData } from './db';
import { checkoutUrl, initialLicense, storeLicense, verifyLicense, type LicenseState } from './license';
import { actualOrderError, formatDate, isIsoDate, scheduleJob, todayIso } from './schedule';
import type { AppData, HistoryEntry, Job, Step } from './types';

type Route = 'home' | 'demo' | 'privacy' | 'terms' | 'not-found';

const app = document.querySelector<HTMLDivElement>('#app')!;
const BUILD = '1.1.0';
const ORIGIN = 'https://actuals-job-sequencer.sociobot.in';
let route: Route = routeFromLocation();
let demoMode = route === 'demo';
let data = emptyData();
let license: LicenseState = { token: '', unlocked: false, checking: false, notice: '' };
let persistenceError = '';
let railMode: 'active' | 'archived' = 'active';
let toastTimer = 0;

function escapeHtml(value: unknown): string {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function routeFromLocation(): Route {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/demo' || (path === '/' && new URLSearchParams(window.location.search).get('demo') === '1')) return 'demo';
  if (path === '/') return 'home';
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  return 'not-found';
}

function routePath(next: Route): string {
  return next === 'home' ? '/' : next === 'not-found' ? '/404/' : `/${next}/`;
}

const metadata: Record<Route, { title: string; description: string }> = {
  home: { title: 'Actuals Job Sequencer — move dates after finishes', description: 'Move forecast dates after an actual finish. Built for small trade crews and works offline after the first visit.' },
  demo: { title: 'Demo — Actuals Job Sequencer', description: 'Try an isolated sample job and see a late actual finish move every later forecast date.' },
  privacy: { title: 'Privacy — Actuals Job Sequencer', description: 'How Actuals Job Sequencer stores job data and checks Crew licenses.' },
  terms: { title: 'Terms — Actuals Job Sequencer', description: 'Terms for using Actuals Job Sequencer and its forecast dates.' },
  'not-found': { title: 'Page not found — Actuals Job Sequencer', description: 'This job-sheet page could not be found.' }
};

function setMetadata(next: Route): void {
  const meta = metadata[next];
  const canonicalPath = next === 'not-found' ? '/404/' : routePath(next);
  document.title = meta.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', meta.description);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `${ORIGIN}${canonicalPath}`);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', meta.title);
  for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', meta.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `${ORIGIN}${canonicalPath}`);
}

function browserTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

function emptyData(): AppData {
  return { version: 1, settings: { timezone: browserTimezone(), workdays: [1, 2, 3, 4, 5], holidays: [] }, jobs: [] };
}

function sampleData(): AppData {
  const job: Job = {
    id: 'demo-kitchen', name: 'Mercer kitchen fit', client: 'Rina Mercer', startDate: '2026-09-07', status: 'active',
    createdAt: '2026-09-07T08:00:00.000Z', updatedAt: '2026-09-14T16:30:00.000Z',
    steps: [
      { id: 'demo-strip', name: 'Strip out', duration: 2, actualFinish: '2026-09-08' },
      { id: 'demo-rough', name: 'Rough-in', duration: 2, actualFinish: '2026-09-14' },
      { id: 'demo-handover', name: 'Fit and handover', duration: 2 }
    ],
    history: [{ id: 'demo-note', at: '2026-09-14T16:30:00.000Z', message: 'Rough-in finished 14 Sep 2026; 1 later date moved.' }]
  };
  return { version: 1, settings: { timezone: 'Europe/London', workdays: [1, 2, 3, 4, 5], holidays: ['2026-09-15'] }, jobs: [job], selectedJobId: job.id };
}

function sharedHeader(): string {
  return `<header class="site-header"><div class="masthead">
    <a class="wordmark" href="/" data-route="home" aria-label="Actuals Job Sequencer home"><span class="mark" aria-hidden="true">A→</span>Actuals Job Sequencer</a>
    <nav class="site-nav" aria-label="Main navigation"><a href="/demo/" data-route="demo">Demo</a><a href="/privacy/" data-route="privacy">Privacy</a><a href="/terms/" data-route="terms">Terms</a></nav>
  </div></header>`;
}

function sharedFooter(): string {
  return `<footer class="site-footer"><div class="footer-inner"><span>Move forecast dates after actual finishes.</span><nav class="footer-links" aria-label="Footer navigation"><a href="/privacy/" data-route="privacy">Privacy</a><a href="/terms/" data-route="terms">Terms</a><a href="https://github.com/B-Divyesh/sf-actuals-job-sequencer" target="_blank" rel="noreferrer">View source code (GitHub)<span class="sr-only"> (opens in a new tab)</span></a></nav><span>Built by Param Factory · v${BUILD}</span></div></footer>`;
}

function renderLegal(page: 'privacy' | 'terms'): void {
  const privacy = `<p><strong>Effective 28 August 2026.</strong> Your job records stay in this browser.</p>
    <h2>What stays on your device</h2><p>Job names, client names, steps, actual finish dates, settings, and change notes use browser storage. We do not receive or sync them. Exports are made on your device.</p>
    <h2>License checks</h2><p>If you buy or restore Crew edition, your license token is saved in this browser. It is sent to the Sociobot billing API at most once a day. The service also receives routine request data, such as your IP address.</p>
    <h2>Analytics and location</h2><p>We do not use analytics, advertising, GPS, or location tracking. The app does not load third-party fonts or scripts. Your timezone appears only in the app and exports.</p>
    <h2>Your control</h2><p>Use Open data settings, then Export JSON, to keep a copy. Clearing this site’s browser data removes local jobs and the saved license token.</p><p>For billing-record questions, email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`;
  const terms = `<p><strong>Effective 28 August 2026.</strong> These terms apply to Actuals Job Sequencer.</p>
    <h2>Forecast dates are estimates</h2><p>The app recalculates dates from the information you enter. Forecast dates are not guarantees, contracts, or professional advice. Check every client update before sending it.</p>
    <h2>Your responsibilities</h2><p>You are responsible for accurate inputs, lawful use of client information, backups, and the dates you agree. Do not use this app as the only record for safety-critical work.</p>
    <h2>Purchase and license</h2><p>Crew edition is a one-time purchase for the features shown at checkout. Sociobot/Dodo is the merchant of record. A refund revokes the license. You may restore a license on devices you control.</p>
    <h2>Availability and liability</h2><p>The software is provided “as is” without warranties. Where the law allows, Sociobot is not liable for lost data, missed dates, or indirect damages.</p>
    <h2>Contact</h2><p>Email <a href="mailto:support@sociobot.in">support@sociobot.in</a> with questions.</p>`;
  app.innerHTML = `${sharedHeader()}<main id="main" class="legal-main" tabindex="-1"><p class="edition">Field notice · ${page}</p><h1>${page === 'privacy' ? 'Privacy for your job records' : 'Terms for forecast dates'}</h1>${page === 'privacy' ? privacy : terms}</main>${sharedFooter()}<div id="route-status" class="sr-only" aria-live="polite"></div>`;
}

function renderNotFound(): void {
  app.innerHTML = `${sharedHeader()}<main id="main" class="not-found" tabindex="-1"><p class="edition">Misfiled sheet · 404</p><h1>This page is not on the job sheet</h1><p>The address may be wrong, or the page may have moved.</p><a class="button primary" href="/" data-route="home">Return to your jobs</a></main>${sharedFooter()}<div id="route-status" class="sr-only" aria-live="polite"></div>`;
}

async function activateRoute(next: Route, focusHeading = false): Promise<void> {
  route = next; demoMode = route === 'demo'; persistenceError = ''; setMetadata(route);
  if (route === 'privacy' || route === 'terms') renderLegal(route);
  else if (route === 'not-found') renderNotFound();
  else await startApp();
  if (focusHeading) focusRouteHeading();
}

async function startApp(): Promise<void> {
  license = demoMode ? { token: '', unlocked: true, checking: false, notice: '' } : initialLicense();
  data = demoMode ? sampleData() : emptyData();
  try { const stored = await loadData(demoMode); if (stored && validateData(stored)) data = stored; else if (demoMode) await saveData(data, true); }
  catch { persistenceError = 'Browser storage could not be opened. Changes will last only until this tab closes. Export a copy before leaving.'; }
  ensureSelection(); renderApp(); registerServiceWorker();
  if (!demoMode && license.token) { license = await verifyLicense(license); renderApp(); }
}

function focusRouteHeading(): void {
  const heading = document.querySelector<HTMLElement>('h1');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  const status = document.querySelector('#route-status'); if (status) status.textContent = document.title;
  window.scrollTo(0, 0);
}

function ensureSelection(): void { if (!data.jobs.some((job) => job.id === data.selectedJobId)) data.selectedJobId = data.jobs.find((job) => job.status === 'active')?.id ?? data.jobs[0]?.id; }
function activeJob(): Job | undefined { return data.jobs.find((job) => job.id === data.selectedJobId); }
function jobList(): Job[] { return data.jobs.filter((job) => job.status === railMode).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
function activeLimit(): number { return license.unlocked ? 5 : 1; }

function hero(): string {
  if (demoMode) return `<section class="hero demo-hero" aria-labelledby="page-heading"><div class="hero-copy"><p class="edition">Sample job · late rough-in</p><h1 id="page-heading">Move job dates after actual finishes</h1><p class="hero-dek">See the moved handover date and the client update below.</p></div></section>`;
  return `<section class="hero" aria-labelledby="page-heading"><div class="hero-copy"><p class="edition">Working dates · built for the job site</p><h1 id="page-heading">Move job dates after actual finishes</h1><p class="hero-dek">For small trade crews when a late step changes the forecast dates you gave a client.</p><div class="hero-actions"><a class="button primary" href="/demo/" data-route="demo">Try it with sample data</a><button class="button" data-action="add-job">Start your first job</button></div><p class="action-note">See a late rough-in move the handover date.</p></div><ul class="hero-facts" aria-label="Product facts"><li>Works offline after the first visit.</li><li>Jobs stay in this browser.</li><li>$29 once; one active job is free.</li></ul></section>`;
}

function demoBanner(): string {
  return `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><span>Changes stay apart from your jobs.</span><div><button class="button" data-action="reset-demo">Reset demo</button><button class="button primary" data-action="start-real">Start for real</button></div></aside>`;
}

function renderApp(): void {
  ensureSelection(); const job = activeJob(); const jobs = jobList();
  app.innerHTML = `${sharedHeader()}${demoMode ? demoBanner() : ''}${hero()}
    ${persistenceError ? `<div class="banner" role="alert">${escapeHtml(persistenceError)}</div>` : ''}${license.notice ? `<div class="banner" role="status">${escapeHtml(license.notice)}</div>` : ''}
    <div class="utility-bar"><span class="network ${navigator.onLine ? '' : 'offline'}" aria-live="polite">${navigator.onLine ? 'Saved in this browser' : 'Offline · changes save here'}</span><button class="button" data-action="settings">Open data settings</button></div>
    <div class="app-shell"><aside class="job-rail" aria-labelledby="jobs-heading"><div class="rail-head"><h2 id="jobs-heading">Your jobs</h2><span>${data.jobs.filter((item) => item.status === 'active').length}/${activeLimit()}</span></div><div class="mode-tabs" aria-label="Job status"><button data-action="rail-mode" data-mode="active" aria-pressed="${railMode === 'active'}">Active</button><button data-action="rail-mode" data-mode="archived" aria-pressed="${railMode === 'archived'}">Archived</button></div>${jobs.length ? `<ul class="job-list">${jobs.map(renderJobPick).join('')}</ul>` : `<p class="all-clear">No ${railMode} jobs. Start one to add its forecast dates.</p>`}<div class="rail-actions"><button class="button primary" data-action="add-job">Add a job</button><button class="button" data-action="settings">Open data settings</button></div></aside>
    <main id="main" class="workspace" tabindex="-1">${job ? renderJob(job) : renderEmpty()}</main></div>${explainSections()}${sharedFooter()}<div id="toast-root" aria-live="polite"></div><div id="route-status" class="sr-only" aria-live="polite"></div>`;
}

function renderJobPick(job: Job): string {
  const complete = job.steps.filter((step) => step.actualFinish).length;
  return `<li><button class="job-pick" data-action="select-job" data-id="${job.id}" aria-current="${job.id === data.selectedJobId}"><strong>${escapeHtml(job.name)}</strong><span>${complete}/${job.steps.length} actual · ${escapeHtml(job.client || 'No client')}</span></button></li>`;
}

function renderEmpty(): string {
  return `<section class="empty" aria-labelledby="empty-heading"><picture><source media="(max-width: 720px)" srcset="/assets/dependency-still-life-720.webp"><img class="empty-image" src="/assets/dependency-still-life-1200.webp" width="1200" height="800" fetchpriority="high" decoding="async" alt="Five blank job slips follow a folding rule across a paper calendar."></picture><div class="empty-copy"><h2 id="empty-heading">Set the first forecast date</h2><div><p>Add the job, its ordered steps, and each estimate. Record an actual finish to move every later forecast.</p><button class="button primary" data-action="add-job">Start your first job</button></div></div></section>`;
}

function renderJob(job: Job): string {
  let scheduled;
  try { scheduled = scheduleJob(job, data.settings); } catch (error) { return `<div class="banner" role="alert">${escapeHtml(error instanceof Error ? error.message : 'The schedule could not be calculated.')} Open data settings to repair the calendar.</div>`; }
  const moved = scheduled.filter((step) => !step.actualFinish && (step.startMoved || step.finishMoved));
  return `<section aria-labelledby="job-heading"><header class="workspace-head"><div><p class="folio">Job ${String(data.jobs.indexOf(job) + 1).padStart(2, '0')} · ${escapeHtml(job.status)}</p><h2 id="job-heading">${escapeHtml(job.name)}</h2><p class="dek">${escapeHtml(job.client || 'No client name')} · starts ${formatDate(job.startDate, 'long')} · ${escapeHtml(data.settings.timezone)}</p></div><div class="head-actions"><button class="button" data-action="edit-job">Edit job</button><button class="button" data-action="archive-job">${job.status === 'active' ? 'Archive job' : 'Restore job'}</button></div></header>
    <p class="forecast-note"><strong>Forecast notice:</strong> Dates use your estimates, calendar, and actual finishes. They are not guaranteed appointments.</p><div class="schedule" aria-label="Ordered job steps"><div class="schedule-head" aria-hidden="true"><span>No.</span><span>Step</span><span>Original forecast</span><span>Current forecast</span><span>Actions</span></div>${scheduled.length ? scheduled.map(renderStep).join('') : '<p class="all-clear">No steps yet. Add the first piece of work to start the sequence.</p>'}<div class="schedule-foot"><button class="button primary" data-action="add-step">Add next step</button>${scheduled.length ? '<button class="button" data-action="print">Print job sheet</button>' : ''}</div></div>
    <div class="notice-grid"><section class="client-notice" aria-labelledby="notice-heading"><h3 id="notice-heading">Client update</h3>${moved.length ? `<div class="message-paper" id="client-message">${escapeHtml(makeClientMessage(job, scheduled))}</div><div class="message-actions"><button class="button signal" data-action="copy-message">Copy client update</button>${'share' in navigator ? '<button class="button" data-action="share-message">Share client update</button>' : ''}</div>` : '<p class="all-clear"><strong>No forecast dates changed.</strong><br>Record an actual finish. Later unfinished steps will move when that date differs from the estimate.</p>'}</section><section class="history" aria-labelledby="history-heading"><h3 id="history-heading">Change notes</h3>${job.history.length ? `<ol class="history-list">${job.history.slice(0, 6).map((entry) => `<li><time datetime="${entry.at}">${formatTimestamp(entry.at)}</time>${escapeHtml(entry.message)}</li>`).join('')}</ol>` : '<p class="all-clear">Actual finishes and step changes will appear here.</p>'}</section></div></section>`;
}

function renderStep(step: ReturnType<typeof scheduleJob>[number], index: number): string {
  const moved = !step.actualFinish && (step.startMoved || step.finishMoved);
  const baseline = `${formatDate(step.baselineStart)} – ${formatDate(step.baselineFinish)}`;
  const forecast = `${formatDate(step.forecastStart)} – ${formatDate(step.forecastFinish)}`;
  return `<article class="step-row ${moved ? 'moved' : ''}" data-step-id="${step.id}"><span class="step-no">${String(index + 1).padStart(2, '0')}</span><div class="step-name"><strong>${escapeHtml(step.name)}</strong><span>${step.duration} working ${step.duration === 1 ? 'day' : 'days'}</span></div><div class="date-block"><span class="label">Original forecast</span><strong>${baseline}</strong></div><div class="date-block"><span class="label">${step.actualFinish ? 'Actual finish' : 'Current forecast'}</span>${moved ? `<del>${baseline}</del>` : ''}<strong class="${moved ? 'moved-date' : ''}">${step.actualFinish ? formatDate(step.actualFinish, 'long') : forecast}</strong>${step.actualFinish ? '<span class="slug actual">ACTUAL</span>' : moved ? '<span class="slug">MOVED</span>' : ''}</div><div class="row-actions"><button class="icon-button" data-action="move-up" data-id="${step.id}" aria-label="Move ${escapeHtml(step.name)} earlier" ${index === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-action="step-menu" data-id="${step.id}" aria-label="Edit or finish ${escapeHtml(step.name)}">•••</button></div></article>`;
}

function makeClientMessage(job: Job, steps = scheduleJob(job, data.settings)): string {
  const moved = steps.filter((step) => !step.actualFinish && (step.startMoved || step.finishMoved));
  const finish = [...steps].reverse().find((step) => !step.actualFinish)?.forecastFinish ?? steps.at(-1)?.forecastFinish;
  const lines = moved.map((step) => `• ${step.name}: ${formatDate(step.baselineStart)} → ${formatDate(step.forecastStart)}; finish ${formatDate(step.forecastFinish)}`);
  return `${job.client ? `Hello ${job.client}` : 'Hello'} — a date update for ${job.name}.\n\n${lines.join('\n')}\n\nCurrent forecast job finish: ${finish ? formatDate(finish, 'long') : 'to be confirmed'}. These dates use current estimates and working days. Please reply if you need to talk it through.`;
}

function explainSections(): string {
  return `<section class="explain" aria-labelledby="how-heading"><h2 id="how-heading">How it works</h2><ol><li><strong>Add the ordered steps.</strong><span>Give each step a working-day estimate.</span></li><li><strong>Record the actual finish.</strong><span>The next forecast starts after the work finished.</span></li><li><strong>Send the changed dates.</strong><span>Copy the client update after checking it.</span></li></ol></section><section class="limits" aria-labelledby="limits-heading"><div><h2 id="limits-heading">Built for dates, not dispatch</h2><p>It does not plan routes, payroll, GPS, or whole projects. Forecast dates remain your estimates.</p></div><div><h2>Crew edition</h2><p><strong>$29 one time.</strong> Keep five active jobs instead of one. Date scheduling and exports remain free.</p><button class="button" data-action="settings">See Crew edition</button></div></section>`;
}

function formatTimestamp(value: string): string { return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }

function bindGlobalEvents(): void {
  document.addEventListener('click', (event) => {
    const skipLink = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href="#main"]');
    if (skipLink) {
      event.preventDefault();
      const main = document.querySelector<HTMLElement>('#main');
      main?.focus();
      main?.scrollIntoView({ block: 'start' });
      return;
    }
    const routeLink = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-route]');
    if (routeLink && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); const next = routeLink.dataset.route as Route; history.pushState({ route: next }, '', routeLink.getAttribute('href') || routePath(next)); void activateRoute(next, true); return; }
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action]'); if (button) void handleAction(button.dataset.action || '', button);
  });
  window.addEventListener('popstate', () => void activateRoute(routeFromLocation(), true));
  window.addEventListener('online', () => { if (route === 'home' || route === 'demo') renderApp(); });
  window.addEventListener('offline', () => { if (route === 'home' || route === 'demo') renderApp(); });
}

async function handleAction(action: string, element: HTMLElement): Promise<void> {
  if (action === 'reset-demo') { await deleteDemoData(); data = sampleData(); await saveData(data, true); renderApp(); showToast('Sample job reset.'); return; }
  if (action === 'start-real') { await deleteDemoData(); history.pushState({ route: 'home' }, '', '/'); await activateRoute('home', true); return; }
  const job = activeJob();
  if (action === 'settings') return openSettings(element.closest('.limits') ? 'license' : '');
  if (action === 'add-job') return addJob();
  if (action === 'rail-mode') { railMode = element.dataset.mode as typeof railMode; renderApp(); return; }
  if (action === 'select-job') { data.selectedJobId = element.dataset.id; await persist(); renderApp(); return; }
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
  if (action === 'print') window.print();
}

function openDialog(title: string, body: string): HTMLDialogElement {
  document.querySelector('dialog')?.remove(); const returnFocus = document.activeElement as HTMLElement | null; const dialog = document.createElement('dialog');
  dialog.innerHTML = `<div class="dialog-head"><h2>${escapeHtml(title)}</h2><button class="icon-button" type="button" data-action="close-dialog" aria-label="Close dialog">×</button></div><div class="dialog-body">${body}</div>`;
  dialog.addEventListener('close', () => { dialog.remove(); returnFocus?.focus(); }, { once: true }); document.body.append(dialog); dialog.showModal(); queueMicrotask(() => (dialog.querySelector<HTMLElement>('.dialog-body input, .dialog-body select, .dialog-body textarea, .dialog-body button') ?? dialog.querySelector<HTMLElement>('button'))?.focus()); return dialog;
}

function formError(): string { return '<p class="field-error" role="alert" tabindex="-1"></p>'; }

function addJob(): void {
  const activeCount = data.jobs.filter((job) => job.status === 'active').length;
  if (activeCount >= activeLimit()) { openSettings('license'); showToast(license.unlocked ? 'Five active jobs is the limit. Archive one to add another.' : 'One active job is free. Crew edition allows five.'); return; }
  const dialog = openDialog('Start a job', `<form id="job-form" novalidate><div class="field"><label for="job-name">Job name</label><input id="job-name" name="name" required maxlength="80" autocomplete="off"><p class="field-hint">Use the name you would say on the phone.</p></div><div class="field"><label for="client-name">Client name <span aria-hidden="true">(optional)</span></label><input id="client-name" name="client" maxlength="80" autocomplete="name"></div><div class="field"><label for="start-date">First forecast start</label><input id="start-date" name="startDate" type="date" required value="${todayIso()}"><p class="field-hint">A non-working date rolls forward.</p></div>${formError()}<div class="form-actions"><button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Create job</button></div></form>`);
  dialog.querySelector<HTMLFormElement>('#job-form')!.addEventListener('submit', async (event) => { event.preventDefault(); const values = new FormData(event.currentTarget as HTMLFormElement); const name = String(values.get('name') || '').trim(); const startDate = String(values.get('startDate') || ''); if (!name || !isIsoDate(startDate)) return setDialogError(dialog, 'Enter a job name and a valid first forecast date.'); const now = new Date().toISOString(); const newJob: Job = { id: crypto.randomUUID(), name, client: String(values.get('client') || '').trim(), startDate, status: 'active', createdAt: now, updatedAt: now, steps: [], history: [] }; data.jobs.push(newJob); data.selectedJobId = newJob.id; railMode = 'active'; await persist(); dialog.close(); renderApp(); showToast('Job created. Add its first step.'); });
}

function editJob(job: Job): void {
  const dialog = openDialog('Edit job', `<form id="job-form" novalidate><div class="field"><label for="job-name">Job name</label><input id="job-name" name="name" required maxlength="80" value="${escapeHtml(job.name)}"></div><div class="field"><label for="client-name">Client name <span aria-hidden="true">(optional)</span></label><input id="client-name" name="client" maxlength="80" value="${escapeHtml(job.client)}"></div><div class="field"><label for="start-date">First forecast start</label><input id="start-date" name="startDate" type="date" required value="${job.startDate}"></div>${formError()}<div class="form-actions"><button type="button" class="button signal" id="delete-job">Delete job</button><button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Save job</button></div></form>`);
  dialog.querySelector('#delete-job')!.addEventListener('click', async () => { if (!window.confirm(`Delete “${job.name}” and all ${job.steps.length} steps? This cannot be undone.`)) return; data.jobs = data.jobs.filter((item) => item.id !== job.id); ensureSelection(); await persist(); dialog.close(); renderApp(); showToast('Job deleted.'); });
  dialog.querySelector<HTMLFormElement>('#job-form')!.addEventListener('submit', async (event) => { event.preventDefault(); const values = new FormData(event.currentTarget as HTMLFormElement); const name = String(values.get('name') || '').trim(); const startDate = String(values.get('startDate') || ''); if (!name || !isIsoDate(startDate)) return setDialogError(dialog, 'Enter a job name and a valid first forecast date.'); job.name = name; job.client = String(values.get('client') || '').trim(); job.startDate = startDate; touch(job, 'Job details updated; forecast dates recalculated.'); await persist(); dialog.close(); renderApp(); });
}

function editStep(job: Job, step?: Step): void {
  const dialog = openDialog(step ? 'Edit step' : 'Add next step', `<form id="step-form" novalidate><div class="field"><label for="step-name">Step name</label><input id="step-name" name="name" required maxlength="80" value="${escapeHtml(step?.name || '')}" autocomplete="off"><p class="field-hint">For example: Rough-in, inspection, or fit-off.</p></div><div class="field"><label for="duration">Forecast working days</label><input id="duration" name="duration" type="number" inputmode="numeric" min="1" max="120" required value="${step?.duration ?? 1}"></div>${formError()}<div class="form-actions">${step ? '<button type="button" class="button signal" id="delete-step">Delete step</button>' : ''}<button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">${step ? 'Save step' : 'Add step'}</button></div></form>`);
  dialog.querySelector('#delete-step')?.addEventListener('click', async () => { if (!window.confirm(`Delete “${step!.name}”? Later forecast dates will be recalculated.`)) return; job.steps = job.steps.filter((item) => item.id !== step!.id); touch(job, `${step!.name} deleted; later forecast dates recalculated.`); await persist(); dialog.close(); renderApp(); });
  dialog.querySelector<HTMLFormElement>('#step-form')!.addEventListener('submit', async (event) => { event.preventDefault(); const values = new FormData(event.currentTarget as HTMLFormElement); const name = String(values.get('name') || '').trim(); const duration = Number(values.get('duration')); if (!name || !Number.isInteger(duration) || duration < 1 || duration > 120) return setDialogError(dialog, 'Enter a step name and 1 to 120 working days.'); if (step) { step.name = name; step.duration = duration; touch(job, `${name} forecast changed to ${duration} working day${duration === 1 ? '' : 's'}.`); } else { job.steps.push({ id: crypto.randomUUID(), name, duration }); touch(job, `${name} added as step ${job.steps.length}.`); } await persist(); dialog.close(); renderApp(); });
}

function stepMenu(job: Job, id: string): void {
  const step = job.steps.find((item) => item.id === id); if (!step) return;
  const dialog = openDialog(step.name, `<p>${step.actualFinish ? `Actual finish: <strong>${formatDate(step.actualFinish, 'long')}</strong>.` : 'Record the actual finish. Every later forecast will move from it.'}</p><div class="form-actions"><button class="button" id="edit-step">Edit forecast</button>${step.actualFinish ? '<button class="button signal" id="remove-actual">Remove actual finish</button>' : '<button class="button primary" id="finish-step">Record actual finish</button>'}</div>`);
  dialog.querySelector('#edit-step')!.addEventListener('click', () => { dialog.close(); editStep(job, step); }); dialog.querySelector('#finish-step')?.addEventListener('click', () => { dialog.close(); finishStep(job, step); }); dialog.querySelector('#remove-actual')?.addEventListener('click', async () => { delete step.actualFinish; touch(job, `${step.name} actual finish removed; forecast reset.`); await persist(); dialog.close(); renderApp(); showToast('Actual finish removed. Later forecast dates recalculated.'); });
}

function finishStep(job: Job, step: Step): void {
  const dialog = openDialog('Record actual finish', `<form id="finish-form" novalidate><p>When did <strong>${escapeHtml(step.name)}</strong> actually finish?</p><div class="field"><label for="actual-date">Actual finish date</label><input id="actual-date" name="actual" type="date" required value="${todayIso()}" aria-describedby="actual-error"></div><p id="actual-error" class="field-error" role="alert" tabindex="-1"></p><div class="form-actions"><button type="button" class="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Save actual and recalculate</button></div></form>`);
  dialog.querySelector<HTMLFormElement>('#finish-form')!.addEventListener('submit', async (event) => { event.preventDefault(); const actual = String(new FormData(event.currentTarget as HTMLFormElement).get('actual') || ''); if (!isIsoDate(actual)) return setDialogError(dialog, 'Enter a valid actual finish date.'); const previous = step.actualFinish; step.actualFinish = actual; const error = actualOrderError(job); if (error) { if (previous) step.actualFinish = previous; else delete step.actualFinish; return setDialogError(dialog, error); } const changed = scheduleJob(job, data.settings).filter((item) => !item.actualFinish && (item.startMoved || item.finishMoved)).length; touch(job, `${step.name} finished ${formatDate(actual)}; ${changed} later ${changed === 1 ? 'date' : 'dates'} moved.`); await persist(); dialog.close(); renderApp(); showToast(changed ? `${changed} later ${changed === 1 ? 'step has' : 'steps have'} new forecast dates.` : 'Actual finish saved. No later forecast date moved.'); });
}

async function moveStepUp(job: Job, id: string): Promise<void> {
  const index = job.steps.findIndex((step) => step.id === id); if (index <= 0) return; const [step] = job.steps.splice(index, 1); job.steps.splice(index - 1, 0, step!); const error = actualOrderError(job); if (error) { job.steps.splice(index - 1, 1); job.steps.splice(index, 0, step!); showToast(`Step order unchanged. ${error}`); return; } touch(job, `${step!.name} moved to step ${index}.`); await persist(); renderApp(); showToast('Step order updated.');
}

async function toggleArchive(job: Job): Promise<void> {
  if (job.status === 'archived' && data.jobs.filter((item) => item.status === 'active').length >= activeLimit()) { showToast(license.unlocked ? 'Archive an active job before restoring this one.' : 'Crew edition allows five active jobs.'); return; }
  job.status = job.status === 'active' ? 'archived' : 'active'; touch(job, `Job ${job.status}.`); railMode = job.status; await persist(); renderApp(); showToast(`Job ${job.status}.`);
}

async function copyMessage(job: Job): Promise<void> { try { await navigator.clipboard.writeText(makeClientMessage(job)); showToast('Client update copied.'); } catch { showToast('Copy was blocked. Select the update and copy it manually.'); } }
async function shareMessage(job: Job): Promise<void> { try { await navigator.share({ title: `${job.name} date update`, text: makeClientMessage(job) }); } catch (error) { if ((error as DOMException).name !== 'AbortError') showToast('Sharing was unavailable. Copy the client update instead.'); } }

function openSettings(focus = ''): void {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const zones = [...new Set([data.settings.timezone, 'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Australia/Sydney'])];
  const dialog = openDialog('Data and calendar settings', `<form id="settings-form" novalidate><section class="settings-section"><h3>Working calendar</h3><fieldset class="days"><legend>Working days</legend>${weekdays.map((day, index) => `<label class="day-check"><input type="checkbox" name="workday" value="${index}" ${data.settings.workdays.includes(index) ? 'checked' : ''}><span>${day}</span></label>`).join('')}</fieldset><div class="field"><label for="timezone">Timezone</label><input id="timezone" name="timezone" list="timezones" required value="${escapeHtml(data.settings.timezone)}"><datalist id="timezones">${zones.map((zone) => `<option value="${escapeHtml(zone)}"></option>`).join('')}</datalist><p class="field-hint">Every export includes this setting.</p></div><div class="field"><label for="holidays">Non-working dates</label><textarea id="holidays" name="holidays" placeholder="2026-12-25&#10;2026-12-26">${escapeHtml(data.settings.holidays.join('\n'))}</textarea><p class="field-hint">Enter one YYYY-MM-DD date per line.</p></div>${formError()}<button class="button primary" type="submit">Save working calendar</button></section><section class="settings-section"><h3>Your data</h3><p>JSON keeps a complete backup. CSV opens in a spreadsheet. Both include your calendar settings.</p><div class="message-actions"><button type="button" class="button" id="export-json">Export JSON</button><button type="button" class="button" id="export-csv">Export CSV</button><label class="button" for="import-json">Import JSON</label><input id="import-json" type="file" accept="application/json,.json" hidden></div></section><section class="settings-section" id="license-section"><h3>Crew edition</h3><p><span class="price">$29 one time</span><br>Keep five active jobs instead of one. Date scheduling and exports remain free.</p>${demoMode ? '<p>Leave the demo to buy or restore a license.</p>' : license.unlocked ? '<p><strong>✓ Crew edition is active in this browser.</strong></p>' : `<a class="button signal" href="${checkoutUrl()}">Buy Crew edition</a><p>Sociobot/Dodo is the merchant of record. A refund revokes the license.</p><div class="license-row"><div class="field"><label for="license-token">Have a license? Paste it</label><input id="license-token" type="text" autocomplete="off" spellcheck="false" value="${escapeHtml(license.token)}"></div><button type="button" class="button" id="restore-license">Verify license</button></div><p id="license-note" class="field-hint" aria-live="polite">${escapeHtml(license.checking ? 'Checking license…' : license.notice)}</p>`}<p><a href="/privacy/" data-route="privacy">Privacy</a> · <a href="/terms/" data-route="terms">Terms</a></p></section></form>`);
  if (focus === 'license') queueMicrotask(() => dialog.querySelector('#license-section')?.scrollIntoView({ block: 'start' }));
  dialog.querySelector<HTMLFormElement>('#settings-form')!.addEventListener('submit', async (event) => { event.preventDefault(); const values = new FormData(event.currentTarget as HTMLFormElement); const workdays = values.getAll('workday').map(Number).sort(); const timezone = String(values.get('timezone') || '').trim(); const holidayLines = String(values.get('holidays') || '').split(/\s+/).filter(Boolean); const invalid = holidayLines.find((date) => !isIsoDate(date)); if (!workdays.length) return setDialogError(dialog, 'Choose at least one working day.'); try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); } catch { return setDialogError(dialog, 'Enter a valid timezone, such as Europe/London.'); } if (invalid) return setDialogError(dialog, `“${invalid}” is not a valid YYYY-MM-DD date.`); data.settings = { timezone, workdays, holidays: [...new Set(holidayLines)].sort() }; await persist(); dialog.close(); renderApp(); showToast('Working calendar saved. Every forecast date was recalculated.'); });
  dialog.querySelector('#export-json')!.addEventListener('click', exportJson); dialog.querySelector('#export-csv')!.addEventListener('click', exportCsv); dialog.querySelector<HTMLInputElement>('#import-json')!.addEventListener('change', (event) => void importJson(((event.currentTarget as HTMLInputElement).files || [])[0], dialog));
  dialog.querySelector('#restore-license')?.addEventListener('click', async () => { const token = dialog.querySelector<HTMLInputElement>('#license-token')!.value.trim(); if (!token) { dialog.querySelector('#license-note')!.textContent = 'Paste the token from your receipt first.'; return; } license = storeLicense(token); dialog.querySelector('#license-note')!.textContent = 'Checking this license…'; license = await verifyLicense(license, true); dialog.close(); renderApp(); showToast(license.notice || 'License checked.'); });
}

function exportJson(): void { download(`actuals-jobs-${todayIso()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), product: 'actuals-job-sequencer', ...data }, null, 2), 'application/json'); showToast('JSON backup exported.'); }
function csvCell(value: unknown): string { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function exportCsv(): void { const header = ['job', 'client', 'status', 'step_order', 'step', 'duration_workdays', 'baseline_start', 'baseline_finish', 'forecast_start', 'forecast_finish', 'actual_finish', 'timezone', 'working_days', 'holidays']; const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const rows = data.jobs.flatMap((job) => scheduleJob(job, data.settings).map((step, index) => [job.name, job.client, job.status, index + 1, step.name, step.duration, step.baselineStart, step.baselineFinish, step.forecastStart, step.forecastFinish, step.actualFinish || '', data.settings.timezone, data.settings.workdays.map((day) => dayNames[day]).join('|'), data.settings.holidays.join('|')])); download(`actuals-jobs-${todayIso()}.csv`, [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8'); showToast('CSV exported with calendar settings.'); }

async function importJson(file: File | undefined, dialog: HTMLDialogElement): Promise<void> {
  if (!file) return;
  try { const parsed = JSON.parse(await file.text()) as unknown; if (!validateData(parsed)) throw new Error('This backup has invalid jobs, dates, or step order.'); const incoming = parsed as AppData; if (!window.confirm(`Replace this ${demoMode ? 'demo’s' : 'browser’s'} ${data.jobs.length} jobs with the ${incoming.jobs.length} jobs in “${file.name}”?`)) return; data = incoming; ensureSelection(); await persist(); dialog.close(); renderApp(); showToast('JSON backup imported.'); } catch (error) { setDialogError(dialog, error instanceof Error ? error.message : 'The backup could not be read.'); }
}

function validateData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false; const item = value as Partial<AppData>;
  if (item.version !== 1 || !Array.isArray(item.jobs) || !item.settings || typeof item.settings !== 'object') return false;
  if (!Array.isArray(item.settings.workdays) || !item.settings.workdays.length || !item.settings.workdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) return false;
  if (typeof item.settings.timezone !== 'string' || !Array.isArray(item.settings.holidays) || !item.settings.holidays.every(isIsoDate)) return false;
  return item.jobs.every((job) => job && typeof job.id === 'string' && typeof job.name === 'string' && typeof job.client === 'string' && isIsoDate(job.startDate) && ['active', 'archived'].includes(job.status) && Array.isArray(job.steps) && job.steps.every((step) => typeof step.id === 'string' && typeof step.name === 'string' && Number.isInteger(step.duration) && step.duration >= 1 && step.duration <= 120 && (!step.actualFinish || isIsoDate(step.actualFinish))) && Array.isArray(job.history) && !actualOrderError(job));
}

function download(name: string, contents: string, type: string): void { const url = URL.createObjectURL(new Blob([contents], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function touch(job: Job, message: string): void { job.updatedAt = new Date().toISOString(); const entry: HistoryEntry = { id: crypto.randomUUID(), at: job.updatedAt, message }; job.history.unshift(entry); job.history = job.history.slice(0, 50); }
async function persist(): Promise<void> { try { await saveData(data, demoMode); persistenceError = ''; } catch { persistenceError = 'This change is visible now but could not be saved. Export a copy and check browser storage permissions.'; } }
function setDialogError(dialog: HTMLDialogElement, message: string): void { const error = dialog.querySelector<HTMLElement>('.field-error'); if (error) { error.textContent = message; error.focus(); } }
function showToast(message: string, reload = false): void { window.clearTimeout(toastTimer); const root = document.querySelector('#toast-root'); if (!root) return; root.innerHTML = `<div class="toast" role="status"><span>${escapeHtml(message)}</span>${reload ? '<button class="button" data-action="reload">Reload app</button>' : ''}</div>`; toastTimer = window.setTimeout(() => { root.innerHTML = ''; }, reload ? 12000 : 4200); }

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  navigator.serviceWorker.register('/sw.js').then((registration) => { registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('A new field edition is ready.', true); }); }); }).catch(() => showToast('Offline setup did not complete. The app still works while connected.'));
  navigator.serviceWorker.addEventListener('message', (event) => { if (event.data?.type === 'UPDATE_AVAILABLE' && navigator.serviceWorker.controller) showToast('Offline use is ready.', true); });
}

bindGlobalEvents();
void activateRoute(route);
