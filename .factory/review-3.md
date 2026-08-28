# Adversarial first-read review 3 — Actuals Job Sequencer

**Reviewed:** 2026-08-28 UTC  
**Target:** <https://actuals-job-sequencer.sociobot.in>  
**Base:** `b6a20f15161adbedb6c22dd7a3b68253655a0c5b`  
**Verdict:** **PASS**

This was a fresh review, not a diff review. I used clean Chromium contexts at 390×844 and 1440×900, a newly cloned local checkout, and fresh live contexts for demo, privacy, routing, metadata, and accessibility checks. There are zero blocking or minor findings.

## First 30 seconds

Before scrolling, both viewports made the product and first action clear.

| Question | Cold reading |
| --- | --- |
| What does it do? | It moves later **forecast dates** when an ordered job step actually finishes late. |
| For whom? | Small trade crews that have already given a client forecast dates. |
| What should I click first? | **Try it with sample data** to see a late rough-in move the handover date. |

The exact first-screen evidence is `Move forecast dates after actual finishes`, `For small trade crews when a late step changes the forecast dates you gave a client.`, and `Try it with sample data`. On the 390px viewport they appear at 147px, 241px, and 343px respectively; the three plain facts are also visible without scrolling. No first-read blocker is present.

## Copy audit

Word counts treat hyphenated and URL-like tokens as one word. The landing list covers the cold empty `/` state, including the image alternative and footer. There are no sentences over 22 words, banned marketing adjectives, terminology conflicts, vague headings, or non-result-naming product buttons.

### Landing page sentences

| Words | Exact copy | Result |
| ---: | --- | --- |
| 16 | For small trade crews when a late step changes the forecast dates you gave a client. | Pass |
| 8 | See a late rough-in move the handover date. | Pass; demo/dependency claim |
| 6 | Works offline after the first visit. | Pass; `offline-reload` |
| 5 | Jobs stay in this browser. | Pass; `local-only` |
| 3 | Five active jobs. | Pass; `five-job-limit` |
| 2 | No account. | Pass; `five-job-limit` |
| 5 | Saved in this browser | Pass; status, consistent with `local-only` |
| 4 | Offline use is ready. | Pass; `offline-reload` |
| 3 | No active jobs. | Pass |
| 7 | Start one to add its forecast dates. | Pass |
| 10 | Five blank job slips follow a folding rule across a paper calendar. | Pass; image alternative |
| 9 | Add the job, its ordered steps, and each estimate. | Pass |
| 9 | Record an actual finish to move every later forecast. | Pass; `dependency-reflow` |
| 6 | Give each step a working-day estimate. | Pass |
| 8 | The next forecast starts after the work finished. | Pass; `dependency-reflow` |
| 5 | Send the changed forecast dates. | Pass; `client-update` |
| 7 | Copy the client update after checking it. | Pass; `client-update` |
| 10 | It does not plan routes, payroll, GPS, or whole projects. | Pass; scope boundary |
| 5 | Forecast dates remain your estimates. | Pass; honest disclaimer |
| 6 | Archive a finished job before adding another. | Pass; `archive-restore` |
| 7 | Restore it when there is room. | Pass; `archive-restore` |
| 6 | Move forecast dates after actual finishes. | Pass; footer one-liner |

### README sentences

| Words | Exact copy | Result |
| ---: | --- | --- |
| 12 | Move forecast dates after actual finishes for solo and two-person trade crews. | Pass |
| 13 | The app keeps ordered steps and writes a client update when dates change. | Pass; registered behavior |
| 13 | Keeps steps in order so one actual finish sets every later forecast date. | Pass; `dependency-reflow` |
| 7 | Skips selected non-working days and holiday dates. | Pass; `dependency-reflow` |
| 11 | Rejects an actual finish that predates an earlier step’s actual finish. | Pass; `dependency-reflow` |
| 9 | Writes a client update with the changed forecast dates. | Pass; `client-update` |
| 10 | Exports every job and calendar setting as JSON or CSV. | Pass; `csv-export` and `json-backup` |
| 9 | Restores jobs and settings from a valid JSON backup. | Pass; `json-backup` |
| 5 | Works offline after the first visit. | Pass; `offline-reload` |
| 8 | Keeps job and client data in this browser. | Pass; `local-only` |
| 10 | It does not plan routes, payroll, GPS, or whole projects. | Pass; scope boundary |
| 7 | Forecast dates are estimates, not guaranteed appointments. | Pass; honest disclaimer |
| 4 | Open `/demo/` or `/?demo=1`. | Pass |
| 14 | The sample kitchen job already shows a late rough-in and a moved handover date. | Pass; demo/dependency claim |
| 7 | Demo changes stay separate from your jobs. | Pass; `demo-isolation` |
| 5 | Reset demo restores the sample. | Pass; `demo-isolation` |
| 11 | Start for real removes the sample and returns to your jobs. | Pass; `demo-isolation` |
| 8 | You need Node.js 20 or newer and npm. | Pass; setup requirement |
| 7 | Open the address shown in the terminal. | Pass |
| 8 | Build the deployable files with: | Pass |
| 11 | The static output is in `dist/`, with `dist/index.html` at its root. | Pass |
| 11 | Every public claim and its clean-state command is listed in `.factory/claims.json`. | Pass; confirmed below |
| 5 | Playwright is pinned to 1.58.2. | Pass |
| 8 | Job and client data stays in this browser. | Pass; `local-only` |
| 13 | The app uses no analytics, third-party scripts, remote fonts, GPS, or location tracking. | Pass; `local-only` |
| 7 | Export JSON to keep a complete backup. | Pass; `json-backup` |
| 9 | Use up to five active jobs without an account. | Pass; `five-job-limit` |
| 7 | The current release does not take payment. | Pass; no payment path and `five-job-limit` |
| 4 | See Privacy and Terms. | Pass |
| 9 | Build `dist/`, then deploy it as a static site. | Pass |
| 14 | `staticwebapp.config.json` caches versioned files for a year, adds browser security rules, and sends unknown URLs to the 404 page. | Pass; source and live headers/status confirm it |
| 5 | This project is MIT licensed. | Pass |
| 2 | See LICENSE. | Pass |

