# Build handoff — Actuals Job Sequencer

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
