# Build handoff — Actuals Job Sequencer

## Review 1 handoff — FAIL (2026-08-28 UTC)

An adversarial first-read review was completed without product-code changes. The committed report is [.factory/review-1.md](review-1.md).

- The live product has no required isolated sample-data demo; `/demo` and `/?demo=1` render the normal empty app.
- `.factory/claims.json` and all tagged claim tests are absent, despite many privacy, offline, scheduling, export, and price claims.
- The primary dependency calculation still accepts an actual finish before a completed prerequisite and writes an impossible downstream client forecast (earlier P1 reproduced live).
- Hashed live assets still use `Cache-Control: public, must-revalidate, max-age=30` (earlier P2 not fixed).
- The phone first viewport does not identify the job/audience or show a sample action; demo/404 routes and share/canonical metadata are incomplete.

Fresh-clone `npm ci`, `npm test` (10/10), `npm run build`, and `npm run test:e2e` (4/4) passed. A live service-worker offline reload and same-origin network-interception smoke check passed, but cannot validate unregistered claims or a missing demo sandbox. Next work must address every finding in `review-1.md`, then repeat the complete review on the deployed URL.

## Independent verification status — FAIL (2026-08-28 UTC)

Candidate `da6a3618e6bcee4e937dea03ef3d3a936f9128ba` was independently verified against <https://actuals-job-sequencer.sociobot.in>. **Do not release this candidate.** See [.factory/verification.md](verification.md) for complete commands and evidence.

- **P1:** The UI accepts an actual finish for a dependent step that predates a prior step's actual finish. It then generates a downstream/client forecast before that prerequisite completed. Repro: ordered one-day steps starting 2026-09-03; record step 1 actual 2026-09-09, then step 2 actual 2026-09-03; step 3/client message promises 2026-09-04. Reject or repair contradictory actuals before recalculation/message generation.
- **P2:** Live hashed assets use `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable caching required for this PWA. This is a deployment configuration follow-up.

All local quality gates, independent axe/mobile/keyboard/offline/update checks, bundle budget, and live byte parity otherwise passed. No product code was changed by the verifier.

## Shipped

- Production Vite + TypeScript offline PWA in `dist/`.
- Local-first IndexedDB job ledger with one useful free active job and five active jobs in the $29 one-time Crew edition.
- Ordered finish-to-start steps, 1–120 working-day estimates, job start dates, actual finish entry/removal, step reorder/edit/delete, job archive/restore, and named destructive confirmation.
- Deterministic downstream recalculation around selected workdays and holiday dates. Actual work may finish on a non-working date; the next step resumes on the next working day.
- Side-by-side original/current dates, `ACTUAL`/`MOVED` text states, a 50-entry visible job history, and client-ready changed-date copy/share text with an estimate disclaimer.
- JSON backup/import and CSV export. Both include timezone, working days, holidays, baselines, forecasts, and actuals; exports are never paywalled.
- Sociobot hosted checkout link, query-token capture, daily license verification cache tied to the exact token, offline cached unlock, revocation handling, and paste-to-restore UI. No product ID or payment provider is embedded.
- Install manifest with 192/512/maskable icons, versioned service-worker caches, shell precache, asset cache-first behavior, navigation fallback, `skipWaiting`, `clientsClaim`, and an update toast.
- First-class empty, loading, persistence-error, offline, archive, and no-change states; responsive 390px layout, keyboard skip path, native accessible dialogs, print treatment, and reduced-motion fallback.
- Static `/privacy/` and `/terms/` pages, MIT license, complete README, robots/sitemap, and no analytics, location tracking, CDN code, or remote fonts.
- Original generated newsprint still life and hand-authored app mark. Prompt, review, model, date, and licensing provenance are in `.factory/design.md` and `assets/src/`.

## Verification (2026-08-28 UTC)

```sh
npm run check
npm run test:e2e
npm run build
```

- TypeScript strict check: passed.
- Vitest: 10/10 scheduling and working-calendar assertions passed, including matching, late, early, sequential, holiday, weekend, and non-working-day actual cases.
- Playwright 1.58.2 / Chromium: 4/4 passed at 390×844. Covered end-to-end job creation and date reflow, IndexedDB persistence after reload, axe scans on empty/populated/legal pages, keyboard skip navigation, and an explicit `context.setOffline(true)` reload.
- Browser console: no errors on production load during Playwright/visual smoke tests.
- Production build: `dist/index.html` present; JS 33.56 KB raw (11.24 KB gzip), CSS 13.58 KB raw (3.71 KB gzip), fonts 0 KB, mobile hero 38.87 KB WebP, large hero 183.03 KB WebP.
- Lighthouse 12.8.2 mobile against the production preview: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0s, LCP 1.7s, CLS 0, TBT 0ms, Speed Index 1.0s.

## Deployment notes and known gaps

- The factory must register `actuals-job-sequencer` with the Sociobot billing engine and its return URL before paid checkout can complete. The client uses `https://api.sociobot.in` by default and supports `VITE_BILLING_BASE_URL` for staging. No live purchase was made in this build environment.
- Forecasts intentionally use date-only arithmetic. The chosen IANA timezone is preserved in exports and labels; there are no appointment times to shift across daylight-saving boundaries.
- Data is deliberately device-local. Users moving browsers or devices must export/import JSON and paste their license; v1 has no sync account.
- Generated source PNG is retained only for provenance. The deploy contains the reviewed, optimized WebP variants.

## Suggested next steps

1. Register the billing product and complete a test-mode checkout/return/revocation pass.
2. Pilot with one or two trade crews and compare their expected dates with the seeded calculator cases.
3. If pilots need it, add a printable one-page client schedule before considering any sync or multi-user scope.
