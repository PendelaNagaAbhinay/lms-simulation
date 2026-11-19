# KLU Moodle + Safe Exam Browser — offline simulation

A pixel-faithful, framework-free recreation of the KLU Moodle examination journey: sign in → dashboard → course → quiz landing → browser launch confirmation → SEB splash → fullscreen exam → submission → exit.

Everything is static HTML, CSS and vanilla JavaScript. No build step, no backend, no packages, no external runtime requests (the only fetch is `questions.json` from the same folder over HTTP). Open it from a folder or publish the folder to GitHub Pages.

## Files

| File | Purpose |
|---|---|
| `index.html` | Login page (fields start empty) |
| `dashboard.html` | Moodle dashboard with Timeline, Recently accessed, Navigation sidebar |
| `course.html` | Course page with General / INSEM / END SEM sections and quiz links |
| `quiz.html` | Quiz landing page with the SEB download / launch buttons |
| `exam.html` | SEB kiosk: attempt, summary and submitted screens |
| `submission.html` | Moodle "Summary of your previous attempts" page shown after leaving SEB |
| `styles.css` | Shared design tokens, shell, login, dashboard, course and quiz layout |
| `seb.css` | SEB kiosk, launch dialog and splash styling |
| `app.js` | Login/shell behaviour, launch dialog, fullscreen, loading, persistence, `window.SEB` |
| `exam.js` | Question rendering, navigator, flags, timer, summary, submit, toolbar |
| `questions.json` | Quiz metadata and the 100-question bank split into CO1–CO4 sets of 25 |
| `questions-data.js` | Generated copy of the bank used as the offline `file://` fallback |
| `assets/` | KL logo, KLU banner and squairy background (extracted from the reference capture with permission) |
| `fonts/OpenSans-latin.woff2` | Bundled Open Sans, so typography works offline |
| `DESIGN.md` | Authoritative visual/behavioural specification |
| `.gitignore` | Excludes `reference/` and QA scratch, not the shipped assets |

## Run it

### Recommended: local static server

Browsers block `fetch('questions.json')` when a page is opened with `file://`. The bundled `questions-data.js` is loaded as a script, so all four CO sets still work offline; serving over HTTP uses `questions.json` as the live source:

```powershell
# Python
python -m http.server 8000
```

Then visit <http://localhost:8000/index.html>.

Any other static server works (VS Code Live Server, `npx serve`, etc.). On GitHub Pages the fetch works automatically.

### Quick look: double-click `index.html`

This also works, but `app.js` falls back to an embedded copy of the five default questions (a notice is written to the console), because `fetch` is blocked on `file://`. Editing `questions.json` will not be reflected until you use a static server.

## Journey

1. **Login** — enter any non-empty username and password. Empty fields show an inline error. Nothing is verified online; the username is shown in the header and no password is stored.
2. **Dashboard / Course** — use the `SELF-OEEE4224M` entry in the navigation menu (or My courses) to reach the course page, then click one of the `END SEM-CO-1` … `END SEM-CO-4` rows, or an "Attempt quiz now" link in the dashboard timeline, to reach the quiz landing. INSEM rows are locked in this simulation.
3. **Quiz landing** — each `END SEM-CO-1` … `END SEM-CO-4` row on the course page opens this page with its matching CO set already selected in the URL (`?co=CO1` … `?co=CO4`). There is no CO picker here. Press **Launch Safe Exam Browser**, then **Open Safe Exam Browser** in the browser-style confirmation. That leads to the Moodle attempt step: a red **Attempt quiz** button appears in the right-hand column, level with "Attempts allowed". Clicking it requests fullscreen, shows the SEB splash for ~2.6 s, then opens the exam. If fullscreen is denied (some automation/embedded browsers), the exam still opens in windowed mode with a restore banner.
4. **Exam** — choose an answer, flag questions, navigate with the 8-column navigator (red square asterisk heading; 30×40 cells whose answered state fills the bottom half), the Back/Next buttons, or the keyboard (`←`/`→`, `1`–`4`, `F`). Answers, flags, current question and remaining time survive a refresh.
5. **Finish** — **Finish attempt ...** opens the summary. **Submit all and finish** asks for confirmation, then immediately opens `submission.html` — no SEB stats screen, and no counts of answered/correct/wrong questions. This is the same for every CO attempt.
6. **Exit** — the power button in the SEB toolbar also opens the Moodle-style submission summary at `submission.html`, with the real submission time and a **Back to the course** button. The SEB menu (Page Zoom / Search page) is opened by the hamburger in the top-right of the exam bar.

