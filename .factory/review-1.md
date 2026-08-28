# Adversarial first-read review 1 — Actuals Job Sequencer

**Reviewed:** 2026-08-28 UTC  
**Target:** `https://actuals-job-sequencer.sociobot.in`  
**Verdict:** **FAIL**

This is a clean-context review. I used Chromium at 390×844 and 1440×900 before scrolling, a fresh local clone for test commands, and a separate fresh live-browser context for storage/network checks. There were no earlier `review-*.md` or `polish-*.md` files. The only earlier review record is `.factory/verification.md` and the failure section of the prior handoff; its P1 and P2 are checked again below.

## First 30 seconds

On the 390px first viewport I saw `Actuals Job Sequencer`, `SAVED ON DEVICE`, `Job ledger`, an empty job list, `Add job`, `Export / import`, and a decorative image. The explanatory heading begins below the image and toast, outside that viewport. Desktop shows the explanatory copy lower on the page, but still has the product name rather than a job-oriented headline.

My best inference was “a place to add jobs,” but I could not answer **what it does** from `Actuals Job Sequencer`, could not identify **who it is for** anywhere on the first screen, and had no safe **first click** because the visible action was `Add job`, not a sample or an explained result. This is a blocking first-read failure.

## Findings

### F-1-1 — BLOCKING — There is no one-click, isolated, realistic demo

**Evidence / location:** The landing page offers `Add job` and `Start the first job`, not `Try it with sample data`. Fresh visits to both `/demo` and `/?demo=1` returned the ordinary empty application with `No active jobs.` and the ordinary title `Actuals Job Sequencer — move promises from actuals`. There is no `Demo — sample data, nothing is saved` banner, `Reset demo`, or `Start for real` action. `src/db.ts` uses only `actuals-job-sequencer` / `app` / `current`; it has no demo namespace. `rg` found no `demo:` implementation or documentation.

**Why this fails:** A visitor must create an empty job before seeing the result, and cannot verify that trying the product leaves their real data alone. The required demo entry point is indistinguishable from a catch-all production route.

**Concrete fix:** Add a first-screen button `Try it with sample data — see a late rough-in move the handover date`. Make `/demo` and `/?demo=1` seed an opinionated three-step trade job whose late actual immediately shows moved dates and the client note. Persist only below a separate `demo:` IndexedDB key/database, never read the real namespace in demo, and show the persistent banner `Demo — sample data, nothing is saved` with working `Reset demo` and `Start for real` controls. Add `.factory/demo.md` and browser tests for direct entry, seeded first screen, reset, and storage separation.

### F-1-2 — BLOCKING — Claims are neither registered nor tested

**Evidence / location:** `.factory/claims.json` does not exist. A repository search found no `@claim:` tag. Consequently there are zero listed claim commands to run from the clean clone, and no sandbox proof for any published claim. `npm test`, `npm run build`, and `npm run test:e2e` did pass in `/tmp/actuals-review-clean`, but none is a tagged claim test.

**Unlisted claim findings:** Every following customer-reliant statement needs its own `claims.json` entry and observable test, or must be removed.

| Location | Exact unlisted claim |
| --- | --- |
| Landing header | `SAVED ON DEVICE` |
| Landing explanation | `The sequencer skips non-working days and writes the client update.` |
| Landing footer | `Local-first.` |
| Landing footer | `No tracking or GPS.` |
| Landing toast | `Offline edition ready.` |
| README opening | `Actuals Job Sequencer is an offline job-date calculator for solo and two-person trade businesses.` |
| README opening | `Record when a step actually finished and every dependent forecast moves around the crew's working days and holidays.` |
| README opening | `The app then drafts a plain client update that says what changed.` |
| README “What it does” | All eight feature bullets, including offline reload, local IndexedDB storage, CSV/JSON export, and private import claims |
| README privacy | `Jobs never leave the browser.` |
| README privacy | `No analytics, GPS, third-party scripts, or remote fonts are used.` |
| README privacy | `A complete backup is available under Settings & data.` |
| README privacy | `Clearing site storage removes jobs and the local license token.` |
| README licence | `Crew edition is a $29 one-time license.` |
| README licence | `Checkout and verification use only the Sociobot billing API; no payment provider is embedded.` |

