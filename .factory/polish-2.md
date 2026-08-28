# Polish round 2 — finding closure

Target: <https://actuals-job-sequencer.sociobot.in>  
Repair commit: `1b06d2a503537e9466e826da94b189119fcbaa83`  
Verified: 28 August 2026 UTC

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the direct `/demo/` and `?demo=1` sample entry, separate demo storage, persistent safety banner, Reset demo, and Start for real path. | Clean-clone `@claim:demo-isolation`; [live demo mobile](evidence/polish-2/live-demo-mobile.png); cold live `?demo=1` check confirmed title, Mercer sample, banner, reset, and exit controls. |
| F-1-2 | Added `archive-restore` to the registry. CSV test now parses the exact header and every exported row/value. JSON test alters job fields and every calendar setting, imports, then compares restored persisted data with the exported fixture. | All nine clean-clone claim commands passed; `@claim:csv-export`, `@claim:json-backup`, and `@claim:archive-restore`. |
| F-1-3 | Retained the first-screen job, audience, sample action, result hint, and tested facts; changed its headline to the one consistent date term. | Browser test `first screen uses forecast-date language and clear job-list filter verbs`; [live home mobile](evidence/polish-2/live-home/mobile.png). |
| F-1-4 / P1 | Retained actual-finish ordering validation in entry, import, and reorder paths. | `@claim:dependency-reflow` rejects the impossible sequence and invalid import from a clean demo. |
| F-1-5 / P2 | Retained one-year immutable headers for hashed assets. | Live `main-BX2gFJab.js` returned `Cache-Control: public, max-age=31536000, immutable`. |
| F-1-6 | Retained physical demo and 404 pages, route metadata, focus handling, and real 404 behavior. | Clean-clone route test; live `/not-a-route` returned 404 with [designed mobile 404](evidence/polish-2/live-not-found-mobile.png). |
| F-1-7 | Retained canonical, Open Graph, Twitter, favicon, Apple touch icon, and original share art on all routes. | Live home has canonical, OG title, Twitter card, and touch-icon references; browser route test passed. |
| F-1-8 | Retained one linked masthead/nav and shared legal footer across routes. | Clean-clone route/keyboard test and live axe scan on all routes. |
| F-1-9 | Replaced `Working dates`, `job dates`, and title shorthand with `forecast dates`; updated sample, client-update, and supporting copy to use that term. | First-screen browser test, source scan, and [live home mobile](evidence/polish-2/live-home/mobile.png). |
| F-1-10 | Retained result-naming settings/export/source controls. | `@claim:csv-export`, `@claim:json-backup`, and keyboard/axe test passed. |
| F-2-1 | Renamed filters to `Show active jobs` and `Show archived jobs`; selected state remains `aria-pressed`. | First-screen browser test and cold live mobile check. |
| F-2-2 | Replaced `Five jobs, kept focused` with `Track up to five active jobs`; the follow-up now states the archive/restore condition plainly. | First-screen browser test; `@claim:archive-restore`. |
| F-2-3 | Rewrote README demo copy as “Try the sample without changing your jobs” and “Demo changes stay separate from your jobs.” | README review and `@claim:demo-isolation`. |
| F-2-4 | Rewrote README deployment copy to state its observable caching, security, and 404 results. | README review; live hashed-asset header and 404 checks. |

No review finding remains open. The visual system remains the warm-paper working broadsheet documented in `design.md`; no generic template was introduced.
