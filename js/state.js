/* Creed Hybrid v2 — state management, storage, and derived analytics. */

const STORAGE_KEY = 'creed.hybrid.v2';
const TOTAL_WEEKS = 8;

const defaultState = {
  week: 1,
  day: 1,
  unit: 'lb',
  screen: 'home',
  playerWD: null, /* "w{week}_d{day}" of the session currently open in the class player */
  liftDone: {},        /* w{w}_d{d}_e{i} -> bool */
  liftLogs: {},         /* w{w}_d{d}_e{i}_s{s} -> {weight,reps,rpe} */
  liftSwaps: {},         /* w{w}_d{d}_e{i} -> name */
  liftCompletedAt: {},    /* w{w}_d{d} -> timestamp */
  finisherOn: { tue: true, fri: true },
  finisherDone: {},        /* w{w}_d{d} -> bool */
  wedCheckin: {},           /* w{w} -> {sleep, soreness, choice, notes, done, completedAt} */
  functionalSessions: {},    /* w{w}_d{d} -> {classId, roundsCompleted, effort, done, completedAt, durationMin} */
  soundCues: true,
  voiceCues: false,
  chartExercise: 'Back Squat',
  bodyweights: [],
  restDone: {}     /* w{w}_d7 -> bool, Sunday rest acknowledgement */
};

const state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
for (const k of ['liftDone', 'liftLogs', 'liftSwaps', 'liftCompletedAt', 'finisherOn', 'finisherDone', 'wedCheckin', 'functionalSessions', 'restDone']) {
  state[k] = Object.assign({}, defaultState[k], state[k]);
}
state.bodyweights = Array.isArray(state.bodyweights) ? state.bodyweights : [];

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------------------------------------------------------------------- */
/* Key helpers                                                            */
/* ---------------------------------------------------------------------- */

function wd(w, d) { return `w${w}_d${d}`; }
function liftDoneKey(w, d, e) { return `w${w}_d${d}_e${e}`; }
function liftLogKey(w, d, e, s) { return `w${w}_d${d}_e${e}_s${s}`; }

function liftDay(day) { return LIFT_DAYS.find(x => x.day === day); }
function allLiftExercises(liftDayDef) { return liftDayDef.primaryLifts.concat(liftDayDef.accessoryLifts); }

function isLiftExerciseDone(w, d, e) { return !!state.liftDone[liftDoneKey(w, d, e)]; }
function toggleLiftExerciseDone(w, d, e) {
  const key = liftDoneKey(w, d, e);
  state.liftDone[key] = !state.liftDone[key];
  if (isLiftDayComplete(w, d)) state.liftCompletedAt[wd(w, d)] = Date.now();
  else delete state.liftCompletedAt[wd(w, d)];
  save();
}

function getLog(w, d, e, s) { return state.liftLogs[liftLogKey(w, d, e, s)] || { weight: '', reps: '', rpe: '' }; }
function setLog(w, d, e, s, field, val) {
  const key = liftLogKey(w, d, e, s);
  const cur = state.liftLogs[key] || { weight: '', reps: '', rpe: '' };
  cur[field] = val;
  state.liftLogs[key] = cur;
  save();
}

function getSwap(w, d, e, original) { return state.liftSwaps[liftDoneKey(w, d, e)] || original; }
function setSwap(w, d, e, val) { state.liftSwaps[liftDoneKey(w, d, e)] = val; save(); }

function isLiftDayComplete(w, d) {
  const def = liftDay(d);
  if (!def) return false;
  return allLiftExercises(def).every((_, i) => isLiftExerciseDone(w, d, i));
}

function clearLiftDay(w, d) {
  const def = liftDay(d);
  if (!def) return;
  allLiftExercises(def).forEach((ex, i) => {
    delete state.liftDone[liftDoneKey(w, d, i)];
    delete state.liftSwaps[liftDoneKey(w, d, i)];
    for (let s = 1; s <= ex.sets; s++) delete state.liftLogs[liftLogKey(w, d, i, s)];
  });
  delete state.liftCompletedAt[wd(w, d)];
  delete state.finisherDone[wd(w, d)];
  save();
}

/* ---------------------------------------------------------------------- */
/* Finishers                                                              */
/* ---------------------------------------------------------------------- */

