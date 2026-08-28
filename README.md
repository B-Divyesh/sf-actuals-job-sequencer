# Actuals Job Sequencer

Move forecast dates after actual finishes for solo and two-person trade crews. The app keeps ordered steps and writes a client update when dates change.

Live product: <https://actuals-job-sequencer.sociobot.in>

Try the isolated sample: <https://actuals-job-sequencer.sociobot.in/demo/>

## What it does

- Keeps steps in order so one actual finish sets every later forecast date.
- Skips selected non-working days and holiday dates.
- Rejects an actual finish that predates an earlier step’s actual finish.
- Writes a client update with the changed forecast dates.
- Exports every job and calendar setting as JSON or CSV.
- Restores jobs and settings from a valid JSON backup.
- Works offline after the first visit.
- Keeps job and client data in this browser.

It does not plan routes, payroll, GPS, or whole projects. Forecast dates are estimates, not guaranteed appointments.

## Try the demo

Open `/demo/` or `/?demo=1`. The sample kitchen job already shows a late rough-in and a moved handover date.

The demo uses the separate `demo:actuals-job-sequencer` browser database. Reset demo restores the sample. Start for real deletes the demo database and returns to your real jobs.

## Run locally

You need Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
```

Open the address shown in the terminal. Build the deployable files with:

```sh
npm run build
```

The static output is in `dist/`, with `dist/index.html` at its root.

## Verify

```sh
npm test          # scheduling and date validation
npm run check     # TypeScript, unit tests, and production build
npm run test:e2e  # claims, browser flows, axe, privacy, and offline reload
```

Every public claim and its clean-state command is listed in [.factory/claims.json](.factory/claims.json). Playwright is pinned to 1.58.2.

## Data and privacy

Job and client data stays in this browser. The app uses no analytics, third-party scripts, remote fonts, GPS, or location tracking. Export JSON to keep a complete backup.

Use up to five active jobs without an account. The current release does not take payment.

See [Privacy](https://actuals-job-sequencer.sociobot.in/privacy/) and [Terms](https://actuals-job-sequencer.sociobot.in/terms/).

## Deploy

Build `dist/`, then deploy it as a static site. `staticwebapp.config.json` sets immutable asset caching, security headers, route behavior, and the real 404 response.

## Product records

- [Researched brief](.factory/brief.json)
- [Visual system and asset provenance](.factory/design.md)
- [Demo sandbox](.factory/demo.md)
- [Release handoff](.factory/handoff.md)

## License

This project is MIT licensed. See [LICENSE](LICENSE).