**Concrete fix:** Create the required registry and one clean-state test per claim, e.g. `@claim:offline-reload`, `@claim:local-only`, `@claim:dependency-reflow`, `@claim:client-update`, `@claim:csv-export`, `@claim:json-import`, and `@claim:demo-isolation`. The privacy test must intercept the entire demo flow and allow only the product origin. The dependency test must also reject impossible actual-date orderings. Remove or soften any statement that cannot be asserted.

### F-1-3 — BLOCKING — The first screen does not say the job or the audience

**Evidence / location:** The sole `<h1>` is `Actuals Job Sequencer`; the visible adjacent heading is `Job ledger`. Neither names an action, a trade business, an actual finish, or a date. The first user-facing explanation is `When one date moves, the promises after it should move too.`, and on phone it begins below the first viewport. No first-screen sentence says “solo,” “two-person,” “trade,” or equivalent.

**Why this fails:** A sceptical visitor cannot decide in five seconds whether this is a scheduling tool for their work, a general Gantt product, or an internal ledger. `Add job` asks for work before explaining the value.

**Concrete fix:** Make the sole landing h1 `Move job dates after actual finishes`. Directly beneath it use `For small trade crews when a late step changes the dates you promised.` Place `Try it with sample data` beside `Start your first job`, with a short next-result label. Put three short facts beside the actions: `Works offline after first visit.`, `Jobs stay in this browser.`, and the exact current price/free limit only when claim-tested.

### F-1-4 (earlier ID P1) — BLOCKING — Contradictory actual dates still create an impossible client promise

**Evidence / location:** The earlier independent record `.factory/verification.md` called this P1. I reproduced it on the live site: a one-day `First` step beginning 2026-09-03 was recorded as actually finished 2026-09-09; its dependent one-day `Second` step was then accepted as actually finished 2026-09-03. The live UI displayed `ACTUAL FINISH Thu, Sep 3, 2026` for Second and drafted `Current estimated job finish: Fri, Sep 4, 2026.` for Third, before First actually finished. In code, `src/main.ts:332` assigns `step.actualFinish = actual` without checking its predecessor, and `src/schedule.ts:55-67` uses that date as the next forecast cursor.

**Why this fails:** This is the central finish-to-start calculation. It permits the app to write a customer-facing date that is physically impossible under its own dependencies.

**Concrete fix:** Reject a dependent actual earlier than the previous actual finish (or require an explicit repair of the order) with a field error naming both steps and dates. Defensively validate imported data too. Add a regression test that attempts this exact sequence, asserts no persistence/change note/client message is produced, and is tagged for the dependency-reflow claim.

### F-1-5 (earlier ID P2) — BLOCKING — The deployed immutable assets are revalidated every 30 seconds

**Evidence / location:** The earlier handoff recorded P2. Live `HEAD` responses for `/assets/main-BAqSnEbw.js`, `/assets/main-D0GoFd6N.css`, and `/assets/dependency-still-life-720.webp` each return `cache-control: public, must-revalidate, max-age=30`.

**Why this fails:** These content-hashed PWA assets should be long-lived immutable resources. The deployed policy needlessly forces connected clients to revalidate on a 30-second cadence and leaves the previously recorded PWA delivery failure unresolved.

**Concrete fix:** Configure the deployment to serve hashed `/assets/*` with a long `max-age` and `immutable`; retain a short/revalidated policy for HTML and `sw.js`. Add a deployment/header check to release verification.

### F-1-6 — BLOCKING — `/demo` and an unknown URL are an unlabelled copy of home, not real routes

