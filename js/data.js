/* Creed Hybrid v2 — program data: lifting days, finishers, functional class library,
   weekly rotation, and 8-week block progression. Pure data, no DOM/state here. */

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* day: 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat 7=Sun */
const DAY_TYPES = { 1: 'lift', 2: 'lift', 3: 'adaptive', 4: 'lift', 5: 'lift', 6: 'functional', 7: 'rest' };

/* ---------------------------------------------------------------------- */
/* Lifting program — Monday / Tuesday / Thursday / Friday                 */
/* ---------------------------------------------------------------------- */

const LIFT_DAYS = [
  {
    day: 1, title: 'Heavy Strength — Squat & Posterior Chain', emphasis: 'Heavy Strength',
    estDurationMin: 60, finisherEligible: false,
    goal: 'Build maximal lower-body strength through a heavy squat pattern with posterior-chain support.',
    warmup: '8–10 min: bike or row easy, hip openers, bodyweight squats, glute bridges, then 2 ramp-up sets on the squat.',
    primaryLifts: [
      { n: 'Back Squat', tag: 'squat', sets: 4, reps: '5', restSec: 180, incLb: 5, incKg: 2.5, cue: 'Brace before you unrack. Hit depth, drive up through the whole foot.', tip: 'Leave 1–2 reps in reserve on the top set unless the block calls for a test.' },
      { n: 'Romanian Deadlift', tag: 'hinge', sets: 3, reps: '6', restSec: 120, incLb: 5, incKg: 2.5, cue: 'Soft knees, hips back, feel the hamstrings load before you reverse.', tip: 'Bar stays close to the legs the whole way down.' }
    ],
    accessoryLifts: [
      { n: 'Walking Lunge', tag: 'squat', sets: 3, reps: '10 each', restSec: 75, incLb: 5, incKg: 2.5, cue: 'Long stride, back knee light kiss to the floor.' },
      { n: 'Seated Leg Curl', tag: 'hinge', sets: 3, reps: '12', restSec: 60, incLb: 5, incKg: 2.5, cue: 'Slow negative, full stretch at the top.' },
      { n: 'Weighted Plank', tag: 'core', sets: 3, reps: '40 sec', restSec: 45, incLb: 0, incKg: 0, bodyweight: true, cue: 'Ribs down, glutes squeezed, no sagging hips.' }
    ]
  },
  {
    day: 2, title: 'Upper Hypertrophy — Push / Pull', emphasis: 'Hypertrophy + Finisher',
    estDurationMin: 55, finisherEligible: true,
    goal: 'Build upper-body muscle with balanced pressing and pulling volume, then an optional conditioning finisher.',
    warmup: '5–7 min easy cardio, band pull-aparts, shoulder circles, 2 ramp-up sets on the bench.',
    primaryLifts: [
      { n: 'Bench Press', tag: 'push', sets: 4, reps: '8', restSec: 120, incLb: 5, incKg: 2.5, cue: 'Shoulder blades set, bar path smooth, leave a rep in the tank.', tip: 'Feet planted, controlled touch on the chest.' },
      { n: 'Weighted Pull-Up', tag: 'pull', sets: 4, reps: '8', restSec: 120, incLb: 5, incKg: 2.5, cue: 'Pull elbows to hips, control the stretch on the way up.', tip: 'Use an assist band or lat pulldown if strict reps break down.' }
    ],
    accessoryLifts: [
      { n: 'Seated Cable Row', tag: 'pull', sets: 3, reps: '10', restSec: 75, incLb: 5, incKg: 2.5, cue: 'Chest tall, row to the lower ribs, pause briefly.' },
      { n: 'Dumbbell Incline Press', tag: 'push', sets: 3, reps: '10', restSec: 75, incLb: 5, incKg: 2.5, cue: 'Moderate incline, control the descent.' },
      { n: 'Cable Lateral Raise', tag: 'push', sets: 3, reps: '12', restSec: 60, incLb: 2.5, incKg: 1, cue: 'Raise to shoulder height only, no shrugging.' },
      { n: 'Face Pull', tag: 'pull', sets: 3, reps: '15', restSec: 45, incLb: 2.5, incKg: 1, cue: 'Lead with the elbows, squeeze the upper back.' }
    ]
  },
  {
    day: 4, title: 'Strength — Deadlift & Front Squat', emphasis: 'Strength',
    estDurationMin: 60, finisherEligible: false,
    goal: 'Reinforce the hinge and front-rack squat pattern with heavy, low-rep strength work.',
    warmup: '8–10 min easy cardio, hip hinges with a dowel, goblet squat holds, 2 ramp-up sets on the deadlift.',
    primaryLifts: [
      { n: 'Deadlift', tag: 'hinge', sets: 4, reps: '4', restSec: 180, incLb: 5, incKg: 2.5, cue: 'Bar close, brace hard, drive the floor away.', tip: 'Reset your brace between every rep.' },
      { n: 'Front Squat', tag: 'squat', sets: 3, reps: '6', restSec: 150, incLb: 5, incKg: 2.5, cue: 'Elbows up, chest tall, sit between the heels.', tip: 'If wrists limit you, cross-arm grip is fine.' }
    ],
    accessoryLifts: [
      { n: 'Bulgarian Split Squat', tag: 'squat', sets: 3, reps: '8 each', restSec: 75, incLb: 5, incKg: 2.5, cue: 'Torso upright, front knee tracks over the foot.' },
      { n: 'Hip Thrust', tag: 'hinge', sets: 3, reps: '10', restSec: 75, incLb: 10, incKg: 5, cue: 'Ribs down, drive through the heels, squeeze at lockout.' },
      { n: 'Hanging Leg Raise', tag: 'core', sets: 3, reps: '12', restSec: 60, incLb: 0, incKg: 0, bodyweight: true, cue: 'Control the swing, curl the pelvis at the top.' }
    ]
  },
  {
    day: 5, title: 'Power / Hypertrophy — Press & Row', emphasis: 'Power + Finisher',
    estDurationMin: 55, finisherEligible: true,
    goal: 'Train pressing power and back thickness, then an optional short conditioning finisher.',
    warmup: '5–7 min easy cardio, shoulder dislocates, scap push-ups, 2 ramp-up sets on the push press.',
    primaryLifts: [
      { n: 'Push Press', tag: 'push', sets: 4, reps: '5', restSec: 150, incLb: 5, incKg: 2.5, cue: 'Dip shallow, drive straight up, punch the bar to lockout.', tip: 'This is a power lift — keep the bar speed fast.' },
      { n: 'Chest-Supported Row', tag: 'pull', sets: 4, reps: '8', restSec: 120, incLb: 5, incKg: 2.5, cue: 'Let the bench support the torso, row with the back not the arms.' }
    ],
    accessoryLifts: [
      { n: 'Dumbbell Bench Press', tag: 'push', sets: 3, reps: '10', restSec: 75, incLb: 5, incKg: 2.5, cue: 'Full stretch at the bottom, press to lockout without flaring elbows.' },
      { n: 'Single-Arm Dumbbell Row', tag: 'pull', sets: 3, reps: '10 each', restSec: 60, incLb: 5, incKg: 2.5, cue: 'Flat back, pull to the hip, avoid rotating the torso.' },
      { n: 'Cable Triceps Pressdown', tag: 'push', sets: 3, reps: '12', restSec: 45, incLb: 2.5, incKg: 1, cue: 'Elbows pinned, full lockout, control the return.' },
      { n: 'Dumbbell Curl', tag: 'pull', sets: 2, reps: '12', restSec: 45, incLb: 2.5, incKg: 1, cue: 'No swinging, squeeze at the top.' }
    ]
  }
];

