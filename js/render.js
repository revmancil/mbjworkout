/* Creed Hybrid v2 — screen rendering. All DOM building lives here. */

let returnScreen = 'home';
let playerRuntime = null; /* { stage:'choice'|'setup'|'live'|'summary', week, day, classId, plan, engine } */

function realWeekday() { return ((new Date().getDay() + 6) % 7) + 1; }

function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }

function drawLineChart(canvas, points, emptyMsg) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const cssWidth = Math.max(Math.floor(canvas.getBoundingClientRect().width || 320), 280);
  const cssHeight = 200;
  canvas.width = Math.floor(cssWidth * ratio); canvas.height = Math.floor(cssHeight * ratio);
  const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const w = cssWidth, h = cssHeight;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#0f0f14'; ctx.fillRect(0, 0, w, h);
  const pad = { l: 40, r: 12, t: 16, b: 26 }; const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const max = Math.max(...points.map(p => Number(p.value) || 0), 0); const topMax = max ? max * 1.15 : 100;
  ctx.strokeStyle = '#2a2a35'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { const y = pad.t + (plotH / 3) * i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); }
  ctx.fillStyle = '#8f8f9b'; ctx.font = '11px system-ui';
  points.forEach((p, i) => { const x = pad.l + (plotW / Math.max(points.length - 1, 1)) * i; ctx.fillText(p.label, x - 10, h - 8); });
  if (!points.some(p => Number(p.value) > 0)) { ctx.fillStyle = '#b4b4bf'; ctx.font = '14px system-ui'; ctx.fillText(emptyMsg, 20, 105); return; }
  ctx.beginPath();
  points.forEach((p, i) => { const x = pad.l + (plotW / Math.max(points.length - 1, 1)) * i; const y = pad.t + plotH - ((Number(p.value) || 0) / topMax) * plotH; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.stroke();
  points.forEach((p, i) => { const x = pad.l + (plotW / Math.max(points.length - 1, 1)) * i; const y = pad.t + plotH - ((Number(p.value) || 0) / topMax) * plotH; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = Number(p.value) ? '#e11d2e' : '#4b4b56'; ctx.fill(); });
}

function drawBarChart(canvas, points, emptyMsg) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const cssWidth = Math.max(Math.floor(canvas.getBoundingClientRect().width || 320), 280);
  const cssHeight = 200;
  canvas.width = Math.floor(cssWidth * ratio); canvas.height = Math.floor(cssHeight * ratio);
  const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const w = cssWidth, h = cssHeight;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#0f0f14'; ctx.fillRect(0, 0, w, h);
  const pad = { l: 10, r: 10, t: 16, b: 26 }; const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const max = Math.max(...points.map(p => Number(p.value) || 0), 0);
  if (!max) { ctx.fillStyle = '#b4b4bf'; ctx.font = '14px system-ui'; ctx.fillText(emptyMsg, 20, 105); return; }
  const bw = plotW / points.length;
  ctx.fillStyle = '#8f8f9b'; ctx.font = '10px system-ui';
  points.forEach((p, i) => {
    const barH = (Number(p.value) / max) * (plotH - 6);
    const x = pad.l + i * bw + bw * 0.18;
    ctx.fillStyle = p.highlight ? '#ffd23f' : '#e11d2e';
    ctx.fillRect(x, pad.t + plotH - barH, bw * 0.64, barH);
    ctx.fillStyle = '#8f8f9b';
    ctx.fillText(p.label, pad.l + i * bw + bw * 0.5 - 8, h - 8);
  });
}

/* ---------------------------------------------------------------------- */
/* Navigation                                                             */
/* ---------------------------------------------------------------------- */

function switchScreen(name, opts) {
  opts = opts || {};
  const detail = ['lifting', 'player', 'block'].includes(name);
  if (!detail) { returnScreen = name; state.screen = name; save(); }
  $$('.screen').forEach(el => el.classList.toggle('active', el.id === `screen-${name}`));
  $$('.bottom-nav .tab').forEach(el => el.classList.toggle('active', el.dataset.screen === (detail ? returnScreen : name)));
  $('#backBtn').style.display = detail ? 'block' : 'none';
  $('#bottomNav').style.display = (name === 'player' && playerRuntime && playerRuntime.stage === 'live') ? 'none' : 'grid';
  $('#timerFab').style.display = (name === 'lifting') ? 'block' : 'none';
  renderScreen(name);
}

function renderScreen(name) {
  if (name === 'home') renderHome();
  else if (name === 'schedule') renderSchedule();
  else if (name === 'lifting') renderLifting();
  else if (name === 'player') renderPlayer();
  else if (name === 'progress') renderProgress();
  else if (name === 'history') renderHistory();
  else if (name === 'block') renderBlock();
  else if (name === 'settings') renderSettings();
  renderTopbar();
}

function renderTopbar() {
  $('#topBlockWeek').textContent = `W${state.week}`;
  $('#topStreak').textContent = String(currentStreak());
}

function openDay(week, day) {
  state.week = week; state.day = day; save();
  const type = DAY_TYPES[day];
  if (type === 'lift') { switchScreen('lifting'); return; }
  if (type === 'functional') { playerRuntime = { stage: 'setup', week, day, classId: weekTheme(week).satClassId }; switchScreen('player'); return; }
  if (type === 'adaptive') { playerRuntime = { stage: 'choice', week, day }; switchScreen('player'); return; }
  if (type === 'rest') { switchScreen('schedule'); return; }
}

/* ---------------------------------------------------------------------- */
/* Home                                                                    */
/* ---------------------------------------------------------------------- */

