# Demo sandbox

- Direct URL: <https://actuals-job-sequencer.sociobot.in/demo/> or `/?demo=1`.
- First-screen action: `Try it with sample data`.
- Sample: Mercer kitchen fit for Rina Mercer. A late rough-in and a non-working date move fit and handover to 16–17 September 2026.
- Storage: IndexedDB database `demo:actuals-job-sequencer`, separate from the real `actuals-job-sequencer` database.
- Reset: `Reset demo` deletes the demo database and recreates the original sample.
- Exit: `Start for real` deletes the demo database and loads the real namespace. It never copies sample changes into real jobs.
- Offline: the service worker precaches the demo document, app shell, and sample implementation.
