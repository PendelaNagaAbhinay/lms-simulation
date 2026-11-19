# KLU Moodle + Safe Exam Browser Portal — Design Specification

> Phase 1 deliverable. This document is the authoritative visual and behavioural specification for the recreation. All implementation must follow it.

## Changes approved after design review

1. **No prefilled credentials.** Both login fields start empty; any non-empty username/password is accepted.
2. **Placeholder question bank.** `questions.json` ships five generic general-knowledge MCQs. The navigator must handle 5–50 questions and is verified with a 25-question fixture.
3. **Extraction policy (later permission from the user).** The KL mark, KLU banner and squairy background are extracted from `reference/` into the shipped `assets/` folder because the code-only recreations were visibly less faithful. The SEB globe remains inline SVG. `.gitignore` still excludes `/reference/` and `/scratch/`; `/assets/` is tracked.

---

## 1. Intent

Recreate the KL University Moodle LMS and its Safe Exam Browser (SEB) examination experience as a fully offline, static, framework-free web application.

The recreation must reproduce:

- The KLU Moodle login page (Open Sans, squairy background, KLU banner, #990000 primary button).
- The Moodle dashboard (dark navbar, Timeline block, Recently accessed items, Navigation sidebar).
- The SELF-OEEE4224M course page (section accordions, activity rows, "Mark as done" buttons).
- The standalone quiz landing page (plain white, offset content column, green SEB buttons) and its post-launch Attempt-quiz variant (red button).
- The Chrome "Open Safe Exam Browser?" launch dialog.
- The SEB splash/loading screen.
- The SEB kiosk quiz-attempt interface with question navigator, flagging, countdown and submission.
- The SEB quit confirmation dialog and return to course.

Non-goals: real authentication, real SEB integration, real Moodle backend, grading upload, multiple question types beyond single-answer multiple choice.

Anti-goals: a generic "modern dashboard" look; Bootstrap or any framework; rounded-card SaaS styling; extra navigation or features not present in the references.

---

## 2. Reference Inventory and Roles

### 2.1 File inventory (`./reference/`)

| File | Role |
|---|---|
| `lms.kluniversity.in_login_index.php.png` | **Primary** login page screenshot (1429×911) |
| `lms.kluniversity.in_login_index-default.php` | Alternate login capture (PNG content) |
| `KL Learning Management System_ Log in to the site.html` | Login DOM capture (SingleFile) |
| `KL Learning Management System_ Log in to the site.mhtml` | Login MHTML with embedded CSS — **computed-style source** |
| `KL Learning Management System: Log in to the site (11_18_2026 7:13:03 PM).html` | Login DOM capture (second) |
| `KL Learning Management System_ Log in to the site_files/` | Theme CSS, Font Awesome, logo assets, JS |
| `lms.kluniversity.in_my_.png` | **Primary** dashboard screenshot, above-the-fold (1414×1342) |
| `lms.kluniversity.in_my_ (1).png` | **Primary** dashboard screenshot, full page (1414×2392) |
| `Dashboard (11_18_2026 7:14:25 PM).html` | Dashboard DOM capture |
| `Dashboard (11_18_2026 7:14:44 PM).html` | Dashboard DOM capture — **computed-style source** |
| `lms.kluniversity.in_course_view.php_id=15281.png` | **Primary** course page screenshot (1414×2370) |
| `lms.kluniversity.in_mod_quiz_view.php_id=144456.png` | **Primary** quiz landing screenshot (1429×911) |
| `INDI-23UC0008 2026-2027 ODD SEMESTER: END SEM-CO-1 (...).html` | Quiz landing DOM — **computed-style source** |
| `seb-launch-button-pop-up.png` | Chrome "Open Safe Exam Browser?" dialog (1919×1033) |
| `seb-after-launch-loading-screen.png` | **Primary** SEB splash/loading screen (1906×978) |
| `mobile-capture-quiz-seb-reference/photo_4_...jpg` | Quiz landing page shown inside SEB |
| `mobile-capture-quiz-seb-reference/photo_8_...jpg` | **Primary** SEB attempt: Q14, navigator states, flag, prev/next |
| `mobile-capture-quiz-seb-reference/photo_9_...jpg` | **Primary** SEB attempt: Q10, clean header strip |
| `mobile-capture-quiz-seb-reference/photo_11_...jpg` | SEB attempt: Q23, 25-cell navigator, Finish attempt link |
| `mobile-capture-quiz-seb-reference/photo_12_...jpg` | SEB attempt: answered question, blue radio, Clear my choice |
| `mobile-capture-quiz-seb-reference/photo_10/13/14...jpg` | Secondary/blurry SEB attempt angles |
| `mobile-capture-quiz-seb-reference/seb-page-default.jpg` | Login page inside SEB (window chrome, toolbar edges) |
| `mobile-capture-quiz-seb-reference/seb-left-lower-corner-icon.jpg` | SEB logo at lower-left of kiosk |
| `mobile-capture-quiz-seb-reference/seb-right-lower-corner-icons.jpg` | Battery, ENG, clock, power icons at lower-right |
| `mobile-capture-quiz-seb-reference/seb-right-upper-corner-icons.jpg` | Three-line menu opened: Page Zoom / Search page panel |
| `mobile-capture-quiz-seb-reference/exit-quiz-pop-up-post-power-button-clicking.jpg` | **Primary** SEB quit dialog "Do you want to quit SEB?" |

### 2.2 Grouping and primary sources

| Page / component | Primary visual source | Secondary / measurements |
|---|---|---|
| Login | `lms...login_index.php.png` | MHTML computed styles, `seb-page-default.jpg` |
| Dashboard | `lms...my_ (1).png` | Dashboard HTML computed styles |
| Course | `lms...course_view.php_id=15281.png` | Dashboard computed styles (shared theme) |
| Quiz landing | `lms...mod_quiz_view.php_id=144456.png` | Quiz HTML computed styles |
| Launch dialog | `seb-launch-button-pop-up.png` | — |
| SEB loading | `seb-after-launch-loading-screen.png` | `seb-left-lower-corner-icon.jpg` |
| SEB attempt | `photo_9`, `photo_8`, `photo_12` | `photo_11`, corner-icon photos |
| SEB exit | `exit-quiz-pop-up...jpg` | — |

### 2.3 Extracted computed styles (reference evidence)

From the MHTML / DOM captures at 1440 px:

- `body`: Open Sans, 13 px / 25 px, `#555555`, white background.
- Login card: `max-width: 750px`, `padding: 10px 0`, `border: 8px solid rgba(255,255,255,.35)`, `background: rgba(255,255,255,.85)`, `border-radius: 3px`, `margin-top: 25px`.
- Login form: `background: #EEEEEE`, `padding: 25px 25px 45px`.
- Login input: 648×43 px, `font-size: 14px`, `line-height: 35px`, `padding: 4px 6px`, no border, inset shadow.
- Login button: 648×37 px, `#990000`, white, `border-radius: 2px`, `font-size: 14.04px`.
- Header: total 109 px; logo image 209×63 at 25 px top inset; navbar 50 px `#3A454B`.
- Page container: 5% side margins; main column 954 px and sidebar 296 px with 33 px gap at 1440 px.
- Block title: 16 px / 26 px, weight 700, `#555555`, background `#F2F2F2`, 44 px tall.
- Green button: `#8EC63F`, `border-radius: 2px`, `padding: 6px 18px`, 14.04 px, white.
- Orange link: `#EFA300`.
- Timeline meta: 11.05 px, `#999999`; event title 13 px bold `#333`.
- Quiz landing content column: 964 px wide, starts at x=404 (28% of 1440), 13 px / 25 px.

Where the phone photographs disagree due to camera colour cast, the Moodle theme values above win; the photographs win for SEB chrome geometry and interaction layout.

---

## 3. Design Tokens

### 3.1 Colour palette

| Token | Hex | Usage |
|---|---|---|
| `--red` | `#990000` | Top strip, primary button, active nav item, block icon |
| `--red-dark` | `#7A0000` | Primary button pressed |
| `--nav` | `#3A454B` | Main navigation bar |
| `--nav-hover` | `#2E373C` | Navbar hover |
| `--green` | `#8EC63F` | Secondary/action buttons, cookies button |
| `--green-hover` | `#7CB32F` | Green button hover/pressed |
| `--orange` | `#EFA300` | Links, "Lost password?", flag link, Finish attempt |
| `--orange-hover` | `#C98A00` | Link hover |
| `--pink` | `#EC66A3` | Assignment activity icon tile |
| `--gray-icon` | `#666666` | Quiz activity icon tile (closed) |
| `--text` | `#555555` | Body copy |
| `--text-dark` | `#333333` | Headings, event titles, question text |
| `--muted` | `#999999` | Meta text, time, course labels |
| `--line` | `#DDDDDD` | Dividers, table borders |
| `--line-soft` | `#E8E8E8` | Activity row separators |
| `--surface` | `#FFFFFF` | Page/card background |
| `--block` | `#F2F2F2` | Block header, nav sidebar background |
| `--block-head` | `#ECECEC` | Block header alt (screenshot match) |
| `--footer` | `#323A45` | Footer background |
| `--footer-text` | `#BDC3C7` | Footer text |
| `--timer` | `#C0392B` | Exam countdown box |
| `--flag` | `#E8A33D` | Flag link/icon, flagged corner |
| `--seb-blue` | `#2E7DBF` | SEB wordmark, splash border, globe |
| `--seb-blue-light` | `#4292BD` | Globe rim |
| `--seb-orange` | `#F58233` | SEB wordmark, continents |
| `--seb-modal` | `#161D1C` | Launch dialog background |
| `--seb-teal` | `#80D9CE` | Launch dialog accent text/border |
| `--seb-teal-dark` | `#005049` | Launch dialog primary button |
| `--seb-progress` | `#06B025` | Splash progress bar |
| `--focus` | `#2F6FBF` | Keyboard focus ring, selected radio |

### 3.2 Typography

- Family: **Open Sans**, bundled locally (400, 600, 700; latin subset), fallback `"Segoe UI", Arial, sans-serif`.
- Base: 13 px / 25 px, weight 400, `#555555`.
- Headings use `#555555` (not black). Section titles are regular weight, not bold.
- Sizes:

| Element | Size / line-height | Weight |
|---|---|---|
| Body | 13 / 25 | 400 |
| Block title | 16 / 26 | 700 |
| Page/course section title | 22 / 30 | 400 |
| Exam question title | 15 / 22 | 700 |
| Exam question text | 14 / 22 | 400 |
| Exam option text | 14 / 22 | 400 |
| Exam meta ("Not yet answered") | 12 / 18 | 400 |
| Timer | 13 / 18 | 700 |
| Navbar link | 13 / 30 | 400 |
| Breadcrumb | 12.5 / 25 | 400 |
| Timeline meta | 11 / 15 | 400 |
| Activity type label | 10 / 14, uppercase, 0.4 px tracking | 400 |
| Login input | 14 / 35 | 400 |
| Login button | 14 / 20 | 400 |
| Nav grid numbers | 12 / 1 | 400 |

### 3.3 Spacing system

4 px base: 4, 8, 10, 12, 14, 16, 20, 24, 25, 30, 32, 40.

- Page gutter: 5% of viewport width (min 16 px).
- Block spacing: 14 px bottom margin.
- Content vertical rhythm: 16/25 px line box.
- Section padding: 20 px top/bottom, 44 px header row.
- Exam shell padding: 24 px sides, 20 px top, 56 px bottom (toolbar clearance).

### 3.4 Radius and elevation

- Buttons, cards, modals: 2 px radius (Moodle theme).
- Activity icons: 4 px.
- Login card: 3 px.
- Launch dialog: 14 px.
- Shadows: navbar `0 1px 4px rgba(0,0,0,.07)`; launch dialog `0 10px 30px rgba(0,0,0,.45)`; SEB toolbar `0 -1px 3px rgba(0,0,0,.06)`.

---

## 4. Application Shell

### 4.1 Global page structure (logged-in pages)

```
body
├─ .top-strip                4px #990000
├─ header.site-header
│  ├─ .user-bar              right-aligned bell + name (bold) + avatar "P2"
│  └─ .logo-row              centered KL logo 209×63
├─ nav.navbar                #3A454B, 50px
│  ├─ .nav-links             Home | Dashboard | My courses | Help ▾
│  └─ .nav-search            input + red search button
├─ main.container
│  ├─ .breadcrumb-row        breadcrumbs left, contextual button right
│  └─ .page-grid             main column + 296px sidebar
├─ footer.site-footer        #323A45, 55px
```

### 4.2 Header

| Property | Value |
|---|---|
| Top strip | 4 px, `#990000`, full width |
| User bar | 28 px high, 13 px, right inset 5%; bell icon 16 px `#666`; name bold `#333`; avatar circle 20 px `#EEE`, text 10 px `#666` |
| Logo row | 84 px; logo 209×63, centered, 25 px top |
| Navbar | 50 px; container 5% gutters |
| Nav link | padding 10 px 18 px; 13 px; white; no radius |
| Active | background `#990000` |
| Hover | background `#2E373C` |
| Help | label + 4 px caret |
| Search | input 175 px, transparent on dark, white placeholder "Search courses"; button 54×50 `#990000` with white magnifier |
| Sticky | No |

### 4.3 Footer

55 px, `#323A45`; centered content; two items with 20 px gap: home icon + "www.kluniversity.in", envelope icon + "moodle@kluniversity.in"; 13 px `#BDC3C7`; icons `#8A949C`.

### 4.4 Sidebar (Navigation block)

- Width 296 px; background `#F2F2F2`; radius 2 px; 1 px border `#E3E3E3`.
- Header 44 px: 26×26 orange tile (`#E86F00`) with white sitemap icon, 8 px gap, "Navigation" 16 px bold; header background `#ECECEC`; bottom border `#E0E0E0`.
- Body padding 14 px 6 px; links 13 px `#555`, 20 px rows.
- Tree: expanders (▸/▾) 9 px `#777`; leaf icons 12 px `#777` (home, page, file, chart, gear).
- Top-level rows ("Dashboard") bold; nested rows regular.
- Current course branch open, showing Participants, Competencies, Grades, General, INSEM, END SEM, Topic 3–4.
- "More..." bold with small square marker; "Ticketing" with gear icon.
- Sticky: no; block ends with content.

---

## 5. Login Page (`index.html`)

### 5.1 Composition

- Body background: `squairy_light` 200×200 noise tile (`assets/page-bg.png`), fixed, repeated.
- No navbar, no footer, no user bar.
- KL logo 209×63 centered, 25 px from top.
- Card: width 750 px (+16 px translucent border = 766), centered, margin-top 25 px, background `rgba(255,255,255,.85)`, 8 px translucent white border, 3 px radius, 10 px vertical padding.
- Inner content width 698 px (26 px side inset).

### 5.2 Card content

1. KLU banner component (pure HTML/CSS/SVG): 698×54 px, full-bleed at top, no radius.
2. Form panel `#EEEEEE`, padding 25 px 25 px 45 px.
   - Username input 648×43, white, 14 px, 4 px 6 px padding, inset shadow, 25 px bottom margin; placeholder "Username or email".
   - Password input 648×43, white, same metrics; placeholder "Password".
   - "Log in" button 648×37, `#990000`, white, 2 px radius, 25 px top margin.
   - "Lost password?" orange link 13 px, 6 px below button.
3. "Cookies notice" green button 147×36 centered, 25 px below form panel.

### 5.3 Interaction

- Both fields start **empty**; no default value, no autofill colour.
- Submit with any non-empty username **and** any non-empty password → `dashboard.html`; username stored in `localStorage` for the header. Password is never stored.
- Empty field → 2 px `#B00020` focus outline and inline "Required" message in 12 px red; no page navigation. The button is not disabled, so validation is visible on click.
- "Lost password?" and "Cookies notice" open a small non-blocking toast: "Password recovery is disabled in this simulation." / "This site uses cookies to remember your login session." Toast: white, 1 px `#DDD`, left border 3 px `#EFA300`, 13 px, bottom-center, auto-dismiss 4 s.
- Enter submits. The logout action in the user menu clears the stored username and returns to `index.html`.

---

## 6. Dashboard (`dashboard.html`)

### 6.1 Layout

- Breadcrumb row: "Dashboard" 12.5 px `#555`; right: green "Customise this page" button (168×32).
- Grid: main `1fr` / sidebar 296 px / gap 33 px.
- Main blocks stacked with 14 px gap.

### 6.2 Timeline block

- Header 44 px `#F2F2F2`: 26 px `#990000` disc with white 8-point asterisk, "Timeline" 16 px bold.
- Controls row (60 px, white, bottom border `#DDD`): left green pill 26×26 with clock icon + caret; right green filter button 68×32.
- Date heading: 16 px bold `#333`, 24 px top margin, 8 px left inset.
- Event row: 72 px min-height; 40×40 icon tile on left (4 px radius); meta line 11 px `#999`; title 13 px bold `#333`; action line 10 px uppercase `#999` ("ADD SUBMISSION", "ATTEMPT QUIZ NOW"); right-aligned time 11 px `#999`.
- Assignment rows use pink `#EC66A3`; closed-quiz rows use `#666`.
- Events included:
  - Sat 7 Nov 2026 — Indian Constitution, items 1–3 (due, add submission).
  - Mon 9 Nov 2026 — Ecology & Environment, Home Assignment 3/4 and ALM 3/4.
  - Tue 10 Nov 2026 — Indian Constitution, items 4–6.
  - Tue 24 Nov 2026 — END SEM-CO-1…4 CLOSES, 13:35/14:05/14:35/17:05, each "ATTEMPT QUIZ NOW" → `quiz.html?quiz=END%20SEM-CO-X` with X matching the row.
- "Show more activities" green button 170×32 after the list.

### 6.3 Recently accessed items

- Header identical to Timeline but title "Recently accessed items".
- Two-column grid; each item: 38×38 pink icon tile, title 11 px bold `#333` uppercase, course line 11 px `#999`; 6 px gutter; 64 px row height.
- Items: ENDSEM-CO-4, ENDSEM-CO-3, ENDSEM-CO-2, ENDSEM-CO-1, INSEM.2 CO-4, INSEM.2 CO-3, HOME ASSIGNMENT - 4, SEM IN II -IMP QUESTIONS, END SEM CO-1.
- END SEM CO-1 links to `quiz.html?quiz=END%20SEM-CO-1`; others are inert (`href="#"` + toast "This item is not part of the simulation.").
- "Show more items" green button.

### 6.4 Navigation sidebar

As §4.4. Course entries link to `course.html`; current page "Dashboard" bold; non-course entries inert with toast. "My courses" section expanded.

### 6.5 Navbar links

- Home → `dashboard.html` (active style on Dashboard only when not Home).
- Dashboard → `dashboard.html`.
- My courses → `course.html`.
- Help → small dropdown with "Moodle documentation", "Ask your instructor" (inert).
- Search: on Enter or click, toast "Course search is not available in this simulation." (no navigation).

---

## 7. Course Page (`course.html`)

### 7.1 Layout

Same shell as dashboard. Breadcrumb: `Dashboard › My courses › SELF-OEEE4224M 2026-2027 ODD SEMESTER`. Sidebar nav with SELF-OEEE4224M branch open (Participants, Competencies, Grades, General, INSEM, END SEM, Topic 3, Topic 4). Reached from the dashboard navigation menu course link.

### 7.2 Course sections

Each section:

- Header row 44 px, top and bottom 1 px `#DDDDDD` border (first section has only bottom).
- 26 px `#EEEEEE` circle at left with 10 px `#888` chevron-down.
- Title 22 px / 30 px, weight 400, `#555`, 12 px gap.
- Collapsible: clicking header toggles body with 180 ms height/opacity; chevron rotates −90° when closed.

Section content:

- Activity row: 48×48 icon tile (4 px radius), type label 10 px uppercase `#777`, name 13 px `#555`; right-side outlined "Mark as done" button 93×24 (1 px `#CCC`, white, 12 px `#555`, 2 px radius); bottom 1 px `#E8E8E8` divider; 26 px vertical padding.
- Icons: Forum = orange-red `#F26B5B` tile with white speech bubble; Assignment = pink `#EC66A3` tile with white document-pencil; Quiz = pink `#EC66A3` tile with white checklist.
- General section: Announcements (forum), MOOCs Evaluation (assignment), introductory paragraph with three orange links (truncated with ellipsis), MOOCs Review (assignment, long rubric content A–G in 13 px).
- INSEM section: four quiz rows (INSEM CO-1…CO-4), each showing a small padlock and "Not available unless: You belong to Missing group"; no links or Mark as done buttons.
- END SEM section: four quiz rows (END SEM-CO-1…CO-4), each with Mark as done and a link to `quiz.html?quiz=END%20SEM-CO-X` (X = 1…4).
- Topic 3, Topic 4: empty sections, collapsed bodies (headers only). This replaces the earlier Topic 2 section.
- "Mark as done" toggles to a green "Done" state with check icon; persisted in `localStorage`; toast "Activity marked as done."
- Footer as §4.3.

---

## 8. Quiz Landing Page (`quiz.html`)

### 8.1 Composition (matches reference exactly)

- **No site header, navbar, footer, or sidebar.** White page only.
- Content column: width 964 px, left offset 28% (404 px at 1440), top padding 40 px; 13 px / 25 px.
- Hidden page title for accessibility: "END SEM-CO-1".

Blocks:

1. `.quizinfo` (168 px):
   - "Attempts allowed: 1"
   - "To attempt this quiz you need to know the quiz password"
   - "This quiz has been configured so that students may only attempt it using the Safe Exam Browser."
   - "Time limit: 25 mins"
   - Each line 16 px bottom margin.
2. `.quizattempt` (starts 168 px below):
   - "This quiz is currently not available."
   - "The config key or browser exam keys could not be validated. Please ensure you are using the Safe Exam Browser with correct configuration file."
   - Button stack, each 32 px high, 5 px left inset, 5 px vertical gap:
     - "Download Safe Exam Browser" (232 px) → toast "The real SEB installer is not bundled with this simulation."
     - "Launch Safe Exam Browser" (203 px) → opens launch dialog (§9).
     - "Download configuration" (203 px) → toast "Configuration download is not available in this simulation."
   - "Back to the course" button centered within the column, 158×32, 106 px below the button stack → `course.html`.
- All buttons `#8EC63F`, white, 2 px radius, 14.04 px, padding 6 px 18 px.

### 8.2 Query handling

`?quiz=NAME` sets the document title and hidden heading only. `?co=COx` (CO1–CO4, default CO1) is supplied by the course/timeline link — there is no picker on this page — and is carried through `&attempt=1` into `exam.html?co=COx`.

---

## 9. SEB Launch Dialog

Recreation of the Chrome external-protocol dialog.

- Full-screen backdrop `rgba(0,0,0,.35)`.
- Dialog 500 px wide, `#161D1C`, 14 px radius, padding 24 px, shadow, centered horizontally, 84 px from top.
- Title: "Open Safe Exam Browser?" 20 px / 28 px, weight 600, white.
- Body 16 px below: "https://lms.kluniversity.in wants to open this application." 14 px `#E6E6E6`.
- Checkbox row 18 px below: 18×18 square, 2 px `#8A8A8A` border, transparent; label 13 px `#DADADA` "Always allow lms.kluniversity.in to open links of this type in the associated app". Checked state shows a white check on transparent.
- Footer right-aligned, 24 px top margin:
  - "Open Safe Exam Browser": pill, 44 px high, padding 0 22 px, background `#005049`, text `#80D9CE` 15 px, no border.
  - "Cancel": pill, 44 px high, 2 px `#80D9CE` border, transparent, text `#80D9CE` 15 px; 10 px left gap.
- Focus ring: 2 px `#80D9CE` offset 2 px.
- Cancel / Esc / backdrop closes; focus returns to the launch button.
- Confirm behaviour: call `document.documentElement.requestFullscreen()` **synchronously in the click handler**, then navigate to `quiz.html?quiz=<title>&attempt=1` (§9.1). The splash and exam are deferred until the Attempt quiz action.
- If fullscreen is rejected/unavailable: continue the same flow and show a dismissible strip at the bottom of the exam page: "Fullscreen is unavailable. The exam is running in windowed mode."

### 9.1 Attempt step (`?attempt=1`)

- Same page as §8 with `is-attempt-stage` on `<body>`.
- The three green Download/Launch/Download configuration buttons and the line "This quiz is currently not available." are hidden.
- A red **Attempt quiz** button (`#990000`, white, 2 px radius, 32 px high) sits in the right-hand column, level with the "Attempts allowed" line; "Back to the course" stays below it.
- Clicking Attempt quiz requests fullscreen synchronously, shows the splash (§10), then opens `exam.html` after 2.6 s. A fresh attempt has already been created by the launch confirmation.

---

## 10. SEB Loading Screen

### 10.1 Background

- Full-screen overlay, `#EDEDED` with the same squairy tile at 35% opacity, z-index above all.
- Content centered: SEB splash card 350×200 (fixed), white, 1 px `#2E7DBF` border, no radius, no shadow.

### 10.2 Splash card

- Left: inline SEB globe SVG (150×150), placed 12 px from left, vertically centered. (Globe + grey key recreated from the reference silhouette.)
- Right column (starting x=175, top 14):
  - "SEB" 38 px, weight 800, `#F58233`, line-height 1.
  - Stacked "Safe / Exam / Browser" 14 px / 17 px, weight 600, `#2E7DBF`, uppercase-off.
  - "Version 3.10.3 (x64)" 12 px `#555`, 14 px below.
  - "Copyright © 2025 ETH Zürich,\nIT Services" 9 px / 11 px `#777`.
- Progress bar: 350×22 at the bottom, `#06B025`; inner lighter stripe `#22C93C` travelling left→right over 1.2 s; overall progress 0→100% over 2.4 s.
- Small caption below the card (outside): "Starting Safe Exam Browser…" 12 px `#777`, 16 px margin-top.
- No close control; Esc does not dismiss.

---

## 11. SEB Attempt Interface (`exam.html`)

### 11.1 Kiosk shell

```
body.seb
├─ .seb-top-strip        4px #990000
├─ .seb-topbar           height 52px, white
│  ├─ .seb-back          centered green "Back" 110×30
│  └─ .seb-timer         right, red #C0392B, 150×30
├─ .seb-main             grid 300px + 1fr, gap 24px
│  ├─ aside.quiz-nav
│  └─ section.question-panel
└─ .seb-toolbar          fixed bottom, 34px
```

- No Moodle header, navbar, footer, breadcrumb, or sidebar.
- Background white.
- The Moodle page's thin red top line is retained.

### 11.2 Top bar

- Height 52 px; white; 1 px bottom border `#EAEAEA`.
- "Back" button: absolutely centered horizontally, 110×30, `#8EC63F`, 13 px white, 2 px radius. Opens the "Leave the exam?" modal (Cancel / Leave; Leave keeps the attempt and returns to `quiz.html`); progress is preserved.
- Timer: right 68 px, 150×30, `#C0392B`, white 13 px bold, clock glyph 14 px, text "Time left 0:24:56". Updates every second from `endsAt` (25-minute limit).
- Hamburger (three-line) button: top-right of this bar, 32×32, 20 px icon `#555`; opens the SEB menu panel below it (§11.5).
- Under 5 minutes: timer background `#A93226`; under 1 minute: subtle pulse (scale 1.0→1.03, 1 s alternate).
- At 0:00: freeze, show "Time has expired" notice, open submission summary automatically with only the Submit action.

### 11.3 Quiz navigation

- Card 300 px, background `#F2F2F2`, 1 px `#E0E0E0`, radius 2 px.
- Header 40 px: 22×22 red `#990000` square badge (2 px radius) with a white asterisk, then "Quiz navigation" 13 px bold `#333`, 8 px gap; bottom 1 px `#E0E0E0`. Matches `quiz-navigation-reference-1/2.jpg`.
- Grid: 8 columns, 30 px wide × 40 px tall cells, 3 px gap, padding 12 px 10 px 8 px. Supports **5 to 50 questions** without layout changes: cells wrap row-major (5 → one row; 25 → 8/8/8/1; 50 → 7 rows).
- Cell base: white background, 1 px `#C8C8C8`, 2 px radius, 12 px `#555`, centered; taller-than-wide so the number sits in the white upper area and the answered band sits below.

| State | Style |
|---|---|
| Unanswered | white `#FFFFFF`, border `#C8C8C8`, text `#555` |
| Answered | top half white, bottom half `#6E6E6E` (`linear-gradient(180deg, #FFFFFF 0 50%, #6E6E6E 50% 100%)`), border `#6E6E6E`, text `#333` |
| Flagged | base state + 0 0 0 8 px orange triangle (`#E8A33D`) in top-right corner |
| Current | 2 px solid `#1A1A1A`, bold text; keeps answered/flagged fill |
| Hover | background `#E8F4D9` |
| Focus-visible | 2 px `#2F6FBF` outline, 1 px offset |

- Below the grid: "Finish attempt ..." orange link 13 px, left aligned, 14 px top margin.
- Below that, a compact legend is **not** shown (absent from references).
- For >32 questions the grid keeps 8 columns and the card scrolls; the card is capped at `calc(100vh - 190px)` with a thin `#DDD` scrollbar.
- Card is sticky at 20 px from the top on tall screens.
- **Verification:** each shipped CO set has 25 questions and renders four rows (8/8/8/1); every cell is clickable and "Question 25" is reachable.

### 11.4 Question panel

- Max width 900 px.
- Header strip: background `#F2F2F2`, 46 px, padding 0 16 px; flex baseline gap 24 px.
  - "Question 14" 15 px bold `#333`.
  - Status 12 px `#666`: "Not yet answered" / "Answer saved".
  - "Marked out of 1.00" 12 px `#666`.
  - Right-aligned flag control: outline flag icon 14 px + "Flag question" (or "Unflag question") 13 px `#E8A33D`; on flagged state the icon fills `#E8A33D`.
- Question text: 14 px / 22 px `#333`, margin 20 px 0 16 px.
- Options: vertical list; each 28 px min-height, 8 px gap; custom radio 14 px (`border 1.5px #9A9A9A`, selected: 5 px `#2F6FBF` dot with `#2F6FBF` ring), letter ("a.", "b.") 13 px `#666` fixed 18 px width, option text 14 px `#333`.
- Hover row: background `#F7F7F7` (2 px radius), cursor pointer.
- Selected text: weight 600.
- "Clear my choice" orange link 13 px, 10 px below the options, only when answered.
- Bottom navigation: 36 px top margin; "Previous page" left and "Next page" right, each 130×32 green; disabled at bounds with opacity .55 and no pointer. Next on last question becomes "Finish attempt →" opening the summary.
- Keyboard: ArrowLeft/ArrowRight navigate when focus is not in an input; 1–4 select options; F toggles flag.

### 11.5 SEB bottom toolbar

- Fixed, 44 px high, full width, white, top border `#D6D6D6`, shadow upward.
- Left inset 14 px: inline SEB globe-with-key SVG (30×30) with a 30×3 blue `#1E9BD8` underline beneath it (reference left-corner photo).
- Right group, 14 px inset, 18 px gap:
  - Charging battery SVG (28×14) with plug/bolt and green `#2FBF3F` fill.
  - Language "ENG" 13 px bold `#333`.
  - Clock stacked two lines: time "01:18" 15 px bold `#555` and date "19-11-2026" 11 px `#777`, updating each minute (reference right-corner photo).
  - Power: 26 px `#333` circular power glyph.
- The top-bar hamburger opens a panel below it, fixed at top 56 px / right 16 px: width 260 px, white, 1 px `#CCC`, shadow, 8 px padding.
  - Row 1: "Page Zoom" 13 px `#333`, then zoom-out, "100%", zoom-in icons; buttons adjust document zoom 80–125% in 10% steps (applies `body { zoom }`, clamped; reset on reload).
  - Row 2: "Search page..." 13 px `#555`, magnifier right; clicking reveals an inline search field that highlights matches in the current question text (simple substring highlight) or shows "No matches".
  - Esc/click-outside closes.
- Toolbar clock displays local time, updates each minute.
- Power opens the SEB quit dialog (§13.2).

### 11.6 Attempt state/persistence

`localStorage` key `klu_seb_attempt_v1`:

```json
{
  "attemptId": "end-sem-co-1",
  "quizTitle": "END SEM-CO-1",
  "startedAt": 1763989800000,
  "endsAt": 1763991600000,
  "current": 3,
  "answers": { "q1": "b", "q4": "c" },
  "flags": ["q3"],
  "screen": "attempt",
  "submittedAt": null
}
```

- Read on load; if absent or `endsAt` missing, create a 30-minute attempt starting now.
- Every answer, flag, navigation and screen change is written immediately.
- Refresh restores question, answers, flags and remaining time.
- A submitted attempt is not resumable from `exam.html`; it renders the submitted screen.
- A new attempt is created when "Launch Safe Exam Browser" is confirmed from `quiz.html` (clears answers, flags, endsAt = now + 30 min).

---

## 12. Submission Flow

### 12.1 Summary of attempt

- `screen: "summary"`, same shell; nav card remains, question panel replaced.
- Heading "Summary of attempt" 22 px / 30 px `#333`, 20 px bottom margin.
- Table: one row per question, 44 px, 1 px `#DDD` bottom border.
  - "Question 1" 13 px `#333`, link to jump back.
  - Status: "Answer saved" (`#3C763D`) or "Not yet answered" (`#777`).
  - Flag icon (orange when flagged).
  - "Check" link right-aligned (`#EFA300`) returns to that question.
- Footer actions: "Return to attempt" left (green), "Submit all and finish" right (`#990000`, white, 32 px). Submit disabled-looking only when no questions; still allowed with unanswered questions.
- A yellow notice at top when unanswered > 0: `#FFF3CD` background, `#FFCC00` border, `#856404` text: "You have N unanswered question(s)."

### 12.2 Submit confirmation

- Modal 520 px, white, 4 px radius, backdrop `rgba(0,0,0,.45)`.
- Header 48 px `#F2F2F2`: "Submit all and finish" 16 px bold `#333`, close ×.
- Body 20 px padding: "Once you submit, you will no longer be able to change your answers for this attempt." 14 px `#555`; summary line "Answered X of N · Flagged F".
- Footer right: "Cancel" outlined (`#666` border, 1 px, transparent, 14 px `#555`), "Submit" `#990000` white, both 32 px, 2 px radius.
- Esc/backdrop = Cancel.

### 12.3 Submission result

- `screen: "submitted"` is persisted with `submittedAt`, but **no SEB stats screen is shown**.
- Confirming **Submit** immediately calls `SEB.showSubmission()` and opens `submission.html` (§12.5), for every CO attempt.
- Reopening `exam.html` while `screen === "submitted"` also redirects to `submission.html`; no answered/correct/wrong statistics are displayed anywhere in this result path.
- The Moodle summary page shows only the finished state, the real submission date/time and "Not permitted" / "No more attempts are allowed".

### 12.4 SEB quit dialog (exit)

- Triggered by the toolbar power button at any time (the submitted screen no longer exists).
- Windows-style dialog: 400×190, `#F3F3F3`, 1 px `#999`, 4 px radius, shadow, centered.
- Title strip: "Quit?" 12 px `#666`, 10 px padding, bottom 1 px `#DCDCDC`.
- Body: 40 px blue `#1675AE` circle with white "?" (24 px bold), message "Do you want to quit SEB?" 15 px `#1A1A1A`.
- Footer: two 100×30 buttons, white, 1 px `#999`, 2 px radius, 13 px: "Yes" / "No", 20 px gap, centered.
- "No"/Esc closes. "Yes": if the attempt is still in progress, submit it; then `document.exitFullscreen()` if active, remember `submittedAt`, clear the attempt state, and navigate to `submission.html` (§12.5).
- The dialog is used from the toolbar power button at any time; there is no intermediate warning screen.

### 12.5 Moodle submission summary (`submission.html`)

- Plain white Moodle page like §8 (red top strip, 964 px column at ~28 % offset, no shell header/footer).
- Repeats the four `.quizinfo` lines, with "Time limit: 25 mins".
- Heading "Summary of your previous attempts" 22 px bold `#555`, 26 px above it.
- Table: two columns "State" / "Review" (13 px bold `#333` headers, bottom border `#DCDCDC`); one row with pale `#F7F7F7` background, "Finished" plus the formatted submission date/time (from `sessionStorage.seb_submitted_at`) and "Not permitted" right-aligned.
- Note "No more attempts are allowed" 13 px `#555`, then centered green 158×32 "Back to the course" → `course.html`.

---

## 13. Visual Assets

`./reference/` and `/scratch/` are gitignored and never shipped. `/assets/` **is** tracked: with the user's later permission, the three images extracted from the reference capture are used because the code-only versions were visibly less faithful. All other iconography is inline SVG.

| Asset | Implementation | Notes |
|---|---|---|
| KL header logo (209×63) | `assets/kl.png` | Original logo from the saved MHTML resources. Used on login and on the shell header (160×48 at mobile) via `<img class="kl-logo">`. |
| KLU login banner (698×54) | `assets/klu-banner.jpg` | Original banner from the saved MHTML resources, displayed at its native 698×54 via `<img class="klu-banner">`. |
| Squairy page background | `assets/page-bg.png` | 200×200 `squairy_light` tile decoded from the MHTML, fixed repeat, `#EFEFEF` base. |
| SEB globe + key (splash 150×150, toolbar 22×22) | Inline SVG | Blue circle `#2E7DBF` with light rim, orange continent shapes `#F58233`, grey key body with black grip, matching the reference silhouette. |
| Open Sans 400/600/700 latin | Bundled `fonts/*.woff2` | Third-party font files (not extracted from `reference/`); tracked so the app is offline. Fallback `"Segoe UI", Arial, sans-serif`. |

Icons: hand-authored inline SVG (no icon font), 1.6 px strokes, matching Font Awesome 4 glyph shapes: bell, search, home, clock, filter, caret, sitemap, page, file, chart, gear, flag, check-square, document, speech bubble, magnifier, zoom, battery, power, hamburger, question mark, chevron.

---

## 14. Responsive Behaviour

Primary targets: 1366×768 and 1920×1080. Desktop layout must not exceed comfortable line lengths.

| Breakpoint | Behaviour |
|---|---|
| ≥1600 | Container capped at 1680 px; dashboard sidebar 320 px; exam nav 320 px |
| 1200–1599 | Reference layout (5% gutters, 296 px sidebar, 300 px exam nav) |
| 1024–1199 | Dashboard sidebar 270 px; exam grid 260 px + 1fr; question panel max-width 100% |
| 768–1023 | Sidebar moves below main content; breadcrumb + button wrap; exam nav becomes a horizontal scrollable strip above the question (32 px cells, no sticky); toolbar labels reduce |
| ≤767 | Page gutters 16 px; login card `calc(100% - 24px)` with 8 px border; banner scaled to width; logo 160×48; navbar links scroll horizontally, search hidden; timeline icon 34 px; course titles 19 px; exam top bar 46 px, timer 128 px, Back 92 px; question header wraps to 2 lines; options full width; toolbar hides clock/battery, keeps hamburger + power |
| Height ≤ 700 | Login card margin-top 10 px; exam nav scroll capped at 40vh; toolbar always visible |

Touch: targets ≥32 px; options 40 px rows on touch screens.

---

## 15. Page Flow and File Structure

```
index.html ──login──▶ dashboard.html ──My courses──▶ course.html
   │                        │                          │
   │                        └──recently accessed──────▶ quiz.html
   │                                                   │
   └───────────────────────────────────────────────────┘
                                                       │ Launch SEB (popup)
                                                       ▼
                                             ?attempt=1 → Attempt quiz → loading overlay → exam.html
                                                       │ Finish attempt
                                                       ▼
                                             summary → confirm → submitted
                                                       │ Exit SEB
                                                       ▼
                                             submission.html ──Back to course──▶ course.html
```

Files:

| File | Owner (Phase 2) | Purpose |
|---|---|---|
| `index.html` | A | Login |
| `dashboard.html` | A | Dashboard |
| `course.html` | A | Course (added for the section interface) |
| `styles.css` | A | Shell, login, dashboard, course, shared components |
| `exam.html` | B | SEB attempt shell |
| `exam.js` | B | Question render, nav, flags, timer, summary, submission, toolbar |
| `seb.css` | B | Exam kiosk, nav grid, top-bar menu, quit dialog, launch dialog & splash styles |
| `quiz.html` | C | Quiz landing page |
| `submission.html` | Orchestrator | Moodle "Summary of your previous attempts" page after leaving SEB |
| `app.js` | C | Login, shell interactions, launch modal, fullscreen, loading, state helpers, exit |
| `questions.json` | C | Quiz metadata + 100 PDF MCQs in four CO sets |
| `questions-data.js` | Orchestrator | Generated offline fallback copy of the bank |
| `fonts/*.woff2` | Orchestrator | Bundled Open Sans (offline) |
| `DESIGN.md`, `README.md`, `.gitignore` | Orchestrator | Documentation |

Shared JS contract (implemented in `app.js`, consumed by `exam.js`):

```js
window.SEB = {
  STORAGE_KEY: 'klu_seb_attempt_v1',
  loadQuestions(): Promise<QuizData>,
  getState(): AttemptState,
  saveState(patch): AttemptState,
  resetAttempt(quizMeta): AttemptState,
  formatClock(ms): string,
  requestFullscreen(): Promise<boolean>,
  exitFullscreen(): Promise<void>,
  showLaunchDialog(onConfirm): void,
  startSebLoading(): void,
  toast(message): void
};
```

Shared CSS contract (defined in `seb.css`, used by `quiz.html`/`app.js`): `.seb-backdrop`, `.seb-dialog`, `.seb-dialog__title`, `.seb-dialog__body`, `.seb-btn-pill`, `.seb-btn-pill--primary`, `.seb-splash`, `.seb-splash__logo`, `.seb-splash__progress`.

`questions.json` now contains the 100 MCQs extracted from `reference/Autonomous_Vehicles_Self_Driving_Cars_100_MCQs.pdf`, grouped into four sets of 25 matching the PDF's units:

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
    }
  }
}
```

CO1 = questions 1–25, CO2 = 26–50, CO3 = 51–75, CO4 = 76–100. `app.js:loadQuestions(co)` flattens the chosen set into `{ quiz, questions }` for `exam.js`; the CO travels via `?co=COx`, the attempt state and the splash URL. `questions-data.js` is a generated, committed copy of the same bank loaded as a script for `file://` fallback. Answer keys are informational only — the UI reports answered counts, not a grade. The engine still supports any count from 5 to 50; 25 renders as 8/8/8/1.