const LIFT_REPLACEMENTS = {
  'Back Squat': ['Front Squat', 'Leg Press', 'Hack Squat'],
  'Romanian Deadlift': ['Cable Pull-Through', 'Glute Bridge', 'Back Extension'],
  'Walking Lunge': ['Reverse Lunge', 'Step-Up', 'Split Squat with Support'],
  'Seated Leg Curl': ['Lying Leg Curl', 'Swiss Ball Curl', 'Sliding Leg Curl'],
  'Weighted Plank': ['Front Plank', 'Ab Wheel Rollout', 'Pallof Press'],
  'Bench Press': ['Machine Chest Press', 'Incline Dumbbell Press', 'Push-Up on Handles'],
  'Weighted Pull-Up': ['Lat Pulldown', 'Assisted Pull-Up', 'Neutral-Grip Pulldown'],
  'Seated Cable Row': ['Chest-Supported Row', 'Machine Row', 'One-Arm Dumbbell Row'],
  'Dumbbell Incline Press': ['Machine Incline Press', 'Flat Dumbbell Press', 'Push-Up on Handles'],
  'Cable Lateral Raise': ['Dumbbell Lateral Raise', 'Machine Lateral Raise', 'Single-Arm Cable Raise'],
  'Face Pull': ['Band Pull-Apart', 'Reverse Pec Deck', 'Cable Rear Delt Fly'],
  'Deadlift': ['Trap Bar Deadlift', 'Rack Pull', 'Romanian Deadlift'],
  'Front Squat': ['Back Squat', 'Goblet Squat', 'Leg Press'],
  'Bulgarian Split Squat': ['Split Squat with Support', 'Step-Up', 'Reverse Lunge'],
  'Hip Thrust': ['Glute Bridge', 'Cable Pull-Through', 'Back Extension'],
  'Hanging Leg Raise': ['Lying Leg Raise', 'Cable Crunch', 'Bicycle Crunch'],
  'Push Press': ['Dumbbell Shoulder Press', 'Landmine Press', 'Seated Arnold Press'],
  'Chest-Supported Row': ['Seated Cable Row', 'Machine Row', 'Dumbbell Row'],
  'Dumbbell Bench Press': ['Machine Chest Press', 'Push-Up on Handles', 'Incline Dumbbell Press'],
  'Single-Arm Dumbbell Row': ['Chest-Supported Row', 'Cable Row', 'Machine Row'],
  'Cable Triceps Pressdown': ['Overhead Rope Extension', 'Cable Kickback', 'Machine Dip'],
  'Dumbbell Curl': ['Cable Curl', 'EZ-Bar Curl', 'Hammer Curl']
};

