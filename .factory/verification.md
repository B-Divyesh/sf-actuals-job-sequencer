# Independent verification — FAIL

**Candidate:** `da6a3618e6bcee4e937dea03ef3d3a936f9128ba`  
**Live URL:** <https://actuals-job-sequencer.sociobot.in>  
**Verified:** 2026-08-28 UTC, clean checkout; Node `v22.23.2`, npm `10.9.8`, Chromium from Playwright `1.58.2`.

## Verdict

**FAIL.** The app permits actual finishes that contradict its ordered finish-to-start dependencies, then uses that impossible input to publish a client-facing forecast before a prerequisite actually finished. This breaks the primary job-to-be-done. A separate deployed-cache policy gap also misses the PWA performance contract.

## Release-blocking defects

### P1 — dependent actuals can create impossible and misleading promises

Reproduced entirely through the shipped UI at production-build preview:

1. Create a job starting `2026-09-03`; add ordered one-day steps `First`, `Second`, and `Third`.
2. Record `First` as actually finished on `2026-09-09`.
3. Record dependent `Second` as actually finished on `2026-09-03`.

The UI accepts the second date without warning. It shows `Second` as an actual finish on **Thu, Sep 3, 2026**, despite `First` actually finishing **Wed, Sep 9, 2026**. It then moves `Third` to **Fri, Sep 4, 2026** and drafts:

> Current estimated job finish: Fri, Sep 4, 2026.

That promise is five days before the prerequisite actual. The workflow must reject or explicitly repair dependent actual dates that precede a previous step's actual finish; it cannot calculate/send a finish-to-start forecast from an impossible sequence.

### P2 — deployed hashed assets are not long-lived immutable

The live deployment serves the hashed JS, CSS, and image assets with:

```text
cache-control: public, must-revalidate, max-age=30
```

For example, this applies to `/assets/main-BAqSnEbw.js`, `/assets/main-D0GoFd6N.css`, and `/assets/dependency-still-life-720.webp`. This does not meet the PWA performance requirement for long-lived immutable caching of hashed assets. The service worker does cache the shell, so offline reload works, but normal connected loads must revalidate these immutable assets every 30 seconds.

## Checks that passed

| Area | Fresh evidence |
| --- | --- |
| Clean install | `npm ci`: 58 packages installed; audit reported 0 vulnerabilities. |
| Static checks/build | `npm run check` passed: `tsc --noEmit`, Vitest 10/10, and Vite production build. `dist/index.html` exists. A separate exact `npm run build` also passed. |
| Repository browser suite | `npm run test:e2e` passed: 4/4 Chromium tests. |
| Normal/boundary workflow | Independent desktop run created a job, three ordered steps, a holiday, a late actual, and a concise changed-date message; persisted after reload. The 120-working-day upper bound is accepted. |
| Invalid input/recovery | Empty job, duration `0`, no working days, invalid holiday, and malformed JSON import each produced an error and allowed recovery without replacing data. |
| Mobile and keyboard | Independent 390×844 run had no horizontal overflow. Tab reached the skip link and Settings button, each with `3px solid` visible focus. Skip moved focus to `<main>`. |
| Accessibility | Independent axe scans on populated desktop and 390px mobile: **0 serious/critical** violations. Title, `lang`, one H1, main landmark, labels, legal pages, and reduced motion all verified. |
| Console/page errors | None during independent local normal/error/offline runs, responsive scans, simulated update, or live smoke test. |
| Privacy/outbound traffic | Initial live load made requests only to `https://actuals-job-sequencer.sociobot.in`; local normal flow made none off-origin. Static review found no analytics, remote fonts, GPS, or third-party scripts. The billing endpoint is only used after a license token is present. |
| Bundle budget | Production main JS: 33,557 bytes raw / 11,240 gzip; CSS: 13,577 raw / 3,710 gzip; no fonts. Both are within the 200 KB JS / 50 KB CSS budgets. Largest shipped image: 183,030 bytes. |
| Lighthouse | Mobile production-preview run: Performance 0.99, Accessibility 1.00, Best Practices 1.00, SEO 1.00; FCP 1.0s, LCP 1.7s, CLS 0, TBT 110ms. Lighthouse emitted a final Chromium target-crash warning while closing after writing its results; the recorded audit result is retained at `/tmp/actuals-lighthouse.json` in this verifier environment. |
| PWA/offline/update | On local production output, data persisted then offline reload showed `Offline · saving locally`. A simulated new `sw.js` revision activated `actuals-v2-shell` and displayed `Offline edition ready.` with no errors. Live deployment also registered a controlling worker and offline-reloaded successfully. |
| Live parity | SHA-256 comparison of every file under local `dist/` with its corresponding live URL found **no mismatches**. In particular live `main-BAqSnEbw.js`, `main-D0GoFd6N.css`, manifest, and service worker matched candidate output byte-for-byte. |

## Response-policy observations

Live responses have HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`. The manifest is served as `application/octet-stream`; Chromium parsed it without manifest errors. No CSP, Permissions-Policy, or frame-ancestors/X-Frame-Options header was observed; these are security-hardening follow-ups, not the basis for this FAIL.

## Commands run

```sh
npm ci
npm run check
npm run test:e2e
npm run build
CHROME_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  npx --yes lighthouse http://127.0.0.1:4173/ --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --screenEmulation.mobile --output=json --output-path=/tmp/actuals-lighthouse.json \
  --chrome-flags='--headless --no-sandbox'
```

No product code was modified during verification.
