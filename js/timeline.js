/* Creed Hybrid v2 — functional class timeline builder + guided player engine. */

function audioBeep(freqStart, freqEnd, durMs, gainLevel) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freqStart; gain.gain.value = gainLevel || 0.14;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    if (freqEnd) setTimeout(() => { osc.frequency.value = freqEnd; }, Math.max(60, durMs * 0.5));
    setTimeout(() => { osc.stop(); ctx.close(); }, durMs);
  } catch (e) { /* audio unavailable — fail silently */ }
}
function cueGo() { audioBeep(880, 1320, 260, 0.16); }
function cueRest() { audioBeep(440, 300, 220, 0.12); }
function cueCountdown() { audioBeep(660, null, 120, 0.14); }
function cueDone() { audioBeep(660, 990, 200, 0.16); setTimeout(() => audioBeep(880, 1320, 260, 0.16), 260); }

function speak(text) {
  if (!state.voiceCues || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02; u.pitch = 0.95; u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech unavailable — fail silently */ }
}

/* ---------------------------------------------------------------------- */
/* Segment / block builders                                               */
/* ---------------------------------------------------------------------- */

function buildStationSegments(exercises, stations, rounds, workSec, restSec, hrZoneTarget, isYGIG, coachingNotes) {
  const segments = [{ type: 'prep', label: 'Get ready', durationSec: 10, hrZoneTarget, coachingNotes }];
  for (let r = 1; r <= rounds; r++) {
    for (let s = 0; s < stations; s++) {
      const exName = exercises[s % exercises.length];
      const nextExName = exercises[(s + 1) % exercises.length];
      segments.push({
        type: 'work', label: isYGIG ? 'Your Go' : 'Work', exerciseName: exName, nextExerciseName: (s === stations - 1) ? (r < rounds ? exercises[0] : null) : nextExName,
        durationSec: workSec, round: r, totalRounds: rounds, station: s + 1, totalStations: stations, hrZoneTarget, coachingNotes
      });
      const isLast = (r === rounds && s === stations - 1);
      if (!isLast && restSec > 0) {
        segments.push({
          type: 'rest', label: isYGIG ? 'Partner Go — active recovery' : 'Rest', exerciseName: isYGIG ? exercises[(s + 1) % exercises.length] : null,
          nextExerciseName: (s === stations - 1) ? exercises[0] : exercises[(s + 1) % exercises.length],
          durationSec: restSec, round: r, totalRounds: rounds, station: s + 1, totalStations: stations, hrZoneTarget, coachingNotes
        });
      }
    }
  }
  segments.push({ type: 'cooldown', label: 'Cooldown', durationSec: 20, hrZoneTarget: 'Zone 1', coachingNotes: 'Walk it out, breathe deep, let the heart rate settle.' });
  return segments;
}

function buildSessionPlan(classDef, week) {
  if (classDef.format === 'Multi-Phase') {
    const blocks = classDef.phases.map(phaseDef => {
      const p = buildPhaseSession(phaseDef, week, classDef.id);
      if (p.format === 'AFAP') {
        return { label: p.label, mode: 'manual-afap', capMinutes: p.capMinutes, exercises: p.exercises, hrZoneTarget: classDef.hrZoneTarget, coachingNotes: classDef.coachingNotes };
      }
      const segments = buildStationSegments(p.exercises, p.stations, p.rounds, p.workSec, p.restSec, classDef.hrZoneTarget, p.format === 'YGIG', classDef.coachingNotes);
      return { label: p.label, mode: 'auto', segments };
    });
    return { classDef, week, blocks, totalDurationMin: classDef.baseDurationMin };
  }
  const session = buildClassSession(classDef, week);
  if (classDef.format === 'AMRAP') {
    return { classDef, week, session, blocks: [{ label: classDef.name, mode: 'manual-amrap', capMinutes: session.amrapMinutes, exercises: session.exercises, hrZoneTarget: classDef.hrZoneTarget, coachingNotes: classDef.coachingNotes }], totalDurationMin: session.durationMin };
  }
  if (classDef.format === 'AFAP') {
    return { classDef, week, session, blocks: [{ label: classDef.name, mode: 'manual-afap', capMinutes: session.amrapMinutes || 12, exercises: session.exercises, hrZoneTarget: classDef.hrZoneTarget, coachingNotes: classDef.coachingNotes }], totalDurationMin: session.durationMin };
  }
  const segments = buildStationSegments(session.exercises, session.stations, session.rounds, session.workSec, session.restSec, classDef.hrZoneTarget, classDef.format === 'YGIG', classDef.coachingNotes);
  return { classDef, week, session, blocks: [{ label: classDef.name, mode: 'auto', segments }], totalDurationMin: session.durationMin };
}

/* ---------------------------------------------------------------------- */
/* Player engine                                                          */
/* ---------------------------------------------------------------------- */

