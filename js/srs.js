/**
 * Moteur de répétition espacée (variante SM-2 / Anki-like).
 * Fonctions pures, sans dépendance au DOM — testables directement.
 */

const GRADES = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 };

const DEFAULTS = {
  learningStepsMin: [1, 10],   // minutes, révisions au sein de la même session
  graduatingIntervalDays: 1,   // intervalle après la dernière étape d'apprentissage (Facile)
  easyIntervalDays: 4,         // intervalle si "Parfait" dès l'apprentissage
  startingEase: 2.5,
  minEase: 1.3,
  easyBonus: 1.3,
  hardIntervalMultiplier: 1.2,
  againEasePenalty: 0.2,
  hardEasePenalty: 0.15,
  easyEaseBonus: 0.15,
  maxIntervalDays: 365,
  matureIntervalDays: 21,
};

function todayISO(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

function newCardState() {
  return {
    state: 'new',       // new | learning | review | relearning
    step: 0,            // index dans learningStepsMin
    interval: 0,         // jours (0 tant que pas gradué)
    ease: DEFAULTS.startingEase,
    due: todayISO(),
    reps: 0,
    lapses: 0,
    lastReviewedAt: null,
  };
}

/**
 * Applique une note (grade) à l'état d'une carte et retourne le nouvel état.
 * @param {object} cardState - état courant (voir newCardState)
 * @param {number} grade - GRADES.AGAIN|HARD|GOOD|EASY
 * @param {object} opts - overrides de DEFAULTS + { now: Date }
 */
function grade(cardState, gradeValue, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const s = { ...cardState };
  const today = todayISO(opts.now);
  s.reps += 1;
  s.lastReviewedAt = today;

  const isLearningPhase = s.state === 'new' || s.state === 'learning' || s.state === 'relearning';

  if (isLearningPhase) {
    if (gradeValue === GRADES.AGAIN) {
      s.state = s.state === 'relearning' ? 'relearning' : 'learning';
      s.step = 0;
      s.due = today; // réapparaît dans la session en cours / aujourd'hui
      if (cardState.state === 'review') s.lapses += 1;
      return s;
    }
    if (gradeValue === GRADES.HARD) {
      s.state = s.state === 'relearning' ? 'relearning' : 'learning';
      // reste sur la même étape, réapparaît un peu plus tard dans la session
      s.due = today;
      return s;
    }
    if (gradeValue === GRADES.EASY) {
      s.state = 'review';
      s.interval = cfg.easyIntervalDays;
      s.ease = Math.max(cfg.minEase, s.ease + cfg.easyEaseBonus);
      s.step = 0;
      s.due = addDays(today, s.interval);
      return s;
    }
    // GOOD
    const steps = cfg.learningStepsMin;
    if (s.step < steps.length - 1) {
      s.state = cardState.state === 'relearning' ? 'relearning' : 'learning';
      s.step += 1;
      s.due = today; // encore une étape à passer, plus tard dans la session
      return s;
    }
    // dernière étape franchie -> graduation
    s.state = 'review';
    s.interval = cfg.graduatingIntervalDays;
    s.step = 0;
    s.due = addDays(today, s.interval);
    return s;
  }

  // Carte en révision (state === 'review')
  if (gradeValue === GRADES.AGAIN) {
    s.state = 'relearning';
    s.step = 0;
    s.lapses += 1;
    s.ease = Math.max(cfg.minEase, s.ease - cfg.againEasePenalty);
    s.interval = 1;
    s.due = today; // repasse par une courte étape d'apprentissage
    return s;
  }
  if (gradeValue === GRADES.HARD) {
    s.ease = Math.max(cfg.minEase, s.ease - cfg.hardEasePenalty);
    s.interval = Math.min(cfg.maxIntervalDays, Math.max(s.interval + 1, Math.round(s.interval * cfg.hardIntervalMultiplier)));
    s.due = addDays(today, s.interval);
    return s;
  }
  if (gradeValue === GRADES.EASY) {
    s.ease = Math.max(cfg.minEase, s.ease + cfg.easyEaseBonus);
    s.interval = Math.min(cfg.maxIntervalDays, Math.round(s.interval * s.ease * cfg.easyBonus));
    s.due = addDays(today, s.interval);
    return s;
  }
  // GOOD
  s.interval = Math.min(cfg.maxIntervalDays, Math.round(s.interval * s.ease));
  s.due = addDays(today, s.interval);
  return s;
}

function isMature(cardState, cfg = DEFAULTS) {
  return cardState.state === 'review' && cardState.interval >= cfg.matureIntervalDays;
}

function isDue(cardState, onDate = todayISO()) {
  if (cardState.state === 'new') return false;
  return cardState.due <= onDate;
}

const EAL_SRS_API = { GRADES, DEFAULTS, newCardState, grade, isMature, isDue, todayISO, addDays };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EAL_SRS_API;
}
if (typeof window !== 'undefined') {
  window.EAL_SRS = EAL_SRS_API;
}