function renderHome() {
  const today = realWeekday();
  const type = DAY_TYPES[today];
  const theme = weekTheme(state.week);
  const phase = liftingPhaseForWeek(state.week);
  const load = weeklyTrainingLoad(state.week);
  const pct = weekPercent(state.week);

  let todayCardHtml = '';
  if (type === 'lift') {
    const def = liftDay(today);
    const done = isLiftDayComplete(state.week, today);
    todayCardHtml = `
      <div class="badge red">Lift Day · ${def.emphasis}</div>
      <div class="today-type">${def.title}</div>
      <div class="today-meta">${def.goal}<br><b>${allLiftExercises(def).length} exercises</b> · est. ${def.estDurationMin} min</div>
      <div class="exlist">${allLiftExercises(def).map(ex => `<div class="li"><span>${ex.n}</span><span>${ex.sets}×${ex.reps}</span></div>`).join('')}</div>
      <button class="btn primary block" id="homeStartBtn" style="margin-top:12px">${done ? 'Review session' : 'Start training'}</button>`;
  } else if (type === 'functional') {
    const cls = classById(theme.satClassId);
    const s = getFunctionalSession(state.week, today);
    todayCardHtml = `
      <div class="badge gold">Flagship Saturday · ${theme.satTheme}</div>
      <div class="today-type">${cls.name}</div>
      <div class="today-meta">${cls.objective}<br><b>${cls.baseDurationMin} min</b> · ${cls.intensityTarget}</div>
      <button class="btn primary block" id="homeStartBtn" style="margin-top:12px">${s && s.done ? 'Review session' : 'Start class'}</button>`;
  } else if (type === 'adaptive') {
    const checkin = getWedCheckin(state.week);
    if (checkin.done) {
      const opt = WEDNESDAY_OPTIONS.find(o => o.id === checkin.choice);
      todayCardHtml = `
        <div class="badge blue">Wednesday · Adaptive</div>
        <div class="today-type">${opt ? opt.label : 'Recovery'}</div>
        <div class="today-meta">Completed for this week. Nice work protecting Thursday.</div>
        <button class="btn alt block" id="homeStartBtn" style="margin-top:12px">Open Wednesday</button>`;
    } else {
      const rec = wednesdayRecommendation(checkin.sleep, checkin.soreness);
      const recOpt = WEDNESDAY_OPTIONS.find(o => o.id === rec.id);
      todayCardHtml = `
        <div class="badge blue">Wednesday · Adaptive</div>
        <div class="today-type">Readiness check-in</div>
        <div class="readiness-banner"><b>Suggested: ${recOpt.label}</b><div class="muted" style="margin-top:4px;font-size:13px">${rec.reason}</div></div>
        <button class="btn primary block" id="homeStartBtn" style="margin-top:12px">Do Wednesday check-in</button>`;
    }
  } else {
    const done = isRestAcknowledged(state.week);
    todayCardHtml = `
      <div class="badge purple">Sunday · Full Rest</div>
      <div class="today-type">Recovery Day</div>
      <div class="today-meta">No structured training. Sleep, hydrate, and get ready for Monday.</div>
      <button class="btn ${done ? 'alt' : 'primary'} block" id="homeRestBtn" style="margin-top:12px">${done ? 'Marked recovered' : 'Mark recovery complete'}</button>`;
  }

  $('#homeContent').innerHTML = `
    <div class="card today-card">
      <div class="kicker">${WEEKDAY_NAMES[today - 1]} · Today's Training</div>
      ${todayCardHtml}
    </div>
    <div class="card">
      <div class="kicker">This block</div>
      <div class="row" style="justify-content:space-between">
        <div><strong style="font-family:var(--display);font-size:20px">Week ${state.week} of 8</strong><div class="muted" style="font-size:13px">${phase.phase} phase</div></div>
        <div class="badge gold">${theme.satTheme}</div>
      </div>
      <div class="progress-bar" style="margin-top:12px"><span style="width:${pct}%"></span></div>
      <div class="row" style="justify-content:space-between;margin-top:6px;font-size:13px"><span class="muted">Week completion</span><b>${pct}%</b></div>
      <div class="stats" style="margin-top:12px">
        <div class="stat"><span>Streak</span><b>${currentStreak()} day${currentStreak() === 1 ? '' : 's'}</b></div>
        <div class="stat"><span>Training load</span><b>${load}</b></div>
      </div>
    </div>
    <div class="card">
      <div class="kicker">Weekly split</div>
      <div class="stack" style="gap:8px">
        ${[1, 2, 3, 4, 5, 6, 7].map(d => {
          const t = DAY_TYPES[d]; const label = t === 'lift' ? liftDay(d).emphasis : t === 'functional' ? weekTheme(state.week).satTheme : t === 'adaptive' ? 'Adaptive recovery / light conditioning' : 'Full rest';
          return `<div class="day-tile" data-open-day="${d}"><div class="dinfo"><strong><span class="daytype-dot ${t}"></span>${WEEKDAY_NAMES[d - 1]}</strong><small>${label}</small></div>${d === today ? '<span class="badge red">Today</span>' : ''}</div>`;
        }).join('')}
      </div>
    </div>`;

  const startBtn = $('#homeStartBtn');
  if (startBtn) startBtn.addEventListener('click', () => openDay(state.week, today));
  const restBtn = $('#homeRestBtn');
  if (restBtn) restBtn.addEventListener('click', () => { toggleRestAcknowledged(state.week); renderHome(); renderTopbar(); });
  $$('#homeContent [data-open-day]').forEach(el => el.addEventListener('click', () => openDay(state.week, Number(el.dataset.openDay))));
}

/* ---------------------------------------------------------------------- */
/* Schedule                                                                */
/* ---------------------------------------------------------------------- */

