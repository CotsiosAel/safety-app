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
  ['countdown stores scheduled timeout handles', 'let sosCountdownTimeouts = []'],
  ['countdown clears every scheduled timeout', 'sosCountdownTimeouts.forEach(clearTimeout)'],
  ['countdown resets scheduled timeout handles', 'sosCountdownTimeouts = []'],
  ['countdown keeps legacy interval cleanup', 'window.clearInterval(sosCountdownTimer)'],
  ['countdown cancels legacy animation frame cleanup', 'window.cancelAnimationFrame(sosCountdownAnimationFrame)'],
  ['countdown clears legacy fallback timeout', 'window.clearTimeout(sosCountdownFallbackTimer)'],
  ['countdown resets duplicate completion guard', 'sosCountdownCompleted = false'],
  ['countdown sets visible number directly', 'function setSosCountdownNumber(value)'],
  ['countdown writes direct text content', 'sosCountdownNumber.textContent = String(value)'],
  ['countdown writes direct data attribute', 'sosCountdownNumber.setAttribute("data-countdown-value", String(value))'],
  ['countdown logs visible countdown values', 'console.log("[SafeMe SOS] visible countdown", value)'],
  ['countdown initializes at 5', 'setSosCountdownNumber(5)'],
  ['countdown schedules 4 after one second', '}, 1000)'],
  ['countdown schedules 3 after two seconds', '}, 2000)'],
  ['countdown schedules 2 after three seconds', '}, 3000)'],
  ['countdown schedules 1 after four seconds', '}, 4000)'],
  ['countdown completes after five seconds', 'window.setTimeout(completeSosCountdown, 5000)'],
  ['countdown guards duplicate completion', 'if (sosCountdownCompleted) return'],
  ['countdown records completion guard', 'sosCountdownCompleted = true'],
  ['countdown marks completed debug state', "sosCountdownDebug.textContent = 'timer: completed'"],
  ['countdown activates SOS automatically', 'confirmSos()'],
  ['countdown logs start', "console.log('[SafeMe SOS] countdown start')"],
  ['countdown logs complete', "console.log('[SafeMe SOS] countdown complete')"],
];
for (const [label, pattern] of countdownRequirements) {
  if (!source.includes(pattern) && !countdownBody.includes(pattern)) {
    console.error(`Missing SOS countdown safeguard: ${label}`);
    process.exit(1);
  }
}

const countdownMarkupRequirements = [
  ['countdown output keeps stable id', 'id="sos-countdown-number"'],
  ['countdown output is plain text', '<output class="sos-countdown-number" id="sos-countdown-number" aria-live="assertive">5</output>'],
  ['countdown renders progress fallback', 'id="sos-countdown-progress"'],
];

for (const [label, pattern] of countdownMarkupRequirements) {
  if (!markup.includes(pattern)) {
    console.error(`Missing SOS countdown markup safeguard: ${label}`);
    process.exit(1);
  }
}

const forbiddenCountdownPatterns = [
  ['animated countdown strip markup', 'sos-countdown-strip'],
  ['CSS countdown running class', 'sos-countdown-running'],
  ['CSS strip keyframes', '@keyframes sos-countdown-strip'],
  ['CSS strip animation property', 'animation: sos-countdown-strip'],
  ['CSS animationend completion listener', "addEventListener('animationend', completeSosCountdown)"],
  ['requestAnimationFrame countdown updates', 'requestAnimationFrame(tickSosCountdownFrame)'],
];

for (const [label, pattern] of forbiddenCountdownPatterns) {
  if (source.includes(pattern) || markup.includes(pattern) || styles.includes(pattern)) {
    console.error(`SOS countdown must not include old ${label}: ${pattern}`);
    process.exit(1);
  }
}

const closeSosStart = source.indexOf('function closeSosModal()');
const closeSosEnd = source.indexOf('async function confirmSos()', closeSosStart);
const closeSosBody = source.slice(closeSosStart, closeSosEnd);

for (const pattern of ['stopSosCountdown()', "sosCountdownDebug.textContent = 'timer: cancelled'", "console.log('[SafeMe SOS] countdown cancelled')", "sosModal.hidden = true", "Το SOS ακυρώθηκε πριν ενεργοποιηθεί."]) {
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
