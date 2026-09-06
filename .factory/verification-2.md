# Move forecast dates after actual finishes — verification 2

**Verdict: PASS**

- Findings: **0**
- Untested claims: **0**
- Implementation reviewed: `23696805729fdee6f57b7e1d8ab73618209c24c5`
- Documentation reviewed: `bdb6e4b1a0ac502f431aacc2b8d16a4f2b67d175`
- Live URL: <https://actuals-job-sequencer.sociobot.in>
- Verified: 6 September 2026 UTC

The product completes the researched job for a small trade crew. A late actual finish moves later forecast dates around non-working days, and the app writes the changed dates in a client update. No finding remains at any severity.

## What the user sees first

I opened the live home page in fresh Chromium contexts at 390×844 and 1440×900 without scrolling.

- Job: `Move forecast dates after actual finishes`.
- Audience: small trade crews whose late step changes dates given to a client.
- First action: `Try it with sample data`.
- Result beside the action: a late rough-in moves the handover date.
- Three visible facts: offline after the first visit, jobs stay in this browser, and five active jobs need no account.

The headline, audience, and first action were inside both first viewports. Neither viewport overflowed. The page had one h1, one main landmark, `lang="en"`, and its plain route title.

## Sample data and real data

The one-click action opened `/demo/` and showed `Demo — sample data, nothing is saved` with `Reset demo` and `Start for real`.

The populated sample showed `Mercer kitchen fit` for Rina Mercer. Its two actual finishes moved `Fit and handover` from 11 September to 16–17 September 2026. The client update named the changed start and current finish of Thursday, 17 September 2026.

I changed the sample name, reset it, and saw the original sample return. I created a disposable real-mode job in the fresh browser context before entering the demo. `Start for real` returned to that unchanged job, with no sample job present. All work used new browser storage; no existing user data was opened or changed.

## Normal, invalid, boundary, and recovery checks

| Check | Result |
| --- | --- |
| Normal schedule and client update | PASS — the realistic sample moved the dependent handover around a non-working date and listed every changed forecast. |
| Impossible actual order | PASS — the claim test rejects a dependent actual before its predecessor, retains the prior schedule and client update, and remains valid after reload. |
| Malformed JSON | PASS — live import announced the parse error and retained the current job. |
| Incomplete JSON | PASS — live import rejected a missing `updatedAt`, said which job was invalid, retained the sample, and reloaded safely. |
| Corrupt stored record | PASS — live startup opened the recovery state instead of remaining on the loading screen. |
| Active-job limit | PASS — live import rejected six active jobs; the claim test retained five jobs through reload and also rejected a sixth form-created job. |
| CSV with no steps | PASS — live export included the zero-step job, timezone, workdays, and non-working date. The claim tests also assert all five zero-step rows. |
| Duration boundary | PASS — live entry accepted 120 working days and rejected 121. |
| Calendar validation | PASS — live entry rejected no selected workday and an invalid timezone. |
| Archive and restore | PASS — the claim test freed a slot, restored the job, and retained its step. |

## Public claims

I ran every command from `.factory/claims.json` separately after `npm ci` in a clean clone pinned to the implementation commit.

| Claim | Result | Observable proof |
| --- | --- | --- |
| `demo-isolation` | PASS | One-click entry, reset, exit, and unchanged real job. |
| `dependency-reflow` | PASS | Moved handover, non-working date, impossible-order rejection, reload, and invalid import. |
| `client-update` | PASS | Client, changed step, moved start, current finish, and clipboard result. |
| `csv-export` | PASS | Exact header, all sample steps, a zero-step job, forecast/actual fields, timezone, workdays, and non-working dates. |
| `json-backup` | PASS | Complete job and settings backup restored after both were changed. |
| `local-only` | PASS | Whole sample flow made no off-origin request, used no location call, and loaded no remote resource. |
| `offline-reload` | PASS | A service-worker-controlled demo reloaded offline with its saved schedule and offline state. |
| `five-job-limit` | PASS | Five jobs and complete exports worked; form and import both rejected a sixth active job without replacement. |
| `archive-restore` | PASS | Archived job freed a slot and restored with its step intact. |

Each registry entry has exactly one matching `@claim:<id>` browser test. Landing, settings, legal, and README statements map to these tests or are scope/disclaimer text. There are no missing, false, incomplete, or untested public claims.

## Earlier findings

I inspected `.factory/verification.md`, reviews 1–4, both polish reports, the repair handoff, source, tests, and live behavior.

