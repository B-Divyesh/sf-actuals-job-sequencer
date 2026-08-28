# Adversarial first-read review 2 — Actuals Job Sequencer

**Reviewed:** 2026-08-28 UTC  
**Target:** <https://actuals-job-sequencer.sociobot.in>  
**Base:** `a072d7be4df0588a6565461dbc1bc39749490c14`  
**Verdict:** **FAIL**

The first screen, demo, core calculation, routing, visual identity, accessibility, and executable test commands work. Two earlier findings are not fully closed, and four minor copy findings remain.

## First 30 seconds

I opened the live site in fresh Chromium contexts at 390×844 and 1440×900 and recorded the unscrolled viewport before interacting.

- **What it does:** It moves later job forecast dates after a step actually finishes late.
- **For whom:** Small trade crews that have already given dates to a client.
- **What to click first:** `Try it with sample data` to see a late rough-in move the handover date.

Both viewports answer all three questions. The exact supporting copy is `Move job dates after actual finishes`, `For small trade crews when a late step changes the forecast dates you gave a client.`, and `Try it with sample data`. This part is not blocking.

## Findings

### F-1-2 — BLOCKING — Reopened: some published claims remain unlisted or only partly tested

**Exact quote / location:** The live landing page says `Archive finished jobs and restore them when needed.` No entry in `.factory/claims.json` promises or tests archive/restore. The nearest command, `@claim:five-job-limit`, creates five jobs, exports CSV, and rejects a sixth; it never archives or restores a job.

Two listed claims also exceed their assertions:

- `csv-export` promises `every step, forecast, actual finish, timezone, workdays, and non-working dates`. Its test checks four lines plus `forecast_start`, the job name, `Europe/London`, and `2026-09-15`. It does not assert the exported `actual_finish`, `forecast_finish`, or `working_days` values.
- `json-backup` promises a complete backup that restores jobs and settings. Its test changes only the job name before import and then checks that name and one forecast. It never changes or directly compares timezone, workdays, or non-working dates, so an importer that ignored settings could still pass.

**Why this fails:** A visitor can rely on archive/restore and complete exports, but the sandbox does not prove those outcomes. Review 1 required every retained claim to have an observable test; this is only a partial closure of the same finding.

**Concrete fix:** Add archive/restore to a claim entry and make its test archive a fifth job, create a replacement, restore the archived job after freeing capacity, and verify its steps remain intact. Strengthen `csv-export` to parse the header and all three rows and assert every promised column/value. Strengthen `json-backup` by changing job fields and every calendar setting after export, importing, and deep-comparing the restored jobs and settings with the exported fixture.

### F-1-9 — BLOCKING — Reopened: the main date concept still has three names

**Exact quote / location:** The live first screen uses `Working dates · built for the job site`, the h1 `Move job dates after actual finishes`, and the next sentence says `forecast dates`. The document title shortens the same concept again to `move dates after finishes`. Source confirms these strings in `src/main.ts:36` and `src/main.ts:133`.

**Why this fails:** A cold visitor must decide whether “working dates,” “job dates,” and “forecast dates” are different fields. Review 1 explicitly required `forecast dates` and `actual finish` everywhere, while polish 1 marked that requirement complete.

**Concrete fix:** Use `forecast dates` for the concept everywhere. For example: h1 `Move forecast dates after actual finishes`, kicker `Forecast dates · built for small trade crews`, and title `Actuals Job Sequencer — move forecast dates`.

### F-2-1 — MINOR — The job filters are buttons without result-naming verbs

**Exact quote / location:** The landing job rail exposes two buttons named `Active` and `Archived`.

**Why this matters:** A first-time keyboard or screen-reader user must infer that these controls filter the job list rather than change a job’s status.

**Concrete fix:** Rename them `Show active jobs` and `Show archived jobs`; retain `aria-pressed` for the selected filter.

### F-2-2 — MINOR — One heading is vague and promotional

**Exact quote / location:** Landing heading `Five jobs, kept focused`.

**Why this matters:** In a heading list, “kept focused” does not name a feature or limit. The reader must inspect the paragraph to learn that this is the five-active-job limit.

