# Actuals Job Sequencer

Actuals Job Sequencer is an offline job-date calculator for solo and two-person trade businesses. Record when a step actually finished and every dependent forecast moves around the crew's working days and holidays. The app then drafts a plain client update that says what changed.

Live product: <https://actuals-job-sequencer.sociobot.in>

## What it does

- Keeps ordered finish-to-start steps for up to five active jobs (Crew edition; one in free edition).
- Treats actual finish dates as the new source of truth for every unfinished step.
- Skips selected non-working weekdays and holiday dates.
- Shows original promises beside current forecasts, with visible change history.
- Drafts a concise client message for moved dates.
- Stores job data locally in IndexedDB and works after an offline reload.
- Exports a full JSON backup or spreadsheet-ready CSV with timezone and calendar settings.
- Imports JSON backups without sending job or client data to a server.

This is intentionally not dispatch, GPS, payroll, route planning, or a general Gantt tool. Forecasts are user-entered estimates, not guaranteed appointments.

## Run locally

Requirements: Node.js 20+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Production output is built with the work-order command:

```sh
npm run build
```

The static deploy artifact lands in `dist/`, with `dist/index.html` at its root. Preview that exact artifact with `npm run preview`.

## Verify

```sh
npm test          # deterministic scheduling tests
npm run check     # TypeScript, unit tests, production build
npm run test:e2e  # Chromium flow, axe, persistence, legal pages, offline reload
```

Playwright is pinned to 1.58.2. The test runner uses the preinstalled Chromium when `PLAYWRIGHT_BROWSERS_PATH` is set; otherwise install it with `npx playwright install chromium`.

## Data, privacy, and licenses

Jobs never leave the browser. No analytics, GPS, third-party scripts, or remote fonts are used. A complete backup is available under **Settings & data**. Clearing site storage removes jobs and the local license token.

Crew edition is a $29 one-time license. Checkout and verification use only the Sociobot billing API; no payment provider is embedded. Configure a non-production billing host, when needed, with `VITE_BILLING_BASE_URL`. The factory registers the product slug before release.

See [Privacy](https://actuals-job-sequencer.sociobot.in/privacy/) and [Terms](https://actuals-job-sequencer.sociobot.in/terms/).

## Product records

- [Researched brief](.factory/brief.json)
- [Visual system and asset provenance](.factory/design.md)
- [Build handoff](.factory/handoff.md)

## License

MIT. See [LICENSE](LICENSE).