function createClassPlayer(plan, callbacks) {
  const player = {
    plan, blockIndex: 0, segIndex: 0, timeLeft: 0, running: false, done: false,
    manualElapsed: 0, manualExerciseIndex: 0, roundsCompleted: 0, intervalId: null,
    lastSpokenSeg: null
  };
  const cb = callbacks || {};

  function currentBlock() { return player.plan.blocks[player.blockIndex]; }
  function currentSegment() { const b = currentBlock(); return b.mode === 'auto' ? b.segments[player.segIndex] : null; }

  function emitTick() { cb.onTick && cb.onTick(playerSnapshot()); }
  function emitSegmentChange() { cb.onSegmentChange && cb.onSegmentChange(playerSnapshot()); }

  function playerSnapshot() {
    const block = currentBlock();
    const seg = currentSegment();
    return {
      blockLabel: block.label, blockMode: block.mode, blockIndex: player.blockIndex, totalBlocks: player.plan.blocks.length,
      segment: seg, timeLeft: player.timeLeft, manualElapsed: player.manualElapsed, manualCapSec: block.capMinutes ? block.capMinutes * 60 : 0,
      manualExercise: block.exercises ? block.exercises[player.manualExerciseIndex % block.exercises.length] : null,
      manualExerciseIndex: player.manualExerciseIndex, roundsCompleted: player.roundsCompleted, running: player.running, done: player.done,
      hrZoneTarget: block.hrZoneTarget, coachingNotes: block.coachingNotes
    };
  }

  function startBlock() {
    const block = currentBlock();
    if (block.mode === 'auto') {
      player.segIndex = 0;
      player.timeLeft = block.segments[0].durationSec;
      speak(`${block.label}. Get ready.`);
    } else {
      player.manualElapsed = 0;
      player.manualExerciseIndex = 0;
      speak(`${block.label}. ${block.mode === 'manual-amrap' ? 'As many rounds as possible.' : 'As fast as possible. Go!'}`);
    }
    emitSegmentChange();
  }

  function advanceAutoSegment() {
    const block = currentBlock();
    const seg = block.segments[player.segIndex];
    if (seg.type === 'work' && seg.station === seg.totalStations) player.roundsCompleted = seg.round;
    if (player.segIndex < block.segments.length - 1) {
      player.segIndex++;
      const next = block.segments[player.segIndex];
      player.timeLeft = next.durationSec;
      if (next.type === 'work') { cueGo(); if (next.exerciseName) speak(next.exerciseName); }
      else if (next.type === 'rest') { cueRest(); speak(seg.type === 'work' ? 'Rest' : 'Recovery'); }
      else if (next.type === 'cooldown') { cueDone(); speak('Cooldown. Great work.'); }
      emitSegmentChange();
    } else {
      advanceBlock();
    }
  }

  function advanceBlock() {
    if (player.blockIndex < player.plan.blocks.length - 1) {
      player.blockIndex++;
      startBlock();
    } else {
      finish();
    }
  }

  function finish() {
    player.running = false;
    player.done = true;
    cueDone();
    speak('Session complete. Nice work.');
    clearInterval(player.intervalId);
    cb.onComplete && cb.onComplete({ roundsCompleted: player.roundsCompleted || player.manualExerciseIndex });
  }

  function tick() {
    const block = currentBlock();
    if (block.mode === 'auto') {
      if (player.timeLeft <= 1) {
        const seg = block.segments[player.segIndex];
        if (seg.durationSec <= 4 && seg.durationSec > 1) cueCountdown();
        player.timeLeft = 0;
        emitTick();
        advanceAutoSegment();
        return;
      }
      player.timeLeft--;
      if (player.timeLeft <= 3 && player.timeLeft > 0) cueCountdown();
    } else {
      player.manualElapsed++;
      if (block.capMinutes) {
        const cap = block.capMinutes * 60;
        if (player.manualElapsed >= cap) { finish(); return; }
        if (cap - player.manualElapsed === 10) cueCountdown();
      }
    }
    emitTick();
  }

  return {
    start() { if (player.running) return; player.running = true; startBlock(); player.intervalId = setInterval(tick, 1000); emitTick(); },
    pause() { player.running = false; clearInterval(player.intervalId); emitTick(); },
    resume() { if (player.running || player.done) return; player.running = true; player.intervalId = setInterval(tick, 1000); emitTick(); },
    skip() { const block = currentBlock(); if (block.mode === 'auto') advanceAutoSegment(); },
    nextManualMovement() {
      const block = currentBlock();
      if (block.mode !== 'manual-amrap' && block.mode !== 'manual-afap') return;
      player.manualExerciseIndex++;
      if (block.exercises && player.manualExerciseIndex % block.exercises.length === 0) player.roundsCompleted++;
      emitTick();
    },
    logRound() { player.roundsCompleted++; emitTick(); },
    finishManualBlock() { if (currentBlock().mode.startsWith('manual')) advanceBlock(); },
    destroy() { clearInterval(player.intervalId); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); },
    snapshot: playerSnapshot
  };
}
