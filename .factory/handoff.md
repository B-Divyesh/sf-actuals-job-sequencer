# Review 2 handoff — Actuals Job Sequencer

## Outcome

Adversarial first-read review 2 is complete. The verdict is **FAIL** with two reopened blocking findings and four minor copy findings. Product code was not modified.

The cold mobile and desktop first screens are clear, the one-click isolated demo works, all eight claim commands pass, the core impossible-date bug remains fixed, routing/metadata/accessibility checks pass, and the broadsheet identity is distinct. The blockers are claim completeness and the previously reported inconsistent date vocabulary.

Full evidence and concrete fixes are in `.factory/review-2.md`.

## Verification completed

- Fresh live Chromium at 390×844 and 1440×900 before scrolling.
- Live one-click demo, direct `/demo/`, `/?demo=1`, reset, storage namespace, and impossible-date checks.
- Fresh clone at base `a072d7be4df0588a6565461dbc1bc39749490c14`; all eight `.factory/claims.json` commands passed individually.
- `npm run check`: passed TypeScript, 11/11 unit tests, and production build.
- `npm run test:e2e`: 10/10 passed.
- Live network interception/offline reload, metadata, cache headers, link crawl, 404, back/forward focus, and axe scans completed.
- `/opt/fleet/lib/verify-url.sh` passed for the live home page with zero console errors.

## Findings left for the next worker

- `F-1-2` reopened: archive/restore is an unlisted live claim; CSV and JSON claim tests assert less than their registered wording.
- `F-1-9` reopened: the first screen still alternates among working, job, forecast, and bare dates.
- `F-2-1`: `Active` and `Archived` filter buttons do not name their result with verbs.
- `F-2-2`: `Five jobs, kept focused` is not a concrete out-of-context heading.
- `F-2-3`: README demo copy exposes storage jargon instead of stating that sample changes stay separate.
- `F-2-4`: README deploy copy stacks unexplained caching/routing jargon.

## How to verify after repair

```sh
npm ci
npm run check
npm run test:e2e
```

Also run every command in `.factory/claims.json` individually from a fresh clone, then repeat the live cold-first-screen, demo-isolation, network/offline, route/focus, link, and metadata checks described in `.factory/review-2.md`.