/* ---------------------------------------------------------------------- */
/* Optional finishers — Tuesday / Friday, 8–12 minutes, toggleable        */
/* ---------------------------------------------------------------------- */

const FINISHERS = [
  { id: 'row-sprints', n: 'Row Sprint Ladder', duration: '8 min', equipment: 'Rower', structure: '6 rounds: 250m row hard / 45s rest', cue: 'Hold a pace you can repeat all 6 rounds.' },
  { id: 'bike-intervals', n: 'Bike Interval Burn', duration: '10 min', equipment: 'Bike', structure: '10 rounds: 30s hard / 30s easy spin', cue: 'Push the work, fully recover on the easy spin.' },
  { id: 'sled-pushes', n: 'Sled Push Ladder', duration: '8 min', equipment: 'Sled', structure: '6 rounds: 20m push down / 20m push back / 40s rest', cue: 'Stay low, drive through the legs, short powerful steps.' },
  { id: 'carries', n: 'Loaded Carry Gauntlet', duration: '10 min', equipment: 'Dumbbells or kettlebells', structure: '5 rounds: 40m farmer carry + 40m suitcase carry each side / 60s rest', cue: 'Stand tall, brace hard, even steps.' },
  { id: 'kb-complex', n: 'Kettlebell Complex Finisher', duration: '9 min', equipment: 'Kettlebell', structure: '5 rounds: 8 swings + 6 goblet squats + 4 clean & press each side / 30s rest', cue: 'Smooth transitions, breathe on the reset.' },
  { id: 'burpee-ladder', n: 'Burpee Ladder', duration: '8 min', equipment: 'None', structure: 'Ascending burpees each minute on the minute (1, 2, 3…) until you can’t finish in the minute', cue: 'Pace early rounds — this one sneaks up on you.' },
  { id: 'wall-balls', n: 'Wall Ball Blitz', duration: '8 min', equipment: 'Med ball + wall/target', structure: '8 rounds: 15 wall balls / 30s rest', cue: 'Full hip drive, soft catch, consistent target height.' },
  { id: 'ski-erg', n: 'Ski Erg Intervals', duration: '10 min', equipment: 'Ski erg', structure: '8 rounds: 250m ski / 40s rest', cue: 'Drive down and through with the lats, not just the arms.' }
];

const FINISHER_ROTATION = { tue: ['row-sprints', 'kb-complex', 'wall-balls', 'burpee-ladder'], fri: ['sled-pushes', 'carries', 'ski-erg', 'bike-intervals'] };
function finisherForWeek(dayKey, week) {
  const rotation = FINISHER_ROTATION[dayKey];
  const id = rotation[(week - 1) % rotation.length];
  return FINISHERS.find(f => f.id === id);
}

/* ---------------------------------------------------------------------- */
/* Functional class library — Wednesday / Saturday                        */
/* ---------------------------------------------------------------------- */