The top-right hamburger opens Page Zoom (80–125%) and a page search. The bottom status bar shows an enlarged SEB globe with a blue underline, a charging battery, "ENG", a two-line clock/date and a power button, matching the reference photos. The timer warns under five minutes, pulses under one minute, and automatically opens the summary at 0:00.

## Question bank

The 100 MCQs were extracted from `reference/Autonomous_Vehicles_Self_Driving_Cars_100_MCQs.pdf` and split into four units, matching the PDF's four COs. `questions.json` holds the quiz metadata and the question sets:

```json
{
  "quiz": {
    "id": "autonomous-vehicles-self-driving-cars",
    "title": "SELF DRIVING CARS",
    "course": "SELF-OEEE4224M 2026-2027 ODD SEMESTER",
    "timeLimitMinutes": 30,
    "attemptsAllowed": 1,
    "totalMarks": 25
  },
  "sets": {
    "CO1": {
      "title": "INTRODUCTION TO SELF-DRIVING CARS",
      "questions": [
        {
          "id": "q1",
          "text": "What is the primary objective of a self-driving car?",
          "options": [
            { "id": "a", "text": "Increase vehicle weight" },
            { "id": "b", "text": "Navigate and operate without continuous human intervention" },
            { "id": "c", "text": "Reduce vehicle speed permanently" },
            { "id": "d", "text": "Eliminate vehicle sensors" }
          ],
          "answer": "b"
        }
      ]
    },
    "CO2": { "title": "STATE ESTIMATION AND LOCALIZATION…", "questions": ["q26 … q50"] },
    "CO3": { "title": "VISUAL PERCEPTION…", "questions": ["q51 … q75"] },
    "CO4": { "title": "MOTION PLANNING…", "questions": ["q76 … q100"] }
  }
}
```

- **CO1** = PDF questions 1–25, **CO2** = 26–50, **CO3** = 51–75, **CO4** = 76–100.
- Each CO loads exactly 25 questions with the same navigator, flags, timer, summary and submit behaviour. The selected CO is stored in the attempt state and carried in the URL (`?co=CO3`), so refresh keeps it.
- `questions-data.js` is a generated copy of the same bank, loaded as a plain script for `file://` use where `fetch` is blocked. If you edit `questions.json`, regenerate/refresh that file too (the generator lives in the gitignored `scratch/` folder with the PDF extraction helpers).
- The navigator supports **5–50 questions**; 25 renders as 8/8/8/1. Marks and answer keys are stored for data completeness but the UI reports answered counts, not a grade. A malformed file shows a readable error panel in the exam instead of a blank page.
- The navigator was verified with 25 questions for all four COs; question 25 is reachable in each.

## Deploy to GitHub Pages

1. Push this folder to a repository (the `reference/` and `scratch/` folders are gitignored).
2. Repository → Settings → Pages → Build and deployment: **Deploy from a branch**, branch `main`, folder `/ (root)`. No build command or framework is needed.
3. Visit the published URL and start at `index.html`.

The site is entirely relative-path based, so it also works in a project subpath. The committed `.nojekyll` file tells GitHub Pages to serve the folder as plain static files without running Jekyll. Before publishing, `node scratch/verify.js` checks that every local `src`/`href` resolves, that the five-question dataset is present, and that no reference/scratch folders are tracked.

## Known limitations

- The confirmation dialog and SEB splash are HTML recreations of native Chrome/SEB visuals; real native dialogs cannot be styled or launched from a static page.
- Fullscreen requires a user gesture. Some embedded browsers and automated drivers reject it; in that case the exam runs windowed with a restore banner.
- No real exam security: answers live in `localStorage` (`klu_seb_attempt_v1`) and can be inspected or cleared by the user. This is a visual/functional simulation, not an assessment platform.
- The three images in `assets/` come from the provided reference capture; they are included for visual fidelity only.
- Lighthouse (desktop) scores: Accessibility 93–95, Best Practices 100, SEO 100, Agentic Browsing 100 on all pages. The remaining accessibility findings are deliberate fidelity trade-offs with the references: the reference's green `#8EC63F` buttons with white text and orange `#EFA300` links have low contrast, and its 20 px navigation rows are below the 24 px touch-target guideline. Markdown/HTML structure, ARIA, focus management, page titles and descriptions are clean.
