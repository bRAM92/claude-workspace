/* App logique — Anglais B1-B2, flashcards + répétition espacée. 100% local. */
(function () {
  'use strict';

  const { CATEGORIES, getAllCards } = window.EAL_DATA;
  const SRS = window.EAL_SRS;
  const Store = window.EAL_STORAGE;

  const ALL_CARDS = getAllCards();
  const CARDS_BY_ID = Object.fromEntries(ALL_CARDS.map((c) => [c.id, c]));
  const CARDS_BY_CAT = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, ALL_CARDS.filter((c) => c.cat === cat.id)]));

  let data = Store.load();
  let session = null; // { queue: [cardId...], pos, catId, direction, stats:{again,hard,good,easy} }

  const GRADE_LABELS = { [SRS.GRADES.AGAIN]: 'Non acquis', [SRS.GRADES.HARD]: 'Difficile', [SRS.GRADES.GOOD]: 'Facile', [SRS.GRADES.EASY]: 'Parfait' };
  const GRADE_KEYS = ['1', '2', '3', '4'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureCardState(cardId) {
    let s = Store.getCardState(data, cardId);
    if (!s) {
      s = SRS.newCardState();
      Store.setCardState(data, cardId, s);
    }
    return s;
  }

  function isCategoryUnlocked(catId) {
    if (data.settings.unlockAll) return true;
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat.unlock) return true;
    const prereq = CARDS_BY_CAT[cat.unlock.requires];
    const matureCount = prereq.filter((c) => {
      const s = Store.getCardState(data, c.id);
      return s && SRS.isMature(s);
    }).length;
    return matureCount / prereq.length >= cat.unlock.matureRatio;
  }

  function categoryStats(catId) {
    const cards = CARDS_BY_CAT[catId];
    let started = 0, mature = 0, review = 0, learning = 0;
    cards.forEach((c) => {
      const s = Store.getCardState(data, c.id);
      if (!s) return;
      started += 1;
      if (SRS.isMature(s)) mature += 1;
      else if (s.state === 'review') review += 1;
      else learning += 1;
    });
    return { total: cards.length, started, mature, review, learning, new: cards.length - started };
  }

  function dueCards(catId, onDate = SRS.todayISO()) {
    return CARDS_BY_CAT[catId].filter((c) => {
      const s = Store.getCardState(data, c.id);
      return s && SRS.isDue(s, onDate);
    });
  }

  function newCardsAvailable(catId) {
    return CARDS_BY_CAT[catId].filter((c) => !Store.getCardState(data, c.id));
  }

  // ---------- Routing ----------
  function navigate(view) {
    $$('.view').forEach((v) => v.hidden = true);
    $(`#view-${view}`).hidden = false;
    $$('.navbtn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    if (view === 'dashboard') renderDashboard();
    if (view === 'stats') renderStats();
    if (view === 'settings') renderSettings();
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const todayISO = SRS.todayISO();
    const streak = data.streak.current;
    $('#streakCount').textContent = streak;
    $('#newToday').textContent = Store.countNewToday(data, todayISO);
    $('#newTodayLimit').textContent = data.settings.newPerDay;

    const totalMature = ALL_CARDS.filter((c) => {
      const s = Store.getCardState(data, c.id);
      return s && SRS.isMature(s);
    }).length;
    $('#globalMature').textContent = totalMature;
    $('#globalTotal').textContent = ALL_CARDS.length;

    const list = $('#categoryList');
    list.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const unlocked = isCategoryUnlocked(cat.id);
      const stats = categoryStats(cat.id);
      const due = dueCards(cat.id, todayISO).length;
      const newAvail = Math.min(newCardsAvailable(cat.id).length, Math.max(0, data.settings.newPerDay - Store.countNewToday(data, todayISO)));
      const goal = data.goals[cat.id] || 3000;
      const pct = Math.min(100, Math.round((stats.mature / goal) * 100));

      const el = document.createElement('div');
      el.className = 'cat-card' + (unlocked ? '' : ' locked');
      el.style.setProperty('--cat-color', cat.color);
      el.innerHTML = `
        <div class="cat-head">
          <h3>${cat.name}</h3>
          ${unlocked ? '' : '<span class="lock-badge">🔒 verrouillée</span>'}
        </div>
        <div class="cat-progress">
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span>${stats.mature} / ${goal} mots en mémoire long terme (${pct}%)</span>
        </div>
        <div class="cat-meta">
          <span>${due} à réviser</span>
          <span>${newAvail} nouvelles dispo.</span>
          <span>${stats.started}/${stats.total} entamées</span>
        </div>
        ${unlocked
          ? `<button class="btn primary start-session" data-cat="${cat.id}" ${due + newAvail === 0 ? 'disabled' : ''}>Commencer la session</button>`
          : `<p class="lock-hint">Débloquée à 70% de cartes maîtrisées dans « ${CATEGORIES.find(c => c.id === cat.unlock.requires).shortName} ».</p>`}
      `;
      list.appendChild(el);
    });

    $$('.start-session').forEach((btn) => btn.addEventListener('click', () => startSession(btn.dataset.cat)));
  }

  // ---------- Study session ----------
  function buildQueue(catId) {
    const todayISO = SRS.todayISO();
    const due = dueCards(catId, todayISO).map((c) => c.id);
    const remainingNew = Math.max(0, data.settings.newPerDay - Store.countNewToday(data, todayISO));
    const fresh = newCardsAvailable(catId).slice(0, remainingNew).map((c) => c.id);
    const reviewCap = data.settings.reviewPerDay;
    const dueCapped = due.slice(0, reviewCap);
    // mélange léger: nouvelles cartes intercalées tous les 4 révisions
    const queue = [];
    let fi = 0;
    dueCapped.forEach((id, i) => {
      queue.push(id);
      if ((i + 1) % 4 === 0 && fi < fresh.length) queue.push(fresh[fi++]);
    });
    while (fi < fresh.length) queue.push(fresh[fi++]);
    return queue;
  }

  function startSession(catId) {
    const queue = buildQueue(catId);
    if (queue.length === 0) return;
    session = { catId, queue, pos: 0, direction: data.settings.direction, stats: { again: 0, hard: 0, good: 0, easy: 0 }, newIntroduced: new Set() };
    navigate('session');
    renderCard();
  }

  function pickDirection() {
    if (session.direction === 'en-fr') return 'en-fr';
    if (session.direction === 'fr-en') return 'fr-en';
    return Math.random() < 0.5 ? 'en-fr' : 'fr-en';
  }

  let currentDirection = 'en-fr';
  let revealed = false;

  function renderCard() {
    revealed = false;
    if (session.pos >= session.queue.length) return renderSessionEnd();
    const cardId = session.queue[session.pos];
    const card = CARDS_BY_ID[cardId];
    currentDirection = pickDirection();
    const front = currentDirection === 'en-fr' ? card.en : card.fr;
    const back = currentDirection === 'en-fr' ? card.fr : card.en;

    $('#sessionProgress').textContent = `${session.pos + 1} / ${session.queue.length}`;
    $('#sessionProgressBar').style.width = `${Math.round((session.pos / session.queue.length) * 100)}%`;
    $('#cardFront').textContent = front;
    $('#cardBack').textContent = back;
    $('#cardExample').textContent = card.ex || '';
    $('#cardExample').hidden = !card.ex;
    $('#cardSub').textContent = card.sub + ' · ' + card.lvl;
    $('#answerArea').hidden = true;
    $('#showAnswerBtn').hidden = false;
    $('#gradeButtons').hidden = true;
  }

  function revealAnswer() {
    revealed = true;
    $('#answerArea').hidden = false;
    $('#showAnswerBtn').hidden = true;
    $('#gradeButtons').hidden = false;
  }

  function gradeCurrent(gradeValue) {
    if (!revealed) return;
    const cardId = session.queue[session.pos];
    const wasNew = !Store.getCardState(data, cardId);
    const state = ensureCardState(cardId);
    const next = SRS.grade(state, gradeValue);
    Store.setCardState(data, cardId, next);

    const todayISO = SRS.todayISO();
    if (wasNew) Store.recordNewCard(data, todayISO);
    const gradeName = ['again', 'hard', 'good', 'easy'][gradeValue];
    Store.recordReview(data, todayISO, gradeName);
    Store.touchStreak(data, todayISO, SRS.addDays);
    session.stats[gradeName] += 1;
    Store.save(data);

    // si la carte n'est pas graduée (encore en apprentissage), la replacer plus loin dans la file
    const stillLearning = next.state === 'new' || next.state === 'learning' || next.state === 'relearning';
    session.pos += 1;
    if (stillLearning && gradeValue !== SRS.GRADES.EASY) {
      const insertAt = Math.min(session.queue.length, session.pos + (gradeValue === SRS.GRADES.AGAIN ? 3 : 6));
      session.queue.splice(insertAt, 0, cardId);
    }
    renderCard();
  }

  function renderSessionEnd() {
    $('#sessionCard').hidden = true;
    $('#sessionEnd').hidden = false;
    $('#sessionProgressBar').style.width = '100%';
    const s = session.stats;
    $('#sessionSummary').textContent = `Non acquis: ${s.again} · Difficile: ${s.hard} · Facile: ${s.good} · Parfait: ${s.easy}`;
  }

  function endSessionAndGoHome() {
    session = null;
    $('#sessionCard').hidden = false;
    $('#sessionEnd').hidden = true;
    navigate('dashboard');
  }

  // ---------- Stats ----------
  function renderStats() {
    const totalMature = ALL_CARDS.filter((c) => { const s = Store.getCardState(data, c.id); return s && SRS.isMature(s); }).length;
    const totalStarted = ALL_CARDS.filter((c) => Store.getCardState(data, c.id)).length;
    $('#statMature').textContent = totalMature;
    $('#statStarted').textContent = totalStarted;
    $('#statTotal').textContent = ALL_CARDS.length;
    $('#statStreak').textContent = data.streak.current;
    $('#statLongestStreak').textContent = data.streak.longest;

    const byCat = $('#statByCategory');
    byCat.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const s = categoryStats(cat.id);
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `<span>${cat.shortName}</span><span>${s.mature} maîtrisées · ${s.review} en révision · ${s.learning} en apprentissage · ${s.new} nouvelles</span>`;
      byCat.appendChild(row);
    });

    // 14 derniers jours
    const days = [];
    let cursor = SRS.todayISO();
    for (let i = 0; i < 14; i++) { days.unshift(cursor); cursor = SRS.addDays(cursor, -1); }
    const chart = $('#dailyChart');
    chart.innerHTML = '';
    const maxVal = Math.max(1, ...days.map((d) => (data.dailyLog[d] ? data.dailyLog[d].reviewCount : 0)));
    days.forEach((d) => {
      const log = data.dailyLog[d];
      const val = log ? log.reviewCount : 0;
      const bar = document.createElement('div');
      bar.className = 'day-bar';
      bar.title = `${d}: ${val} cartes`;
      bar.style.height = `${Math.max(4, Math.round((val / maxVal) * 60))}px`;
      chart.appendChild(bar);
    });
  }

  // ---------- Settings ----------
  function renderSettings() {
    $('#newPerDay').value = data.settings.newPerDay;
    $('#reviewPerDay').value = data.settings.reviewPerDay;
    $('#directionSelect').value = data.settings.direction;
    $('#unlockAll').checked = data.settings.unlockAll;
    CATEGORIES.forEach((cat) => {
      const input = $(`#goal-${cat.id}`);
      if (input) input.value = data.goals[cat.id];
    });
  }

  function saveSettings() {
    data.settings.newPerDay = Math.max(1, parseInt($('#newPerDay').value, 10) || 20);
    data.settings.reviewPerDay = Math.max(1, parseInt($('#reviewPerDay').value, 10) || 200);
    data.settings.direction = $('#directionSelect').value;
    data.settings.unlockAll = $('#unlockAll').checked;
    CATEGORIES.forEach((cat) => {
      const input = $(`#goal-${cat.id}`);
      if (input) data.goals[cat.id] = Math.max(1, parseInt(input.value, 10) || 3000);
    });
    Store.save(data);
    navigate('dashboard');
  }

  function exportData() {
    const blob = new Blob([Store.exportJSON(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-b1b2-backup-${SRS.todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        data = Store.importJSON(reader.result);
        Store.save(data);
        alert('Sauvegarde importée avec succès.');
        navigate('dashboard');
      } catch (e) {
        alert("Le fichier n'a pas pu être importé (format invalide).");
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!confirm('Cela efface toute ta progression. Continuer ?')) return;
    data = Store.resetAll();
    navigate('dashboard');
  }

  // ---------- Wiring ----------
  function init() {
    $$('.navbtn').forEach((b) => b.addEventListener('click', () => navigate(b.dataset.view)));
    $('#showAnswerBtn').addEventListener('click', revealAnswer);
    $$('.grade-btn').forEach((b) => b.addEventListener('click', () => gradeCurrent(parseInt(b.dataset.grade, 10))));
    $('#endSessionBtn').addEventListener('click', endSessionAndGoHome);
    $('#quitSessionBtn').addEventListener('click', endSessionAndGoHome);
    $('#saveSettingsBtn').addEventListener('click', saveSettings);
    $('#exportBtn').addEventListener('click', exportData);
    $('#importInput').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); });
    $('#resetBtn').addEventListener('click', resetProgress);

    document.addEventListener('keydown', (e) => {
      if ($('#view-session').hidden) return;
      if (!revealed && (e.code === 'Space' || e.key === 'Enter')) { e.preventDefault(); revealAnswer(); return; }
      const idx = GRADE_KEYS.indexOf(e.key);
      if (revealed && idx !== -1) gradeCurrent(idx);
    });

    navigate('dashboard');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
