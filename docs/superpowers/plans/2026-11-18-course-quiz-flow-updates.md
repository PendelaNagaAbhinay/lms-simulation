# Course Quiz Flow Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard's course link land on a page matching `reference/exam-quiz-page.png`, launch the SEB journey from each END SEM quiz, insert a red "Attempt quiz" step after the launch confirmation, and correct the quit dialog to the reference image.

**Architecture:** Flat static site, no build. `course.html` is the course page reached from `dashboard.html`. `quiz.html?quiz=…` is the landing page; `quiz.html?quiz=…&attempt=1` is the same page re-skinned with the red Attempt quiz action. `app.js` owns the launch/attempt/fullscreen/splash flow and the `window.SEB` contract. `exam.js` owns the quit dialog and returns to `course.html` via `SEB.quitToCourse()`. `styles.css` / `seb.css` carry the visuals.

**Tech Stack:** HTML5, CSS3, vanilla ES2017, `localStorage`, Fullscreen API.

**Spec:** `DESIGN.md` plus the three user-supplied references: `reference/exam-quiz-page.png`, `reference/mobile-capture-quiz-seb-reference/photo_4_2026-11-18_19-26-22.jpg`, `reference/mobile-capture-quiz-seb-reference/exit-quiz-pop-up-post-power-button-clicking.jpg`.

## Global Constraints

- No frameworks, no build step, no backend, no external runtime requests.
- END SEM rows open `quiz.html?quiz=END%20SEM-CO-X` (X = 1…4); the landing page keeps its Download / Launch / Download configuration buttons.
- After the launch dialog is confirmed, show the Attempt-quiz variant; clicking Attempt quiz requests fullscreen synchronously, plays the 2.6 s splash, then opens `exam.html`.
- Attempt quiz uses the DESIGN red button format (`#990000`, white, 2 px radius, 32 px height).
- Exiting SEB always returns to `course.html` and clears `klu_seb_attempt_v1`.
- Quit dialog copy/controls: "Quit?" title, blue `?` disc, "Do you want to quit SEB?", Yes / No. No extra mid-attempt warning screen.
- Course code everywhere is `SELF-OEEE4224M 2026-2027 ODD SEMESTER`.

## Review Focus

- Launch dialog → Attempt quiz → splash → exam: fullscreen must be requested inside a click handler, never on page load.
- Refreshing the attempt variant must not skip to the exam or lose the quiz title.
- Pressing Esc / No on the quit dialog must leave the attempt untouched; Yes must clear state and return to the course.
- The four END SEM links must carry distinct quiz titles into the landing page.
- 5- and 25-question datasets must still work after the flow change.

---

### Task 1: Course page to match reference

**Files:** Modify `course.html`, `dashboard.html`.

- [ ] Step 1: In `course.html`, replace the course code text `SELF-OEE4224M` with `SELF-OEEE4224M` in `<title>`, breadcrumb, sidebar branch and expanded submenu.
- [ ] Step 2: In `dashboard.html`, change the navigation-menu course link text `SELF-OEE4224M 2026-2027 ODD SEMESTER` to `SELF-OEEE4224M 2026-2027 ODD SEMESTER` (keep `href="course.html"`).
- [ ] Step 3: In `course.html`, convert the four INSEM activity rows to the reference form: quiz icon tile, label "QUIZ" + name `INSEM CO-1`…`INSEM CO-4`, and the lock line `Not available unless: You belong to Missing group`; remove their quiz links and Mark as done buttons.
- [ ] Step 4: Replace the `Topic 2` `<details>` block with an open `END SEM` section containing four activity rows `END SEM-CO-1`…`END SEM-CO-4`, each with a Mark as done button using `.js-mark-done[data-activity="end-sem-co-X"]` and an activity-name link to `quiz.html?quiz=END%20SEM-CO-X`. Keep Topic 3 and Topic 4 collapsed.
- [ ] Step 5: In the `course.html` sidebar submenu, remove the `Topic 2` row, add an `END SEM` row, and keep General / INSEM / Topic 3 / Topic 4.
- [ ] Step 6: Verify in Chromium at 1366×768 that the page matches `reference/exam-quiz-page.png` and that each END SEM link points to the right quiz URL.

