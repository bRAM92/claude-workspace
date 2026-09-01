/**
 * Couche de persistance — localStorage uniquement (app 100% locale, gratuite).
 * Toutes les données restent dans le navigateur. Export/Import JSON pour
 * sauvegarder ou transférer la progression vers un autre appareil.
 */

const STORAGE_KEY = 'ealb1b2:v1';

function defaultData() {
  return {
    version: 1,
    cardStates: {},     // { [cardId]: srsState }
    dailyLog: {},        // { [isoDate]: { newCount, reviewCount, again, hard, good, easy } }
    streak: { current: 0, longest: 0, lastStudyDate: null },
    settings: {
      newPerDay: 20,
      reviewPerDay: 200,
      direction: 'mixed',  // 'en-fr' | 'fr-en' | 'mixed'
      unlockAll: false,
    },
    goals: {
      // objectif "mots/phrases en mémoire long terme" par catégorie, ajustable
      conversational: 3000,
      professional: 3000,
      culinary: 3000,
      finance: 3000,
    },
  };
}

function migrate(data) {
  const d = defaultData();
  return {
    ...d,
    ...data,
    settings: { ...d.settings, ...(data && data.settings) },
    goals: { ...d.goals, ...(data && data.goals) },
    streak: { ...d.streak, ...(data && data.streak) },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.error('Storage load failed, resetting.', e);
    return defaultData();
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCardState(data, cardId) {
  return data.cardStates[cardId] || null;
}

function setCardState(data, cardId, state) {
  data.cardStates[cardId] = state;
}

function recordReview(data, isoDate, gradeName) {
  const log = data.dailyLog[isoDate] || { newCount: 0, reviewCount: 0, again: 0, hard: 0, good: 0, easy: 0 };
  log[gradeName] = (log[gradeName] || 0) + 1;
  log.reviewCount += 1;
  data.dailyLog[isoDate] = log;
}

function recordNewCard(data, isoDate) {
  const log = data.dailyLog[isoDate] || { newCount: 0, reviewCount: 0, again: 0, hard: 0, good: 0, easy: 0 };
  log.newCount += 1;
  data.dailyLog[isoDate] = log;
}

function touchStreak(data, isoDate, addDaysFn) {
  const s = data.streak;
  if (s.lastStudyDate === isoDate) return; // déjà comptabilisé aujourd'hui
  const yesterday = addDaysFn(isoDate, -1);
  if (s.lastStudyDate === yesterday) {
    s.current += 1;
  } else {
    s.current = 1;
  }
  s.longest = Math.max(s.longest, s.current);
  s.lastStudyDate = isoDate;
}

function countNewToday(data, isoDate) {
  const log = data.dailyLog[isoDate];
  return log ? log.newCount : 0;
}

function exportJSON(data) {
  return JSON.stringify(data, null, 2);
}

function importJSON(jsonStr) {
  const parsed = JSON.parse(jsonStr);
  return migrate(parsed);
}

function resetAll() {
  const fresh = defaultData();
  save(fresh);
  return fresh;
}

const EAL_STORAGE_API = {
  STORAGE_KEY, defaultData, migrate, load, save, getCardState, setCardState,
  recordReview, recordNewCard, touchStreak, countNewToday, exportJSON, importJSON, resetAll,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EAL_STORAGE_API;
}
if (typeof window !== 'undefined') {
  window.EAL_STORAGE = EAL_STORAGE_API;
}