function renderSchedule() {
  const theme = weekTheme(state.week);
  const weekStrip = Array.from({ length: 8 }, (_, i) => i + 1).map(w => `<button class="week-chip ${w === state.week ? 'active' : ''}" data-week="${w}">W${w}</button>`).join('');
  const dayTiles = [1, 2, 3, 4, 5, 6, 7].map(d => {
    const type = DAY_TYPES[d];
    const complete = isDayComplete(state.week, d);
    let title, sub;
    if (type === 'lift') { const def = liftDay(d); title = def.title; sub = `${def.emphasis} · est. ${def.estDurationMin} min`; }
    else if (type === 'functional') { const cls = classById(theme.satClassId); title = cls.name; sub = `${theme.satTheme} · ${cls.baseDurationMin} min`; }
    else if (type === 'adaptive') { title = 'Adaptive: Rest, Recovery, or Light Functional'; sub = 'Readiness-based recommendation'; }
    else { title = 'Full Rest'; sub = 'Sleep, hydrate, reset'; }
    return `<div class="day-tile ${complete ? 'done' : ''}" data-day="${d}">
      <div class="dinfo"><strong><span class="daytype-dot ${type}"></span>${WEEKDAY_NAMES[d - 1]} · ${title}</strong><small>${sub}</small></div>
      ${complete ? '<span class="badge green">Done</span>' : '<span class="muted">&rsaquo;</span>'}
    </div>`;
  }).join('');

  $('#scheduleContent').innerHTML = `
    <div class="card">
      <div class="kicker">Block week</div>
      <div class="week-strip">${weekStrip}</div>
      <div class="row" style="justify-content:space-between;margin-top:10px">
        <span class="muted">${liftingPhaseForWeek(state.week).phase} phase</span>
        <strong>${weekPercent(state.week)}% complete</strong>
      </div>
    </div>
    <div class="card">
      <div class="kicker">Monday &rarr; Sunday</div>
      <div class="stack" style="gap:8px">${dayTiles}</div>
    </div>`;

  $$('#scheduleContent .week-chip').forEach(btn => btn.addEventListener('click', () => { state.week = Number(btn.dataset.week); save(); renderSchedule(); renderTopbar(); }));
  $$('#scheduleContent [data-day]').forEach(tile => tile.addEventListener('click', () => {
    const d = Number(tile.dataset.day);
    if (DAY_TYPES[d] === 'rest') { toggleRestAcknowledged(state.week); renderSchedule(); renderTopbar(); return; }
    openDay(state.week, d);
  }));
}

/* ---------------------------------------------------------------------- */
/* Lifting session                                                         */
/* ---------------------------------------------------------------------- */

function suggestionFor(ex) {
  const hist = historyForName(ex.n);
  const current = hist.find(h => h.week === state.week);
  const prior = hist.find(h => h.week === Math.max(1, state.week - 1));
  const source = (current && current.top) ? current : prior;
  const phase = liftingPhaseForWeek(state.week);
  if (phase.phase === 'Deload') return `Deload week: cut load ~10–20% and total sets slightly. Keep every rep smooth.`;
  if (!source || !source.top) return `${phase.phase} phase: ${phase.guidance}`;
  const step = state.unit === 'lb' ? (ex.incLb || 2.5) : (ex.incKg || 1);
  let next = source.top;
  if (source.avgRpe && source.avgRpe <= 7.5) next += step;
  else if (source.avgRpe && source.avgRpe >= 9) next -= Math.max(step / 2, state.unit === 'lb' ? 2.5 : 1);
  next = Math.round(next / (state.unit === 'lb' ? 2.5 : 0.5)) * (state.unit === 'lb' ? 2.5 : 0.5);
  return `${phase.phase} phase — if that felt around RPE ${source.avgRpe ? source.avgRpe.toFixed(1) : '7–8'}, try about ${next} ${state.unit} next time.`;
}

function renderExerciseCard(def, ex, exIndex, groupLabel) {
  const done = isLiftExerciseDone(state.week, state.day, exIndex);
  const currentName = getSwap(state.week, state.day, exIndex, ex.n);
  const alts = [ex.n].concat(LIFT_REPLACEMENTS[ex.n] || []);
  const card = document.createElement('div');
  card.className = `exercise ${done ? 'done' : ''}`;
  const best = personalBests().find(p => p.name === ex.n);
  card.innerHTML = `
    <div class="exercise-top">
      <div><span class="badge ${groupLabel === 'Primary' ? 'red' : 'blue'}" style="margin-bottom:6px">${groupLabel}</span><h4>${currentName}</h4><small>${ex.cue}</small></div>
      <div class="sr">${ex.sets}×${ex.reps}<span>${done ? 'done' : 'work'}</span></div>
    </div>
    ${best ? `<div class="muted" style="font-size:12px">PR: ${best.weight} ${state.unit} · est. 1RM ${best.est1RM} ${state.unit}</div>` : ''}
    <select class="field swap">${alts.map(o => `<option ${o === currentName ? 'selected' : ''}>${o}</option>`).join('')}</select>
    <div class="hint">${suggestionFor(ex)}</div>
    <div class="set-grid"></div>
    <button class="btn ${done ? 'alt' : 'primary'} block done-btn">${done ? 'Completed' : 'Mark complete'}</button>`;
  card.querySelector('.done-btn').addEventListener('click', () => { toggleLiftExerciseDone(state.week, state.day, exIndex); renderLifting(); renderTopbar(); });
  card.querySelector('.swap').addEventListener('change', e => { setSwap(state.week, state.day, exIndex, e.target.value); renderLifting(); });
  const grid = card.querySelector('.set-grid');
  for (let s = 1; s <= ex.sets; s++) {
    const log = getLog(state.week, state.day, exIndex, s);
    const row = document.createElement('div'); row.className = 'set-row';
    row.innerHTML = `<div class="set-id">${s}</div>
      <input class="field" type="number" inputmode="decimal" step="${state.unit === 'lb' ? '2.5' : '0.5'}" value="${log.weight}" placeholder="${ex.bodyweight ? 'added load' : 'weight'}" />
      <input class="field" type="number" inputmode="numeric" step="1" value="${log.reps}" placeholder="reps" />
      <input class="field" type="number" inputmode="decimal" step="0.5" min="1" max="10" value="${log.rpe}" placeholder="RPE" />`;
    const [wt, reps, rpe] = row.querySelectorAll('input');
    wt.addEventListener('input', e => setLog(state.week, state.day, exIndex, s, 'weight', e.target.value));
    reps.addEventListener('input', e => setLog(state.week, state.day, exIndex, s, 'reps', e.target.value));
    rpe.addEventListener('input', e => setLog(state.week, state.day, exIndex, s, 'rpe', e.target.value));
    grid.appendChild(row);
  }
  return card;
}