**Concrete fix:** Use `Track up to five active jobs` and follow with `Archive a finished job before adding another.` Add the archive/restore claim test in F-1-2 before retaining that second sentence.

### F-2-3 — MINOR — The README explains the demo with storage jargon

**Exact quote / location:** README demo copy says `Try the isolated sample` and `The demo uses the separate demo:actuals-job-sequencer browser database.`

**Why this matters:** A prospective user must translate “isolated” and an internal database name to learn the useful fact: trying the sample will not change their jobs.

**Concrete fix:** Write `Try the sample without changing your jobs` and `Demo changes stay separate from your jobs.` Keep the storage namespace in `.factory/demo.md` for maintainers.

### F-2-4 — MINOR — The README deploy sentence stacks unexplained implementation terms

**Exact quote / location:** `staticwebapp.config.json sets immutable asset caching, security headers, route behavior, and the real 404 response.`

**Why this matters:** “Immutable asset caching” and “route behavior” do not state an observable result on first read.

**Concrete fix:** Use `staticwebapp.config.json caches versioned files for a year, adds browser security rules, and sends unknown URLs to the 404 page.`

## Copy audit

Word counts treat a hyphenated or code-formatted token as one word. The landing audit is the complete fresh, empty `/` state, including its image alternative and service-worker status. No sentence exceeds 22 words and no banned marketing word appears.

### Landing sentences

| Words | Exact sentence | Result |
| ---: | --- | --- |
| 16 | `For small trade crews when a late step changes the forecast dates you gave a client.` | Pass |
| 8 | `See a late rough-in move the handover date.` | Pass; demo/dependency claims |
| 6 | `Works offline after the first visit.` | Pass; `offline-reload` |
| 5 | `Jobs stay in this browser.` | Pass; `local-only` |
| 3 | `Five active jobs.` | Pass; `five-job-limit` |
| 2 | `No account.` | Pass; `five-job-limit` |
| 3 | `No active jobs.` | Pass |
| 7 | `Start one to add its forecast dates.` | Pass |
| 10 | `Five blank job slips follow a folding rule across a paper calendar.` | Pass; image alternative |
| 9 | `Add the job, its ordered steps, and each estimate.` | Pass |
| 9 | `Record an actual finish to move every later forecast.` | Pass; `dependency-reflow` |
| 4 | `Add the ordered steps.` | Pass |
| 6 | `Give each step a working-day estimate.` | Pass |
| 4 | `Record the actual finish.` | Pass |
| 8 | `The next forecast starts after the work finished.` | Pass; `dependency-reflow` |
| 4 | `Send the changed dates.` | Pass |
| 7 | `Copy the client update after checking it.` | Pass; `client-update` |
| 10 | `It does not plan routes, payroll, GPS, or whole projects.` | Pass as the brief's scope boundary |
| 5 | `Forecast dates remain your estimates.` | Pass; disclaimer |
| 6 | `Track up to five active jobs.` | Pass; `five-job-limit` |
| 8 | `Archive finished jobs and restore them when needed.` | **Flag: F-1-2** |
| 6 | `Move forecast dates after actual finishes.` | Pass; footer one-liner |
| 4 | `Offline use is ready.` | Pass; `offline-reload` |

Landing headings, controls, and fragments were also checked. `Working dates · built for the job site` and `Move job dates after actual finishes` are flagged under F-1-9; `Active` and `Archived` under F-2-1; and `Five jobs, kept focused` under F-2-2. `Try it with sample data`, `Start your first job`, `Add a job`, `Open data settings`, and `Reload app` use verbs and name their result. Nav labels name destinations and status fragments describe state.

### README sentences

