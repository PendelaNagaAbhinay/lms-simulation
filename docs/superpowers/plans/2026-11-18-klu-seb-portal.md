# KLU Moodle + SEB Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Moodle/SEB recreation as a static, framework-free, offline-capable site with a complete login → dashboard → course → quiz launch → SEB splash → exam → submission → exit journey.

**Architecture:** Flat multi-page static site. Shared tokens/shell in `styles.css`; SEB kiosk in `seb.css`; flow/state/fullscreen in `app.js`; exam engine in `exam.js`; exam content in `questions.json`. No build, no backend, no binary images (all marks are inline SVG/CSS).

**Tech Stack:** HTML5, CSS3, vanilla ES2017 JavaScript, `localStorage`, Fullscreen API, bundled Open Sans woff2.

**Spec:** `DESIGN.md` (authoritative). Read it fully before every task.

## Global Constraints

- Exactly 5–50 questions supported; shipped dataset is 5 generic general-knowledge MCQs.
- Login fields start empty; any non-empty username + password is accepted; password never stored.
- No committed imagery from `./reference/`; recreate marks with inline SVG/CSS. `.gitignore` already excludes `/reference/`, `/assets/`, `/scratch/`.
- No frameworks, no build step, no external network calls at runtime.
- Primary viewports: 1366×768 and 1920×1080; responsive behaviour per DESIGN §14.
- All pages use Open Sans from `fonts/OpenSans-latin.woff2` (weights 400/600/700 via one variable file).
- `document.documentElement.requestFullscreen()` is called synchronously inside the launch-confirm click handler.
- Attempt state persists in `localStorage` key `klu_seb_attempt_v1` across refresh.
- File ownership is strict: A = shell pages + `styles.css`; B = `exam.html`, `exam.js`, `seb.css`; C = `quiz.html`, `app.js`, `questions.json`. Shared changes go through the orchestrator.

## Review Focus

- Pressing Esc exits fullscreen mid-exam: show a restore-fullscreen notice, never lose answers.
- Refreshing mid-exam: same question, answers, flags and remaining time.
- 25-question navigator: 8/8/8/1 rows, last cell reachable, card does not overflow viewport.
- Timer expiry: auto-open submission with no editing possible.
- `questions.json` malformed / missing: show a readable error panel instead of a blank exam.

---

### Task 1: Foundation (orchestrator) — completed before dispatch

**Files:**
- Create: `.gitignore`, `questions.json`, `fonts/OpenSans-latin.woff2`, `docs/superpowers/plans/2026-11-18-klu-seb-portal.md`

**Interfaces:**
- Produces: the 5-question dataset and the font file all pages consume.

- [x] Write `.gitignore` excluding `/reference/`, `/assets/`, `/scratch/`, crop artefacts.
- [x] Write `questions.json` with 5 generic MCQs (`q1`–`q5`, options `a`–`d`, `answer`).
- [x] Download and store `fonts/OpenSans-latin.woff2`.
- [x] Write this plan.
- [x] Later user permission: extract `assets/kl.png`, `assets/klu-banner.jpg` and `assets/page-bg.png` from `reference/` (via `scratch/extract-assets.js`), un-ignore `/assets/`, and swap the code-only logo/banner/background for the real images in `index.html`, `dashboard.html`, `course.html` and `styles.css`.

---

### Task 2: Agent A — Application shell

**Files:**
- Create: `index.html`, `dashboard.html`, `course.html`, `styles.css`

**Interfaces:**
- Consumes: `questions.json` (links only), `fonts/OpenSans-latin.woff2`.
- Produces for `app.js`:
  - `#login-form`, `#username`, `#password`, `#login-error`, `.js-lost-password`, `.js-cookies`
  - `.js-username` (all pages), `.js-logout`, `#course-search`
  - `.js-mark-done[data-activity]` (course)
  - page classes `page-login`, `page-dashboard`, `page-course`
  - `.toast-region` may be created by `app.js`; style `.toast`, `.toast__inner`
  - quiz links: `quiz.html?quiz=END%20SEM-CO-1` and `quiz.html?quiz=INSEM%20CO-1`
- Produces for visual reuse: `:root` tokens, `.btn`, `.btn-green`, `.btn-red`, `.btn-outline`, `.btn-sm`, `.top-strip`, `.site-header`, `.navbar`, `.container`, `.page-grid`, `.block`, `.block-head`, `.site-footer`, `.kl-logo`, `.klu-banner`, `.squairy` background.
- `styles.css` must also implement the quiz landing layout used by C: `.page-quiz`, `.quiz-page`, `.quiz-column`, `.quizinfo`, `.quizattempt`, `.singlebutton`, `.continuebutton`, and the 28%-offset column at ≥1024 px.

**Steps:**
- [ ] Build login per DESIGN §5: empty fields, CSS KLU banner, inline SVG KL logo, squairy tile, green cookies button.
- [ ] Build dashboard per DESIGN §6: user bar, navbar, search, breadcrumb + Customise button, Timeline, Recently accessed, Navigation sidebar, footer.
- [ ] Build course page per DESIGN §7: General + INSEM sections, activity rows, "Mark as done", Topic 2–4 collapsed.
- [ ] Add shared tokens/typography/buttons per DESIGN §3–4.
- [ ] Implement quiz landing styles per DESIGN §8 (no header/footer on that page).
- [ ] Add responsive rules per DESIGN §14.
- [ ] Verify in Chrome at 1366×768 and 1920×1080; check fields are empty and all links resolve.
- [ ] Report files, deviations, and any hooks C must know.

---

