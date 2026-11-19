/*!
 * app.js — KLU Moodle + Safe Exam Browser portal flow helpers.
 * Framework-free ES2017. Safe to load on every page: every binding is guarded.
 * Exposes window.SEB before exam.js runs (exam.html loads app.js first).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'klu_seb_attempt_v1';
  var USER_KEY = 'klu_moodle_user';
  var DONE_KEY = 'klu_done_activities';
  var WINDOWED_KEY = 'seb_windowed';
  var SUBMITTED_KEY = 'seb_submitted_at';
  var DEFAULT_TITLE = 'END SEM-CO-1';
  var DEFAULT_LIMIT_MINUTES = 30;
  var DEFAULT_USER = 'PENDELA NAGA ABHINAY 2300080175';
  var cachedQuizMeta = null; // quiz metadata prefetched on the landing page

  /* Embedded copy of questions.json, used when fetch() is impossible (file://)
     or the file is missing/offline. Kept in sync with the shipped dataset. */
  var DEFAULT_QUESTIONS = {
    quiz: {
      id: 'end-sem-co-1',
      title: 'END SEM-CO-1',
      course: 'INDIAN CONSTITUTION 2026-2027 ODD SEMESTER',
      timeLimitMinutes: 25,
      attemptsAllowed: 1,
      totalMarks: 5,
      passMark: 3
    },
    questions: [
      {
        id: 'q1',
        text: 'Which planet is known as the Red Planet?',
        options: [
          { id: 'a', text: 'Mercury' },
          { id: 'b', text: 'Venus' },
          { id: 'c', text: 'Mars' },
          { id: 'd', text: 'Jupiter' }
        ],
        answer: 'c',
        marks: 1
      },
      {
        id: 'q2',
        text: 'What is the capital city of Australia?',
        options: [
          { id: 'a', text: 'Sydney' },
          { id: 'b', text: 'Canberra' },
          { id: 'c', text: 'Melbourne' },
          { id: 'd', text: 'Perth' }
        ],
        answer: 'b',
        marks: 1
      },
      {
        id: 'q3',
        text: 'Which gas do plants primarily absorb from the atmosphere during photosynthesis?',
        options: [
          { id: 'a', text: 'Oxygen' },
          { id: 'b', text: 'Nitrogen' },
          { id: 'c', text: 'Carbon dioxide' },
          { id: 'd', text: 'Hydrogen' }
        ],
        answer: 'c',
        marks: 1
      },
      {
        id: 'q4',
        text: 'Who wrote the play "Romeo and Juliet"?',
        options: [
          { id: 'a', text: 'Charles Dickens' },
          { id: 'b', text: 'William Shakespeare' },
          { id: 'c', text: 'Jane Austen' },
          { id: 'd', text: 'Mark Twain' }
        ],
        answer: 'b',
        marks: 1
      },
      {
        id: 'q5',
        text: 'What is the largest ocean on Earth?',
        options: [
          { id: 'a', text: 'Atlantic Ocean' },
          { id: 'b', text: 'Indian Ocean' },
          { id: 'c', text: 'Arctic Ocean' },
          { id: 'd', text: 'Pacific Ocean' }
        ],
        answer: 'd',
        marks: 1
      }
    ]
  };

  var fallbackNoted = false;
  var globeCounter = 0;

  /* ------------------------------------------------------------------ */
  /* Small utilities                                                     */
  /* ------------------------------------------------------------------ */

  function queryParam(name) {
    try {
      if (typeof window.URLSearchParams === 'function') {
        var value = new window.URLSearchParams(window.location.search).get(name);
        if (value !== null) return value;
      }
    } catch (error) {
      /* fall through to manual parsing */
    }
    var match = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    if (!match) return null;
    try {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    } catch (error) {
      return match[1];
    }
  }

  function qs(name, fallback) {
    var value = queryParam(name);
    if (value === null || value === undefined) {
      return fallback === undefined ? null : fallback;
    }
    return value;
  }

  function quizTitleFromQuery() {
    var quiz = qs('quiz', '');
    quiz = String(quiz).trim();
    return quiz || DEFAULT_TITLE;
  }

  function validCo(value) {
    var co = String(value || '').toUpperCase();
    return /^CO[1-4]$/.test(co) ? co : null;
  }

  function coFromQuery() {
    return validCo(qs('co', '')) || 'CO1';
  }

  function slugify(value) {
    var slug = String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'end-sem-co-1';
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  }

  function sessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function sessionSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      /* ignore */
    }
  }

  function sessionRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Attempt state (DESIGN §11.6)                                       */
  /* ------------------------------------------------------------------ */

  function createState(title, minutes, co) {
    var now = Date.now();
    var label = String(title || DEFAULT_TITLE).trim() || DEFAULT_TITLE;
    var limit = Number(minutes) > 0 ? Number(minutes) : DEFAULT_LIMIT_MINUTES;
    return {
      attemptId: slugify(label),
      co: validCo(co) || coFromQuery(),
      quizTitle: label,
      startedAt: now,
      endsAt: now + limit * 60000,
      current: 0,
      answers: {},
      flags: [],
      screen: 'attempt',
      submittedAt: null
    };
  }

  function persistState(state) {
    storageSet(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function getState() {
    var raw = storageGet(STORAGE_KEY);
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed) &&
          typeof parsed.endsAt === 'number' &&
          isFinite(parsed.endsAt)
        ) {
          if (typeof parsed.current !== 'number' || parsed.current < 0) parsed.current = 0;
          if (!parsed.answers || typeof parsed.answers !== 'object' || Array.isArray(parsed.answers)) parsed.answers = {};
          if (!Array.isArray(parsed.flags)) parsed.flags = [];
          if (!parsed.screen) parsed.screen = 'attempt';
          if (parsed.submittedAt === undefined) parsed.submittedAt = null;
          if (!parsed.quizTitle) parsed.quizTitle = quizTitleFromQuery();
          if (!parsed.co) parsed.co = coFromQuery();
          if (!parsed.attemptId) parsed.attemptId = slugify(parsed.quizTitle);
          if (typeof parsed.startedAt !== 'number') parsed.startedAt = Date.now();
          return parsed;
        }
      } catch (error) {
        /* invalid JSON: fall through to a fresh attempt */
      }
    }
    return persistState(createState(quizTitleFromQuery(), DEFAULT_LIMIT_MINUTES, coFromQuery()));
  }

  function saveState(patch) {
    var state = getState();
    if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
      Object.keys(patch).forEach(function (key) {
        state[key] = patch[key];
      });
    }
    return persistState(state);
  }

  function resetAttempt(quizMeta) {
    var meta = quizMeta && typeof quizMeta === 'object' ? quizMeta : {};
    var title = meta.title ? String(meta.title) : quizTitleFromQuery();
    var minutes = Number(meta.timeLimitMinutes) > 0 ? Number(meta.timeLimitMinutes) : DEFAULT_LIMIT_MINUTES;
    var state = createState(title, minutes, meta.co);
    if (meta.id) state.attemptId = String(meta.id);
    return persistState(state);
  }

  function formatClock(ms) {
    var total = Math.floor((Number(ms) || 0) / 1000);
    if (!isFinite(total) || total < 0) total = 0;
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return hours + ':' + (minutes < 10 ? '0' + minutes : String(minutes)) +
      ':' + (seconds < 10 ? '0' + seconds : String(seconds));
  }

  /* ------------------------------------------------------------------ */
  /* Question loading                                                   */
  /* ------------------------------------------------------------------ */

  function validateQuestions(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.questions) || data.questions.length === 0) {
      var shapeError = new Error('questions.json does not contain a valid quiz.questions array.');
      shapeError.code = 'SCHEMA';
      throw shapeError;
    }
    data.questions.forEach(function (question, index) {
      if (!question || typeof question !== 'object' || !question.id || !Array.isArray(question.options) || question.options.length < 2) {
        var questionError = new Error('Question ' + (index + 1) + ' is malformed in questions.json.');
        questionError.code = 'SCHEMA';
        throw questionError;
      }
    });
    if (!data.quiz || typeof data.quiz !== 'object') {
      data.quiz = {
        id: slugify(quizTitleFromQuery()),
        title: quizTitleFromQuery(),
        timeLimitMinutes: DEFAULT_LIMIT_MINUTES,
        attemptsAllowed: 1
      };
    }
    return data;
  }

  // Flatten one CO set into the shape exam.js consumes, preserving the
  // five-question single-set format for backwards compatibility.
  function bankForCo(data, co) {
    var selected = validCo(co) || 'CO1';
    var source = data || {};
    var set = source.sets && source.sets[selected];
    if (set && Array.isArray(set.questions)) {
      return {
        quiz: source.quiz,
        questions: set.questions,
        co: selected,
        setTitle: set.title || ''
      };
    }
    return {
      quiz: source.quiz,
      questions: source.questions || [],
      co: selected,
      setTitle: ''
    };
  }

  function fallbackQuestions(co) {
    if (!fallbackNoted) {
      fallbackNoted = true;
      try {
        window.console.info('[SEB] questions.json could not be fetched (offline or file:// mode). Using the bundled question bank.');
      } catch (error) {
        /* ignore */
      }
    }
    var bank = window.SEB_QUESTION_BANK || DEFAULT_QUESTIONS;
    return bankForCo(JSON.parse(JSON.stringify(bank)), co);
  }

  function loadQuestions(co) {
    var selected = validCo(co) || coFromQuery();
    var isFileProtocol = false;
    try {
      isFileProtocol = window.location.protocol === 'file:';
    } catch (error) {
      isFileProtocol = false;
    }

    // Browsers block fetch() of local files; use the bundled bank immediately.
    if (isFileProtocol) return Promise.resolve(fallbackQuestions(selected));

    return window
      .fetch('questions.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          var httpError = new Error('questions.json could not be loaded (HTTP ' + response.status + ').');
          httpError.code = 'FETCH';
          throw httpError;
        }
        return response.text();
      })
      .then(function (text) {
        var data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          var jsonError = new Error('questions.json contains invalid JSON.');
          jsonError.code = 'PARSE';
          throw jsonError;
        }
        return validateQuestions(bankForCo(data, selected));
      })
      .catch(function (error) {
        // Missing file or offline network: still resolve with the bundled bank.
        if (error && error.code === 'FETCH') return fallbackQuestions(selected);
        if (error && (error.name === 'TypeError' || error.name === 'NetworkError')) return fallbackQuestions(selected);
        // Malformed JSON / schema errors must surface so exam can show an error panel.
        throw error;
      });
  }

  /* ------------------------------------------------------------------ */
  /* Toast (DESIGN §5.3)                                                */
  /* ------------------------------------------------------------------ */

  function toast(message) {
    var region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }

    var element = document.createElement('div');
    element.className = 'toast';

    var inner = document.createElement('div');
    inner.className = 'toast__inner';
    inner.textContent = String(message);
    element.appendChild(inner);
    region.appendChild(element);

    window.setTimeout(function () {
      element.classList.add('is-hiding');
      window.setTimeout(function () {
        if (element.parentNode) element.parentNode.removeChild(element);
      }, 280);
    }, 4000);
  }

  /* ------------------------------------------------------------------ */
  /* Fullscreen                                                         */
  /* ------------------------------------------------------------------ */

  function requestFullscreen() {
    var element = document.documentElement;
    try {
      if (!element || typeof element.requestFullscreen !== 'function') {
        return Promise.resolve(false);
      }
      var request = element.requestFullscreen();
      if (request && typeof request.then === 'function') {
        return request.then(
          function () {
            return true;
          },
          function () {
            return false;
          }
        );
      }
      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  function exitFullscreen() {
    try {
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        var request = document.exitFullscreen();
        if (request && typeof request.catch === 'function') request.catch(function () {});
      }
    } catch (error) {
      /* never throw */
    }
    return Promise.resolve();
  }

  function showSubmission() {
    var finished = null;
    try {
      finished = JSON.parse(storageGet(STORAGE_KEY) || 'null');
    } catch (error) {
      finished = null;
    }
    if (finished && finished.submittedAt) {
      sessionSet(SUBMITTED_KEY, String(finished.submittedAt));
    }
    window.location.href = 'submission.html';
  }

  function quitToCourse() {
    showSubmission();
    exitFullscreen();
    storageRemove(STORAGE_KEY);
    sessionRemove(WINDOWED_KEY);
  }

  /* ------------------------------------------------------------------ */
  /* SEB globe mark (DESIGN §13)                                        */
  /* ------------------------------------------------------------------ */

  function globeSvg(size) {
    var pixels = Math.max(1, Math.round(Number(size) || 150));
    globeCounter += 1;
    var clipId = 'seb-globe-clip-' + globeCounter;
    return (
      '<svg class="seb-globe" xmlns="http://www.w3.org/2000/svg" width="' + pixels + '" height="' + pixels + '" viewBox="0 0 100 100" role="img" aria-label="Safe Exam Browser">' +
        '<defs><clipPath id="' + clipId + '"><circle cx="53" cy="50" r="37"/></clipPath></defs>' +
        '<circle cx="53" cy="50" r="38.5" fill="#2E7DBF"/>' +
        '<circle cx="53" cy="50" r="37.4" fill="none" stroke="#4292BD" stroke-width="2"/>' +
        '<g clip-path="url(#' + clipId + ')">' +
          '<path fill="#F58233" d="M12 42c2-12 14-21 27-22 9-1 15 4 12 10-2 6-11 6-15 11-3 5 1 10 7 11 8 2 11 8 7 14-4 7-13 6-19 2-5-4-9-2-12 3-4 6-10 2-11-5-1-9 0-17 4-24z"/>' +
          '<path fill="#F58233" d="M45 56c6-4 12-1 15 5 3 6 1 13-3 17-4 5-10 5-13 0-3-5-4-13-2-17 1-3 1-4 3-5z"/>' +
          '<path fill="#F58233" d="M62 24c9-4 19 1 23 10 4 9-1 16-8 17-6 1-9-4-11-10-2-5-7-7-8-11-1-3 1-5 4-6z"/>' +
          '<path fill="#F58233" d="M68 59c5-3 11-1 14 4 3 5 0 10-5 11-5 1-9-3-10-7-1-4 0-7 1-8z"/>' +
          '<path fill="#F58233" d="M27 75c9-3 23-2 32 1 8 3 12 7 10 11H21c-4-4-2-9 6-12z"/>' +
        '</g>' +
        '<g transform="rotate(38 53 50)">' +
          '<path fill="#A9A9A9" stroke="#333333" stroke-width="2.6" stroke-linejoin="round" fill-rule="evenodd" d="M7 37h26v26H7V37zm11 8h6v10h-6V45z"/>' +
          '<rect x="32" y="43" width="7" height="14" fill="#333333"/>' +
          '<rect x="39" y="46.5" width="45" height="7" fill="#B5B5B5" stroke="#333333" stroke-width="1.6"/>' +
          '<rect x="50" y="47" width="11" height="6" fill="#333333"/>' +
          '<path fill="#333333" d="M67 53h8v12h-8V53zm10 0h6v8h-6v-8z"/>' +
        '</g>' +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* SEB loading / splash (DESIGN §10)                                  */
  /* ------------------------------------------------------------------ */

  function startSebLoading(co) {
    if (document.querySelector('.seb-backdrop--splash')) return;
    var examUrl = 'exam.html?co=' + (validCo(co) || coFromQuery());

    var backdrop = document.createElement('div');
    backdrop.className = 'seb-backdrop--splash seb-splash-overlay';
    backdrop.innerHTML =
      '<div class="seb-splash" role="status" aria-live="assertive" aria-label="Starting Safe Exam Browser">' +
        '<div class="seb-splash__logo">' + globeSvg(150) + '</div>' +
        '<div class="seb-splash__text">' +
          '<div class="seb-splash__wordmark">SEB</div>' +
          '<div class="seb-splash__product">Safe<br>Exam<br>Browser</div>' +
          '<div class="seb-splash__version">Version 3.10.3 (x64)</div>' +
          '<div class="seb-splash__copyright">Copyright &copy; 2025 ETH Z&uuml;rich,<br>IT Services</div>' +
        '</div>' +
        '<div class="seb-splash__progress"><span></span></div>' +
      '</div>' +
      '<div class="seb-splash__caption">Starting Safe Exam Browser&hellip;</div>';

    document.body.appendChild(backdrop);

    window.setTimeout(function () {
      window.location.href = examUrl;
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* SEB launch dialog (DESIGN §9)                                      */
  /* ------------------------------------------------------------------ */

  function showLaunchDialog(onConfirm) {
    if (document.querySelector('.seb-dialog')) return;

    var launchButton = document.getElementById('launch-seb');
    var previousFocus = document.activeElement;

    var backdrop = document.createElement('div');
    backdrop.className = 'seb-backdrop';
    backdrop.innerHTML =
      '<div class="seb-dialog" role="dialog" aria-modal="true" aria-labelledby="seb-dialog-title">' +
        '<h2 class="seb-dialog__title" id="seb-dialog-title">Open Safe Exam Browser?</h2>' +
        '<p class="seb-dialog__body">https://lms.kluniversity.in wants to open this application.</p>' +
        '<label class="seb-dialog__check">' +
          '<input type="checkbox" id="seb-allow-always" value="1">' +
          '<span class="seb-dialog__check-text">Always allow lms.kluniversity.in to open links of this type in the associated app</span>' +
        '</label>' +
        '<div class="seb-dialog__actions">' +
          '<button type="button" class="seb-btn-pill seb-btn-pill--primary" data-seb-action="confirm">Open Safe Exam Browser</button>' +
          '<button type="button" class="seb-btn-pill" data-seb-action="cancel">Cancel</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);

    var dialog = backdrop.querySelector('.seb-dialog');
    var confirmButton = backdrop.querySelector('[data-seb-action="confirm"]');
    var cancelButton = backdrop.querySelector('[data-seb-action="cancel"]');

    function close() {
      document.removeEventListener('keydown', onKeydown, true);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      var target = launchButton && document.body.contains(launchButton) ? launchButton : previousFocus;
      if (target && typeof target.focus === 'function') {
        try {
          target.focus();
        } catch (error) {
          /* ignore */
        }
      }
    }

    function cancel() {
      close();
    }

    function confirm() {
      // Called synchronously from the click handler: keeps the user gesture
      // required by the Fullscreen API.
      var request = requestFullscreen();

      sessionRemove(WINDOWED_KEY);
      request.then(function (granted) {
        if (!granted) sessionSet(WINDOWED_KEY, '1');
      });

      // A launch from the quiz landing always starts a fresh attempt, using the
      // time limit from questions.json when it was available on the landing page.
      var meta = cachedQuizMeta || {};
      var launchTitle = quizTitleFromQuery() || meta.title || DEFAULT_TITLE;
      var launchCo = coFromQuery();
      resetAttempt({
        title: launchTitle,
        id: meta.id,
        co: launchCo,
        timeLimitMinutes: meta.timeLimitMinutes
      });

      close();

      if (typeof onConfirm === 'function') {
        onConfirm();
        return;
      }

      // The browser confirmation is followed by the Moodle "Attempt quiz"
      // step, which is where SEB actually starts.
      window.location.href = 'quiz.html?quiz=' + encodeURIComponent(launchTitle) + '&co=' + launchCo + '&attempt=1';
    }

    function focusableItems() {
      var nodes = dialog.querySelectorAll('button, input[type="checkbox"], a[href], [tabindex]:not([tabindex="-1"])');
      return Array.prototype.slice.call(nodes).filter(function (node) {
        return !node.disabled && node.offsetParent !== null;
      });
    }

    function onKeydown(event) {
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
        return;
      }
      if (event.key !== 'Tab') return;

      var items = focusableItems();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      var active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    confirmButton.addEventListener('click', confirm);
    cancelButton.addEventListener('click', cancel);
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) cancel();
    });
    document.addEventListener('keydown', onKeydown, true);

    try {
      confirmButton.focus();
    } catch (error) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Login page (DESIGN §5.3)                                           */
  /* ------------------------------------------------------------------ */

  function initLogin() {
    var form = document.getElementById('login-form');
    if (!form) return;

    var username = document.getElementById('username');
    var password = document.getElementById('password');
    var errorBox = document.getElementById('login-error');

    // Both fields must start empty; never restore a password from a password manager.
    [username, password].forEach(function (input) {
      if (input) input.value = '';
    });

    function clearInvalid() {
      [username, password].forEach(function (input) {
        if (!input) return;
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var userValue = username ? String(username.value).trim() : '';
      var passwordValue = password ? String(password.value) : '';
      var firstInvalid = null;

      clearInvalid();

      if (!userValue && username) {
        username.classList.add('is-invalid');
        username.setAttribute('aria-invalid', 'true');
        firstInvalid = firstInvalid || username;
      }
      if (!passwordValue && password) {
        password.classList.add('is-invalid');
        password.setAttribute('aria-invalid', 'true');
        firstInvalid = firstInvalid || password;
      }

      if (!userValue || !passwordValue) {
        if (errorBox) errorBox.textContent = 'Please enter your username and password.';
        if (firstInvalid) {
          try {
            firstInvalid.focus();
          } catch (error) {
            /* ignore */
          }
        }
        return;
      }

      if (errorBox) errorBox.textContent = '';
      storageSet(USER_KEY, userValue); // password is intentionally never stored
      window.location.href = 'dashboard.html';
    });

    [username, password].forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        if (errorBox && !form.querySelector('.is-invalid')) errorBox.textContent = '';
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Shell behaviours (DESIGN §4, §6)                                   */
  /* ------------------------------------------------------------------ */

  function initShellUser() {
    var name = storageGet(USER_KEY) || DEFAULT_USER;
    document.querySelectorAll('.js-username').forEach(function (element) {
      element.textContent = name;
    });
  }

  function initLogout() {
    document.querySelectorAll('.js-logout').forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.preventDefault();
        storageRemove(USER_KEY);
        window.location.href = 'index.html';
      });
    });
  }

  function initSearch() {
    var search = document.getElementById('course-search');
    if (!search) return;

    function notify() {
      toast('Course search is not available in this simulation.');
    }

    if (search.tagName === 'FORM') {
      search.addEventListener('submit', function (event) {
        event.preventDefault();
        notify();
      });
      return;
    }

    search.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        notify();
      }
    });

    var wrapper = search.parentNode;
    var button = wrapper ? wrapper.querySelector('button') : null;
    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        notify();
      });
    }
  }

  function initHelpMenu() {
    var toggle = document.querySelector('.js-help-toggle, .js-help');
    var menu = document.querySelector('.js-help-menu, .help-menu, .nav-help__menu');

    if (!toggle) {
      var candidates = document.querySelectorAll('.navbar a, .navbar button, .nav-links a, .nav-links button');
      for (var index = 0; index < candidates.length; index += 1) {
        var label = (candidates[index].textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (label === 'help' || label.indexOf('help') === 0) {
          toggle = candidates[index];
          break;
        }
      }
    }
    if (!toggle) return;

    if (!menu) {
      var parent = toggle.parentNode;
      if (parent) menu = parent.querySelector('.dropdown-menu, .nav-dropdown, ul');
      if (!menu && toggle.nextElementSibling) {
        var next = toggle.nextElementSibling;
        if (next.tagName === 'UL' || next.querySelector('a')) menu = next;
      }
    }
    if (!menu) return;

    // Keep the inert-link handler from also toasting on this control.
    toggle.setAttribute('data-no-inert', '1');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');

    var open = false;

    function setOpen(nextOpen) {
      open = nextOpen;
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.style.display = open ? 'block' : 'none';
    }

    // Start closed; CSS may also hide the menu, but the inline state wins.
    setOpen(false);

    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      setOpen(!open);
    });

    menu.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('click', function (event) {
      if (!open) return;
      if (menu.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !open) return;
      setOpen(false);
      try {
        toggle.focus();
      } catch (error) {
        /* ignore */
      }
    });
  }

  function initInertLinks() {
    document.addEventListener('click', function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest('a[href="#"]') : null;
      if (!anchor) return;
      if (
        anchor.hasAttribute('data-no-inert') ||
        anchor.classList.contains('js-logout') ||
        anchor.classList.contains('js-help-toggle') ||
        anchor.classList.contains('js-help') ||
        anchor.classList.contains('js-lost-password') ||
        anchor.classList.contains('js-cookies')
      ) {
        return;
      }
      event.preventDefault();
      toast('This item is not part of the simulation.');
    });
  }

  function readDoneList() {
    var raw = storageGet(DONE_KEY);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (value) {
        return typeof value === 'string';
      });
    } catch (error) {
      return [];
    }
  }

  function writeDoneList(list) {
    storageSet(DONE_KEY, JSON.stringify(list));
  }

  function initMarkDone() {
    var buttons = document.querySelectorAll('.js-mark-done');
    if (!buttons.length) return;

    var done = readDoneList();

    buttons.forEach(function (button, index) {
      var activity = button.getAttribute('data-activity') || button.getAttribute('data-id') || 'activity-' + index;
      var defaultLabel = button.getAttribute('data-label') || (button.textContent || '').trim() || 'Mark as done';

      function render(isDone) {
        if (isDone) {
          button.classList.add('is-done');
          button.setAttribute('aria-pressed', 'true');
          button.textContent = 'Done';
        } else {
          button.classList.remove('is-done');
          button.setAttribute('aria-pressed', 'false');
          button.textContent = defaultLabel;
        }
      }

      render(done.indexOf(activity) !== -1);

      button.addEventListener('click', function (event) {
        event.preventDefault();
        var list = readDoneList();
        var isDone = list.indexOf(activity) !== -1;

        if (isDone) {
          list = list.filter(function (value) {
            return value !== activity;
          });
          writeDoneList(list);
          render(false);
          toast('Activity marked as not done.');
        } else {
          list.push(activity);
          writeDoneList(list);
          render(true);
          toast('Activity marked as done.');
        }
      });
    });
  }

  function initSimulationNotices() {
    document.querySelectorAll('.js-lost-password').forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.preventDefault();
        toast('Password recovery is disabled in this simulation.');
      });
    });

    document.querySelectorAll('.js-cookies').forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.preventDefault();
        toast('This site uses cookies to remember your login session.');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Moodle summary after leaving SEB                                   */
  /* ------------------------------------------------------------------ */

  function initSubmission() {
    var dateNode = document.getElementById('submitted-date');
    if (!dateNode) return;
    var stamp = Number(sessionGet(SUBMITTED_KEY)) || Date.now();
    var date = new Date(stamp);
    try {
      var day = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      var time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      dateNode.textContent = 'Submitted ' + day + ', ' + time;
    } catch (error) {
      dateNode.textContent = 'Submitted ' + date.toLocaleString();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Quiz landing (DESIGN §8)                                           */
  /* ------------------------------------------------------------------ */

  function initQuizPage() {
    var isQuizPage = document.body.classList.contains('page-quiz') || !!document.querySelector('.quiz-page');
    if (!isQuizPage) return;

    var title = quizTitleFromQuery();
    var selectedCo = coFromQuery();
    document.title = title;

    var isAttemptStage = qs('attempt') === '1';
    document.body.classList.toggle('is-attempt-stage', isAttemptStage);

    var heading = document.getElementById('quiz-heading') || document.getElementById('quiz-title');
    if (heading) heading.textContent = title;

    // Prefetch the selected set so a launch uses its configured time limit.
    loadQuestions(selectedCo).then(function (data) {
      cachedQuizMeta = data.quiz;
    }).catch(function () {
      cachedQuizMeta = null;
    });

    var launch = document.getElementById('launch-seb');
    if (launch) {
      launch.addEventListener('click', function (event) {
        event.preventDefault();
        showLaunchDialog();
      });
    }

    var download = document.getElementById('download-seb');
    if (download) {
      download.addEventListener('click', function () {
        toast('The real SEB installer is not bundled with this simulation.');
      });
    }

    var configuration = document.getElementById('download-config');
    if (configuration) {
      configuration.addEventListener('click', function () {
        toast('Configuration download is not available in this simulation.');
      });
    }

    var attemptButton = document.getElementById('attempt-quiz');
    if (attemptButton) {
      attemptButton.addEventListener('click', function (event) {
        event.preventDefault();
        // Fullscreen must be requested inside this click handler.
        var request = requestFullscreen();
        sessionRemove(WINDOWED_KEY);
        Promise.resolve(request).then(function (granted) {
          if (!granted) sessionSet(WINDOWED_KEY, '1');
        }).catch(function () {
          sessionSet(WINDOWED_KEY, '1');
        });
        startSebLoading(selectedCo);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Public API (DESIGN §15)                                            */
  /* ------------------------------------------------------------------ */

  window.SEB = {
    STORAGE_KEY: STORAGE_KEY,
    qs: qs,
    getState: getState,
    saveState: saveState,
    resetAttempt: resetAttempt,
    formatClock: formatClock,
    toast: toast,
    loadQuestions: loadQuestions,
    requestFullscreen: requestFullscreen,
    exitFullscreen: exitFullscreen,
    showLaunchDialog: showLaunchDialog,
    startSebLoading: startSebLoading,
    showSubmission: showSubmission,
    quitToCourse: quitToCourse,
    globeSvg: globeSvg
  };

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */

  function init() {
    initLogin();
    initShellUser();
    initLogout();
    initSearch();
    initHelpMenu();
    initInertLinks();
    initMarkDone();
    initSimulationNotices();
    initQuizPage();
    initSubmission();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