Constraints satisfied: pure HTML/CSS/JS, no build, no backend, GitHub Pages compatible, offline after assets are local, flat structure.

Known platform constraint: browsers block `fetch('questions.json')` on `file://` (CORS). Primary path fetches the JSON over HTTP(S); the bundled `questions-data.js` script provides the same four sets offline. Keep both files in sync when editing the bank.

`.gitignore` (required, committed):

```gitignore
# Reference captures and QA scratch — never shipped
/reference/
/scratch/
*.crop.png
/analysis/

# /assets/ is tracked: the three approved images extracted from the reference
# capture (kl.png, klu-banner.jpg, page-bg.png) are part of the shipped UI.

# OS / editor noise
.DS_Store
Thumbs.db
desktop.ini
```

---

## 16. Phase 3–4 Verification Targets

Visual (Playwright, 1366×768 and 1920×1080):

1. Login: logo position, 750 px card, CSS banner, #990000 button, squairy background, **both fields empty**.
2. Dashboard: 50 px navbar, 109 px header, 954/296 column split, 44 px block headers, timeline rows.
3. Course: 22 px section titles, 48 px activity tiles, 24 px "Mark as done".
4. Quiz landing: 964 px column at 28% offset, stacked green buttons.
5. Launch dialog: 500 px, dark #161D1C, teal pill buttons.
6. Splash: 350×200 card, inline SVG logo, wordmark, green progress.
7. Exam: 300 px nav with red square asterisk + "Quiz navigation", 30×40 cells with bottom-half gray answered fill, 8-column grid, 46 px question header, red timer and top-right hamburger menu, green prev/next, 44 px bottom toolbar.
8. **25-question navigator fixture:** four rows (8/8/8/1), all states correct, no overflow outside the card.