function renderLifting() {
  const def = liftDay(state.day);
  if (!def) { switchScreen('home'); return; }
  const doneCount = allLiftExercises(def).filter((_, i) => isLiftExerciseDone(state.week, state.day, i)).length;
  const pct = Math.round((doneCount / allLiftExercises(def).length) * 100);
  const finisherKey = finisherDayKey(state.day);
  const finisher = finisherKey ? finisherForWeek(finisherKey, state.week) : null;

  const container = $('#liftingContent');
  container.innerHTML = `
    <div class="card">
      <div class="kicker">Week ${state.week} · ${WEEKDAY_NAMES[state.day - 1]}</div>
      <h2 class="section-title">${def.title}</h2>
      <div class="muted" style="font-size:14px;line-height:1.55">${def.goal}</div>
      <div class="tip" style="margin-top:10px"><b>Warm-up:</b> ${def.warmup}</div>
      <div class="progress-bar" style="margin-top:12px"><span style="width:${pct}%"></span></div>
      <div class="row" style="justify-content:space-between;margin-top:6px">
        <strong>${pct}% complete</strong>
        <button class="btn alt slim" id="resetDayBtn">Reset day</button>
      </div>
    </div>
    <div id="exerciseList" class="stack"></div>
    ${finisher ? `<div class="card" id="finisherCard"></div>` : ''}`;

  const list = $('#exerciseList');
  def.primaryLifts.forEach((ex, i) => list.appendChild(renderExerciseCard(def, ex, i, 'Primary')));
  def.accessoryLifts.forEach((ex, i) => list.appendChild(renderExerciseCard(def, ex, def.primaryLifts.length + i, 'Accessory')));

  if (finisher) {
    const on = isFinisherOn(state.day);
    const fdone = isFinisherDone(state.week, state.day);
    $('#finisherCard').innerHTML = `
      <div class="kicker">Optional finisher</div>
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div><strong style="font-size:16px">${finisher.n}</strong><div class="muted" style="font-size:13px;margin-top:2px">${finisher.duration} · ${finisher.equipment}</div></div>
        <div class="switch ${on ? 'on' : ''}" id="finisherToggle"><div class="knob"></div></div>
      </div>
      ${on ? `<div class="tip" style="margin-top:10px">${finisher.structure}</div><div class="hint" style="margin-top:8px">${finisher.cue}</div>
      <button class="btn ${fdone ? 'alt' : 'primary'} block" id="finisherDoneBtn" style="margin-top:10px">${fdone ? 'Finisher completed' : 'Mark finisher complete'}</button>` : `<div class="muted" style="font-size:13px;margin-top:8px">Toggled off for this day.</div>`}`;
    $('#finisherToggle').addEventListener('click', () => { toggleFinisherOn(state.day); renderLifting(); });
    const fbtn = $('#finisherDoneBtn'); if (fbtn) fbtn.addEventListener('click', () => { toggleFinisherDone(state.week, state.day); renderLifting(); renderTopbar(); });
  }

  $('#resetDayBtn').addEventListener('click', () => { clearLiftDay(state.week, state.day); renderLifting(); renderTopbar(); });
}

/* ---------------------------------------------------------------------- */
/* Functional class player                                                 */
/* ---------------------------------------------------------------------- */

function renderClassPickerOptions(week, day) {
  return WEDNESDAY_OPTIONS.map(opt => {
    const cls = opt.classId ? classById(opt.classId) : null;
    return `<div class="class-card" data-choice="${opt.id}">
      <div class="catline">${opt.label}</div>
      <b>${cls ? cls.name : 'No session'}</b>
      <p>${opt.description}</p>
      ${cls ? `<div class="class-meta"><span>${cls.baseDurationMin} min</span><span>${cls.intensityTarget}</span><span>${cls.format}</span></div>` : ''}
    </div>`;
  }).join('');
}