const MOVEMENT_LIBRARY = {
  squat: ['Goblet Squat', 'Kettlebell Front Squat', 'Dumbbell Squat', 'Jump Squat', 'Air Squat'],
  hinge: ['Kettlebell Swing', 'Dumbbell RDL', 'Broad Jump Hinge Reset', 'Hip Hinge to Row'],
  push: ['Push-Up', 'Dumbbell Push Press', 'Med Ball Chest Pass', 'Plate Push-Press'],
  pull: ['Inverted Row', 'Dumbbell Row', 'Band Face Pull', 'Ring Row'],
  carry: ["Farmer's Carry", 'Suitcase Carry', 'Sandbag Carry', 'Sled Drag'],
  core: ['Plank Shoulder Tap', 'Med Ball Slam', 'Russian Twist', 'Mountain Climbers'],
  'core-light': ['Bird Dog', 'Dead Bug', 'Cat-Cow Flow', 'Side Plank Hold'],
  monostructural: ['Row Erg', 'Bike Erg', 'Ski Erg', 'Shuttle Run', 'Jump Rope'],
  jump: ['Box Jump', 'Broad Jump', 'Lateral Bound', 'Tuck Jump'],
  throw: ['Med Ball Slam', 'Rotational Med Ball Throw', 'Overhead Med Ball Throw'],
  'ballistic-hinge': ['Kettlebell Swing', 'Dumbbell Snatch', 'Trap Bar Jump'],
  sprint: ['Shuttle Sprint', 'Bike Sprint', 'Row Sprint'],
  mobility: ['Hip Opener Flow', 'Thoracic Rotation', "World's Greatest Stretch", 'Ankle Rocks'],
  breathing: ['Box Breathing Walk', 'Easy Bike Spin']
};

/* format: 'EMOM' | 'AMRAP' | 'AFAP' | 'YGIG' | 'Interval Circuit' | 'Multi-Phase' */
const FUNCTIONAL_CLASSES = [
  {
    id: 'contender-conditioning', name: 'Contender Conditioning', category: 'Balanced Functional', format: 'EMOM',
    objective: 'Full-body movement quality and aerobic base without excess fatigue.',
    baseDurationMin: 25, intensityTarget: 'RPE 5–6 · conversational', hrZoneTarget: 'Zone 2 (60–70% max HR)',
    baseStations: 4, baseRounds: 5, workSec: 40, restSec: 20,
    movementPool: ['squat', 'hinge', 'push', 'pull'],
    coachingNotes: "Keep this one smooth. If you can't hold a conversation, back off the pace."
  },
  {
    id: 'iron-engine', name: 'Iron Engine', category: 'Cardio Engine', format: 'Interval Circuit',
    objective: 'Build aerobic capacity and repeatable output on machines and cyclical movement.',
    baseDurationMin: 30, intensityTarget: 'RPE 7–8 · hard but steady', hrZoneTarget: 'Zone 3–4 (75–88% max HR)',
    baseStations: 3, baseRounds: 6, workSec: 60, restSec: 30,
    movementPool: ['monostructural', 'carry', 'core'],
    coachingNotes: 'Pick a pace you can hold for every round, not just the first one.'
  },
  {
    id: 'endurance-circuit', name: 'Endurance Circuit', category: 'Strength Endurance Circuit', format: 'AMRAP',
    objective: 'Blend moderate-load strength work with conditioning to build muscular endurance.',
    baseDurationMin: 35, intensityTarget: 'RPE 7 · sustainable grind', hrZoneTarget: 'Zone 3 (70–80% max HR)',
    baseStations: 5, baseRounds: 0, amrapMinutes: 18, workSec: 0, restSec: 0,
    movementPool: ['squat', 'hinge', 'push', 'pull', 'carry'],
    coachingNotes: 'Break reps up early on purpose so you never fully redline.'
  },
  {
    id: 'power-circuit', name: 'Explosive Power Circuit', category: 'Power Circuit', format: 'EMOM',
    objective: 'Develop rate of force development with low-rep, high-quality explosive movement.',
    baseDurationMin: 25, intensityTarget: 'RPE 6–7 · max intent, low fatigue', hrZoneTarget: 'Zone 2–3 (65–78% max HR)',
    baseStations: 4, baseRounds: 6, workSec: 20, restSec: 40,
    movementPool: ['jump', 'throw', 'ballistic-hinge', 'sprint'],
    coachingNotes: 'Every rep should look like the first rep. Quality over quantity here.'
  },
  {
    id: 'hybrid-grind', name: 'Hybrid Grind', category: 'Hybrid Conditioning', format: 'YGIG',
    objective: 'Mix loaded strength stations with cardio bursts for a true hybrid test, relay-style solo.',
    baseDurationMin: 35, intensityTarget: 'RPE 8 · race pace', hrZoneTarget: 'Zone 3–4 (75–88% max HR)',
    baseStations: 4, baseRounds: 5, workSec: 45, restSec: 45,
    movementPool: ['squat', 'hinge', 'push', 'pull', 'monostructural', 'carry'],
    coachingNotes: 'This mirrors a team relay — go hard on your interval, use the rest like a true recovery, not a pause.'
  },
  {
    id: 'recovery-flow', name: 'Recovery Flow', category: 'Recovery Flow', format: 'Interval Circuit',
    objective: 'Restore range of motion and circulate blood flow without adding fatigue.',
    baseDurationMin: 22, intensityTarget: 'RPE 3–4 · easy', hrZoneTarget: 'Zone 1 (50–60% max HR)',
    baseStations: 4, baseRounds: 2, workSec: 60, restSec: 20,
    movementPool: ['mobility', 'breathing', 'core-light'],
    coachingNotes: 'Nothing here should feel like effort. Breathe, move slow, leave feeling better than you started.'
  },
  {
    id: 'signature-saturday', name: 'Signature Saturday', category: 'Signature Saturday Session', format: 'Multi-Phase',
    objective: 'The flagship weekly test — a long-form, multi-phase hybrid session blending strength, engine work, and grit.',
    baseDurationMin: 55, intensityTarget: 'RPE 8–9 · flagship effort', hrZoneTarget: 'Zone 3–4 (75–90% max HR)',
    baseStations: 6, baseRounds: 4, workSec: 50, restSec: 25,
    movementPool: ['squat', 'hinge', 'push', 'pull', 'carry', 'monostructural', 'core'],
    coachingNotes: 'Three phases: strength block, engine block, finisher for time. Pace phase one — you need legs for phase three.',
    phases: [
      { label: 'Phase 1 · Strength Block', format: 'EMOM', pool: ['squat', 'hinge', 'push', 'pull'], stations: 4, rounds: 3, workSec: 40, restSec: 30 },
      { label: 'Phase 2 · Engine Block', format: 'Interval Circuit', pool: ['monostructural', 'carry'], stations: 2, rounds: 5, workSec: 50, restSec: 25 },
      { label: 'Phase 3 · Finisher For Time', format: 'AFAP', pool: ['core', 'throw'], stations: 3, rounds: 1, capMinutes: 8 }
    ]
  }
];

