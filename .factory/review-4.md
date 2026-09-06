# Move forecast dates after actual finishes — independent review 4

**Reviewed:** 6 September 2026 UTC

**Live URL:** <https://actuals-job-sequencer.sociobot.in>

**Implementation candidate:** `1b06d2a503537e9466e826da94b189119fcbaa83`

**Documentation candidate:** `f6b3449d0a33a2185e77c26660309de75cb36035`

**Verdict:** **FAIL**

**Findings:** 4 — 3 blocking, 1 minor

**Untested or incompletely tested public claims:** 2

## Verdict

**FAIL.** The main scheduling flow works, but JSON import can save data that prevents the app from loading, JSON import can create six active jobs despite the five-job limit, and CSV export silently omits jobs that have no steps. The last two defects leave two public claims incompletely tested. Several navigation links also miss the required 44 by 44 CSS pixel touch target.

A successful command exit is not a product pass. All registered claim commands exit successfully, but two tests do not exercise the boundaries that make their public statements false.

## First screen before scrolling

I opened `/` in new Chromium contexts at 390 by 844 and 1440 by 900. Both started at scroll position zero with no stored data.

| Question | Answer visible before scrolling |
| --- | --- |
| Job | Move later forecast dates after an ordered step actually finishes late. |
| Audience | Small trade crews that already gave forecast dates to a client. |
| First action | Select `Try it with sample data` to see a late rough-in move the handover date. |

The phone positions were: headline 147–227 px, audience sentence 241–321 px, and sample action 343–387 px. Desktop positions were 142–291 px, 309–361 px, and 383–427 px. Both pages had zero horizontal overflow and no console or page error.

## Findings

### F-4-1 — BLOCKING — An incomplete JSON file is saved and prevents later loads

**Live evidence:** In a new browser context, I imported a version-1 JSON file containing two otherwise ordinary jobs but no `updatedAt` field. The app accepted the file and saved it. Reloading then raised `Cannot read properties of undefined (reading 'localeCompare')` and left the page at `Loading your job sheet…`. The only practical recovery is to clear site data outside the app.

**Source evidence:** `validateData` at `src/main.ts:293` does not validate `createdAt`, `updatedAt`, history entry fields, unique IDs, the selected job, or a valid timezone. The accepted records later reach `jobList` at `src/main.ts:128`, which calls `b.updatedAt.localeCompare(...)` without a guard. Import persists the data before rendering at `src/main.ts:290`.

**Why this blocks:** Import is the documented restore path. A file the app calls valid can persistently stop the product from opening, so invalid-input and recovery requirements are not met.

**Required correction:** Validate the complete backup schema before confirmation or persistence. Reject missing or invalid timestamps and history fields, duplicate IDs, a missing selected job, and invalid settings. Add a browser test that imports the incomplete two-job fixture, confirms an announced error, reloads, and confirms the prior jobs still open.

**Evidence:** `.factory/evidence/review-4/invalid-import-crash-two-jobs.json`.

### F-4-2 — BLOCKING — JSON import bypasses the five-active-job limit

**Live evidence:** A new browser context accepted a JSON file with six valid active jobs. The rail displayed `6/5`, all six jobs were available, and the import reported success.

**Source and test evidence:** The limit is checked when adding or restoring a job, but `validateData` does not count active imported jobs. The `@claim:five-job-limit` test creates five jobs through the form and checks that a sixth form action is rejected. It never imports a sixth active job.

**Why this blocks:** The landing page says `Five active jobs. No account.` The feature section says `Track up to five active jobs`, and the registered claim says the app tracks up to five. The live product permits more than five through its documented import path, so the quantitative claim is false and incompletely tested.

**Required correction:** Reject an import with more than five active jobs, without replacing existing data. Extend `@claim:five-job-limit` to exercise that import boundary and reload the unchanged prior state.

**Evidence:** `.factory/evidence/review-4/boundary-claims.json` and `.factory/evidence/review-4/six-active-import.png`.

### F-4-3 — BLOCKING — CSV omits jobs with no steps and can omit all calendar settings

**Live evidence:** In a new browser context, I created `Boundary job without steps` and immediately selected `Export CSV`. The downloaded file contained only the header. It contained no job row, timezone, working days, or non-working dates.

**Source and test evidence:** `exportCsv` at `src/main.ts:286` creates rows only by mapping scheduled steps. A job with no steps creates no row. The README says `Exports every job and calendar setting as JSON or CSV.` The settings dialog says both formats include calendar settings. The registered CSV claim promises timezone, workdays, and non-working dates. The `@claim:csv-export` test covers only the three-step sample. More importantly, `@claim:five-job-limit` creates five zero-step jobs, exports CSV, and checks only the filename at `tests/e2e/app.spec.ts:226-229`; it never checks that any of those jobs or settings are present.