function renderPlayer() {
  if (!playerRuntime) { switchScreen('home'); return; }
  const { week, day } = playerRuntime;
  const container = $('#playerContent');

  if (playerRuntime.stage === 'choice') {
    const checkin = getWedCheckin(week);
    const rec = wednesdayRecommendation(checkin.sleep, checkin.soreness);
    container.innerHTML = `
      <div class="card">
        <div class="kicker">Week ${week} · Wednesday readiness check-in</div>
        <h2 class="section-title">How are you feeling?</h2>
        <div class="stack" style="gap:14px;margin-top:6px">
          <div><label class="muted" style="font-size:13px">Sleep quality last night (1 great — 5 rough)</label>
            <div class="seg-wrap" style="grid-template-columns:repeat(5,1fr)" id="sleepSeg">${[1,2,3,4,5].map(n => `<button class="seg ${checkin.sleep===n?'active':''}" data-sleep="${n}">${n}</button>`).join('')}</div></div>
          <div><label class="muted" style="font-size:13px">Muscle soreness / fatigue (1 fresh — 5 wrecked)</label>
            <div class="seg-wrap" style="grid-template-columns:repeat(5,1fr)" id="sorenessSeg">${[1,2,3,4,5].map(n => `<button class="seg ${checkin.soreness===n?'active':''}" data-soreness="${n}">${n}</button>`).join('')}</div></div>
        </div>
        <div class="readiness-banner" style="margin-top:14px"><b>Recommended: ${WEDNESDAY_OPTIONS.find(o=>o.id===rec.id).label}</b><div class="muted" style="margin-top:4px;font-size:13px">${rec.reason}</div></div>
      </div>
      <div class="card">
        <div class="kicker">Choose your path (any option is fine)</div>
        <div class="stack">${renderClassPickerOptions(week, day)}</div>
      </div>`;
    $$('#sleepSeg [data-sleep]').forEach(b => b.addEventListener('click', () => { setWedCheckin(week, 'sleep', Number(b.dataset.sleep)); renderPlayer(); }));
    $$('#sorenessSeg [data-soreness]').forEach(b => b.addEventListener('click', () => { setWedCheckin(week, 'soreness', Number(b.dataset.soreness)); renderPlayer(); }));
    $$('#playerContent .class-card').forEach(card => card.addEventListener('click', () => {
      const choice = card.dataset.choice;
      const opt = WEDNESDAY_OPTIONS.find(o => o.id === choice);
      if (choice === 'rest') { completeWedChoice(week, 'rest'); playerRuntime = null; switchScreen('schedule'); return; }
      completeWedChoice(week, choice);
      playerRuntime = { stage: 'setup', week, day, classId: opt.classId };
      renderPlayer();
    }));
    return;
  }

  if (playerRuntime.stage === 'setup') {
    const cls = classById(playerRuntime.classId);
    const theme = weekTheme(week);
    const plan = buildSessionPlan(cls, week);
    playerRuntime.plan = plan;
    container.innerHTML = `
      <div class="card">
        <div class="kicker">${cls.category}${day === 6 ? ` · ${theme.satTheme}` : ''}</div>
        <h2 class="section-title">${cls.name}</h2>
        <div class="muted" style="font-size:14px;line-height:1.55">${cls.objective}</div>
        <div class="class-meta" style="margin-top:12px">
          <span>${plan.totalDurationMin} min</span><span>${cls.format}</span><span>${cls.intensityTarget}</span><span>${cls.hrZoneTarget}</span>
        </div>
        <div class="tip" style="margin-top:12px">${cls.coachingNotes}</div>
        ${plan.blocks.length > 1 ? `<div class="stack" style="margin-top:10px">${plan.blocks.map((b,i) => `<div class="list-item"><b>${b.label}</b><span>${b.mode === 'auto' ? 'Guided intervals' : b.mode === 'manual-amrap' ? `AMRAP · ${b.capMinutes} min` : `AFAP · cap ${b.capMinutes} min`}</span></div>`).join('')}</div>` : ''}
        <button class="btn primary block" id="beginClassBtn" style="margin-top:14px">Begin class</button>
      </div>`;
    $('#beginClassBtn').addEventListener('click', () => {
      startFunctionalSession(week, day, cls.id);
      playerRuntime.stage = 'live';
      playerRuntime.engine = createClassPlayer(plan, {
        onTick: snap => updatePlayerTick(snap),
        onSegmentChange: snap => paintPlayerLive(snap),
        onComplete: summary => {
          completeFunctionalSession(week, day, { roundsCompleted: summary.roundsCompleted, durationMin: plan.totalDurationMin });
          playerRuntime.stage = 'summary';
          playerRuntime.summary = summary;
          renderPlayer();
        }
      });
      switchScreen('player');
      playerRuntime.engine.start();
    });
    return;
  }

  if (playerRuntime.stage === 'live') { paintPlayerLive(playerRuntime.engine.snapshot()); return; }

  if (playerRuntime.stage === 'summary') {
    const cls = classById(playerRuntime.classId);
    const s = getFunctionalSession(week, day);
    container.innerHTML = `
      <div class="card" style="text-align:center">
        <div class="kicker">Session complete</div>
        <h2 class="section-title">${cls.name}</h2>
        <div class="stats" style="margin-top:10px">
          <div class="stat"><span>Rounds</span><b>${playerRuntime.summary ? playerRuntime.summary.roundsCompleted : (s.roundsCompleted||0)}</b></div>
          <div class="stat"><span>Duration</span><b>${playerRuntime.plan ? playerRuntime.plan.totalDurationMin : cls.baseDurationMin} min</b></div>
        </div>
        <div style="margin-top:14px">
          <div class="muted" style="font-size:13px;margin-bottom:8px">How hard was that? (RPE)</div>
          <div class="seg-wrap" style="grid-template-columns:repeat(5,1fr)">${[6,7,8,9,10].map(n => `<button class="seg ${s.effort===n?'active':''}" data-effort="${n}">${n}</button>`).join('')}</div>
        </div>
        <button class="btn primary block" id="playerDoneBtn" style="margin-top:16px">Done</button>
      </div>`;
    $$('#playerContent [data-effort]').forEach(b => b.addEventListener('click', () => { completeFunctionalSession(week, day, { effort: Number(b.dataset.effort) }); renderPlayer(); }));
    $('#playerDoneBtn').addEventListener('click', () => { playerRuntime = null; switchScreen('schedule'); });
  }
}

