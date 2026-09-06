# Move forecast dates after actual finishes — review 5

**VERDICT: PASS — 0 findings and 0 untested claims.**

- Reviewed: 6 September 2026 UTC
- Live URL: <https://actuals-job-sequencer.sociobot.in>
- Implementation reviewed: `23696805729fdee6f57b7e1d8ab73618209c24c5`
- Documentation reviewed: `043d5a8d4401785f66bd4a51f55fea794ec52fe0`

## Job, audience, and first action

Fresh Chromium contexts opened the live home page at 390×844 and 1440×900 without scrolling. Both showed the job, `Move forecast dates after actual finishes`; the audience, `For small trade crews when a late step changes the forecast dates you gave a client.`; and the first action, `Try it with sample data`. The result beside it says that a late rough-in moves the handover date. The three visible facts were offline after the first visit, jobs stay in this browser, and five active jobs need no account. Both first views had no horizontal overflow.

## Demo and real data

I created `Review real job` in a fresh real-data browser namespace, then entered the demo. The persistent `Demo — sample data, nothing is saved` label appeared with working Reset demo and Start for real controls. The realistic Mercer kitchen sample showed its late rough-in moving Fit and handover from 11–14 September to 16–17 September 2026. Its client update named Rina Mercer, the changed step, the changed dates, and the current forecast finish of Thursday, 17 September 2026.

After changing the sample name, Reset demo restored `Mercer kitchen fit`. Start for real removed the sample and returned to the unchanged `Review real job`. The live flow made no off-origin requests. This verifies the separate demo namespace and that sample work did not read or change the real job.

## Claims and clean checkout

From a new clone at the implementation commit, after the documented `npm ci`, every declared command passed. Each registry claim has exactly one matching browser test and was run separately.

| Claim | Result |
| --- | --- |
| `demo-isolation` | PASS — entry, populated sample, reset, exit, and unchanged real job. |
| `dependency-reflow` | PASS — moved handover, non-working date, impossible actual order rejection, reload, and invalid import rejection. |
| `client-update` | PASS — client, moved step, moved dates, final date, and copy result. |
| `csv-export` | PASS — every step, zero-step job, forecast, actual finish, timezone, workdays, and non-working date. |
| `json-backup` | PASS — complete job and calendar settings restored from JSON. |
| `local-only` | PASS — no off-origin request or location use during the sample flow. |
| `offline-reload` | PASS — service-worker-controlled sample reloaded offline. |
| `five-job-limit` | PASS — five real jobs exported; form and import reject a sixth without replacement. |
| `archive-restore` | PASS — archiving frees a slot and restoring retains its step. |

| Command | Result |
| --- | --- |
| `npm test` | PASS — 15/15 tests. |
| `npm run build` | PASS — produced `dist/index.html`. |
| `npm run check` | PASS — TypeScript, unit tests, and production build. |
| `npm run test:e2e` | PASS — 14/14 browser tests. |
| Nine exact commands from `.factory/claims.json` | PASS — one clean-state browser test per command. |

The built JavaScript is 39.13 KB raw / 12.54 KB gzip. CSS is 16.97 KB raw / 4.46 KB gzip. The largest shipped image is below the 300 KB mobile budget. A byte comparison found that all 21 public build files match the live release; deployment-only `staticwebapp.config.json` was correctly excluded. The later `043d5a8` commit is documentation and evidence only, so `2369680` remains the live implementation candidate.

## User paths and recovery

The normal Mercer sample moved the downstream forecast around its non-working date and wrote the changed forecast into the client update. The clean browser suite also exercised malformed JSON, schema-incomplete JSON, corrupt saved data recovery, the 120-day duration boundary, empty workdays, invalid timezone, zero-step CSV export, five-job form and import boundaries, and archive/restore. All passed.