**Why this blocks:** A new user can export a file that appears successful but contains none of the jobs they created. The public export statement is false for a normal empty-step state, and its tests miss the failure.

**Required correction:** Include one CSV row for every job, even before its first step, or narrow the public statement and provide another complete job export. Assert zero-step and mixed-step jobs plus calendar values in the claim test.

**Evidence:** `.factory/evidence/review-4/boundary-claims.json`.

### F-4-4 — MINOR — Header and footer links are smaller than 44 by 44 pixels

**Live evidence at 390 px:** Header links measured `Demo` 33.3 by 44, `Privacy` 42.7 by 44, and `Terms` 35.1 by 44 CSS pixels. Footer links measured `Privacy` 42 by 19.2, `Terms` 34.8 by 19.2, and the source link 152.7 by 19.2. These results repeat on home, demo, legal, and 404 pages.

**Why this matters:** The supplied accessibility and site-structure contracts require touch targets of at least 44 by 44 CSS pixels. These are separate navigation controls, not text inside one prose sentence.

**Required correction:** Give each header and footer navigation link a minimum 44 by 44 hit area while keeping the visible spacing and focus style.

## Sample and real-data separation

The one-click sample path passes.

- `Try it with sample data` changes the URL to `/demo/` and title to `Demo — Actuals Job Sequencer`.
- The persistent banner says `Demo — sample data, nothing is saved` and provides `Reset demo` and `Start for real`.
- The populated Mercer kitchen job shows Rina Mercer, two actual finishes, a moved `Fit and handover` step, and a ready client update. The sample moves its start from 11 September to 16 September and its finish to 17 September 2026.
- Editing the sample name and selecting `Reset demo` restores `Mercer kitchen fit` while keeping the banner.
- A real `Real boiler service` job created in the same fresh context is absent in demo mode and returns unchanged after `Start for real`. The demo database is removed on exit.
- A direct clean `/demo/` visit creates only `demo:actuals-job-sequencer`. Request logging during the flow found no off-origin request.

No real user data was opened or changed. All real-mode checks used new, disposable browser contexts.

## Claim commands

I cloned commit `f6b3449` to `/tmp/actuals-review4-clean.UJPwhc`, ran `npm ci`, and then ran every command exactly as listed in `.factory/claims.json`.

| Claim | Command exit | Coverage result |
| --- | --- | --- |
| `demo-isolation` | PASS | Complete for entry, reset, exit, and real/demo separation. |
| `dependency-reflow` | PASS | Complete for the seeded move, impossible actual order, reload, and the tested invalid import. |
| `client-update` | PASS | Complete for the sample dates and clipboard result. |
| `csv-export` | PASS | **Incomplete and false at the zero-step boundary; F-4-3.** |
| `json-backup` | PASS | Complete for a valid generated sample backup; import validation still fails F-4-1. |
| `local-only` | PASS | Complete for same-origin requests, resources, and no location call. |
| `offline-reload` | PASS | Complete for controlled offline demo reload. |
| `five-job-limit` | PASS | **Incomplete and false through JSON import; F-4-2.** |
| `archive-restore` | PASS | Complete for slot release, restore, and retained step. |

There are **2** incompletely tested public claims: `csv-export` and `five-job-limit`. No listed command is unexecuted.

## Earlier finding disposition

I read `.factory/verification.md`, both polish reports, reviews 1–3, and their prior handoffs. Review 3's PASS is superseded by the new boundary evidence above.

| Earlier finding | Current disposition and fresh evidence |
| --- | --- |
| P1 / F-1-4: impossible actual order | Fixed. Unit and claim tests reject an actual before its predecessor, and live files match that build. |
| P2 / F-1-5: short cache life for hashed assets | Fixed. Live JS, CSS, and the WebP return `public, max-age=31536000, immutable`. |
| F-1-1: no isolated sample | Fixed. One-click and direct demo entry, banner, reset, exit, and separate IndexedDB all work live. |
| F-1-2: claims missing or incomplete | **Reopened.** The registry exists and every command passes, but F-4-2 and F-4-3 prove two incomplete public claims. |
| F-1-3: first screen unclear | Fixed. Job, audience, first action, result, and three facts are visible before scrolling on phone and desktop. |
| F-1-6: demo and 404 routes missing | Fixed. Demo is distinct. An unknown URL returns the designed page with deliberate HTTP 404 and a return-home action. |
| F-1-7: metadata missing | Fixed. Titles, descriptions, canonicals, Open Graph, Twitter card, icons, and share image are present. |
| F-1-8: shared header/footer missing | Fixed. All public routes use the linked wordmark, navigation, legal links, source link, factory credit, and build ID. |
| F-1-9: inconsistent date terms | Fixed. User-facing scheduling copy uses `forecast date` and `actual finish`. |
| F-1-10: vague action labels | Fixed. Settings, exports, import, and source controls name their result. |
| F-2-1: unclear filters | Fixed. Buttons say `Show active jobs` and `Show archived jobs` and expose pressed state. |
| F-2-2: vague five-job heading | Copy fixed. The heading is clear, but the limit itself now fails through import under F-4-2. |
| F-2-3: demo storage jargon | Fixed. README explains that sample changes stay separate from the user's jobs. |
| F-2-4: unclear deploy wording | Fixed. README states the observable one-year cache, browser rules, and 404 result. |

