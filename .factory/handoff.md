# Polish 1 handoff — Actuals Job Sequencer

## Outcome

All findings in `.factory/review-1.md` and the earlier P1/P2 findings in `.factory/verification.md` are resolved. The repaired static PWA is live at <https://actuals-job-sequencer.sociobot.in>.

The first screen now says the job and audience, gives one-click sample access, and lists three tested facts. `/demo/` and `/?demo=1` load a realistic late-rough-in sample in the separate `demo:actuals-job-sequencer` IndexedDB database. The persistent demo banner provides Reset demo and Start for real.

Actual finish order is validated in the scheduling core. The UI, imports, reordering, client updates, and exports cannot calculate from a later step that predates an earlier actual finish.

Physical `/demo/`, `/privacy/`, `/terms/`, and `/404/` documents now have route titles, descriptions, canonical links, Open Graph/Twitter metadata, and shared navigation. Unknown live URLs return the designed page with HTTP 404. History navigation focuses and announces the new h1.

The broadsheet visual identity remains intact. Mobile places the first-screen explanation before the working area and shows the populated sample immediately. Screenshots are in `.factory/evidence/` and `.factory/evidence/live/`.

## Honest monetization deviation

The previously advertised $29 checkout returned HTTP 404 because no billing product is registered, and this work environment has no authorized product-registration tool. Shipping that link would leave a dead action and an untrue claim. The paywall and purchase copy were removed, and the brief’s full five-active-job capacity is available without payment. This is the closest complete and honest version; payment can be added only after the factory registers a working Sociobot product.

## Clean-clone verification

Final implementation commit: `3d8b82e`. Fresh clone: `/tmp/actuals-polish-final-10249/repo`.

- `npm ci`: passed; 58 packages, 0 vulnerabilities.
- Every command in `.factory/claims.json`: passed individually, 8/8.
- `npm run check`: passed TypeScript, 11/11 Vitest assertions, and production build.
- `npm run test:e2e`: 10/10 passed with Playwright 1.58.2 Chromium.
- Browser coverage includes demo isolation/reset, actual-date rejection, invalid-import rejection, client copy, CSV/JSON round trips, five-job limit, privacy interception, offline reload, routing/focus, 390 px overflow, keyboard/dialog focus, and axe scans.
- Production output: JS 36.09 KB raw / 11.74 KB gzip; CSS 16.83 KB raw / 4.43 KB gzip; fonts 0 KB; mobile image 38.87 KB; largest image 183.03 KB.
- Local Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s. The report is `.factory/evidence/lighthouse-local.json`.

## Live verification

Deployment ID: `b4a95c90-a70c-44a1-8a66-81110d0817f9`.

- `/opt/fleet/lib/verify-url.sh`: HTTP 200, title and `lang` present, one h1, main landmark, zero missing alt text, zero unlabeled buttons, zero console errors. Evidence: `.factory/evidence/live/verify.json`.
- Cold 390×844 home: correct headline, audience, sample action, three facts, and zero horizontal overflow. Screenshot: `.factory/evidence/live/home-cold-mobile.png`.
- Cold direct demo: title `Demo — Actuals Job Sequencer`; required banner, sample job, moved handover, client update, and Reset demo all verified. Only `demo:actuals-job-sequencer` existed in the fresh demo context. Screenshot: `.factory/evidence/live/demo-query-mobile.png`.
- Live impossible-date regression: Rough-in on 3 September was rejected because Strip out finished on 8 September; history remained unchanged.
- Live privacy/offline: the complete sample flow made zero off-origin requests; a service-worker-controlled offline reload restored the sample and offline status.
- Live routing: `/not-a-route` returned HTTP 404 with the designed h1 and home link. Screenshot: `.factory/evidence/live/not-found-mobile.png`.
- Live headers: hashed JS, CSS, and the shipped `/assets/` image return `Cache-Control: public, max-age=31536000, immutable`. HTML stays revalidated. CSP, Permissions-Policy, Referrer-Policy, and `nosniff` are present.
- Live metadata assets, manifest, robots, sitemap, and every public route returned 200.
- `npx @axe-core/cli` on home, demo, privacy, and terms: 0 violations on all four pages.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, TBT 0 ms. Evidence: `.factory/evidence/live/lighthouse-live.json`. Lighthouse printed a Chromium shutdown warning after writing the complete report.

## Run and verify

```sh
npm ci
npm run check
npm run test:e2e
```

Run any single claim with the exact command in `.factory/claims.json`.

## Remaining work

None for the product scope or review findings. A future paid tier requires prior Sociobot billing registration and a new end-to-end checkout test; the current release neither takes payment nor links to a dead checkout.