| Words | Exact sentence | Result |
| ---: | --- | --- |
| 12 | `Move forecast dates after actual finishes for solo and two-person trade crews.` | Pass |
| 13 | `The app keeps ordered steps and writes a client update when dates change.` | Pass |
| 13 | `Keeps steps in order so one actual finish sets every later forecast date.` | Pass |
| 7 | `Skips selected non-working days and holiday dates.` | Pass; `dependency-reflow` |
| 11 | `Rejects an actual finish that predates an earlier step’s actual finish.` | Pass; `dependency-reflow` |
| 9 | `Writes a client update with the changed forecast dates.` | Pass; `client-update` |
| 10 | `Exports every job and calendar setting as JSON or CSV.` | **Flag: F-1-2** |
| 9 | `Restores jobs and settings from a valid JSON backup.` | **Flag: F-1-2** |
| 6 | `Works offline after the first visit.` | Pass; `offline-reload` |
| 8 | `Keeps job and client data in this browser.` | Pass; `local-only` |
| 10 | `It does not plan routes, payroll, GPS, or whole projects.` | Pass as a scope boundary |
| 7 | `Forecast dates are estimates, not guaranteed appointments.` | Pass |
| 4 | `Open /demo/ or /?demo=1.` | Pass |
| 14 | `The sample kitchen job already shows a late rough-in and a moved handover date.` | Pass; demo/dependency claims |
| 8 | `The demo uses the separate demo:actuals-job-sequencer browser database.` | **Flag: F-2-3** |
| 5 | `Reset demo restores the sample.` | Pass; `demo-isolation` |
| 13 | `Start for real deletes the demo database and returns to your real jobs.` | Pass; `demo-isolation` |
| 8 | `You need Node.js 20 or newer and npm.` | Pass; setup requirement |
| 7 | `Open the address shown in the terminal.` | Pass |
| 11 | `The static output is in dist/, with dist/index.html at its root.` | Pass; observed after build |
| 11 | `Every public claim and its clean-state command is listed in .factory/claims.json.` | **Flag: inaccurate until F-1-2 closes** |
| 5 | `Playwright is pinned to 1.58.2.` | Pass; package manifest |
| 8 | `Job and client data stays in this browser.` | Pass; `local-only` |
| 13 | `The app uses no analytics, third-party scripts, remote fonts, GPS, or location tracking.` | Pass; request/resource and source checks |
| 7 | `Export JSON to keep a complete backup.` | **Flag: F-1-2** |
| 9 | `Use up to five active jobs without an account.` | Pass; `five-job-limit` |
| 7 | `The current release does not take payment.` | Pass; `five-job-limit` and no purchase path |
| 4 | `See Privacy and Terms.` | Pass |
| 9 | `Build dist/, then deploy it as a static site.` | Pass |
| 14 | `staticwebapp.config.json sets immutable asset caching, security headers, route behavior, and the real 404 response.` | **Flag: F-2-4** |
| 5 | `This project is MIT licensed.` | Pass; `LICENSE` |
| 2 | `See LICENSE.` | Pass |

README headings and fragments checked: `Actuals Job Sequencer`, `Live product`, `What it does`, `Try the demo`, `Run locally`, `Verify`, `Data and privacy`, `Deploy`, `Product records`, and `License` identify their section or destination. `Try the isolated sample` is flagged under F-2-3. The run/build/test commands are code, not prose sentences. There is no README button label to audit.

## Demo and sandbox

`Try it with sample data` reaches `/demo/` in one click. The first 390px demo viewport already contains the persistent `Demo — sample data, nothing is saved` banner, `Reset demo`, `Start for real`, the Mercer kitchen job identity, and the moved-date prompt. The page contains the realistic three-step schedule, 16–17 September moved handover, and ready client update.

I changed the demo job name, selected `Reset demo`, and confirmed that `Mercer kitchen fit` returned and the changed name disappeared. Direct `/demo/` and `/?demo=1` entries created only `demo:actuals-job-sequencer` in fresh contexts. The clean-clone isolation test also created a real job, changed/reset the demo, exited, and confirmed the real job was untouched. No demo blocker remains.

The privacy test intercepted the complete edit/export/reset flow and observed no off-origin request or geolocation call. The offline test waited for service-worker control, disabled the network, reloaded `/demo/`, and recovered the seeded schedule with `Offline · changes save here`.

## Claims execution

I cloned the repository afresh to `/tmp/actuals-review2-clean.TqQb9z` at the stated base, ran `npm ci`, then ran every command exactly as listed. Every command built the app and launched one fresh Chromium test.

