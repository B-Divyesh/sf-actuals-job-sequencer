# Polish round 1 — finding closure

Target: <https://actuals-job-sequencer.sociobot.in>  
Implementation commits: `7ff5d01`, `3d8b82e`  
Final verification date: 28 August 2026 UTC

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Added one-click home action, physical `/demo/` and `?demo=1` entry, a seeded Mercer kitchen job, persistent banner, Reset demo, Start for real, and separate `demo:actuals-job-sequencer` storage. | `@claim:demo-isolation`; `.factory/evidence/demo-mobile.png`; `.factory/evidence/live/demo-query-mobile.png`; live cold database list contained only the demo namespace. |
| F-1-2 | Added `.factory/claims.json` with one uniquely tagged observable browser test for every retained claim. Removed unprovable and broken payment claims. | Eight claim commands passed individually from `/tmp/actuals-polish-final-10249/repo`; full browser suite passed 10/10. |
| F-1-3 | Replaced the product-name h1 with `Move job dates after actual finishes`, added the small-trade-crew sentence, two clear actions, a result hint, and three tested facts before the working area. | `@claim:demo-isolation`; `.factory/evidence/home-mobile.png`; `.factory/evidence/live/home-cold-mobile.png`; live 390 px check found zero overflow. |
| F-1-4 / P1 | Added core actual-order validation. Invalid dates are restored before persistence, named in a focused field error, rejected during import, and blocked during reorder. | Vitest `rejects an actual finish before an earlier dependency finished`; `@claim:dependency-reflow`; live Rough-in 3 Sep attempt rejected against Strip out 8 Sep with unchanged history. |
| F-1-5 / P2 | Added Static Web Apps route headers for long-lived immutable `/assets/*`; kept service worker and HTML revalidated. | Live JS `main-5hhtG1iZ.js`, CSS `main-mUGnW-zO.css`, and `dependency-still-life-720.webp` each returned `public, max-age=31536000, immutable`. |
| F-1-6 | Added physical demo and 404 documents, sitemap demo entry, route-specific runtime metadata, History API navigation, h1 focus/announcement, and SW offline fallbacks by route. | Browser test `routes set metadata, restore focus, and provide a designed not-found page`; live `/not-a-route` returned 404; `.factory/evidence/live/not-found-mobile.png`. |
| F-1-7 | Added canonical, Open Graph, Twitter, SVG/ICO favicon, 180 px Apple icon, and original-art 1200×630 share image metadata to every route. | Route browser test; live `og-image.webp`, `apple-touch-icon.png`, and `favicon.ico` returned 200; provenance updated in `.factory/design.md`. |
| F-1-8 | Added one shared linked wordmark/header and one shared footer with Demo, Privacy, Terms, source, Param Factory, and build ID on every route. | Browser routing/axe test; live privacy and terms navigation retained focus and showed `Built by Param Factory · v1.1.0`; all crawled links returned 200. |
| F-1-9 | Standardized user language on `forecast date`, `actual finish`, `job`, `step`, and `client update`; removed ledger/local-first/design-record jargon. | `.factory/copy-audit.md`; repository banned-term scan; live first-read copy screenshot. |
| F-1-10 | Replaced vague controls with `Open data settings`, `Export JSON`, `Export CSV`, `Import JSON`, and `View source code (GitHub)` plus new-tab text. | `@claim:csv-export`; `@claim:json-backup`; keyboard/axe browser test; GitHub target returned 200 live. |

## Additional release checks

- `npm run check`: passed.
- `npm run test:e2e`: passed 10/10.
- Live axe CLI: 0 violations on home, demo, privacy, and terms.
- Live Lighthouse: 100/100/100/100; LCP 1.2 s, CLS 0, TBT 0 ms.
- Live sample network interception: zero off-origin requests and zero console errors.
- Live offline reload: sample job and offline state restored.
- No unresolved blocking or minor review finding remains.