**Evidence / location:** `GET /demo` and `GET /not-a-route` both returned HTTP 200, the home title, and `<h1>Actuals Job Sequencer</h1>`. There is no 404 page or `staticwebapp.config.json`; `vite.config.ts` has no demo/404 input. `/demo` is not listed in `sitemap.xml`.

**Why this fails:** The advertised verification/demo address does not enter a demo, and a mistyped URL silently looks like a valid app page. Neither route has a route-specific title or a focus/announcement transition.

**Concrete fix:** Implement a real `/demo` as specified in F-1-1 with title `Demo — Actuals Job Sequencer`, add it to sitemap, and ship a designed `/404` that explains the missing page and links home. Configure static hosting so unknown paths return that page with HTTP 404 while genuine app routes deep-link and restore focus to their h1.

### F-1-7 — MINOR — Required share and canonical metadata is absent

**Evidence / location:** Live inspection of `/`, `/privacy/`, and `/terms/` found descriptions and favicons, but no canonical link, no Open Graph metadata, and no Twitter card metadata. `apple-touch-icon.png` and `og-image.png` both returned 404. The source confirms only the SVG favicon and manifest are linked.

**Why this matters:** Shared links have no controlled title/image/description, canonicalization is absent, and iOS has no declared touch icon.

**Concrete fix:** Add a canonical URL, route-specific OG/Twitter title and description, a product-owned 1200×630 editorial image, and an existing 180px apple-touch icon to every HTML route. Verify every referenced metadata URL returns 200.

### F-1-8 — MINOR — Header/footer navigation is inconsistent across routes

**Evidence / location:** The landing masthead `Actuals Job Sequencer` is not a home link and has no route navigation. Its footer says `Local-first. No tracking or GPS. Generated editorial image disclosed in the design record.` then Privacy/Terms/Source. Legal pages instead show unlinked `Actuals Job Sequencer · field notice` and only `← Return to the job sheet`; their footer has no Privacy/Terms pair, product one-liner, Param Factory attribution, or build/version identifier.

**Why this matters:** Visitors lose orientation when moving to legal pages and the skeleton required on every route is not present.

**Concrete fix:** Use one compact header everywhere: linked wordmark plus Demo, Privacy, and Terms. Use one footer everywhere with a plain product one-liner, Privacy, Terms, `Built by Param Factory`, and a build/version string.

### F-1-9 — MINOR — The copy mixes terms and uses opaque labels

**Evidence / location:** The interface alternates between `Job ledger`, `promises`, `forecast`, `actual finish`, `actuals`, and `sequencer`. The footer says `Local-first.` and `Generated editorial image disclosed in the design record.` The README uses specialist terms such as `finish-to-start`, `IndexedDB`, and `Gantt` in user-facing feature copy.

**Why this matters:** The visitor must translate several terms before understanding a simple date shift. `Local-first` and “design record” do not tell a trade user what happens to their data.

**Concrete fix:** Choose `forecast dates` and `actual finish` everywhere. Rename `Job ledger` to `Your jobs`; replace `Local-first.` with `Your jobs stay in this browser.`; delete the asset-provenance sentence from the product footer (keep provenance in the design record); rewrite the README feature as `Keeps steps in order so one finished step sets the next forecast date.`

### F-1-10 — MINOR — Several actions do not name their result

**Evidence / location:** Landing buttons include `Settings & data`, `Export / import`, and the external `Source`. `Export / import` combines opposite actions and actually opens settings rather than doing either named result; `Source` gives no indication that it opens GitHub.

**Why this matters:** The controls make a first-time visitor guess the next screen or destination.

**Concrete fix:** Use `Open data settings`, then distinct `Export JSON`, `Export CSV`, and `Import JSON` inside it. Rename the external link `View source code (GitHub)` and mark it as external.

## Copy audit

