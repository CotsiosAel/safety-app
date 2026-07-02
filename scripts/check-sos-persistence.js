import { readFile } from 'node:fs/promises';

const source = await readFile('src/main.js', 'utf8');
const markup = await readFile('index.html', 'utf8');
const styles = await readFile('src/styles.css', 'utf8');

const requiredPatterns = [
  ['ended session tombstone storage key', "endedSosSession: 'safety-app-ended-sos-session'"],
  ['legacy active SOS storage cleanup', 'function clearLegacyActiveSosStorage()'],
  ['restore gate defaults inactive for ended sessions', 'function shouldRestoreActiveSosSession(session)'],
  ['central runtime cleanup stops live tracking', 'function clearActiveSosRuntimeState('],
  ['end flow marks backend sessions ended', ".update({ status: 'ended', ended_at: now, updated_at: now })"],
  ['pull-to-refresh blocks active SOS reloads', "if (isActiveSosInProgress())"],
];

for (const [label, pattern] of requiredPatterns) {
  if (!source.includes(pattern)) {
    console.error(`Missing SOS persistence safeguard: ${label}`);
    process.exit(1);
  }
}

const loadSupabaseStart = source.indexOf('async function loadSupabaseData()');
const loadSupabaseEnd = source.indexOf('async function handleAuthSubmit', loadSupabaseStart);
const loadSupabaseBody = source.slice(loadSupabaseStart, loadSupabaseEnd);

if (!loadSupabaseBody.includes('shouldRestoreActiveSosSession(restoredActiveSosSession)')) {
  console.error('Supabase/account loading must gate active SOS restore through shouldRestoreActiveSosSession().');
  process.exit(1);
}

const endFlowStart = source.indexOf('async function endActiveSosSession()');
const endFlowEnd = source.indexOf('function formatCheckInDateTime', endFlowStart);
const endFlowBody = source.slice(endFlowStart, endFlowEnd);

for (const pattern of ['markSosSessionEnded(endingSession', 'stopActiveSosLocationAutoUpdate()', 'clearActiveSosRuntimeState({']) {
  if (!endFlowBody.includes(pattern)) {
    console.error(`End SOS flow is missing required cleanup call: ${pattern}`);
    process.exit(1);
  }
}


const countdownStart = source.indexOf('function stopSosCountdown()');
const countdownEnd = source.indexOf('function openSosModal()', countdownStart);
const countdownBody = source.slice(countdownStart, countdownEnd);

const countdownRequirements = [
  ['countdown keeps legacy interval cleanup', 'window.clearInterval(sosCountdownTimer)'],
  ['countdown cancels legacy animation frame cleanup', 'window.cancelAnimationFrame(sosCountdownAnimationFrame)'],
  ['countdown clears forced fallback timeout', 'window.clearTimeout(sosCountdownFallbackTimer)'],
  ['countdown removes CSS running class during cleanup', "classList.remove('sos-countdown-running')"],
  ['countdown stores deadline start timestamp', 'sosCountdownStartedAt = Date.now()'],
  ['countdown stores deadline end timestamp', 'sosCountdownEndsAt = Date.now() + 5000'],
  ['countdown resets remaining seconds', 'sosCountdownRemaining = 5'],
  ['countdown resets duplicate completion guard', 'sosCountdownCompleted = false'],
  ['countdown marks CSS running debug state', "setSosCountdownTimerState('css-running')"],
  ['countdown restarts CSS animation by removing running class', "sosCountdownNumber.classList.remove('sos-countdown-running')"],
  ['countdown forces reflow before restart', 'void sosCountdownNumber.offsetWidth'],
  ['countdown starts CSS animation', "sosCountdownNumber.classList.add('sos-countdown-running')"],
  ['countdown uses forced fallback timeout', 'sosCountdownFallbackTimer = window.setTimeout(completeSosCountdown, 5500)'],
  ['countdown guards duplicate completion', 'if (sosCountdownCompleted) return'],
  ['countdown records completion guard', 'sosCountdownCompleted = true'],
  ['countdown marks completed debug state', "setSosCountdownTimerState('completed')"],
  ['countdown activates SOS automatically', 'confirmSos()'],
  ['countdown logs start', "console.log('[SafeMe SOS] countdown start')"],
  ['countdown logs complete', "console.log('[SafeMe SOS] countdown complete')"],
];
for (const [label, pattern] of countdownRequirements) {
  if (!countdownBody.includes(pattern)) {
    console.error(`Missing SOS countdown safeguard: ${label}`);
    process.exit(1);
  }
}


const countdownMarkupRequirements = [
  ['countdown output keeps stable id', 'id="sos-countdown-number"'],
  ['countdown renders animated strip', 'class="sos-countdown-strip"'],
  ['countdown includes digit 5', '<span>5</span>'],
  ['countdown includes digit 1', '<span>1</span>'],
];

for (const [label, pattern] of countdownMarkupRequirements) {
  if (!markup.includes(pattern)) {
    console.error(`Missing SOS countdown markup safeguard: ${label}`);
    process.exit(1);
  }
}

const countdownStyleRequirements = [
  ['countdown clips animated strip to circle', 'overflow: hidden'],
  ['countdown has running animation class', '.sos-countdown-running .sos-countdown-strip'],
  ['countdown animation lasts five seconds', 'animation: sos-countdown-strip 5s'],
  ['countdown keyframes keep 5 visible for first second', '0%, 19.999%'],
  ['countdown keyframes show 1 for fifth second', '80%, 100%'],
  ['countdown final offset shows digit 1', 'translate(-50%, -4.5em)'],
];

for (const [label, pattern] of countdownStyleRequirements) {
  if (!styles.includes(pattern)) {
    console.error(`Missing SOS countdown CSS safeguard: ${label}`);
    process.exit(1);
  }
}

if (countdownBody.includes('requestAnimationFrame(tickSosCountdownFrame)') || countdownBody.includes('textContent = String(visibleSeconds)')) {
  console.error('SOS countdown must not rely on JavaScript animation frames or text updates for visual ticks.');
  process.exit(1);
}

if (!source.includes("sosCountdownStrip?.addEventListener('animationend', completeSosCountdown)")) {
  console.error('SOS countdown must complete from the CSS animationend event.');
  process.exit(1);
}

const closeSosStart = source.indexOf('function closeSosModal()');
const closeSosEnd = source.indexOf('async function confirmSos()', closeSosStart);
const closeSosBody = source.slice(closeSosStart, closeSosEnd);

for (const pattern of ['stopSosCountdown()', "setSosCountdownTimerState('cancelled')", "console.log('[SafeMe SOS] countdown cancelled')", "sosModal.hidden = true", "Το SOS ακυρώθηκε πριν ενεργοποιηθεί."]) {
  if (!closeSosBody.includes(pattern)) {
    console.error(`Cancel flow is missing countdown cleanup/feedback: ${pattern}`);
    process.exit(1);
  }
}

for (const pattern of ['let sosActivationInProgress = false', 'if (sosActivationInProgress) return', 'sosActivationInProgress = true']) {
  if (!source.includes(pattern)) {
    console.error(`Missing duplicate SOS activation guard: ${pattern}`);
    process.exit(1);
  }
}

console.log('SOS persistence regression safeguards are present.');