Functional:

- Login → dashboard with any non-empty username/password; empty-field validation; My courses → course; course quiz → quiz page; launch → fullscreen + splash → exam.
- Answer, navigate, flag/unflag, summary, submit, exit; refresh persistence of answers, flags, current index, timer; fullscreen-exit notice; timer expiry auto-submit.
- Question count 5 and 25 both render and navigate correctly; last question reachable; Finish attempt visible for both.
- No console errors, no 404s, no unexpected state resets, no network requests to `reference/`.

Acceptance: all journeys above work offline (after load), at both viewports, with no framework and no build step.

---

## 17. Implementation Order (Phase 2)

1. Orchestrator: `questions.json`, `fonts/`, `.gitignore`, shared SVG symbol library contract, QA harness.
2. Agent A: shell pages + `styles.css` (login/dashboard/course, inline CSS banner + KL logo + squairy tile).
3. Agent B: `exam.html`, `exam.js`, `seb.css` (including launch dialog/splash styles, inline SEB globe SVG).
4. Agent C: `quiz.html`, `app.js` (launch, fullscreen, loading), `questions.json` integration.
5. Orchestrator: integrate, resolve class mismatches, 25-question navigator fixture, QA rounds, README.

No agent modifies another agent's files; shared-contract changes go through the orchestrator.