| Claim | Result | Coverage judgment |
| --- | --- | --- |
| `demo-isolation` | PASS | Complete for entry, reset, and real-data separation |
| `dependency-reflow` | PASS | Complete for the sample, invalid order, reload, and invalid import |
| `client-update` | PASS | Complete for the sample's changed date and clipboard result |
| `csv-export` | PASS | **Partial assertions; F-1-2** |
| `json-backup` | PASS | **Settings restoration not exercised; F-1-2** |
| `local-only` | PASS | Complete with interception, resource inspection, geolocation trap, and source scan |
| `offline-reload` | PASS | Complete for controlled offline demo reload |
| `five-job-limit` | PASS | Complete for five jobs, no purchase link, export, and sixth-job rejection; archive/restore remains untested |

No command failed. The verdict remains `FAIL` because two registered claims are not fully asserted and one live claim is unlisted.

## Earlier-finding verification

I read `.factory/review-1.md`, `.factory/polish-1.md`, `.factory/verification.md`, and the prior `.factory/handoff.md`, then checked every earlier finding live and in source.

| Earlier ID | Result | Fresh evidence |
| --- | --- | --- |
| F-1-1 | Fixed | Seeded demo, banner, reset/exit, and only the `demo:` database on direct entry; source selects distinct databases. |
| F-1-2 | **Reopened, blocking** | Registry/tests exist, but archive/restore is unlisted and CSV/JSON assertions are incomplete. |
| F-1-3 | Fixed | Both cold viewports show the job, audience, sample action, and three facts before the app area. |
| F-1-4 / P1 | Fixed | Live rejected Rough-in on 3 September because Strip out finished on 8 September; reload showed no invalid actual. Core and import validation call `actualOrderError`. |
| F-1-5 / P2 | Fixed | Live hashed JS, CSS, and WebP return one-year `immutable`; source contains the route rule. |
| F-1-6 | Fixed | `/demo/` is distinct; `/not-a-route` returns HTTP 404 with the designed page; physical documents and rewrite exist. |
| F-1-7 | Fixed | Every route has canonical/OG/Twitter/icons; live metadata assets return 200. |
| F-1-8 | Fixed | All routes share linked wordmark/nav and the complete footer with build ID. |
| F-1-9 | **Reopened, blocking** | `working dates`, `job dates`, `forecast dates`, and bare `dates` still name one concept. |
| F-1-10 | Fixed | Result-naming data/export/source controls exist and match their action. |

## Structure, accessibility, and visual identity

- `/`, `/demo/`, `/privacy/`, `/terms/`, and the 404 have the expected title, one h1, one main, `lang="en"`, description, canonical, OG/Twitter card, and icons.
- Direct loads work. Privacy navigation, browser back, and forward each focused the destination h1. A polite route status exists.
- Every crawled HTTP link returned 200 except the deliberate unknown route, which returned 404. Explicit `mailto:` links were skipped. GitHub returned 200 and announces its new tab.
- Live Playwright axe scans found zero violations on all five routes. The URL verifier found zero home console errors, missing alt text, or unlabeled buttons.
- Focus rings, 44px controls, dialog focus return, reduced-motion rules, and mobile overflow are covered.
- The warm-paper ruled broadsheet, folio numbers, signal-red moved dates, and job-sheet 404 match `.factory/design.md`. It is not a generic SaaS template.

No structure, accessibility, routing, dead-link, or generic-identity finding remains.

## Missed leverage

No AI feature is justified. Date sequencing is deterministic and should remain reliable offline without model variability or a provider key. JSON import/restore and JSON/CSV export cover the brief's import/export leverage. Account sync would conflict with the local-only scope. Repository and request scans found no AI provider key or decorative AI path.

## Other verification

- `npm run check`: PASS — TypeScript, 11/11 Vitest tests, and build.
- `npm run test:e2e`: PASS — 10/10 Playwright tests.
- Main bundle: 36.09 KB raw / 11.74 KB gzip; CSS: 16.83 KB raw / 4.43 KB gzip.
- Live URL verifier: HTTP 200, zero console errors, required semantics present.
- Live hashed assets use one-year immutable caching; public routes/assets resolve; unknown paths return 404.

## What would make this perfect

Register and exercise archive/restore, parse every promised CSV field, and prove that JSON import restores altered calendar settings. Then use `forecast dates` consistently, rename the job-filter buttons, replace the vague heading, and remove README storage/deploy jargon. Re-run the full review from a clean clone and a fresh live browser only after all six findings are absent.