function paintPlayerLive(snap) {
  const container = $('#playerContent');
  const seg = snap.segment;
  if (snap.blockMode === 'auto' && seg) {
    const stageClass = seg.type === 'work' ? 'work' : seg.type === 'rest' ? 'rest' : 'prep';
    container.innerHTML = `
      <div class="player-stage ${stageClass}">
        <div class="player-phase">${snap.blockLabel}${snap.totalBlocks > 1 ? ` · Block ${snap.blockIndex + 1}/${snap.totalBlocks}` : ''}</div>
        <div class="player-exercise">${seg.exerciseName || seg.label}</div>
        <div class="player-clock" id="pClock">${fmtClock(snap.timeLeft)}</div>
        <div class="player-sub">${seg.type === 'work' ? 'Work' : seg.type === 'rest' ? 'Recover' : seg.label}</div>
        ${seg.hrZoneTarget ? `<div class="player-hr-zone">${seg.hrZoneTarget}</div>` : ''}
        <div class="player-meta-row">
          <div class="m">Round<b>${seg.round || '—'}${seg.totalRounds ? ` / ${seg.totalRounds}` : ''}</b></div>
          <div class="m">Station<b>${seg.station || '—'}${seg.totalStations ? ` / ${seg.totalStations}` : ''}</b></div>
          <div class="m">Cue<b style="font-size:11px">${seg.coachingNotes ? seg.coachingNotes.slice(0, 40) + '…' : '—'}</b></div>
        </div>
        ${seg.nextExerciseName ? `<div class="player-next">Next up: <b>${seg.nextExerciseName}</b></div>` : ''}
      </div>
      <div class="player-controls">
        <button class="btn alt" id="playerPauseBtn">${snap.running ? 'Pause' : 'Resume'}</button>
        <button class="btn alt" id="playerSkipBtn">Skip</button>
      </div>`;
    $('#playerPauseBtn').addEventListener('click', () => { const running = playerRuntime.engine.snapshot().running; running ? playerRuntime.engine.pause() : playerRuntime.engine.resume(); $('#playerPauseBtn').textContent = running ? 'Resume' : 'Pause'; });
    $('#playerSkipBtn').addEventListener('click', () => playerRuntime.engine.skip());
  } else {
    const isAmrap = snap.blockMode === 'manual-amrap';
    const remaining = snap.manualCapSec ? Math.max(0, snap.manualCapSec - snap.manualElapsed) : 0;
    container.innerHTML = `
      <div class="player-stage work">
        <div class="player-phase">${snap.blockLabel}${snap.totalBlocks > 1 ? ` · Block ${snap.blockIndex + 1}/${snap.totalBlocks}` : ''}</div>
        <div class="player-exercise">${isAmrap ? 'AMRAP' : 'AFAP'}</div>
        <div class="player-clock" id="pClock">${isAmrap ? fmtClock(remaining) : fmtClock(snap.manualElapsed)}</div>
        <div class="player-sub">${isAmrap ? 'Time remaining' : `Elapsed · cap ${snap.manualCapSec ? fmtClock(snap.manualCapSec) : '—'}`}</div>
        ${snap.hrZoneTarget ? `<div class="player-hr-zone">${snap.hrZoneTarget}</div>` : ''}
        <div class="player-meta-row">
          <div class="m">Rounds<b id="pRounds">${snap.roundsCompleted}</b></div>
          <div class="m">Current<b id="pCurrentEx" style="font-size:13px">${snap.manualExercise || '—'}</b></div>
          <div class="m">Cue<b style="font-size:11px">${snap.coachingNotes ? snap.coachingNotes.slice(0, 40) + '…' : '—'}</b></div>
        </div>
      </div>
      <div class="player-controls">
        <button class="btn alt" id="playerPauseBtn">${snap.running ? 'Pause' : 'Resume'}</button>
        <button class="btn alt" id="playerNextMoveBtn">Next movement</button>
      </div>
      <div class="grid2" style="margin-top:10px">
        ${isAmrap ? `<button class="btn green block" id="playerLogRoundBtn" style="grid-column:1/3">Log round complete</button>` : ''}
        <button class="btn primary block" id="playerFinishBtn" style="grid-column:1/3">${isAmrap ? 'End early' : "I'm done"}</button>
      </div>`;
    $('#playerPauseBtn').addEventListener('click', () => { const running = playerRuntime.engine.snapshot().running; running ? playerRuntime.engine.pause() : playerRuntime.engine.resume(); $('#playerPauseBtn').textContent = running ? 'Resume' : 'Pause'; });
    $('#playerNextMoveBtn').addEventListener('click', () => { playerRuntime.engine.nextManualMovement(); paintPlayerLive(playerRuntime.engine.snapshot()); });
    const logBtn = $('#playerLogRoundBtn'); if (logBtn) logBtn.addEventListener('click', () => { playerRuntime.engine.logRound(); paintPlayerLive(playerRuntime.engine.snapshot()); });
    $('#playerFinishBtn').addEventListener('click', () => playerRuntime.engine.finishManualBlock());
  }
}

function updatePlayerTick(snap) {
  const clockEl = $('#pClock');
  if (!clockEl) { paintPlayerLive(snap); return; }
  if (snap.blockMode === 'auto') {
    clockEl.textContent = fmtClock(snap.timeLeft);
  } else {
    const isAmrap = snap.blockMode === 'manual-amrap';
    const remaining = snap.manualCapSec ? Math.max(0, snap.manualCapSec - snap.manualElapsed) : 0;
    clockEl.textContent = isAmrap ? fmtClock(remaining) : fmtClock(snap.manualElapsed);
    const roundsEl = $('#pRounds'); if (roundsEl) roundsEl.textContent = snap.roundsCompleted;
  }
}