Heading/control audit: `Forecast dates · built for small trade crews`, `Move forecast dates after actual finishes`, `Your jobs`, `Show active jobs`, `Show archived jobs`, `Set the first forecast date`, `How it works`, `Built for forecast dates, not dispatch`, and `Track up to five active jobs` stand alone. `Try it with sample data`, `Start your first job`, `Add a job`, `Open data settings`, `Export JSON`, `Export CSV`, `Import JSON`, `Reset demo`, and `Start for real` name their result. `forecast date`, `actual finish`, `job`, `step`, and `client update` remain consistent.

## Demo and sandbox

`Try it with sample data` reaches `/demo/` in one click. A fresh 390px demo view contains the persistent `Demo — sample data, nothing is saved` controls, `Reset demo`, `Start for real`, `Sample job · late rough-in`, and the realistic `Mercer kitchen fit` job for Rina Mercer; the job workspace begins in that same viewport. The sample has two actual finishes, a moved handover, and a ready client update.

Reset restored `Mercer kitchen fit` after an edit. The registered isolation flow creates a real `Real boiler service` job, enters and changes/resets demo data, exits demo, and confirms the real job is unchanged. Source uses distinct IndexedDB names: `actuals-job-sequencer` and `demo:actuals-job-sequencer`; demo-mode reads/writes only the latter and `Start for real` deletes it.

Live interception across opening demo, editing the client, exporting JSON, and reset observed only the product origin. The clean-state offline claim disables the network after service-worker control, reloads `/demo/`, and confirms both the sample job and `Offline · changes save here`.

## Claims

I created a new local clone, ran `npm ci`, then ran each command exactly as listed in `.factory/claims.json`. All nine passed: `demo-isolation`, `dependency-reflow`, `client-update`, `csv-export`, `json-backup`, `local-only`, `offline-reload`, `five-job-limit`, and `archive-restore`. `npm test`, `npm run build`, and the full `npm run test:e2e` suite also passed (11 Vitest tests; 12 Playwright tests).

The substantive claim assertions are complete: CSV is checked header- and row-for-row; JSON restoration deep-compares the job and all calendar settings after changes; the five-job/archive flow proves restore keeps a step; privacy intercepts the whole demo flow; and the dependency test rejects both UI and imported impossible actual-date order. No live landing or README claim lacks a registry entry and observable claim test.

## Earlier findings

I re-read `review-1.md`, `review-2.md`, both polish records, the independent verification, and the previous handoff. Each earlier finding is fixed in live behavior and source:

| Earlier finding | Fresh confirmation |
| --- | --- |
| F-1-1 | One-click seeded demo, banner, reset, exit, and isolated database work. |
| F-1-2 | Nine registered clean-state claim tests pass; CSV/JSON/archive coverage is now complete. |
| F-1-3 | Both cold viewports state job, audience, first action, result, and three facts. |
| F-1-4 / P1 | UI/import reject an actual finish before its predecessor; regression test passes. |
| F-1-5 / P2 | Live hashed JS returns `Cache-Control: public, max-age=31536000, immutable`. |
| F-1-6 | `/demo/` is distinct and `/not-a-route` returns the designed 404 with HTTP 404. |
| F-1-7 | Canonical, OG/Twitter metadata, favicon, Apple icon, and original share art are present. |
| F-1-8 | Shared linked masthead/footer, Privacy, Terms, source, Param Factory, and build ID appear on public routes. |
| F-1-9 | The user-facing date term is consistently `forecast date`. |
| F-1-10 | Data, source, and export controls name their results. |
| F-2-1 through F-2-4 | Filters, five-job heading, README demo wording, and README deploy wording remain fixed. |

## Structure, access, and identity

`/`, `/demo/`, `/privacy/`, `/terms/`, `/404/`, and an unknown URL were checked live. Public pages have one h1 and main landmark, `lang=en`, route-specific title/description/canonical/OG/Twitter/icon metadata, a header/footer, Privacy/Terms links, and no console errors. `/not-a-route` correctly returns 404; its expected failed-resource console entry is the browser response to that 404, not an application error.

Privacy navigation, browser back, and forward focus the destination h1 and update the polite route announcement. Every discovered HTTP link returned 200 (with expected `mailto:` links skipped). Live axe scans at 390px returned no serious or critical violation on home, demo, privacy, terms, or 404. The warm-paper, ruled broadsheet, editorial type, signal-red moved dates, original still-life art, and job-sheet 404 match the documented visual thesis and are not a generic SaaS template.

## Missed leverage

No extra AI step is warranted: finish-to-start date calculation and client-message assembly are deterministic, need to work offline, and would not be improved by a model or a key. JSON import/restore and JSON/CSV export cover the obvious transfer path; sync would contradict the local-only product scope. Repository and live-request checks found no runtime AI feature, provider key, or external AI endpoint.

## What would make this perfect

Keep the existing claim tests, storage separation, and route/accessibility checks in the release path. The current product has no unaddressed first-read, functional, claim, privacy, routing, copy, or visual-system gap from this review.
