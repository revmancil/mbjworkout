/* Creed Hybrid v2 — wiring, navigation, rest timer, boot. */

$$('.bottom-nav .tab').forEach(btn => btn.addEventListener('click', () => {
  if (playerRuntime && playerRuntime.engine) { playerRuntime.engine.destroy(); playerRuntime = null; }
  switchScreen(btn.dataset.screen);
}));

$('#backBtn').addEventListener('click', () => {
  if (playerRuntime && playerRuntime.engine) { playerRuntime.engine.destroy(); playerRuntime = null; }
  switchScreen(returnScreen);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

/* Rest timer FAB (lifting days) */
let timerSecs = 90, timerLeft = 90, timerId = null;
function drawTimer() { $('#timerDisplay').textContent = fmtClock(timerLeft); }
$('#timerFab').addEventListener('click', () => $('#timerModal').classList.add('open'));
$('#timerClose').addEventListener('click', () => $('#timerModal').classList.remove('open'));
$('#timerReset').addEventListener('click', () => { clearInterval(timerId); timerId = null; timerLeft = timerSecs; $('#timerStart').textContent = 'Start'; drawTimer(); });
$('#timerStart').addEventListener('click', () => {
  if (timerId) { clearInterval(timerId); timerId = null; $('#timerStart').textContent = 'Start'; return; }
  $('#timerStart').textContent = 'Pause';
  timerId = setInterval(() => {
    timerLeft--; drawTimer();
    if (timerLeft <= 0) { clearInterval(timerId); timerId = null; $('#timerStart').textContent = 'Start'; timerLeft = timerSecs; cueDone(); drawTimer(); }
  }, 1000);
});
$$('.preset').forEach(btn => btn.addEventListener('click', () => { timerSecs = Number(btn.dataset.sec); timerLeft = timerSecs; drawTimer(); }));

drawTimer();
switchScreen(state.screen && ['home', 'schedule', 'progress', 'history', 'settings'].includes(state.screen) ? state.screen : 'home');
