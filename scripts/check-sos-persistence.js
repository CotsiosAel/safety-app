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
  ['post-SOS active title', 'SOS ενεργό'],
  ['post-SOS primary SMS action', 'Αποστολή SMS σε όλες τις επαφές'],
  ['post-SOS safety send note', 'Για λόγους ασφαλείας, το κινητό σου μπορεί να ζητήσει να πατήσεις αποστολή μέσα στο SMS app.'],
  ['post-SOS compact test badge', 'Δοκιμή SOS'],
  ['post-SOS single test note', 'Δεν αποστέλλεται πραγματικό μήνυμα έκτακτης ανάγκης.'],
  ['post-SOS diagnostics collapsed toggle', '<summary>Διαγνωστικά</summary>'],
  ['post-SOS contacts collapsed toggle', '<summary>Επαφές &amp; αποστολές</summary>'],
  ['post-SOS information collapsed toggle', '<summary>Πληροφορίες SOS</summary>'],
  ['post-SOS muted tracking unavailable state', 'Live tracking μη διαθέσιμο σε αυτή τη δοκιμή.'],
  ['no-contact post-SOS add contact action', 'Προσθήκη επαφής'],
  ['no-contact post-SOS 112 backup', 'id="active-sos-call-112" href="tel:112"'],
  ['honest PWA send limitation text', 'Το SafeMe ετοιμάζει το μήνυμα. Η αποστολή γίνεται από τη συσκευή σου όπου απαιτείται.'],
  ['SOS tracking base uses Vercel production URL', "const SOS_TRACKING_BASE_URL = 'https://safety-app-vert.vercel.app/'"],
  ['compact SOS history summary card', 'class="sos-history-card sos-history-summary-card"'],
  ['SOS history collapsed by default', 'id="sos-history-list" aria-live="polite" hidden'],
  ['SOS history view button', 'id="sos-history-toggle" type="button">Προβολή ιστορικού</button>'],
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


const oldGithubPagesSosBase = `https://${['cotsios', 'ael'].join('')}.github.${'io'}/safety-app/`;

for (const [label, pattern] of [
  ['old GitHub Pages SOS tracking base', `const SOS_TRACKING_BASE_URL = '${oldGithubPagesSosBase}'`],
]) {
  if (source.includes(pattern) || markup.includes(pattern)) {
    console.error(`Forbidden SOS persistence regression found: ${label}`);
    process.exit(1);
  }
}


const requiredPolishPatterns = [
  ['test mode primary action label', 'Δοκιμή αποστολής SMS'],
  ['real mode primary action label remains', 'Αποστολή SMS σε όλες τις επαφές'],
  ['SOS information disclosure', '<summary>Πληροφορίες SOS</summary>'],
  ['tracking unavailable note inside SOS information', 'Live tracking μη διαθέσιμο σε αυτή τη δοκιμή.'],
  ['Greek opened notification status', 'Άνοιξε'],
  ['Greek copied notification status', 'Αντιγράφηκε'],
  ['Greek failed notification status', 'Απέτυχε'],
  ['Greek sent notification status', 'Στάλθηκε'],
  ['mobile vertical SOS contacts header', '.sos-contact-notify-header {\n    flex-direction: column;'],
  ['mobile full-width all-contacts SMS button', '.sos-notify-primary { width: 100%; }'],
];

for (const [label, pattern] of requiredPolishPatterns) {
  if (!source.includes(pattern) && !markup.includes(pattern) && !styles.includes(pattern)) {
    console.error(`Missing post-SOS polish safeguard: ${label}`);
    process.exit(1);
  }
}

const forbiddenPostSosUiPatterns = [
  ['English Send SMS label', 'Send SMS'],
  ['English Open WhatsApp label', 'Open WhatsApp'],
  ['English Send Email label', 'Send Email'],
  ['English copy emergency message label', 'Copy emergency message'],
  ['English Emergency contacts label', 'Emergency contacts'],
  ['English uppercase emergency contacts label', 'EMERGENCY CONTACTS'],
  ['English Opened notification label', 'Opened'],
  ['confusing unavailable tracking label', 'Tracking link μη διαθέσιμο'],
  ['large unavailable tracking action label', '>Live tracking μη διαθέσιμο</button>'],
];

for (const [label, pattern] of forbiddenPostSosUiPatterns) {
  if (source.includes(pattern) || markup.includes(pattern) || styles.includes(pattern)) {
    console.error(`Post-SOS mobile UI regression found: ${label}: ${pattern}`);
    process.exit(1);
  }
}

if (markup.includes('<details class="active-sos-disclosure active-sos-debug" open')) {
  console.error('Active SOS diagnostics must be collapsed by default.');
  process.exit(1);
}

for (const [label, pattern] of [
  ['Active SOS information', '<details class="active-sos-disclosure active-sos-info" open'],
  ['Active SOS contacts and sends', '<details class="active-sos-disclosure active-sos-contacts" open'],
]) {
  if (markup.includes(pattern)) {
    console.error(`${label} must be collapsed by default.`);
    process.exit(1);
  }
}

const activeSosStart = markup.indexOf('<section class="active-sos-card"');
const activeSosEnd = markup.indexOf('<section class="home-readiness-summary"', activeSosStart);
const activeSosMarkup = markup.slice(activeSosStart, activeSosEnd);

for (const [label, pattern] of [
  ['emergency-first real message', 'Το μήνυμα SOS είναι έτοιμο.'],
  ['emergency-first test message', 'Δεν αποστέλλεται πραγματικό μήνυμα έκτακτης ανάγκης.'],
  ['terminate SOS action', 'id="end-active-sos"'],
  ['contacts disclosure before diagnostics', '<summary>Επαφές &amp; αποστολές</summary>'],
]) {
  if (!source.includes(pattern) && !activeSosMarkup.includes(pattern)) {
    console.error(`Missing emergency-first active SOS UI: ${label}`);
    process.exit(1);
  }
}

if (activeSosMarkup.includes('<p class="eyebrow">Επαφές έκτακτης ανάγκης</p>')) {
  console.error('Active SOS must not show the old full emergency contacts card heading immediately.');
  process.exit(1);
}

const testModeCopyMatches = activeSosMarkup.match(/Δοκιμή SOS/g) || [];
if (testModeCopyMatches.length !== 1) {
  console.error(`Active SOS should show the test mode badge copy once, found ${testModeCopyMatches.length}.`);
  process.exit(1);
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
