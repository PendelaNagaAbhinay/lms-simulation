/* ==========================================================================
   KLU Moodle + SEB — examination engine
   Depends on window.SEB (app.js) for questions, persistence and quit/fullscreen.
   ========================================================================== */

(function () {
  'use strict';

  var SEB = null;
  var quiz = null;
  var questions = [];
  var state = null;
  var expired = false;
  var timerId = null;
  var clockId = null;
  var dom = {};
  var navCells = [];
  var activeDialog = null;
  var dialogReturnFocus = null;
  var searchQuery = '';
  var zoomSteps = [80, 90, 100, 110, 120, 125];
  var zoomIndex = 2;
  var restoreDismissed = false;
  var fullscreenSeen = false;
  var lastClock = '';
  var currentCo = 'CO1';

  /* ---------------------------------------------------------------- utils */

  function coFromQuery() {
    var match = /(?:^|[?&])co=([^&]*)/.exec(window.location.search || '');
    var co = match ? decodeURIComponent(match[1]).toUpperCase() : '';
    return /^CO[1-4]$/.test(co) ? co : 'CO1';
  }

  currentCo = coFromQuery();

  function $(id) { return document.getElementById(id); }

  function pad(value) { return value < 10 ? '0' + value : String(value); }

  function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function escapeAttr(value) { return escapeHtml(value); }

  function copyObject(source) {
    var out = {};
    if (source && typeof source === 'object') {
      Object.keys(source).forEach(function (key) { out[key] = source[key]; });
    }
    return out;
  }

  function formatDuration(ms) {
    var total = Math.max(0, Math.round(Number(ms) / 1000));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    if (hours > 0) return hours + ':' + pad(minutes) + ':' + pad(seconds);
    return minutes + ':' + pad(seconds);
  }

  function formatRemaining(ms) {
    if (SEB && typeof SEB.formatClock === 'function') {
      try {
        var text = SEB.formatClock(ms);
        if (typeof text === 'string' && text) return text;
      } catch (err) { /* fall through */ }
    }
    return formatDuration(ms);
  }

  function isTyping(target) {
    if (!target || !target.tagName) return false;
    var tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable === true;
  }

  function currentQuestion() {
    if (!questions.length) return null;
    return questions[clamp(state ? state.current : 0, 0, questions.length - 1)] || null;
  }

  function hasFlag(id) { return !!(state && state.flags && state.flags.indexOf(id) !== -1); }

  function answeredCount() {
    return questions.filter(function (q) { return !!state.answers[q.id]; }).length;
  }

  function flaggedCount() {
    return questions.filter(function (q) { return hasFlag(q.id); }).length;
  }

  /* ------------------------------------------------------------- bootstrap */

  function init() {
    SEB = window.SEB || null;
    cacheDom();
    bindEvents();
    updateClock();
    clockId = window.setInterval(updateClock, 15000);
    // Fullscreen is normally released by the navigation to exam.html, so the
    // landing page records whether the launch request was actually granted.
    var windowedFlag = '';
    try { windowedFlag = window.sessionStorage.getItem('seb_windowed') || ''; } catch (error) { /* ignore */ }
    fullscreenSeen = isFullscreen() || windowedFlag !== '1';

    if (!SEB) {
      showError('The exam engine (app.js) did not load. Reload the page or relaunch Safe Exam Browser.');
      return;
    }

    Promise.resolve()
      .then(function () {
        var saved = SEB.getState && SEB.getState();
        if (saved && saved.co) currentCo = saved.co;
        return SEB.loadQuestions(currentCo);
      })
      .then(function (data) {
        if (!data || !data.quiz || !Array.isArray(data.questions)) {
          throw new Error('The question bank is empty or malformed.');
        }
        if (!data.questions.length) throw new Error('This quiz does not contain any questions yet.');
        if (data.questions.length > 50) {
          // Rendering still works for any count; 5–50 is the supported range.
          data.questions = data.questions.slice(0, 50);
        }

        quiz = data.quiz;
        questions = data.questions;

        state = normalizeState(quiz);
        if (state.screen === 'submitted') {
          if (SEB && typeof SEB.showSubmission === 'function') SEB.showSubmission();
          else window.location.href = 'submission.html';
          return;
        }
        document.title = (state.quizTitle || quiz.title || 'Exam') + ' \u2014 Safe Exam Browser';
        document.documentElement.classList.add('seb-ready');
        dom.loading.hidden = true;
        buildNav();

        if (remainingMs() <= 0) {
          expired = true;
          if (state.screen === 'attempt') {
            state.screen = 'summary';
            persist({ screen: 'summary' });
          }
        }

        renderAll();
        updateFlagControl(currentQuestion());
        if (state.screen !== 'submitted') startTimer();
      })
      .catch(function (err) {
        showError((err && err.message) ? err.message : 'The exam could not be loaded.');
      });
  }

  function cacheDom() {
    dom.main = $('seb-main');
    dom.stage = $('seb-stage');
    dom.nav = $('quiz-nav');
    dom.navGrid = $('quiz-nav-grid');
    dom.navFinish = $('quiz-nav-finish');
    dom.loading = $('seb-loading');
    dom.timer = $('seb-timer');
    dom.timerText = $('seb-timer-text');
    dom.back = $('seb-back');

    dom.screenAttempt = $('screen-attempt');
    dom.screenSummary = $('screen-summary');
    dom.screenSubmitted = $('screen-submitted');
    dom.error = $('seb-error');
    dom.errorMessage = $('seb-error-message');
    dom.errorReload = $('seb-error-reload');

    dom.qTitle = $('q-title');
    dom.qStatus = $('q-status');
    dom.qMarks = $('q-marks');
    dom.qFlag = $('q-flag');
    dom.qFlagLabel = $('q-flag-label');
    dom.qText = $('q-text');
    dom.qOptions = $('q-options');
    dom.qClear = $('q-clear');
    dom.qPrev = $('q-prev');
    dom.qNext = $('q-next');

    dom.summaryTitle = $('summary-title');
    dom.summaryNotice = $('summary-notice');
    dom.summaryTable = $('summary-table');
    dom.summaryReturn = $('summary-return');
    dom.summarySubmit = $('summary-submit');

    dom.submittedTitle = $('submitted-title');
    dom.submittedSub = $('submitted-sub');
    dom.submittedStats = $('submitted-stats');
    dom.exitButton = $('seb-exit');

    dom.restore = $('seb-restore');
    dom.restoreText = $('seb-restore-text');
    dom.restoreBtn = $('seb-restore-btn');
    dom.restoreClose = $('seb-restore-close');

    dom.menuBtn = $('seb-menu-btn');
    dom.menu = $('seb-menu');
    dom.clock = $('seb-clock');
    dom.clockTime = $('seb-clock-time');
    dom.clockDate = $('seb-clock-date');
    dom.zoomOut = $('seb-zoom-out');
    dom.zoomIn = $('seb-zoom-in');
    dom.zoomValue = $('seb-zoom-value');
    dom.searchToggle = $('seb-search-toggle');
    dom.searchBox = $('seb-search-box');
    dom.searchInput = $('seb-search-input');
    dom.searchCount = $('seb-search-count');
    dom.power = $('seb-power');

    dom.submitModal = $('submit-modal');
    dom.submitSummary = $('submit-modal-summary');
    dom.submitClose = $('submit-modal-close');
    dom.submitCancel = $('submit-cancel');
    dom.submitConfirm = $('submit-confirm');

    dom.leaveModal = $('leave-modal');
    dom.leaveClose = $('leave-modal-close');
    dom.leaveCancel = $('leave-cancel');
    dom.leaveConfirm = $('leave-confirm');

    dom.quitDialog = $('quit-dialog');
    dom.quitYes = $('quit-yes');
    dom.quitNo = $('quit-no');
  }

  function normalizeState(meta) {
    var next = null;
    try { next = SEB.getState(); } catch (err) { next = null; }

    if (!next || typeof next !== 'object' || !next.endsAt) {
      if (typeof SEB.resetAttempt === 'function') {
        try { next = SEB.resetAttempt(meta); } catch (err) { next = null; }
      }
    }

    if (!next || typeof next !== 'object') {
      next = {
        attemptId: meta.id,
        quizTitle: meta.title,
        startedAt: Date.now(),
        endsAt: Date.now() + (Number(meta.timeLimitMinutes) || 30) * 60000,
        current: 0,
        answers: {},
        flags: [],
        screen: 'attempt',
        submittedAt: null
      };
      try { SEB.saveState(next); } catch (err) { /* ignore, render read-only */ }
    }

    next.answers = (next.answers && typeof next.answers === 'object') ? next.answers : {};
    next.flags = Array.isArray(next.flags) ? next.flags : [];
    var last = Math.max(questions.length - 1, 0);
    var current = parseInt(next.current, 10);
    next.current = isNaN(current) ? 0 : clamp(current, 0, last);
    if (next.screen !== 'summary' && next.screen !== 'submitted') next.screen = 'attempt';
    if (next.screen === 'submitted' && !next.submittedAt) next.submittedAt = Date.now();
    return next;
  }

  function persist(patch) {
    if (!state) return;
    var next = null;
    try { next = SEB.saveState(patch); } catch (err) { next = null; }
    if (next && typeof next === 'object') {
      Object.keys(next).forEach(function (key) { state[key] = next[key]; });
    } else {
      Object.keys(patch).forEach(function (key) { state[key] = patch[key]; });
    }
    return state;
  }

  function showError(message) {
    if (!dom.error) return;
    dom.loading.hidden = true;
    dom.screenAttempt.hidden = true;
    dom.screenSummary.hidden = true;
    dom.screenSubmitted.hidden = true;
    dom.nav.hidden = true;
    dom.error.hidden = false;
    dom.errorMessage.textContent = message;
    dom.timerText.textContent = 'Time left --:--';
    dom.timer.classList.remove('is-warning', 'is-critical', 'is-expired');
    stopTimer();
  }

  /* ------------------------------------------------------------ navigation */

  function buildNav() {
    dom.navGrid.innerHTML = '';
    navCells = questions.map(function (q, index) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'quiz-nav__cell';
      cell.textContent = String(index + 1);
      cell.setAttribute('data-index', String(index));
      dom.navGrid.appendChild(cell);
      return cell;
    });
  }

  function updateNav() {
    if (!state) return;
    navCells.forEach(function (cell, index) {
      var q = questions[index];
      var answered = !!state.answers[q.id];
      var flagged = hasFlag(q.id);
      var current = index === state.current;
      cell.classList.toggle('is-answered', answered);
      cell.classList.toggle('is-flagged', flagged);
      cell.classList.toggle('is-current', current);
      if (current) cell.setAttribute('aria-current', 'true');
      else cell.removeAttribute('aria-current');
      var label = 'Question ' + (index + 1) + (answered ? ', answered' : ', not answered') + (flagged ? ', flagged' : '') + (current ? ', current' : '');
      cell.setAttribute('aria-label', label);
      cell.disabled = expired || state.screen === 'submitted';
    });
    dom.navFinish.disabled = expired;
  }

  function goTo(index) {
    if (!questions.length || expired || !state) return;
    if (isNaN(index) || index < 0 || index >= questions.length) return;
    state.current = index;
    state.screen = 'attempt';
    persist({ current: index, screen: 'attempt' });
    renderScreen();
  }

  function openSummary() {
    if (!state) return;
    if (state.screen === 'submitted') return;
    state.screen = 'summary';
    persist({ screen: 'summary' });
    renderScreen();
    if (dom.summaryTitle) dom.summaryTitle.focus();
  }

  function returnToAttempt() {
    if (!state || expired) return;
    state.screen = 'attempt';
    persist({ screen: 'attempt' });
    renderScreen();
  }

  /* --------------------------------------------------------------- screens */

  function renderAll() {
    renderScreen();
    updateTimer();
  }

  function renderScreen() {
    if (!state) return;
    dom.screenAttempt.hidden = state.screen !== 'attempt';
    dom.screenSummary.hidden = state.screen !== 'summary';
    dom.screenSubmitted.hidden = state.screen !== 'submitted';
    dom.error.hidden = true;
    dom.nav.hidden = state.screen === 'submitted';
    dom.main.classList.toggle('seb-main--single', state.screen === 'submitted');
    dom.loading.hidden = true;

    if (state.screen === 'attempt') renderQuestion();
    if (state.screen === 'summary') renderSummary();
    if (state.screen === 'submitted') {
      renderSubmitted();
      stopTimer();
    }

    updateNav();
    updateRestore();
  }

  /* -------------------------------------------------------------- question */

  function renderQuestion() {
    var q = currentQuestion();
    if (!q) return;
    var selected = state.answers[q.id] || null;
    var marks = parseFloat(q.marks);
    if (!isFinite(marks)) marks = 1;

    dom.qTitle.textContent = 'Question ' + (state.current + 1);
    dom.qStatus.textContent = selected ? 'Answer saved' : 'Not yet answered';
    dom.qStatus.classList.toggle('is-saved', !!selected);
    dom.qMarks.textContent = 'Marked out of ' + marks.toFixed(2);
    updateFlagControl(q);

    dom.qText.innerHTML = highlightText(q.text);
    dom.qOptions.innerHTML = (q.options || []).map(function (option, index) {
      var id = option && option.id != null ? String(option.id) : String.fromCharCode(97 + index);
      var text = option && option.text != null ? option.text : '';
      var checked = selected === id;
      return '<label class="option' + (checked ? ' is-selected' : '') + '">' +
        '<input type="radio" name="q-option" value="' + escapeAttr(id) + '"' +
        (checked ? ' checked' : '') + (expired ? ' disabled' : '') + '>' +
        '<span class="option__radio" aria-hidden="true"></span>' +
        '<span class="option__letter">' + String.fromCharCode(97 + index) + '.</span>' +
        '<span class="option__text">' + escapeHtml(text) + '</span>' +
        '</label>';
    }).join('');

    dom.qClear.hidden = !selected || expired;
    dom.qClear.disabled = expired;
    dom.qFlag.disabled = expired;
    dom.qPrev.disabled = expired || state.current === 0;
    dom.qNext.disabled = expired;
    dom.qNext.textContent = state.current === questions.length - 1 ? 'Finish attempt \u2192' : 'Next page';
  }

  function updateFlagControl(q) {
    if (!q) {
      dom.qFlag.disabled = true;
      return;
    }
    var flagged = hasFlag(q.id);
    dom.qFlag.classList.toggle('is-flagged', flagged);
    dom.qFlag.setAttribute('aria-pressed', flagged ? 'true' : 'false');
    dom.qFlagLabel.textContent = flagged ? 'Unflag question' : 'Flag question';
  }

  function applySelection() {
    var q = currentQuestion();
    if (!q) return;
    var selected = state.answers[q.id] || null;
    Array.prototype.forEach.call(dom.qOptions.querySelectorAll('.option'), function (label) {
      var input = label.querySelector('input');
      var on = !!(input && input.value === selected);
      if (input) input.checked = on;
      label.classList.toggle('is-selected', on);
    });
    dom.qStatus.textContent = selected ? 'Answer saved' : 'Not yet answered';
    dom.qStatus.classList.toggle('is-saved', !!selected);
    dom.qClear.hidden = !selected || expired;
  }

  function selectOption(optionId) {
    if (!state || expired || state.screen !== 'attempt') return;
    var q = currentQuestion();
    if (!q) return;
    var answers = copyObject(state.answers);
    answers[q.id] = String(optionId);
    persist({ answers: answers });
    applySelection();
    updateNav();
  }

  function clearChoice() {
    if (!state || expired) return;
    var q = currentQuestion();
    if (!q) return;
    var answers = copyObject(state.answers);
    delete answers[q.id];
    persist({ answers: answers });
    applySelection();
    updateNav();
    var first = dom.qOptions.querySelector('input');
    if (first) first.focus();
  }

  function toggleFlag() {
    if (!state || expired) return;
    var q = currentQuestion();
    if (!q) return;
    var flags = state.flags.slice();
    var at = flags.indexOf(q.id);
    if (at === -1) flags.push(q.id);
    else flags.splice(at, 1);
    persist({ flags: flags });
    updateFlagControl(q);
    updateNav();
  }

  /* --------------------------------------------------------------- summary */

  function flagIcon(filled) {
    return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
      '<path d="M3.2 1.6v13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"></path>' +
      '<path d="M4.2 2.2h8.2l-2.1 3 2.1 3H4.2z" fill="' + (filled ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"></path>' +
      '</svg>';
  }

  function renderSummary() {
    var total = questions.length;
    var answered = answeredCount();
    var unanswered = total - answered;

    if (expired) {
      dom.summaryNotice.textContent = 'Time has expired.' +
        (unanswered ? ' You have ' + unanswered + ' unanswered question' + (unanswered === 1 ? '' : 's') + '.' : '') +
        ' Submit your attempt to finish.';
    } else if (unanswered) {
      dom.summaryNotice.textContent = 'You have ' + unanswered + ' unanswered question' + (unanswered === 1 ? '' : 's') + '.';
    }
    dom.summaryNotice.hidden = !(expired || unanswered > 0);

    dom.summaryTable.innerHTML = questions.map(function (q, index) {
      var saved = !!state.answers[q.id];
      var flagged = hasFlag(q.id);
      var disabled = expired ? ' disabled' : '';
      return '<div class="summary-row">' +
        '<button type="button" class="summary-row__q" data-goto="' + index + '"' + disabled + '>Question ' + (index + 1) + '</button>' +
        '<span class="summary-row__status' + (saved ? ' is-saved' : '') + '">' + (saved ? 'Answer saved' : 'Not yet answered') + '</span>' +
        '<span class="summary-row__flag' + (flagged ? ' is-flagged' : '') + '" title="' + (flagged ? 'Flagged' : 'Not flagged') + '" role="img" aria-label="' + (flagged ? 'Flagged' : 'Not flagged') + '">' + flagIcon(flagged) + '</span>' +
        '<button type="button" class="summary-row__check" data-goto="' + index + '"' + disabled + '>Check</button>' +
        '</div>';
    }).join('');

    dom.summaryReturn.hidden = expired;
    dom.summarySubmit.disabled = questions.length === 0;
  }

  /* ------------------------------------------------------------- submitted */

  function submittedStat(label, value) {
    return '<div class="submitted-stat">' +
      '<span class="submitted-stat__label">' + escapeHtml(label) + '</span>' +
      '<span class="submitted-stat__value">' + escapeHtml(value) + '</span>' +
      '</div>';
  }

  function renderSubmitted() {
    var total = questions.length;
    var answered = answeredCount();
    var flagged = flaggedCount();
    var started = Number(state.startedAt) || Date.now();
    var ended = Number(state.submittedAt) || Date.now();
    var used = Math.max(0, ended - started);
    var course = quiz && quiz.course ? quiz.course : '';
    var title = state.quizTitle || (quiz && quiz.title) || '';

    dom.submittedSub.textContent = course && title ? course + ' \u00b7 ' + title : (course || title);
    dom.submittedStats.innerHTML =
      submittedStat('Answered', answered + ' / ' + total) +
      submittedStat('Flagged', String(flagged)) +
      submittedStat('Time used', formatDuration(used));
  }

  /* ---------------------------------------------------------------- timer */

  function remainingMs() {
    if (!state) return 0;
    var ends = Number(state.endsAt);
    if (!isFinite(ends)) return 0;
    return Math.max(0, ends - Date.now());
  }

  function startTimer() {
    stopTimer();
    if (expired) { updateTimer(); return; }
    updateTimer();
    timerId = window.setInterval(updateTimer, 1000);
  }

  function stopTimer() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function updateTimer() {
    if (!state || !dom.timerText) return;
    var ms = remainingMs();
    dom.timerText.textContent = 'Time left ' + formatRemaining(ms);
    dom.timer.classList.toggle('is-warning', ms > 0 && ms < 5 * 60000);
    dom.timer.classList.toggle('is-critical', ms > 0 && ms < 60000);
    dom.timer.classList.toggle('is-expired', ms <= 0);
    if (ms <= 0 && !expired && state.screen !== 'submitted') handleExpiry();
  }

  function handleExpiry() {
    if (expired) return;
    expired = true;
    stopTimer();
    if (!state || state.screen === 'submitted') return;
    state.screen = 'summary';
    persist({ screen: 'summary' });
    renderScreen();
    if (!activeDialog) dom.summaryTitle.focus();
  }

  /* --------------------------------------------------------------- submit */

  function openSubmitModal() {
    if (!state || state.screen === 'submitted') return;
    var total = questions.length;
    dom.submitSummary.textContent = 'Answered ' + answeredCount() + ' of ' + total + ' \u00b7 Flagged ' + flaggedCount();
    openDialog(dom.submitModal, '#submit-confirm');
  }

  function submitAttempt() {
    if (!state || state.screen === 'submitted') return;
    var now = Date.now();
    state.submittedAt = now;
    state.screen = 'submitted';
    persist({ screen: 'submitted', submittedAt: now });
    closeDialog(dom.submitModal, false);
    closeDialog(dom.leaveModal, false);
    stopTimer();
    // The Moodle submission summary replaces the old SEB stats screen.
    if (SEB && typeof SEB.showSubmission === 'function') SEB.showSubmission();
    else window.location.href = 'submission.html';
  }

  /* ----------------------------------------------------------- fullscreen */

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function updateRestore() {
    if (!state || !dom.restore) return;
    var show = !isFullscreen() && !restoreDismissed && state.screen !== 'submitted';
    dom.restore.hidden = !show;
    if (show) {
      dom.restoreText.textContent = fullscreenSeen
        ? 'Fullscreen was exited. Your answers are saved.'
        : 'Fullscreen is not active. The exam is running in windowed mode.';
    }
  }

  function onFullscreenChange() {
    if (isFullscreen()) fullscreenSeen = true;
    updateRestore();
  }

  function requestFullscreenAgain() {
    if (!SEB || typeof SEB.requestFullscreen !== 'function') {
      updateRestore();
      return;
    }
    Promise.resolve(SEB.requestFullscreen()).then(function (ok) {
      if (ok) {
        fullscreenSeen = true;
        updateRestore();
      } else if (SEB.toast) {
        SEB.toast('Fullscreen is unavailable. The exam is running in windowed mode.');
      }
    }).catch(function () {
      if (SEB && SEB.toast) SEB.toast('Fullscreen is unavailable. The exam is running in windowed mode.');
    });
  }

  function exitSeb() {
    if (SEB && typeof SEB.quitToCourse === 'function') SEB.quitToCourse();
    else window.location.href = 'course.html';
  }

  /* ------------------------------------------------------- toolbar helpers */

  function updateClock() {
    if (!dom.clock) return;
    var now = new Date();
    var time = pad(now.getHours()) + ':' + pad(now.getMinutes());
    var date = pad(now.getDate()) + '-' + pad(now.getMonth() + 1) + '-' + now.getFullYear();
    var text = time + ' ' + date;
    if (text !== lastClock) {
      lastClock = text;
      if (dom.clockTime) dom.clockTime.textContent = time;
      if (dom.clockDate) dom.clockDate.textContent = date;
      dom.clock.setAttribute('aria-label', 'Local time ' + time + ', ' + date);
    }
  }

  function applyZoom() {
    var percent = zoomSteps[zoomIndex];
    document.body.style.zoom = percent === 100 ? '' : String(percent / 100);
    dom.zoomValue.textContent = percent + '%';
    dom.zoomOut.disabled = zoomIndex === 0;
    dom.zoomIn.disabled = zoomIndex === zoomSteps.length - 1;
  }

  function openMenu() {
    dom.menu.hidden = false;
    dom.menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!dom.menu || dom.menu.hidden) return;
    dom.menu.hidden = true;
    dom.menuBtn.setAttribute('aria-expanded', 'false');
    dom.searchBox.hidden = true;
    dom.searchToggle.setAttribute('aria-expanded', 'false');
    if (searchQuery) {
      searchQuery = '';
      dom.searchInput.value = '';
      dom.searchCount.textContent = '';
      if (state && state.screen === 'attempt') {
        var q = currentQuestion();
        if (q) dom.qText.innerHTML = highlightText(q.text);
      }
    }
  }

  function toggleMenu() {
    if (dom.menu.hidden) openMenu();
    else closeMenu();
  }

  function countMatches(text) {
    if (!searchQuery) return 0;
    var hay = String(text == null ? '' : text).toLowerCase();
    var needle = searchQuery.toLowerCase();
    var count = 0;
    var at = 0;
    while (needle && (at = hay.indexOf(needle, at)) !== -1) {
      count += 1;
      at += needle.length;
      if (count > 400) break;
    }
    return count;
  }

  function highlightText(text) {
    text = String(text == null ? '' : text);
    if (!searchQuery) return escapeHtml(text);
    var hay = text.toLowerCase();
    var needle = searchQuery.toLowerCase();
    var out = '';
    var from = 0;
    var at;
    var guard = 0;
    while (needle && (at = hay.indexOf(needle, from)) !== -1 && guard < 400) {
      out += escapeHtml(text.slice(from, at));
      out += '<mark class="seb-mark">' + escapeHtml(text.slice(at, at + needle.length)) + '</mark>';
      from = at + needle.length;
      guard += 1;
    }
    out += escapeHtml(text.slice(from));
    return out;
  }

  function updateSearch() {
    searchQuery = dom.searchInput.value.trim();
    if (!SEB) return;
    var q = currentQuestion();
    var matches = q ? countMatches(q.text) : 0;
    dom.searchCount.textContent = !searchQuery ? '' :
      (matches ? matches + (matches === 1 ? ' match' : ' matches') : 'No matches');
    if (q && state && state.screen === 'attempt') {
      dom.qText.innerHTML = highlightText(q.text);
      dom.qText.setAttribute('data-search', searchQuery ? 'on' : 'off');
    }
  }

  /* --------------------------------------------------------------- dialogs */

  function openDialog(backdrop, focusSelector) {
    if (!backdrop) return;
    if (activeDialog && activeDialog !== backdrop) closeDialog(activeDialog, false);
    dialogReturnFocus = document.activeElement;
    backdrop.hidden = false;
    activeDialog = backdrop;
    var target = focusSelector ? backdrop.querySelector(focusSelector) : null;
    if (!target) target = backdrop.querySelector('button, input, a[href]');
    if (target) {
      window.setTimeout(function () {
        try { target.focus(); } catch (err) { /* ignore */ }
      }, 0);
    }
  }

  function closeDialog(backdrop, restoreFocus) {
    if (!backdrop) return;
    backdrop.hidden = true;
    if (activeDialog === backdrop) activeDialog = null;
    if (restoreFocus !== false) {
      var target = dialogReturnFocus;
      dialogReturnFocus = null;
      if (target && document.contains(target) && !target.closest('[hidden]')) {
        try { target.focus(); } catch (err) { /* ignore */ }
      }
    } else {
      dialogReturnFocus = null;
    }
  }

  function trapFocus(event) {
    if (!activeDialog || event.key !== 'Tab') return;
    var nodes = activeDialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    var visible = Array.prototype.filter.call(nodes, function (node) {
      return node.offsetParent !== null || node === document.activeElement;
    });
    if (!visible.length) return;
    var first = visible[0];
    var last = visible[visible.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------------- events */

  function bindEvents() {
    dom.back.addEventListener('click', onBack);

    dom.navGrid.addEventListener('click', function (event) {
      var cell = event.target.closest('.quiz-nav__cell');
      if (!cell || cell.disabled) return;
      goTo(parseInt(cell.getAttribute('data-index'), 10));
    });

    dom.navFinish.addEventListener('click', function () {
      if (!expired) openSummary();
    });

    dom.qOptions.addEventListener('change', function (event) {
      if (event.target && event.target.type === 'radio') selectOption(event.target.value);
    });

    dom.qPrev.addEventListener('click', function () {
      if (!state) return;
      goTo(state.current - 1);
    });

    dom.qNext.addEventListener('click', function () {
      if (!state || expired) return;
      if (state.current >= questions.length - 1) openSummary();
      else goTo(state.current + 1);
    });

    dom.qClear.addEventListener('click', clearChoice);
    dom.qFlag.addEventListener('click', toggleFlag);

    dom.summaryReturn.addEventListener('click', returnToAttempt);
    dom.summarySubmit.addEventListener('click', openSubmitModal);

    dom.summaryTable.addEventListener('click', function (event) {
      var target = event.target.closest('[data-goto]');
      if (!target || target.disabled || expired) return;
      goTo(parseInt(target.getAttribute('data-goto'), 10));
    });

    dom.submitClose.addEventListener('click', function () { closeDialog(dom.submitModal); });
    dom.submitCancel.addEventListener('click', function () { closeDialog(dom.submitModal); });
    dom.submitConfirm.addEventListener('click', submitAttempt);

    dom.leaveClose.addEventListener('click', function () { closeDialog(dom.leaveModal); });
    dom.leaveCancel.addEventListener('click', function () { closeDialog(dom.leaveModal); });
    dom.leaveConfirm.addEventListener('click', function () {
      var title = (state && state.quizTitle) || '';
      window.location.href = 'quiz.html' + (title ? '?quiz=' + encodeURIComponent(title) : '');
    });

    dom.quitNo.addEventListener('click', function () { closeDialog(dom.quitDialog); });
    dom.quitYes.addEventListener('click', function () {
      if (state && state.screen !== 'submitted') submitAttempt();
      closeDialog(dom.quitDialog, false);
      exitSeb();
    });

    dom.exitButton.addEventListener('click', function () {
      openDialog(dom.quitDialog, '#quit-no');
    });

    dom.restoreBtn.addEventListener('click', requestFullscreenAgain);
    dom.restoreClose.addEventListener('click', function () {
      restoreDismissed = true;
      updateRestore();
    });

    dom.menuBtn.addEventListener('click', toggleMenu);
    dom.menu.addEventListener('click', function (event) { event.stopPropagation(); });
    dom.zoomOut.addEventListener('click', function () {
      if (zoomIndex > 0) {
        zoomIndex -= 1;
        applyZoom();
      }
    });
    dom.zoomIn.addEventListener('click', function () {
      if (zoomIndex < zoomSteps.length - 1) {
        zoomIndex += 1;
        applyZoom();
      }
    });
    dom.searchToggle.addEventListener('click', function () {
      var opening = dom.searchBox.hidden;
      dom.searchBox.hidden = !opening;
      dom.searchToggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) dom.searchInput.focus();
    });
    dom.searchInput.addEventListener('input', updateSearch);

    dom.power.addEventListener('click', function () {
      closeMenu();
      if (!state) return;
      openDialog(dom.quitDialog, '#quit-no');
    });

    dom.errorReload.addEventListener('click', function () { window.location.reload(); });

    [dom.submitModal, dom.leaveModal, dom.quitDialog].forEach(function (backdrop) {
      backdrop.addEventListener('click', function (event) {
        if (event.target === backdrop) closeDialog(backdrop);
      });
    });

    document.addEventListener('click', function (event) {
      if (!dom.menu || dom.menu.hidden) return;
      if (dom.menu.contains(event.target) || dom.menuBtn.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    applyZoom();
  }

  function onBack() {
    if (!state) return;
    if (state.screen === 'submitted') openDialog(dom.quitDialog, '#quit-no');
    else openDialog(dom.leaveModal, '#leave-confirm');
  }

  function onKeyDown(event) {
    if (activeDialog) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(activeDialog);
        return;
      }
      trapFocus(event);
      return;
    }

    if (event.key === 'Escape' && dom.menu && !dom.menu.hidden) {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTyping(event.target)) return;
    if (!state || state.screen !== 'attempt' || expired || !questions.length) return;

    if (event.key === 'ArrowLeft') {
      if (state.current > 0) {
        event.preventDefault();
        goTo(state.current - 1);
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (state.current < questions.length - 1) goTo(state.current + 1);
      else openSummary();
    } else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      toggleFlag();
    } else if (event.key >= '1' && event.key <= '4') {
      var q = currentQuestion();
      var index = parseInt(event.key, 10) - 1;
      if (q && q.options && q.options[index]) {
        event.preventDefault();
        selectOption(q.options[index].id);
      }
    }
  }

  /* ------------------------------------------------------------------ boot */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();