The live supplemental checks confirmed the skip link is first, moves focus to `main`, dialogs focus their first control and return focus to their trigger on Escape, and reduced-motion transition duration is `0.00001s`. At 200% text, the supplied browser suite found no overflow and retained the headline and demo action. The service worker produced `actuals-v4-shell` and `actuals-v4-runtime`; after service-worker control, the demo reloaded offline with `Offline · changes save here`. The manifest has standalone display, a versioned start URL, and 192px, 512px, and maskable icons.

## Accessibility, privacy, routes, and performance

`/opt/fleet/lib/verify-url.sh` passed on the live home page: title, `lang="en"`, one h1, main landmark, image alternatives, named buttons, and no console errors. Fresh live axe-core scans found zero violations on home, demo, privacy, terms, and the designed 404 page.

Home, demo, privacy, and terms each returned 200 with their own route title, one h1, and one main. An unknown URL returned HTTP 404 with the designed recovery page and return-home link. The physical `/404/` document deliberately returns 200 as a browsable recovery route; it is not an unknown URL and is not a defect. All observed product resources were same-origin. The privacy promise is supported by the passing request-interception claim test; there are no analytics, remote fonts or scripts, GPS, location use, model calls, payment calls, or product backend. Backend tenant, restart, health, and 429 checks do not apply to this static local-first PWA.

Live mobile Lighthouse wrote a valid report with Performance 100, Accessibility 100, Best Practices 100, and SEO 100; FCP 1.2 s, LCP 1.2 s, CLS 0, and TBT 0 ms. The Lighthouse wrapper reported a Chromium tab crash during teardown after writing that complete JSON report. The measurements are retained and the wrapper failure is environmental, not a failed product check.

## Earlier findings

| Earlier finding | Current disposition and proof |
| --- | --- |
| P1 / F-1-4: impossible actual order | Fixed. `dependency-reflow` rejects an earlier dependent actual and an invalid imported order without changing the saved schedule. |
| P2 / F-1-5: short immutable cache life | Fixed. Live hashed JavaScript returns `public, max-age=31536000, immutable`; `sw.js` returns `no-cache, no-store, must-revalidate`. |
| F-1-1: no isolated sample | Fixed. Fresh live demo entry, banner, reset, exit, and unchanged real job passed. |
| F-1-2: missing or incomplete claims | Fixed. All nine registered commands passed separately with observable outcomes. |
| F-1-3: first screen unclear | Fixed. Job, audience, action, result, and facts appeared before scrolling on both live viewports. |
| F-1-6: demo and 404 were not routes | Fixed. Demo has distinct title and data; unknown path returned deliberate 404 with recovery. |
| F-1-7: share and canonical metadata missing | Fixed. Route tests and live route checks found route-specific metadata and the product-owned share image. |
| F-1-8: shared navigation missing | Fixed. Public routes have the linked wordmark, navigation, legal links, source link, factory credit, and build ID. |
| F-1-9: date terminology inconsistent | Fixed. Current first screen, sample, client update, README, and copy audit consistently use `forecast date` and `actual finish`. |
| F-1-10: vague action labels | Fixed. Settings, import, exports, filters, and source controls name their results. |
| F-2-1: unclear filters | Fixed. `Show active jobs` and `Show archived jobs` are visible and expose pressed state. |
| F-2-2: vague five-job heading | Fixed. The current heading says `Track up to five active jobs`; the five-job claim proves the boundary. |
| F-2-3: demo storage jargon | Fixed. README says sample changes stay separate from jobs. |
| F-2-4: unclear deployment wording | Fixed. README states caching, browser rules, and 404 behavior in plain words. |
| F-4-1: incomplete import could break later load | Fixed. Clean suite rejects incomplete JSON and shows recovery for corrupt stored data. |
| F-4-2: import bypassed five-job limit | Fixed. The five-job claim rejects six imported active jobs without replacement. |
| F-4-3: CSV omitted zero-step jobs/settings | Fixed. The CSV claim asserts every row including a zero-step job and calendar settings. |
| F-4-4: navigation targets smaller than 44px | Fixed. The browser suite measures every header and footer navigation target at least 44×44 CSS px. |

## Result

**VERDICT: PASS — 0 findings and 0 untested claims.**
