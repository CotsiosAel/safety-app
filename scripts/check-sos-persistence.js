import { readFile } from 'node:fs/promises';

const source = await readFile('src/main.js', 'utf8');

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
  ['countdown uses interval cleanup', 'window.clearInterval(sosCountdownTimer)'],
  ['countdown stores deadline start timestamp', 'sosCountdownStartedAt = Date.now()'],
  ['countdown stores deadline end timestamp', 'sosCountdownEndsAt = sosCountdownStartedAt + 5000'],
  ['countdown renders an immediate 5', 'renderSosCountdown(5)'],
  ['countdown uses one active interval handle', 'sosCountdownTimer = window.setInterval(tickSosCountdown, 250)'],
  ['countdown derives remaining seconds from deadline', 'Math.ceil((sosCountdownEndsAt - Date.now()) / 1000)'],
  ['countdown completes from deadline', 'Date.now() >= sosCountdownEndsAt'],
  ['countdown marks running debug state', "setSosCountdownTimerState('running')"],
  ['countdown marks completed debug state', "setSosCountdownTimerState('completed')"],
  ['countdown activates SOS automatically', 'confirmSos()'],
  ['countdown logs start', "console.log('[SafeMe SOS] countdown start')"],
  ['countdown logs tick', "console.log('[SafeMe SOS] countdown tick'"],
  ['countdown logs complete', "console.log('[SafeMe SOS] countdown complete')"],
];

for (const [label, pattern] of countdownRequirements) {
  if (!countdownBody.includes(pattern)) {
    console.error(`Missing SOS countdown safeguard: ${label}`);
    process.exit(1);
  }
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
