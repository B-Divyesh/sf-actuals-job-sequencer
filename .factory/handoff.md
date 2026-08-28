# Polish 2 handoff — Actuals Job Sequencer

## Outcome

All findings from `review-1.md`, `review-2.md`, `polish-1.md`, and the earlier verification record are closed in repair commit `1b06d2a503537e9466e826da94b189119fcbaa83`. It is pushed to `main` and deployed as the configured static PWA to <https://actuals-job-sequencer.sociobot.in>.

This round completes the previously partial claim work: CSV export is asserted field-for-field, JSON backup restoration is compared after changing all job/calendar data, and archive/restore is now a registered, isolated claim with an end-to-end test. First-screen language is consistently `forecast dates`; filters and the five-job section name their results plainly; README demo and deploy copy use plain words. Service-worker/manifest versions were advanced for the release.

## Verification evidence

- Fresh local install: `npm ci && npm run check` passed at `/tmp/actuals-polish2-clean.ZTm0UC/repo` (TypeScript, 11 Vitest tests, and production build).
- Every claim command in `.factory/claims.json` passed from that clean clone: `demo-isolation`, `dependency-reflow`, `client-update`, `csv-export`, `json-backup`, `local-only`, `offline-reload`, `five-job-limit`, and `archive-restore`.
- Full clean-clone browser suite: `npm run test:e2e` passed, 12/12. It includes keyboard, 390px overflow, dialog focus return, privacy interception, controlled offline reload, route/focus behavior, and axe scans.
- Production build: `dist/` contains its root `index.html`; main JS is 36.19 KB raw / 11.74 KB gzip and CSS is 16.83 KB raw / 4.43 KB gzip.
- Local verifier: `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ .factory/evidence/polish-2/local-verify` passed with title, `lang=en`, one h1, main, no missing image alt, no unlabeled button, and zero console errors.
- Live verifier: `/opt/fleet/lib/verify-url.sh https://actuals-job-sequencer.sociobot.in/ .factory/evidence/polish-2/live-home` passed with the same semantic checks and zero console errors.
- Live Playwright axe scan passed with zero serious/critical violations and zero console errors on `/`, `/demo/`, `/privacy/`, `/terms/`, and `/not-a-route`.
- Cold live check confirmed the forecast-date title/h1/kicker, verb-named filters, concrete five-job heading, `?demo=1` banner/reset/exit/sample, 390px no-overflow, and the designed 404. Screenshots: `evidence/polish-2/live-home/mobile.png`, `evidence/polish-2/live-demo-mobile.png`, and `evidence/polish-2/live-not-found-mobile.png`.
- Live `/not-a-route` returns HTTP 404; the current hashed JS returns `Cache-Control: public, max-age=31536000, immutable`; canonical, OG, Twitter, and Apple-touch metadata are present.

The standalone `npx @axe-core/cli` runner could not start because this worker has no system Chrome binary. The equivalent pinned `@axe-core/playwright` scan passed locally and against all five live routes.

## Run and deploy

```sh
npm ci
npm run check
npm run test:e2e
```

Build output is `dist/`. Static deployment uses the work-order configuration: `npm ci && npm test && npm run build`, then `/opt/fleet/lib/deploy-static.sh actuals-job-sequencer dist`.

## Known gaps

None. The product remains local-first/offline and intentionally has no AI or payment path; those are out of scope for the researched job.