| Earlier finding | Current proof |
| --- | --- |
| P1 / F-1-4: impossible actual order | Fixed. Unit and `dependency-reflow` tests reject it without changing saved state. Live files exactly match that implementation. |
| P2 / F-1-5: short cache life | Fixed. Live hashed JS and CSS return `public, max-age=31536000, immutable`; `sw.js` returns `no-cache, no-store, must-revalidate`. |
| F-1-1: no isolated sample | Fixed. One-click and direct demo entry, persistent label, reset, exit, and separate storage passed live. |
| F-1-2: claims missing or incomplete | Fixed. Nine registered commands passed separately, including the repaired zero-step CSV and six-job import boundaries. |
| F-1-3: unclear first screen | Fixed. Job, audience, action, result, and three facts appeared before scrolling on phone and desktop. |
| F-1-6: demo and 404 were not real routes | Fixed. Demo has its own title and state. An unknown URL returned the designed recovery page with deliberate HTTP 404. |
| F-1-7: metadata missing | Fixed. Descriptions, canonicals, Open Graph/Twitter data, share image, favicon, and Apple icon were present and linked files returned 200. |
| F-1-8: inconsistent navigation | Fixed. All public routes use the same linked wordmark, navigation, legal links, source link, factory credit, and build ID. |
| F-1-9: inconsistent date terms | Fixed. User copy consistently uses `forecast date` and `actual finish`; the copy audit has no flagged sentence. |
| F-1-10: vague actions | Fixed. Data, export, import, source, and filter controls name their result. |
| F-2-1: unclear filters | Fixed. `Show active jobs` and `Show archived jobs` expose their pressed state. |
| F-2-2: vague five-job heading | Fixed. The heading says `Track up to five active jobs`, and both entry paths enforce the limit. |
| F-2-3: demo storage jargon | Fixed. README explains separation in user terms. |
| F-2-4: unclear deployment wording | Fixed. README names the observable cache, browser rules, and 404 behavior. |
| F-4-1: unsafe JSON can break later loads | Fixed. Live incomplete import and corrupt-storage recovery both passed; unit validation covers the full record. |
| F-4-2: import bypasses five-job limit | Fixed. Live and claim checks rejected six active jobs without replacing five saved jobs. |
| F-4-3: CSV drops zero-step jobs | Fixed. Live and claim checks included zero-step rows and calendar settings. |
| F-4-4: navigation targets below 44×44 | Fixed. Every header and footer navigation target measured at least 44×44 CSS pixels on phone and desktop. |

Reviews 3 and the first repair record introduced no additional open finding.

## Accessibility, routes, privacy, and offline use

- Live axe-core found **0 violations** on home, demo, privacy, terms, and 404.
- The supplied URL verifier found no console errors, one h1, `lang="en"`, a main landmark, no missing image alternative, and no unnamed button.
- Tab reached the skip link first. Enter moved focus to main. Dialog focus moved to the first field and returned to the trigger on Escape.
- Live Privacy navigation moved focus to its h1 and announced its title. Browser Back restored home, focused its h1, and announced the home title.
- Reduced-motion transition duration computed to `0.00001s`.
- At 200% text size, the headline and sample action remained available with no horizontal overflow. The update notice clears after 12 seconds and provides `Reload app` while shown.
- All header and footer navigation targets were at least 44×44 CSS pixels.
- Privacy and Terms returned 200 with route-specific titles, one h1, one main, shared navigation, and working email links.
- Every crawled HTTP link returned 200. The unknown test route deliberately returned HTTP 404 with a designed page and `Return to your jobs`.
- All product requests during the complete live flow stayed on `actuals-job-sequencer.sociobot.in`. There was no analytics, remote script, remote font, location, model, billing, or other third-party request.
- Offline demo reload passed. Cache Storage contained `actuals-v4-shell` and `actuals-v4-runtime`. The manifest has standalone display, versioned start URL, 192/512/maskable icons, and matching colors.
- A deliberate 404 navigation produced Chromium's expected failed-resource console line. It is not a defect; there were no unexpected console or page errors.

This is a static local-first PWA. Backend tenant isolation, SQLite restart persistence, health, and 429/`Retry-After` checks do not apply. The current release does not advertise or take payment.

## Clean checkout and live candidate

Clean clone: `/tmp/actuals-verify2.hk8Sbo/repo` at `23696805729fdee6f57b7e1d8ab73618209c24c5`.

| Command or check | Result |
| --- | --- |
| `npm ci` | PASS — 58 packages, 0 vulnerabilities. |
| Nine exact claim commands | PASS — all run separately. |
| `npm test` | PASS — 15/15 unit tests. |
| `npm run build` | PASS — `dist/index.html` produced. |
| `npm run check` | PASS — TypeScript, unit tests, and build. |
| `npm run test:e2e` | PASS — 14/14 Chromium tests. |
| Public file comparison | PASS — 21/21 local build files matched live SHA-256 hashes; deployment configuration was correctly excluded. |
| Live mobile Lighthouse | PASS — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s, CLS 0, TBT 80 ms. |

Lighthouse wrote a complete valid report before Chromium crashed during CLI teardown. The recorded audit is complete; this environment-only wrapper exit does not change the passing measurements.

Main JavaScript is 39.13 KB raw / 12.54 KB gzip. CSS is 16.97 KB raw / 4.46 KB gzip. There is no font payload. The largest image is 183.03 KB. All stated budgets pass.

Commit `bdb6e4b` changes only documentation and evidence after implementation `2369680`. All 21 public files built from the implementation match live, so no later report-only commit required another product image.

## Evidence

Fresh evidence is under `.factory/evidence/verification-2/`:

- `live-audit.json` — first screens, sample, boundaries, routes, axe, requests, offline, and PWA checks.
- `lighthouse-live.json` — complete live mobile Lighthouse report.
- `verify-url/verify.json` — supplied URL verifier result.
- Phone, desktop, demo, 200% text, and designed 404 screenshots.

## Final result

**VERDICT: PASS — 0 findings and 0 untested claims.**
