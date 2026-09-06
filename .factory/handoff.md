# Repair 1 handoff — Actuals Job Sequencer

## Outcome

All four findings from independent review 4 are fixed and deployed at <https://actuals-job-sequencer.sociobot.in>.

- Implementation SHA: `23696805729fdee6f57b7e1d8ab73618209c24c5`.
- Version: `1.2.1`; service-worker cache: `actuals-v4`.
- Deployment: existing `sf-actuals-job-sequencer` Azure Static Web App, production slot, one static deployment.
- Local `dist/` and every public live file have matching SHA-256 hashes. `staticwebapp.config.json` is deployment configuration and is not a public file.

## Changes

### Safe JSON restore

The import boundary now validates the complete version-1 backup before confirmation or persistence. It checks timestamps, history entries, unique IDs, selected-job references, timezone, calendar values, job and step fields, actual-finish order, and the five-active-job limit. An invalid import announces the specific problem and leaves the current jobs unchanged. A corrupt legacy IndexedDB record no longer holds the app on its loading screen; the app opens an empty recovery state and leaves the stored record untouched.

### Complete CSV rows

CSV export now writes one row for every job. A job without steps gets blank step and forecast cells while retaining its job identity, status, timezone, working days, and non-working dates. The claim test covers a mixed export and a five-job, zero-step export.

### Accessible navigation

Every header and footer navigation link now measures at least 44 by 44 CSS pixels. The phone header wraps when text is enlarged, so 200% text has no horizontal overflow or hidden headline/action.

## Review finding disposition

| Finding | Current evidence |
| --- | --- |
| F-4-1 incomplete JSON can break later loads | Fixed. Browser import rejects a two-job file missing `updatedAt`, retains the sample through reload, and a separate corrupt-storage recovery flow reaches the app instead of the loading screen. Unit validation covers timestamps, history, IDs, selection, timezone, and calendar fields. |
| F-4-2 import bypasses five-job limit | Fixed. `@claim:five-job-limit` rejects a valid six-active-job backup, retains and reloads the five existing jobs, and still rejects a sixth form-created job. |
| F-4-3 CSV drops jobs without steps | Fixed. `@claim:csv-export` checks the exact three sample step rows plus a zero-step job row and all calendar values. The five-job claim separately checks all five zero-step rows. |
| F-4-4 navigation targets below 44×44 | Fixed. The route/accessibility test measures every header/footer link on all five routes; the live phone and desktop audit reports no target below 44×44. |
| P1 / F-1-4 impossible actual order | Remains fixed. Unit and `@claim:dependency-reflow` checks reject UI and imported contradictions and retain the prior state after reload. |
| P2 / F-1-5 short hashed-asset caching | Remains fixed. Live JS and CSS return `Cache-Control: public, max-age=31536000, immutable`. |
| F-1-1, F-1-3, F-1-6 through F-1-10 | Remain fixed. The isolated sample, first screen, routes, metadata, shared navigation, terminology, and result-naming actions pass the full browser suite and live audit. |
| F-2-1 through F-2-4 | Remain fixed. Filter verbs, five-job copy, demo wording, and deployment wording are unchanged and verified. |

## Clean verification

Final clean checkout: `/tmp/actuals-repair-final.6XEOKm/repo`, cloned from implementation `2369680`.

- `npm ci`: 58 packages, 0 vulnerabilities.
- All nine commands in `.factory/claims.json`: passed individually from the clean checkout.
- `npm test`: 15/15 tests passed.
- `npm run build`: passed; `dist/index.html` produced.
- `npm run check`: passed.
- `npm run test:e2e`: 14/14 Chromium tests passed.
- Main JS: 39.13 KB raw / 12.54 KB gzip.
- CSS: 16.97 KB raw / 4.46 KB gzip.
- No font payload; largest image remains below the 300 KB mobile budget.

## Live verification

- Cold 390×844 and 1440×900 contexts show the job, small-trade-crew audience, and `Try it with sample data` before scrolling. Neither viewport overflows.
- The sample shows the moved 16–17 September handover and complete client update. Reset restores `Mercer kitchen fit`; Start for real restores the untouched real job.
- Live boundary probes reject incomplete and six-active-job imports and include a zero-step job plus calendar values in CSV.
- Offline reload restores the sample and shows the offline state. Cache Storage contains `actuals-v4-shell` and `actuals-v4-runtime`.
- Reduced motion computes to 0.01 ms. At 200% text, the headline and sample action remain visible with no overflow.
- Privacy and Terms have correct titles, one h1, and one main. An unknown route deliberately returns HTTP 404 with the designed recovery page.
- The URL verifier reports no console errors, one h1, a main landmark, no missing alt text, and no unlabeled button.
- axe-core 4.10.3 reports 0 violations on home, demo, privacy, terms, and 404.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, TBT 0 ms. Lighthouse wrote a complete report before Chromium emitted a teardown crash; the report is retained.
- Live requests during the complete sample and boundary flow stayed on the product origin. No analytics, remote script, location, AI, or payment request occurred.

Evidence is in `.factory/evidence/repair-1/live/`, especially `live-check.json`, `verify.json`, screenshots, and `lighthouse.json`.

## Run

```sh
npm ci
npm test
npm run build
npm run check
npm run test:e2e
```

## Known gaps and next steps

No product gap remains from the current or earlier review findings. This is a static local-first PWA, so backend tenant, restart, health, SQLite, and 429 checks do not apply. There is no advertised paid offer or checkout in this release, so no billing-offer metadata was created. The next step is an independent final review of the deployed implementation.