Word counts treat a hyphenated or code-style token as one word. This table lists every prose sentence in the fresh empty landing state (including the image alternative) and README narrative/bullets. Labels, headings, commands, and link-only lines are listed afterward as fragments rather than misrepresented as sentences.

### Landing

| Words | Sentence | Result |
| ---: | --- | --- |
| 3 | `No active jobs.` | Clear empty state. |
| 11 | `When one date moves, the promises after it should move too.` | Uses inconsistent `promises`; see F-1-9. |
| 14 | `Start a job, add its ordered steps and estimates, then record actual finish dates.` | Clear, but below the phone first viewport. |
| 10 | `The sequencer skips non-working days and writes the client update.` | `sequencer` is opaque and this is an unlisted claim. |
| 1 | `Local-first.` | Jargon/fragment; rewrite `Your jobs stay in this browser.` |
| 4 | `No tracking or GPS.` | Plain, but an unlisted claim. |
| 8 | `Generated editorial image disclosed in the design record.` | Irrelevant/jargon; delete from footer. |
| 3 | `Offline edition ready.` | Unlisted offline claim. |
| 17 | `Five blank job slips follow a folding rule across a paper calendar, like a chain of dependencies.` | Useful image alternative. |

### README

| Words | Sentence | Result |
| ---: | --- | --- |
| 14 | `Actuals Job Sequencer is an offline job-date calculator for solo and two-person trade businesses.` | Unlisted product/offline claim. |
| 18 | `Record when a step actually finished and every dependent forecast moves around the crew's working days and holidays.` | Unlisted functional claim. |
| 12 | `The app then drafts a plain client update that says what changed.` | Unlisted functional claim. |
| 16 | `Keeps ordered finish-to-start steps for up to five active jobs (Crew edition; one in free edition).` | Jargon and unlisted plan-limit claim; rewrite `Keeps steps in order; Crew allows five active jobs and free allows one.` |
| 14 | `Treats actual finish dates as the new source of truth for every unfinished step.` | Unlisted functional claim. |
| 7 | `Skips selected non-working weekdays and holiday dates.` | Unlisted functional claim. |
| 10 | `Shows original promises beside current forecasts, with visible change history.` | Inconsistent `promises`/`forecasts`; unlisted claim. |
| 8 | `Drafts a concise client message for moved dates.` | Unlisted functional claim. |
| 12 | `Stores job data locally in IndexedDB and works after an offline reload.` | `IndexedDB` jargon and unlisted privacy/offline claim; rewrite `Stores jobs in this browser and works offline after your first visit.` |
| 13 | `Exports a full JSON backup or spreadsheet-ready CSV with timezone and calendar settings.` | Unlisted export claim. |
| 12 | `Imports JSON backups without sending job or client data to a server.` | Unlisted privacy/import claim. |
| 14 | `This is intentionally not dispatch, GPS, payroll, route planning, or a general Gantt tool.` | `Gantt` jargon; rewrite `It does not plan routes, payroll, GPS, or whole-project charts.` |
| 7 | `Forecasts are user-entered estimates, not guaranteed appointments.` | Clear disclaimer. |
| 5 | `Requirements: Node.js 20+ and npm.` | Developer setup fragment; acceptable in run instructions. |
| 7 | `Open the local URL printed by Vite.` | Developer jargon; rewrite `Open the address shown in the terminal.` |
| 8 | `Production output is built with the work-order command:` | Developer jargon; rewrite `Build the deployable files with:` |
| 12 | `The static deploy artifact lands in dist/, with dist/index.html at its root.` | Developer detail; clear enough. |
| 8 | `Preview that exact artifact with npm run preview.` | Developer detail; clear enough. |
| 5 | `Playwright is pinned to 1.58.2.` | Developer detail; clear enough. |
| 19 | `The test runner uses the preinstalled Chromium when PLAYWRIGHT_BROWSERS_PATH is set; otherwise install it with npx playwright install chromium.` | Under 22 but dense developer jargon; split into two short setup lines. |
| 5 | `Jobs never leave the browser.` | Unlisted privacy claim. |
| 10 | `No analytics, GPS, third-party scripts, or remote fonts are used.` | Unlisted privacy claim. |
| 9 | `A complete backup is available under Settings & data.` | Unlisted export claim. |
| 10 | `Clearing site storage removes jobs and the local license token.` | Unlisted storage claim. |
| 7 | `Crew edition is a $29 one-time license.` | Unlisted price claim. |
| 14 | `Checkout and verification use only the Sociobot billing API; no payment provider is embedded.` | Unlisted billing/privacy claim; too implementation-oriented for product overview. |
| 9 | `Configure a non-production billing host, when needed, with VITE_BILLING_BASE_URL.` | Developer configuration detail; retain only in an advanced deployment section. |
| 8 | `The factory registers the product slug before release.` | Internal process; remove from public README. |
| 4 | `See Privacy and Terms.` | Clear link instruction. |
| 1 | `MIT.` | Fragment in the license section; use `This project is MIT licensed.` |
| 2 | `See LICENSE.` | Clear enough but can be combined with the previous line. |