function finisherDayKey(day) { return day === 2 ? 'tue' : day === 5 ? 'fri' : null; }
function isFinisherOn(day) { const k = finisherDayKey(day); return k ? !!state.finisherOn[k] : false; }
function toggleFinisherOn(day) { const k = finisherDayKey(day); if (!k) return; state.finisherOn[k] = !state.finisherOn[k]; save(); }
function isFinisherDone(w, d) { return !!state.finisherDone[wd(w, d)]; }
function toggleFinisherDone(w, d) { const key = wd(w, d); state.finisherDone[key] = !state.finisherDone[key]; save(); }

/* ---------------------------------------------------------------------- */
/* Wednesday adaptive check-in                                            */
/* ---------------------------------------------------------------------- */

function getWedCheckin(w) { return state.wedCheckin[w] || { sleep: 3, soreness: 3, choice: null, notes: '', done: false }; }
function setWedCheckin(w, field, val) {
  const cur = getWedCheckin(w);
  cur[field] = val;
  state.wedCheckin[w] = cur;
  save();
}
function completeWedChoice(w, choiceId) {
  const cur = getWedCheckin(w);
  cur.choice = choiceId;
  cur.done = true;
  cur.completedAt = Date.now();
  state.wedCheckin[w] = cur;
  save();
}

/* ---------------------------------------------------------------------- */
/* Functional sessions (Wed light/recovery + Saturday flagship)           */
/* ---------------------------------------------------------------------- */

function getFunctionalSession(w, d) { return state.functionalSessions[wd(w, d)] || null; }
function startFunctionalSession(w, d, classId) {
  const key = wd(w, d);
  state.functionalSessions[key] = Object.assign({ classId, roundsCompleted: 0, effort: null, done: false }, state.functionalSessions[key] || {});
  state.functionalSessions[key].classId = classId;
  save();
  return state.functionalSessions[key];
}
function updateFunctionalSession(w, d, patch) {
  const key = wd(w, d);
  state.functionalSessions[key] = Object.assign({}, state.functionalSessions[key] || {}, patch);
  save();
}
function completeFunctionalSession(w, d, patch) {
  updateFunctionalSession(w, d, Object.assign({ done: true, completedAt: Date.now() }, patch));
  if (d === 3) { const c = getWedCheckin(w); c.done = true; state.wedCheckin[w] = c; save(); }
}

/* ---------------------------------------------------------------------- */
/* Sunday rest                                                            */
/* ---------------------------------------------------------------------- */

function isRestAcknowledged(w) { return !!state.restDone[wd(w, 7)]; }
function toggleRestAcknowledged(w) { const key = wd(w, 7); state.restDone[key] = !state.restDone[key]; save(); }

/* ---------------------------------------------------------------------- */
/* Day completion (any type) + weekly percent                             */
/* ---------------------------------------------------------------------- */

function isDayComplete(w, d) {
  const type = DAY_TYPES[d];
  if (type === 'lift') return isLiftDayComplete(w, d);
  if (type === 'adaptive') { const s = getFunctionalSession(w, d); if (s && s.done) return true; return getWedCheckin(w).done; }
  if (type === 'functional') { const s = getFunctionalSession(w, d); return !!(s && s.done); }
  if (type === 'rest') return isRestAcknowledged(w);
  return false;
}

function weekPercent(w) { let n = 0; for (let d = 1; d <= 7; d++) if (isDayComplete(w, d)) n++; return Math.round((n / 7) * 100); }

/* ---------------------------------------------------------------------- */
/* 1RM / volume / personal bests                                          */
/* ---------------------------------------------------------------------- */

function estimated1RM(weight, reps) { const w = Number(weight) || 0, r = Number(reps) || 0; if (!w || !r) return 0; return Math.round(w * (1 + r / 30)); }

function exerciseSlots(name) {
  const refs = [];
  LIFT_DAYS.forEach(dd => allLiftExercises(dd).forEach((ex, idx) => { if (ex.n === name) refs.push({ day: dd.day, exIndex: idx, sets: ex.sets }); }));
  return refs;
}

function historyForName(name) {
  const refs = exerciseSlots(name);
  return Array.from({ length: TOTAL_WEEKS }, (_, i) => {
    const week = i + 1;
    let top = 0, best1RM = 0, totalRpe = 0, c = 0;
    refs.forEach(ref => {
      for (let s = 1; s <= ref.sets; s++) {
        const log = getLog(week, ref.day, ref.exIndex, s);
        const wt = Number(log.weight || 0), reps = Number(log.reps || 0), rpe = Number(log.rpe || 0);
        top = Math.max(top, wt);
        best1RM = Math.max(best1RM, estimated1RM(wt, reps));
        if (rpe) { totalRpe += rpe; c++; }
      }
    });
    return { week, top, best1RM, avgRpe: c ? totalRpe / c : 0 };
  });
}