function classById(id) { return FUNCTIONAL_CLASSES.find(c => c.id === id); }

/* Wednesday's three adaptive options, always selectable manually */
const WEDNESDAY_OPTIONS = [
  { id: 'rest', label: 'Full Rest', description: 'No structured training. Sleep, hydrate, and let Monday/Tuesday fully absorb.' },
  { id: 'recovery', label: 'Recovery / Mobility', classId: 'recovery-flow', description: 'A gentle, low-HR mobility and breathing flow that speeds recovery without adding fatigue.' },
  { id: 'functional', label: 'Light Functional Conditioning', classId: 'contender-conditioning', description: 'A shorter, lighter version of Contender Conditioning to build aerobic base while protecting Thursday.' }
];

function wednesdayRecommendation(sleep, soreness) {
  const score = (sleep || 3) + (soreness || 3); /* 2 (great) .. 10 (rough) */
  if (score >= 8) return { id: 'rest', reason: 'Sleep and soreness scores point to high fatigue — full rest protects Thursday’s lifting.' };
  if (score >= 5) return { id: 'recovery', reason: 'Moderate fatigue — a light recovery flow will help you arrive fresh for Thursday.' };
  return { id: 'functional', reason: 'You’re reading fresh — a light functional session adds conditioning without borrowing from Thursday.' };
}

/* ---------------------------------------------------------------------- */
/* 8-week block: lifting phases + Saturday rotation + weekly theme        */
/* ---------------------------------------------------------------------- */