## Other checks

| Area | Result |
| --- | --- |
| Normal schedule | PASS. The realistic sample recalculates around a non-working date and writes all changed dates into the client update. |
| Form boundaries | PASS for step duration 120; 121 is rejected. Empty working days, an invalid timezone, and `2026-02-30` are announced and can be corrected. |
| Import and recovery | **FAIL.** Malformed JSON text is rejected without replacing the job, but a schema-incomplete JSON object is accepted and can prevent reload; F-4-1. |
| Five-job boundary | **FAIL.** Form entry and restore enforce five, but import accepts six; F-4-2. |
| Export boundary | **FAIL.** Zero-step jobs disappear from CSV; F-4-3. |
| Phone and desktop | PASS aside from F-4-4. No overflow at 390 px, at desktop, or at 200% text zoom. |
| Keyboard and focus | PASS. The skip link is first, moves focus to main, dialogs focus the first field and return focus, and route history focuses the new h1. Focus uses a visible 3 px signal outline. |
| Reduced motion | PASS. Computed animation and transition duration is 0.01 ms under the reduce preference. |
| Automated accessibility | PASS with the noted manual target-size finding. Default Axe 4.10.3 and 4.13.0 scans report zero violations on home, demo, privacy, terms, and 404. An opt-in experimental label-content rule flags the visible `A→` brand mark because it is intentionally hidden from the accessible name; the full visible product-name text remains in the link name, so this decorative-mark result is not classified as a defect. |
| Privacy | PASS. Live requests stayed on the product origin. No analytics, remote scripts, remote fonts, location call, runtime model call, or payment path was found. |
| Legal and privacy requests | PASS. `/privacy/` and `/terms/` have route titles, one h1, one main, shared navigation, and working privacy/support mail links. |
| Links and 404 | PASS. Same-origin links return 200. The source link returns 200. The tested unknown URL deliberately returns HTTP 404 with the designed recovery page. |
| Offline and update | PASS. After service-worker control, offline reload preserves the demo and shows `Offline · changes save here`. A simulated worker revision activates the v3 caches and exposes the reload action. |
| PWA metadata | PASS. The manifest has standalone display, versioned start URL, 192/512/maskable icons, and matching theme colors. |
| Performance | PASS. Live mobile Lighthouse is 100 performance, 100 accessibility, 100 best practices, and 100 SEO; FCP 1.0 s, LCP 1.6 s, CLS 0, TBT 0 ms. Main JS is 36.19 KB raw / 11.74 KB gzip; CSS is 16.83 KB raw / 4.43 KB gzip; no font payload. |
| Backend checks | Not applicable. This is a static local-first PWA with no product backend, tenant, server database, health endpoint, or request-rate contract. |
| Missed leverage | No finding. Deterministic date sequencing should remain offline. JSON import and JSON/CSV export are the expected transfer paths, although their defects above must be corrected. |

## Clean checkout commands

All documented commands completed from the clean clone after `npm ci`:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 11/11 Vitest tests. |
| `npm run build` | PASS — `dist/index.html` produced. |
| `npm run check` | PASS — TypeScript, unit tests, and build. |
| `npm run test:e2e` | PASS — 12/12 Playwright tests. |
| Nine exact claim commands | PASS by process exit; two have incomplete assertions as recorded above. |

## Live candidate comparison

The implementation last changed in `1b06d2a503537e9466e826da94b189119fcbaa83`. Commits `b6a20f1` and `f6b3449` change only documentation and review evidence. I built the clean documentation candidate and compared SHA-256 hashes for every served file in `dist/`, excluding the deployment configuration file that is not public. Every local file matched the live response. There is no indication that a later report-only commit needs a new product image.

## Evidence notes

Current evidence is under `.factory/evidence/review-4/`. The key files are `boundary-claims.json`, `invalid-import-crash-two-jobs.json`, `live-supplement.json`, `update-history.json`, the phone/desktop screenshots, the 200% text screenshot, both axe result files, and `lighthouse-live.json`.

`live-audit.json` is a preliminary combined probe. Its demo-isolation, validation-recovery, and 404 return-link booleans were read before asynchronous route rendering completed. `live-supplement.json` and the dedicated reruns supersede only those race-affected booleans. The screenshots, route metadata, request log, reduced-motion result, link results, and other values in the combined probe remain consistent with the dedicated checks.

## Final result

**VERDICT: FAIL — 4 findings, including 3 blocking findings, and 2 incompletely tested public claims.**