No audited sentence exceeds 22 words. The audited landing headings/fragments are `Actuals Job Sequencer`, `Job ledger`, `SAVED ON DEVICE`, `Settings & data`, `Export / import`, and `Source`; the problematic ones are covered by F-1-3, F-1-9, and F-1-10. README headings (`What it does`, `Run locally`, `Verify`, `Data, privacy, and licenses`, `Product records`, `License`) make sense in context.

## Checks completed

| Check | Result / evidence |
| --- | --- |
| Live cold first read | Checked at 390×844 and 1440×900 before scrolling; failed as described above. |
| Demo and sandbox | Failed: no sample route, data, banner, reset, or namespace. |
| Earlier history | P1 reproduced live and confirmed in code. P2 rechecked from live asset headers. Neither is fixed. |
| Clean-clone quality commands | In `/tmp/actuals-review-clean`: `npm ci`, `npm test` (10/10), `npm run build`, and `npm run test:e2e` (4/4) passed. These do not replace required claim tests. |
| Offline and privacy exercise | In a fresh live context, service-worker-controlled reload after `context.setOffline(true)` rendered `OFFLINE · SAVING LOCALLY`. Intercepted initial/reload requests were only same-origin root, JS, CSS, and image URLs; no off-origin request occurred. This does not clear the unlisted claims finding because no demo flow or registry/test exists. |
| Link crawl | Landing internal Privacy/Terms links and the external GitHub source returned 200; legal `mailto:` links were explicit. `/robots.txt` and `/sitemap.xml` returned 200. `/favicon.ico`, apple touch icon, and an OG-image candidate returned 404; the latter two are metadata omissions, not navigable page links. |
| Structure and accessibility smoke | `lang`, one h1, main landmark, descriptions, SVG favicon, robots and sitemap are present. Privacy/Terms titles match their routes. Canonical/OG/Twitter/apple icon and designed 404 are absent; `/demo` and bad routes fall back to home. Existing clean-clone axe e2e tests passed. |
| Missed leverage / AI | The brief already calls for import/export, and both are present. A sync account is not implied by this local-first brief. An AI feature would be decorative here, so none is required; no provider key was found. |
| Visual identity | The warm-paper broadsheet treatment and original still-life are specific to the product and do not present as a generic SaaS template. No finding. |

## What would make this perfect

Ship the sample-data demo first, then make every published promise testable from that isolated entry point. Repair contradictory actual-date validation before any client text is generated. Replace the product-name-first opening with a trade-specific outcome and one clear sample action, make real demo/404 routes with complete metadata and shared navigation, standardize the vocabulary around forecast dates, and correct immutable asset caching at deployment. Re-run this entire review only when every listed finding has fresh live evidence of closure.