const LIFTING_BLOCK_PHASES = [
  { weeks: [1, 2], phase: 'Foundation', guidance: 'Groove technique. RPE 6–7. Add load only if every rep is crisp.' },
  { weeks: [3, 4], phase: 'Accumulation', guidance: 'Add small load or a rep each week. RPE 7–8.' },
  { weeks: [5, 6], phase: 'Intensification', guidance: 'Heavier loads, hold reps steady. RPE 8–9.' },
  { weeks: [7], phase: 'Peak', guidance: 'Test top working weights this week. RPE 9.' },
  { weeks: [8], phase: 'Deload', guidance: 'Cut volume roughly 40%. RPE 5–6. Rebuild for the next block.' }
];
function liftingPhaseForWeek(week) {
  return LIFTING_BLOCK_PHASES.find(p => p.weeks.includes(week)) || LIFTING_BLOCK_PHASES[0];
}

const WEEK_THEMES = [
  { week: 1, satClassId: 'signature-saturday', satTheme: 'Contender Kickoff' },
  { week: 2, satClassId: 'endurance-circuit', satTheme: 'Grind Line' },
  { week: 3, satClassId: 'iron-engine', satTheme: 'Iron Lungs' },
  { week: 4, satClassId: 'contender-conditioning', satTheme: 'Steady State' },
  { week: 5, satClassId: 'power-circuit', satTheme: 'Fast Twitch' },
  { week: 6, satClassId: 'hybrid-grind', satTheme: 'Full Gauntlet' },
  { week: 7, satClassId: 'signature-saturday', satTheme: 'Peak Week Test' },
  { week: 8, satClassId: 'recovery-flow', satTheme: 'Reset & Rebuild' }
];
function weekTheme(week) { return WEEK_THEMES.find(w => w.week === week) || WEEK_THEMES[0]; }

/* Functional progression scaling applied per block week (rounds/density/interval length) */
const FUNCTIONAL_BLOCK_SCALE = [
  { week: 1, roundsAdd: 0, workSecAdd: 0, lighter: false },
  { week: 2, roundsAdd: 0, workSecAdd: 5, lighter: false },
  { week: 3, roundsAdd: 1, workSecAdd: 5, lighter: false },
  { week: 4, roundsAdd: 0, workSecAdd: 0, lighter: true },
  { week: 5, roundsAdd: 1, workSecAdd: 10, lighter: false },
  { week: 6, roundsAdd: 2, workSecAdd: 10, lighter: false },
  { week: 7, roundsAdd: 2, workSecAdd: 15, lighter: false },
  { week: 8, roundsAdd: -2, workSecAdd: -15, lighter: true }
];
function functionalScaleForWeek(week) { return FUNCTIONAL_BLOCK_SCALE.find(s => s.week === week) || FUNCTIONAL_BLOCK_SCALE[0]; }

/* Deterministic pseudo-random pick so the same week always generates the same session */
function hashPick(seedStr, list) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

function buildClassSession(classDef, week) {
  const scale = functionalScaleForWeek(week);
  const stations = Math.max(3, classDef.baseStations);
  const rounds = classDef.baseRounds ? Math.max(2, classDef.baseRounds + scale.roundsAdd) : 0;
  const workSec = classDef.workSec ? Math.max(15, classDef.workSec + scale.workSecAdd) : 0;
  const restSec = classDef.restSec || 0;
  const exercises = [];
  for (let s = 0; s < stations; s++) {
    const tag = classDef.movementPool[s % classDef.movementPool.length];
    const pool = MOVEMENT_LIBRARY[tag] || ['Bodyweight Movement'];
    exercises.push(hashPick(`${classDef.id}_w${week}_s${s}`, pool));
  }
  return {
    classDef, week, stations, rounds, workSec, restSec, exercises,
    amrapMinutes: classDef.amrapMinutes ? Math.max(10, classDef.amrapMinutes + (scale.lighter ? -3 : Math.floor(scale.roundsAdd * 1.5))) : 0,
    durationMin: classDef.baseDurationMin + (scale.lighter ? -5 : Math.round(scale.workSecAdd / 10)),
    lighter: scale.lighter
  };
}

function buildPhaseSession(phaseDef, week, classId) {
  const scale = functionalScaleForWeek(week);
  const stations = phaseDef.stations;
  const rounds = phaseDef.rounds ? Math.max(1, phaseDef.rounds + (scale.lighter ? 0 : Math.floor(scale.roundsAdd / 2))) : 1;
  const exercises = [];
  for (let s = 0; s < stations; s++) {
    const tag = phaseDef.pool[s % phaseDef.pool.length];
    const pool = MOVEMENT_LIBRARY[tag] || ['Bodyweight Movement'];
    exercises.push(hashPick(`${classId}_${phaseDef.label}_w${week}_s${s}`, pool));
  }
  return { ...phaseDef, stations, rounds, exercises };
}