### Task 3: Agent B — Examination interface

**Files:**
- Create: `exam.html`, `exam.js`, `seb.css`

**Interfaces:**
- Consumes: `window.SEB` from `app.js` (`loadQuestions`, `getState`, `saveState`, `resetAttempt`, `formatClock`, `toast`, `requestFullscreen`, `exitFullscreen`, `quitToCourse`), `styles.css` tokens.
- Produces: standalone exam screens (`attempt`, `summary`, `submitted`), SEB toolbar, quit dialog, and shared SEB visual classes:
  `.seb-backdrop`, `.seb-dialog`, `.seb-dialog__title`, `.seb-dialog__body`, `.seb-dialog__check`, `.seb-dialog__actions`, `.seb-btn-pill`, `.seb-btn-pill--primary`, `.seb-splash`, `.seb-splash__logo`, `.seb-splash__text`, `.seb-splash__wordmark`, `.seb-splash__product`, `.seb-splash__version`, `.seb-splash__copyright`, `.seb-splash__progress`, `.seb-splash__caption`.
- `seb.css` must style those launch/splash classes for C's markup even though B does not render them.

**Steps:**
- [ ] `exam.html`: red strip, top bar with centered Back + timer, 300 px nav card, question panel, submitted/summary containers, bottom toolbar, script order `app.js` then `exam.js`.
- [ ] `exam.js`: fetch data via `SEB.loadQuestions()`, render question list from state, 8-col navigator (5–50), answered/unanswered/flagged/current states, flag toggle, prev/next, keyboard nav, summary table, submit modal, submitted screen, quit dialog, toolbar clock/zoom/search.
- [ ] Timer from `endsAt`, persisted; red warning states; expiry auto-summary.
- [ ] Fullscreen-loss notice with restore button.
- [ ] `seb.css`: all exam styles plus launch dialog and splash card (350×200, inline-SVG globe positioning, green progress animation).
- [ ] 25-question fixture: verify 8/8/8/1 and question 25 reachable (ask orchestrator for fixture).
- [ ] Verify persistence across reload; no console errors.
- [ ] Report.

---

### Task 4: Agent C — Application flow

**Files:**
- Create: `quiz.html`, `app.js`
- Reference (do not edit): `questions.json`

**Interfaces:**
- Consumes: shell classes from `styles.css`; SEB classes from `seb.css`; `questions.json`.
- Produces: `window.SEB` exactly as DESIGN §15, plus login/nav/toast/mark-done/fullscreen/launch/loading/exit behaviour.
- `app.js` must be safe to load on every page (guard missing elements) and expose the API before `exam.js` runs.

**Steps:**
- [ ] `quiz.html`: header-less quiz landing per DESIGN §8, buttons with ids/classes, launch button `#launch-seb`, links to `course.html`.
- [ ] `app.js`: login validation (empty ⇒ inline Required), session username, logout, toast, inert-link handling, Help menu, search toast, mark-as-done.
- [ ] `app.js`: `SEB` API + state schema exactly per DESIGN §11.6.
- [ ] `app.js`: launch dialog markup/behaviour + checkbox + Esc/backdrop; confirm calls `requestFullscreen()` synchronously, then splash 2.6 s, then `exam.html`.
- [ ] `app.js`: splash markup (inline SVG globe) + graceful continue if fullscreen rejected.
- [ ] `app.js`: `quitToCourse()` clears state, exits fullscreen, navigates to `course.html`.
- [ ] `app.js`: `loadQuestions()` fetch with 5-question embedded fallback for `file://`; readable error if parse fails.
- [ ] Verify quiz page buttons, dialog focus, Esc/backdrop, fullscreen attempt, splash timing, and failed-fullscreen path.
- [ ] Report.

---

### Task 5: Integration (orchestrator)

- [ ] Reconcile DOM hooks/classes between `app.js`, `styles.css`, `exam.js`, `seb.css`.
- [ ] Serve locally over HTTP and walk the full journey.
- [ ] Fix console errors, 404s, styling collisions.
- [ ] Verify no requests to `reference/` or `/assets/`.

### Task 6: 25-question navigator fixture

- [ ] Generate `scratch/questions-25.json` from `questions.json` (repeat/extend to 25 valid MCQs).
- [ ] Temporarily serve it as `questions.json`; verify 8/8/8/1 grid, all states, Q25 reachable, Finish attempt visible, summary lists 25.
- [ ] Restore the 5-question dataset and re-verify.

### Task 7: Visual QA

- [ ] Playwright/Chrome screenshots at 1366×768 and 1920×1080 for login, dashboard, course, quiz, launch dialog, splash, exam, summary, submitted, quit dialog.
- [ ] Compare against references; fix highest-impact differences first (max 3 rounds).
- [ ] Record remaining differences in the final report.

### Task 8: Functional QA

- [ ] Login (empty + any values) → dashboard.
- [ ] Dashboard → course; course quiz → quiz; dashboard recent → quiz.
- [ ] Launch → fullscreen + splash → exam.
- [ ] Answer, navigate, flag, refresh persistence, timer, finish, submit, exit.
- [ ] Esc fullscreen notice + restore; expiry path.
- [ ] Mobile/tablet sanity at 1024 and 768.

### Task 9: Docs/finalization

- [ ] `README.md`: overview, structure, run locally (double-click + server), `questions.json` schema/example, adding questions, GitHub Pages deploy, functionality/navigation, known limitations.
- [ ] Confirm `.gitignore` covers `/reference/` and all extraction output.
- [ ] Final report: features, files, tests, remaining visual deltas, assumptions.