function allLiftNames() { const names = new Set(); LIFT_DAYS.forEach(d => allLiftExercises(d).forEach(ex => names.add(ex.n))); return [...names]; }

function personalBests() {
  return allLiftNames().map(name => {
    const hist = historyForName(name);
    const best = hist.reduce((acc, cur) => (cur.top > acc.top ? cur : acc), { week: null, top: 0, best1RM: 0 });
    return { name, weight: best.top, week: best.week, est1RM: best.best1RM };
  }).filter(x => x.weight > 0).sort((a, b) => b.est1RM - a.est1RM);
}

function weeklyTonnage(w) {
  let total = 0;
  LIFT_DAYS.forEach(dd => allLiftExercises(dd).forEach((ex, i) => {
    for (let s = 1; s <= ex.sets; s++) { const log = getLog(w, dd.day, i, s); total += (Number(log.weight) || 0) * (Number(log.reps) || 0); }
  }));
  return total;
}

const RPE_INTENSITY_FACTOR = { 'RPE 3–4 · easy': 0.4, 'RPE 5–6 · conversational': 0.55, 'RPE 6–7 · max intent, low fatigue': 0.65, 'RPE 7 · sustainable grind': 0.75, 'RPE 7–8 · hard but steady': 0.8, 'RPE 8 · race pace': 0.85, 'RPE 8–9 · flagship effort': 0.95 };

function weeklyTrainingLoad(w) {
  const tonnage = weeklyTonnage(w);
  const liftLoad = Math.min(100, tonnage / 120); /* normalized index, not a physical unit */
  let functionalMin = 0;
  [3, 6].forEach(d => { const s = getFunctionalSession(w, d); if (s && s.done) functionalMin += (s.durationMin || 0) * (RPE_INTENSITY_FACTOR[classById(s.classId) ? classById(s.classId).intensityTarget : ''] || 0.6); });
  return Math.round(liftLoad + functionalMin);
}

/* ---------------------------------------------------------------------- */
/* Streak + history log                                                   */
/* ---------------------------------------------------------------------- */

function allCompletionTimestamps() {
  const ts = [];
  Object.values(state.liftCompletedAt).forEach(t => ts.push(t));
  Object.values(state.functionalSessions).forEach(s => { if (s.done && s.completedAt) ts.push(s.completedAt); });
  Object.values(state.wedCheckin).forEach(c => { if (c.done && c.completedAt) ts.push(c.completedAt); });
  return ts;
}

function dateStr(ts) { return new Date(ts).toISOString().slice(0, 10); }

function currentStreak() {
  const days = new Set(allCompletionTimestamps().map(dateStr));
  if (!days.size) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dateStr(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateStr(cursor.getTime()))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function historyEntries() {
  const entries = [];
  Object.keys(state.liftCompletedAt).forEach(key => {
    const [w, d] = key.replace('w', '').split('_d').map(Number);
    const def = liftDay(d);
    if (!def) return;
    const tonnage = allLiftExercises(def).reduce((sum, ex, i) => { let t = 0; for (let s = 1; s <= ex.sets; s++) { const log = getLog(w, d, i, s); t += (Number(log.weight) || 0) * (Number(log.reps) || 0); } return sum + t; }, 0);
    entries.push({ type: 'lift', w, d, title: def.title, ts: state.liftCompletedAt[key], summary: `${WEEKDAY_NAMES[d - 1]} · ${Math.round(tonnage).toLocaleString()} ${state.unit} volume` });
  });
  Object.keys(state.functionalSessions).forEach(key => {
    const s = state.functionalSessions[key];
    if (!s.done) return;
    const [w, d] = key.replace('w', '').split('_d').map(Number);
    const cls = classById(s.classId);
    entries.push({ type: 'functional', w, d, title: cls ? cls.name : 'Functional session', ts: s.completedAt, summary: `${WEEKDAY_NAMES[d - 1]} · ${s.roundsCompleted || 0} rounds${s.effort ? ` · RPE ${s.effort}` : ''}` });
  });
  Object.keys(state.wedCheckin).forEach(wKey => {
    const c = state.wedCheckin[wKey];
    if (!c.done || c.choice !== 'rest') return;
    entries.push({ type: 'rest', w: Number(wKey), d: 3, title: 'Wednesday Full Rest', ts: c.completedAt || Date.now(), summary: 'Recovery day taken' });
  });
  return entries.sort((a, b) => b.ts - a.ts);
}
