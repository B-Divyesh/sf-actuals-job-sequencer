# Review 4 handoff — Actuals Job Sequencer

## Outcome

Independent review 4 is **FAIL** with four findings: three blocking and one minor. Two public claims are incompletely tested. No product code changed. The full report is in `.factory/review-4.md`.

## Verification

- Clean clone: `npm ci`, all nine exact claim commands, `npm test`, `npm run build`, `npm run check`, and `npm run test:e2e` passed. The browser suite is 12/12 and the unit suite is 11/11.
- The live site is byte-for-byte equal to the build from implementation `1b06d2a`; the current documentation commit is `f6b3449`.
- Cold phone and desktop checks verified the job, audience, and sample action before scrolling. Demo isolation, reset, exit, offline reload, routes, focus, privacy, legal pages, deliberate 404, reduced motion, axe, and Lighthouse checks pass.
- Live boundary checks found that incomplete JSON can prevent later loads, import accepts six active jobs, and CSV drops jobs with no steps. Header and footer navigation also has targets below 44 by 44 pixels.

## Run

```sh
npm ci
npm run check
npm run test:e2e
```

Build output is `dist/`.

## Known gaps

- Reject incomplete backup records before saving them and add a reload recovery test.
- Reject imports containing more than five active jobs and extend `@claim:five-job-limit` to cover import.
- Include zero-step jobs and calendar data in CSV, then assert that boundary in the claim suite.
- Increase header and footer navigation hit areas to at least 44 by 44 CSS pixels.
