# Improvement audit — KLU Moodle + SEB simulation

Source baseline: current workspace (no git repository). Audit date: 2026-11-18.

## Navigator reference pass (2026-11-19, fifth pass)

- Restored the red square (not circular) white-asterisk badge before "Quiz navigation".
- Changed navigator cells from 32×32 squares to 30×40 tall rectangles so the number sits in the white upper area and the answered gray band fills the bottom half, per `quiz-navigation-reference-1.jpg` / `-2.jpg`.
- Refined to the references: numbers now hug the top of each cell (`align-items: flex-start`, 5 px top padding) instead of crossing the white/gray split; grid gap 4 px; 4 px corner radius; border `#C4C4C4`; `Finish attempt ...` permanently underlined with hover only darkening the orange. The 1024–1199 px breakpoint keeps a 34 px-tall cell so the number still clears the gray half.
- Verified in Chromium at 1366 px and 1100 px: cells 30×40 / 26×34, top-aligned numbers, bottom-half gradient, flag triangle intact, 0 console errors; `test-flow.js` 23/23 and `verify.js` all green.

## Direct submission result (2026-11-19, fourth pass)

- `SEB.showSubmission()` added; `submitAttempt()` now opens `submission.html` immediately after confirming submit, for every CO, with no answered/correct/wrong statistics.
- Reopening `exam.html` with `screen === "submitted"` also redirects to `submission.html`.
- Verified in Chromium with CO4: submit → submission page with real timestamp, no stats text, 0 console errors; `test-flow.js` 21/21 green.

## Navigator/toolbar reference pass (2026-11-19, third pass)

- Answered navigator cells now split horizontally with the gray half at the bottom (was left/right).
- Enlarged the SEB bottom status bar to 44 px: 30 px globe + blue underline, charging-battery icon, ENG label, stacked time/date clock, 26 px power icon, per `seb-left-lower-corner-icon.jpg` and `seb-right-lower-corner-icons.jpg`.
- Verified in Chromium: bottom-half gradient computed style, 44 px toolbar, ENG + "01:18 / 19-11-2026", larger globe/power, 0 console errors; `test-flow.js` 19/19 green.

## Reference-alignment update (2026-11-19, second pass)

- Added `submission.html`, a plain Moodle-style "Summary of your previous attempts" page matching `reference/submission-screen.png`; SEB exit now lands here, then **Back to the course** returns to `course.html`.
- Moved the SEB hamburger from the bottom toolbar to the top-right of the exam top bar; the menu now opens downward (reference `seb-right-upper-corner-icons.jpg`).
- Rebuilt the navigator heading (plain "Quiz navigation", 13 px) and answered cells as half-gray squares (reference `photo_9_…jpg`).
- Removed the CO picker from the quiz landing page; each `END SEM-CO-X` course/timeline link now carries `?co=COX`, so launch opens the correct 25-question set automatically.
- Set the course time limit to 25 minutes to match the submission reference; `questions.json`, `questions-data.js`, quiz landing and exam timer are consistent.
- Verified in Chromium: CO2 course link → correct questions, top-right menu, half-gray answered cell, submit → submission summary with real timestamp, 0 console errors; `test-flow.js` 17/17 and `verify.js` all green.

## PDF question-bank update (2026-11-19)

- Extracted 100 MCQs from `reference/Autonomous_Vehicles_Self_Driving_Cars_100_MCQs.pdf` with `pypdf` (the model cannot view PDF pages directly; text extraction works).
- Split into CO1 (Q1–25), CO2 (Q26–50), CO3 (Q51–75), CO4 (Q76–100) in `questions.json`; `questions-data.js` is the committed offline copy.
- Added CO1–CO4 selectors to `quiz.html`; `?co=COx` is carried through launch, attempt, splash and exam, and stored in attempt state.
- Verified all four sets in Chromium: 25 cells each, correct first/last question, question 25 reachable, 0 console errors. `scratch/test-flow.js` 13/13 and `scratch/verify.js` all green.

## Applied in this pass

| Finding | Category | Action | Verification |
|---|---|---|---|
| Summary flag spans used `aria-label` on a generic `span` | Accessibility | Added `role="img"` in `exam.js` | Lighthouse exam: Agentic Browsing 50 → 100, no prohibited-ARIA finding |
| User avatar accessible name was "Log out" while visible text was "P2" | Accessibility | Name now "P2 — Log out" | Label/name mismatch finding gone on dashboard and course |
| Meta description missing on four pages | SEO / docs | Added to dashboard, course, quiz, exam | Lighthouse SEO 91/90 → 100 |
| Bundled font was render-blocking on first paint | Performance | Added `crossorigin` font preload on all five pages | `scratch/verify.js` checks the preload on every page |
| Neutral `#777` text was just under 4.5:1 | Accessibility | Nudged text-only colours to `#767676` | Contrast findings for those nodes gone |
| Login inputs relied on JS-only validation semantics | Accessibility | Added `required`, `aria-describedby`, dynamic `aria-invalid`; removed `:invalid` CSS so fields still start visually empty | Fresh screenshot + empty-submit check |
| GitHub Pages could treat the folder as a Jekyll site | Deployment | Added committed `.nojekyll` | `scratch/verify.js` checks it |

## Deliberately deferred (fidelity trade-offs)

| Finding | Why deferred | Cost if wrong |
|---|---|---|
| `#8EC63F` green buttons with white text are 2.03:1 | Exact reference colour; darkening changes every Moodle/SEB button in the screenshots | Low-contrast text for some users |
| Orange `#EFA300` links are 2.11–2.82:1 | Exact reference colour | Same |
| Navigation rows are 20 px tall, below the 24 px touch-target guideline | Exact reference density | Harder tapping on touch devices |
| Custom overlays instead of native `<dialog>` | Native top-layer styling would change the Chrome/SEB dialog recreations | Manual focus trap must stay correct |
| No service worker | Site is already fully local and offline after load; SW adds caching complexity | No offline shell before first visit |

Lighthouse (desktop, final): Accessibility 93–95, Best Practices 100, SEO 100, Agentic Browsing 100 on all five pages.
