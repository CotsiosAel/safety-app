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
  ['one-tap SOS button handler', "sosButton.addEventListener('click', activateSosFromMainButton)"],
  ['immediate active SOS activation', 'async function confirmSos()'],
  ['test mode creates active test SOS', "createLocalActiveSosSession(currentLocation, { testMode: true })"],
  ['active screen notification primary action', 'id="notify-all-sos-contacts-action"'],
  ['honest PWA send limitation text', 'Το SafeMe ετοιμάζει το μήνυμα. Η αποστολή γίνεται από τη συσκευή σου όπου απαιτείται.'],
];

for (const [label, pattern] of requiredPatterns) {
  if (!source.includes(pattern) && !markup.includes(pattern)) {
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

for (const pattern of ['window.confirm', 'markSosSessionEnded(endingSession', 'stopActiveSosLocationAutoUpdate()', 'clearActiveSosRuntimeState({']) {
  if (!endFlowBody.includes(pattern)) {
    console.error(`End SOS flow is missing required cleanup/confirmation call: ${pattern}`);
    process.exit(1);
  }
}

const forbiddenCountdownPatterns = [
  ['countdown function', 'function stopSosCountdown()'],
  ['countdown starter', 'function startSosCountdown()'],
  ['countdown completion', 'completeSosCountdown'],
  ['countdown number markup', 'id="sos-countdown-number"'],
  ['countdown progress markup', 'sos-countdown-progress'],
  ['countdown debug markup', 'sos-countdown-debug'],
  ['countdown CSS class', '.sos-countdown-number'],
  ['countdown timeout handles', 'sosCountdownTimeouts'],
  ['activation-now confirmation step', 'Ενεργοποίηση τώρα'],
  ['pre-activation confirmation modal handler', 'function openSosModal()'],
];

for (const [label, pattern] of forbiddenCountdownPatterns) {
  if (source.includes(pattern) || markup.includes(pattern) || styles.includes(pattern)) {
    console.error(`SOS one-tap flow must not include ${label}: ${pattern}`);
    process.exit(1);
  }
}

for (const pattern of ['let sosActivationInProgress = false', 'if (sosActivationInProgress) return', 'sosActivationInProgress = true']) {
  if (!source.includes(pattern)) {
    console.error(`Missing duplicate SOS activation guard: ${pattern}`);
    process.exit(1);
  }
}

console.log('SOS one-tap persistence regression safeguards are present.');