---

### Task 2: Attempt-quiz step and full flow

**Files:** Modify `quiz.html`, `styles.css`, `app.js`, `README.md`, `DESIGN.md`.

**Interfaces:** Consumes `window.SEB.requestFullscreen`, `window.SEB.startSebLoading`, `window.SEB.resetAttempt`. Produces URL `?attempt=1`, button id `#attempt-quiz`.

- [ ] Step 1: In `quiz.html`, add a hidden right-hand action block inside `.quiz-column` with `<button id="attempt-quiz" class="btn btn-red">Attempt quiz</button>`; keep the existing `.continuebutton` "Back to the course" link below it.
- [ ] Step 2: In `styles.css`, add `.attempt-action` positioned in the right column, aligned with the first `.quizinfo` line (top ≈ 40 px), and style `#attempt-quiz` with the DESIGN red button tokens. Hide it unless the page has the `is-attempt-stage` class.
- [ ] Step 3: In `app.js` `initQuizPage()`, read `?attempt=1`; when present add `is-attempt-stage` to `body`, hide `.singlebutton` launch/download buttons and the "not available" line, show `#attempt-quiz`, and set the hidden heading/title from `?quiz=`.
- [ ] Step 4: In `app.js` launch-dialog confirm handler, replace the immediate `startSebLoading()` + `exam.html` navigation with navigation to `quiz.html?quiz=<encoded title>&attempt=1`; keep the synchronous `requestFullscreen()` call and the fresh attempt reset.
- [ ] Step 5: Bind `#attempt-quiz`: call `SEB.requestFullscreen()` synchronously, reset/keep the attempt state, show the existing splash, then navigate to `exam.html` after 2.6 s. If fullscreen is denied, continue in windowed mode and set `seb_windowed`.
- [ ] Step 6: Update `README.md` journey and `DESIGN.md` flow section to include the Attempt quiz step and the new course page structure.
- [ ] Step 7: Verify: END SEM-CO-3 link → landing page → dialog confirm → attempt variant → Attempt quiz → splash → exam; Back to the course link returns to `course.html`.

---

### Task 3: Quit dialog to reference

**Files:** Modify `exam.html`, `exam.js`, `seb.css`.

- [ ] Step 1: Remove the `#quit-warn` dialog markup from `exam.html`; keep only `#quit-dialog` with the exact reference copy and Yes/No buttons.
- [ ] Step 2: In `exam.js`, remove all `quitWarn` DOM caches, handlers, backdrop entries and the `closeDialog(dom.quitWarn)` call; make the power button open `#quit-dialog` in every state.
- [ ] Step 3: On `#quit-yes`, if the attempt is still in progress, submit it, then clear state and navigate to `course.html` via `SEB.quitToCourse()`; `#quit-no` and Esc just close the dialog.
- [ ] Step 4: In `seb.css`, refine the dialog to the photo: translucent `#F3F3F3` background, thin `#999` border, 400×190 box, 12 px gray "Quit?" title strip, 40 px `#1675AE` disc, 15 px message, and two 100×30 Yes/No buttons in a centered footer.
- [ ] Step 5: Verify at 1366×768: power button shows the reference dialog directly; No preserves answers; Yes returns to `course.html` with no stored attempt.

---

### Task 4: Integration QA

- [ ] Walk the full journey from the dashboard navigation menu, through all four END SEM links, to exam and exit.
- [ ] Re-run the 25-question fixture and confirm the exam still renders 8/8/8/1.
- [ ] Confirm no console errors, no 404s, and no requests outside the local folder.