/* ---------------------------------------------------------------------- */
/* Progress / Analytics                                                    */
/* ---------------------------------------------------------------------- */

function renderProgress() {
  const names = allLiftNames();
  if (!names.includes(state.chartExercise)) state.chartExercise = names[0];
  const hist = historyForName(state.chartExercise);
  const current = hist.find(h => h.week === state.week) || { top: 0, best1RM: 0 };
  const best = hist.reduce((a, c) => (c.top > a.top ? c : a), { week: '—', top: 0 });
  const tonnagePoints = Array.from({ length: 8 }, (_, i) => ({ label: `W${i + 1}`, value: weeklyTonnage(i + 1), highlight: i + 1 === state.week }));
  const loadPoints = Array.from({ length: 8 }, (_, i) => ({ label: `W${i + 1}`, value: weeklyTrainingLoad(i + 1), highlight: i + 1 === state.week }));
  const prs = personalBests();
  const completedLiftDays = Object.values(state.liftCompletedAt).length;
  const completedFunctional = Object.values(state.functionalSessions).filter(s => s.done).length;

  $('#progressContent').innerHTML = `
    <div class="card">
      <div class="kicker">Lift progression</div>
      <select id="chartExerciseSelect" class="field">${names.map(n => `<option ${n === state.chartExercise ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <div class="stats" style="margin-top:12px">
        <div class="stat"><span>This week</span><b>${current.top ? `${current.top} ${state.unit}` : '—'}</b></div>
        <div class="stat"><span>Best</span><b>${best.top ? `W${best.week} · ${best.top} ${state.unit}` : '—'}</b></div>
      </div>
      <canvas id="liftChart" style="margin-top:12px"></canvas>
    </div>
    <div class="card">
      <div class="kicker">Weekly tonnage (lifting volume)</div>
      <canvas id="tonnageChart"></canvas>
    </div>
    <div class="card">
      <div class="kicker">Weekly training load</div>
      <canvas id="loadChart"></canvas>
      <div class="muted" style="font-size:12px;margin-top:8px">Relative index blending lifting tonnage with functional session duration &amp; intensity.</div>
    </div>
    <div class="card">
      <div class="kicker">Completion &amp; streaks</div>
      <div class="stats">
        <div class="stat"><span>Lift days done</span><b>${completedLiftDays} / 32</b></div>
        <div class="stat"><span>Functional sessions</span><b>${completedFunctional} / 16</b></div>
        <div class="stat"><span>Current streak</span><b>${currentStreak()} days</b></div>
        <div class="stat"><span>This week</span><b>${weekPercent(state.week)}%</b></div>
      </div>
    </div>
    <div class="card">
      <div class="kicker">Personal bests</div>
      <div class="stack" style="gap:8px">
        ${prs.length ? prs.slice(0, 8).map(p => `<div class="list-item"><b>${p.name}</b><span>${p.weight} ${state.unit} · est. 1RM ${p.est1RM} ${state.unit} · Week ${p.week}</span></div>`).join('') : '<div class="list-item"><b>No PRs yet</b><span>Log a lifting session to start tracking bests.</span></div>'}
      </div>
    </div>
    <div class="card">
      <div class="kicker">Body tracking</div>
      <div class="row">
        <input id="bwWeight" class="field" type="number" step="0.1" placeholder="Weight" />
        <input id="bwNote" class="field" type="text" placeholder="Note (optional)" />
      </div>
      <button id="addBwBtn" class="btn primary block" style="margin-top:8px">Add check-in</button>
      <canvas id="bwChart" style="margin-top:12px"></canvas>
    </div>`;

  drawLineChart($('#liftChart'), hist.map(h => ({ label: `W${h.week}`, value: h.top })), 'Log some working weights to draw your line.');
  drawBarChart($('#tonnageChart'), tonnagePoints, 'Log lifting sets to see weekly volume.');
  drawBarChart($('#loadChart'), loadPoints, 'Complete sessions to see training load.');
  const sortedBw = [...state.bodyweights].sort((a, b) => a.ts - b.ts);
  drawLineChart($('#bwChart'), sortedBw.map(x => ({ label: new Date(x.ts).toISOString().slice(5, 10), value: x.weight })), 'Add check-ins to see your trend.');

  $('#chartExerciseSelect').addEventListener('change', e => { state.chartExercise = e.target.value; save(); renderProgress(); });
  $('#addBwBtn').addEventListener('click', () => {
    const weight = Number($('#bwWeight').value);
    if (!weight) return;
    state.bodyweights.push({ ts: Date.now(), weight, note: $('#bwNote').value.trim() });
    save(); renderProgress();
  });
}

/* ---------------------------------------------------------------------- */
/* History                                                                  */
/* ---------------------------------------------------------------------- */

function renderHistory() {
  const entries = historyEntries();
  $('#historyContent').innerHTML = `
    <div class="card">
      <div class="kicker">Session log</div>
      <div class="stack" style="gap:8px">
        ${entries.length ? entries.map(e => `<div class="list-item"><b>${new Date(e.ts).toLocaleDateString()} · ${e.title}</b><span>${e.summary}</span></div>`).join('') : '<div class="list-item"><b>No sessions logged yet</b><span>Complete a lifting day or functional class to build your history.</span></div>'}
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------- */
/* Block overview                                                           */
/* ---------------------------------------------------------------------- */

function renderBlock() {
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1).map(w => {
    const phase = liftingPhaseForWeek(w);
    const theme = weekTheme(w);
    const cls = classById(theme.satClassId);
    return `<div class="week-block-card ${w === state.week ? 'current' : ''}" data-week="${w}">
      <div class="week-block-head"><b>Week ${w}</b><span class="badge ${w === state.week ? 'gold' : 'blue'}">${phase.phase}</span></div>
      <div class="muted" style="font-size:13px;margin-top:6px">${phase.guidance}</div>
      <div class="row" style="justify-content:space-between;margin-top:10px;font-size:13px">
        <span class="muted">Saturday: <b style="color:var(--text)">${cls.name}</b> — “${theme.satTheme}”</span>
      </div>
      <div class="progress-bar" style="margin-top:10px"><span style="width:${weekPercent(w)}%"></span></div>
    </div>`;
  }).join('');

  $('#blockContent').innerHTML = `
    <div class="card">
      <div class="kicker">8-week hybrid block</div>
      <h2 class="section-title">Block Overview</h2>
      <div class="muted" style="font-size:13px">Lifting periodizes Foundation &rarr; Accumulation &rarr; Intensification &rarr; Peak &rarr; Deload. Saturday rotates through Creed's flagship functional formats, scaled to match.</div>
      <div class="phase-timeline">${Array.from({ length: 8 }, (_, i) => `<span class="${i + 1 <= state.week ? 'active' : ''}"></span>`).join('')}</div>
    </div>
    <div class="stack">${weeks}</div>`;

  $$('#blockContent [data-week]').forEach(el => el.addEventListener('click', () => { state.week = Number(el.dataset.week); save(); switchScreen('schedule'); }));
}

/* ---------------------------------------------------------------------- */
/* Settings                                                                  */
/* ---------------------------------------------------------------------- */

function renderSettings() {
  $('#settingsContent').innerHTML = `
    <div class="card">
      <div class="kicker">Units</div>
      <div class="seg-wrap">
        <button class="seg ${state.unit === 'lb' ? 'active' : ''}" data-unit="lb">Pounds</button>
        <button class="seg ${state.unit === 'kg' ? 'active' : ''}" data-unit="kg">Kilograms</button>
      </div>
    </div>
    <div class="card">
      <div class="kicker">Class player</div>
      <div class="toggle-row"><div class="tinfo"><b>Sound cues</b><small>Beeps at countdown, work, and rest transitions</small></div><div class="switch ${state.soundCues ? 'on' : ''}" id="soundToggle"><div class="knob"></div></div></div>
      <div class="toggle-row"><div class="tinfo"><b>Coach voice prompts</b><small>Spoken exercise callouts and phase announcements</small></div><div class="switch ${state.voiceCues ? 'on' : ''}" id="voiceToggle"><div class="knob"></div></div></div>
    </div>
    <div class="card">
      <div class="kicker">Optional finishers</div>
      <div class="toggle-row"><div class="tinfo"><b>Tuesday finisher</b><small>8–12 min optional conditioning add-on</small></div><div class="switch ${state.finisherOn.tue ? 'on' : ''}" id="finTueToggle"><div class="knob"></div></div></div>
      <div class="toggle-row"><div class="tinfo"><b>Friday finisher</b><small>8–12 min optional conditioning add-on</small></div><div class="switch ${state.finisherOn.fri ? 'on' : ''}" id="finFriToggle"><div class="knob"></div></div></div>
    </div>
    <div class="card">
      <div class="kicker">Block overview</div>
      <button class="btn alt block" id="openBlockBtn">View 8-week block overview</button>
    </div>
    <div class="card">
      <div class="kicker">Your data</div>
      <div class="stack">
        <button id="exportBtn" class="btn alt block">Export history</button>
        <button id="importBtn" class="btn alt block">Import history</button>
        <input id="importFile" type="file" accept="application/json" style="display:none" />
        <button id="resetAllBtn" class="btn block" style="background:rgba(225,29,46,.14);border-color:rgba(225,29,46,.4);color:#ff9aa2">Reset all data</button>
      </div>
      <p class="muted" style="font-size:12px;margin-top:10px">Export saves lifting logs, functional sessions, check-ins, and bodyweight to a JSON file you can back up or move to another device.</p>
    </div>`;

  $$('#settingsContent [data-unit]').forEach(b => b.addEventListener('click', () => { state.unit = b.dataset.unit; save(); renderSettings(); }));
  $('#soundToggle').addEventListener('click', () => { state.soundCues = !state.soundCues; save(); renderSettings(); });
  $('#voiceToggle').addEventListener('click', () => { state.voiceCues = !state.voiceCues; save(); renderSettings(); });
  $('#finTueToggle').addEventListener('click', () => { state.finisherOn.tue = !state.finisherOn.tue; save(); renderSettings(); });
  $('#finFriToggle').addEventListener('click', () => { state.finisherOn.fri = !state.finisherOn.fri; save(); renderSettings(); });
  $('#openBlockBtn').addEventListener('click', () => switchScreen('block'));
  $('#exportBtn').addEventListener('click', exportHistory);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', e => { const file = e.target.files[0]; if (file) importHistory(file); e.target.value = ''; });
  $('#resetAllBtn').addEventListener('click', () => {
    if (!confirm('Reset all Creed Hybrid data on this device? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

function exportHistory() {
  const payload = { exported_at: new Date().toISOString(), app: 'Creed Hybrid', data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `creed-hybrid-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}
function importHistory(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const next = Object.assign({}, defaultState, parsed.data || parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      location.reload();
    } catch (e) { alert('Import failed. Please choose a valid export file.'); }
  };
  reader.readAsText(file);
}
