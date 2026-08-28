# Visual thesis — The working broadsheet

## Direction and rationale

Actuals Job Sequencer is a **monochrome typographic broadsheet**: a working paper a small trade crew could fold beside an estimate, made interactive. The UI borrows the decisive hierarchy of a local newspaper—masthead, dateline, ruled columns, large figures, terse annotations—because the product's core task is editorial: when reality changes, decide what the next promise now says. It avoids dashboard chrome and ornamental cards. Rules group related facts; open paper gives the schedule room to breathe.

The single-mode treatment is intentionally light, like an annotated job sheet. It paints every surface explicitly. Dark mode is omitted because the visual thesis depends on the legibility and material metaphor of black ink on warm stock.

## Palette

All values meet WCAG AA against their intended backgrounds.

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#f1eee6` | Page background, 13.8:1 with ink |
| Sheet | `#fbfaf6` | Working surfaces |
| Ink | `#171713` | Primary text and controls |
| Muted ink | `#5d5b54` | Secondary copy, 6.1:1 on paper |
| Rule | `#9b988e` | Large dividers and input outlines |
| Signal | `#9d2e22` | Changed dates, warnings, focus accents |
| Signal dark | `#742219` | Text-sized warning content, 7.3:1 on paper |
| Success | `#285c3b` | Finished status, 6.8:1 on sheet |
| Wash | `#dedad0` | Pressed and selected backgrounds |

Color never carries status alone: `ACTUAL`, `MOVED`, `BLOCKED`, and icons/patterns appear in text.

## Type

- Display/editorial: Georgia with Times New Roman fallback. Its compact, high-contrast forms give dates and the masthead authority without a font download.
- Utility: Arial/Helvetica system sans. Labels, forms, status flags, and figures stay plain at a glance on a dusty phone.
- Scale: 12px kicker, 14px annotation, 16px body, 20px section title, fluid 34–68px display. Body line-height is 1.5; prose measure caps at 68 characters. Dates and schedule figures use tabular numerals.

System fonts keep the entire typographic payload at 0 KB and work reliably offline.

## Spacing and layout

An 8px base rhythm with 4px for tight label relationships. Working width is 1200px. Desktop uses an editorial rail and a wide schedule column; phone drops the rail into a compact edition bar and stacks schedule fields in reading order. Touch targets are at least 44px. Independent jobs are separated like newspaper stories with heavy horizontal rules, not floating cards.

## Interaction grammar

- The primary action is a reversed-ink rectangular button, labeled with a verb.
- Inputs look like blanks on a work order: flat fields with a strong bottom edge.
- Selecting a job moves a black lozenge and changes the folio number.
- Changed dates receive a signal-colored left rule and a `MOVED` slug; the old date remains struck through for provenance.
- Completing a step opens a focused sheet dialog from the row that caused it; saving immediately reflows dependent dates and announces the count of changes.
- Destructive actions name the job/step and require confirmation. Imports show a specific error and never replace data until validation succeeds.

## Motion policy

Transitions last 160–220ms and only animate opacity or transform: the editor sheet rises from its trigger; recalculated rows flash once with a very small ink-mark fade. Nothing loops. Under `prefers-reduced-motion: reduce`, movement becomes an immediate state change and smooth scrolling is disabled.

## Asset plan and provenance

The only illustrative raster is an original editorial still life used in the first-run edition: a carpenter's folding rule and five paper job slips arranged like falling dominoes across a calendar grid. It explains dependency without pretending to show app functionality. Product icons and status marks are hand-authored CSS/SVG geometric marks.

### Image prompt sheet

- Subject: folding carpenter's rule touching a line of five blank job-order slips, each slightly shifting the next, on a gridded paper workbench calendar.
- World/materials: 1960s trade newspaper photograph, coarse newsprint halftone, ink roller texture, folded paper edges, practical workshop still life.
- Light/lens: overhead hard window light, crisp long shadows, 50mm editorial still-life composition, generous negative space.
- Palette words: warm ivory paper, charcoal black, one restrained brick-red registration mark.
- Negative list: people, hands, readable text, letters, numbers, logos, brands, watermarks, gradients, glossy 3D, app screenshot, blueprint cyan.
- Generation: Azure OpenAI image model (`factory-image`) through `/opt/fleet/lib/gen-image.sh`, generated 2026-08-28. Original generated asset; licensed for this product. Source PNG and exact prompt sidecar are kept in `assets/src/`; shipped WebP is optimized to ≤300 KB.
- Social preview: `public/og-image.webp` is a 1200×630 crop of the same reviewed original. The Apple touch icon and favicon are resized from the hand-authored product mark.
