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



const publicTrackingStart = source.indexOf('async function fetchPublicTrackingSession()');
const publicTrackingEnd = source.indexOf('function initializeSafeMeAppUnsafe()', publicTrackingStart);
const publicTrackingBody = source.slice(publicTrackingStart, publicTrackingEnd);

for (const [label, pattern] of [
  ['public tracking waits for Supabase during startup', 'await ensureSupabaseReady();'],
  ['public tracking keeps lightweight startup branch', 'if (hasTrackingTokenParam) {'],
  ['public tracking missing token error is specific', "PUBLIC_TRACKING_ERRORS.invalidToken"],
  ['public tracking Supabase not ready error is specific', "PUBLIC_TRACKING_ERRORS.notReady"],
  ['public tracking RPC permission error is specific', "PUBLIC_TRACKING_ERRORS.permissionDenied"],
  ['public tracking network error is specific', "PUBLIC_TRACKING_ERRORS.networkError"],
  ['public tracking REST RPC fallback exists', 'loadPublicSosSessionByTokenViaRest'],
  ['public tracking invalid token error is specific', 'Ο σύνδεσμος SOS δεν είναι έγκυρος.'],
  ['public tracking ended state remains visible', "Το SOS έχει τερματιστεί."],
  ['public tracking active state remains visible', "Υπάρχει ενεργό SOS."],
  ['public tracking developer diagnostics exist', "console.error('[SafeMe] Public tracking error'"],
  ['public tracking diagnostics do not expose token', 'trackingTokenPresent: Boolean(trackingToken)'],
  ['public tracking in-page diagnostic code exists', 'public-tracking-diagnostics'],
  ['public tracking map helpers are module scoped', 'function getNavigationUrl(location) {'],
  ['public tracking REST RPC fallback on SDK failure', 'viaFallback: Boolean(sdkError)'],
  ['public tracking auto-refreshes active sessions', 'window.setInterval(fetchPublicTrackingSession, 20000)'],
  ['public tracking parses token from URL', 'function parsePublicTrackingToken()'],
  ['public tracking loads session by RPC token', "rpc('get_sos_session_by_token'"],
  ['public tracking missing Supabase config logs clearly', 'Missing Supabase configuration'],
  ['public tracking SafeMe location heading', 'Τοποθεσία SOS SafeMe'],
  ['public tracking last known location note', 'Αυτή είναι η τελευταία γνωστή τοποθεσία του ατόμου.'],
  ['public tracking copy coordinates button', 'Αντιγραφή συντεταγμένων'],
  ['public tracking Google Maps open action', 'Άνοιγμα στο Google Maps'],
  ['public tracking Google Maps navigation action', 'Πλοήγηση στο Google Maps'],
  ['public tracking Apple Maps navigation action', 'Πλοήγηση στο Apple Maps'],
  ['public tracking refresh action', 'Ανανέωση τοποθεσίας'],
  ['public tracking map embed helper', 'function getGoogleMapsEmbedUrl(location)'],
  ['public tracking coordinates copy helper', 'function getCoordinatesCopyText(location)'],
  ['public tracking Google Maps search uses coordinates', 'https://www.google.com/maps/search/?api=1&query=${getCoordinatesCopyText(location)}'],
  ['public tracking Google Maps navigation uses coordinates', 'destination=${getCoordinatesCopyText(location)}&travelmode=driving'],
  ['public tracking Apple Maps navigation uses coordinates', 'daddr=${lat},${lng}&dirflg=d'],
  ['public tracking map embed uses coordinates', 'maps?q=${lat},${lng}&z=16&output=embed'],
]) {
  if (!source.includes(pattern)) {
    console.error(`Missing public tracking regression safeguard: ${label}`);
    process.exit(1);
  }
}

const publicMapHelpersStart = source.indexOf('function getRoundedCoordinates(location)');
const publicMapHelpersEnd = source.indexOf('function buildPublicTrackingDiagnosticCode', publicMapHelpersStart);
const publicMapHelpersBody = source.slice(publicMapHelpersStart, publicMapHelpersEnd);

for (const [label, pattern] of [
  ['named map query helper removed', 'function getNamedMapQuery(location)'],
  ['Google Maps navigation must not use label@coordinates', 'destination=${encodeURIComponent(SAFE_ME_SOS_LOCATION_LABEL)}'],
  ['Google Maps search must not use label@coordinates', 'query=${encodeURIComponent(SAFE_ME_SOS_LOCATION_LABEL)}'],
  ['Apple Maps navigation must not use label@coordinates', 'daddr=${encodeURIComponent(SAFE_ME_SOS_LOCATION_LABEL)}@'],
  ['map embed must not use label@coordinates', 'getNamedMapQuery(location)'],
]) {
  if (publicMapHelpersBody.includes(pattern)) {
    console.error(`Forbidden public map URL regression found: ${label}`);
    process.exit(1);
  }
}

if (publicTrackingBody.includes('Το tracking link δεν είναι πλέον διαθέσιμο.')) {
  console.error('Public tracking errors must not collapse into the old generic unavailable message.');
  process.exit(1);
}

const publicTrackingStartupStart = source.indexOf('function startSafeMeWhenDomReady()');
const publicTrackingStartupEnd = source.indexOf("window.addEventListener('pageshow'", publicTrackingStartupStart);
const publicTrackingStartupBody = source.slice(publicTrackingStartupStart, publicTrackingStartupEnd);
const publicTrackingStartupBranchStart = publicTrackingStartupBody.indexOf('if (hasTrackingTokenParam) {');
const publicTrackingStartupBranchEnd = publicTrackingStartupBody.indexOf('} else {', publicTrackingStartupBranchStart);
const publicTrackingStartupBranch = publicTrackingStartupBody.slice(publicTrackingStartupBranchStart, publicTrackingStartupBranchEnd);

if (publicTrackingStartupBranch.indexOf('await initializePublicTrackingMode();') === -1) {
  console.error('Public tracking startup must call initializePublicTrackingMode().');
  process.exit(1);
}

if (!publicTrackingBody.includes('loadPublicSosSessionByToken(')) {
  console.error('Public tracking fetch must load the SOS session through loadPublicSosSessionByToken().');
  process.exit(1);
}

if (publicTrackingBody.includes('await ensureSupabaseReady();') && publicTrackingBody.includes("error: PUBLIC_TRACKING_ERRORS.loadFailed")) {
  console.error('Public tracking must not use the old generic loadFailed message.');
  process.exit(1);
}

if (publicTrackingStartupBranch.includes('initializeSafeMeApp();')) {
  console.error('Public tracking startup must not initialize the normal app UI.');
  process.exit(1);
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



const sosMessageStart = source.indexOf('function buildSosMessage(');
const sosMessageEnd = source.indexOf('function getSmsLink', sosMessageStart);
const sosMessageBody = source.slice(sosMessageStart, sosMessageEnd);

for (const [label, pattern] of [
  ['real SOS SafeMe heading', '🚨 SOS SafeMe'],
  ['real SOS emergency copy', 'Χρειάζομαι βοήθεια ΤΩΡΑ.'],
  ['test SOS SafeMe heading', '🧪 ΔΟΚΙΜΗ SafeMe SOS'],
  ['test SOS clearly states no emergency', 'Δεν υπάρχει πραγματική ανάγκη.'],
  ['Apple Maps named location URL', 'encodeURIComponent(SAFE_ME_SOS_LOCATION_LABEL)'],
  ['Apple Maps navigation URL', 'daddr=${lat},${lng}&dirflg=d'],
  ['Google Maps coordinates search URL', 'https://www.google.com/maps/search/?api=1&query=${getCoordinatesCopyText(location)}'],
  ['Google Maps driving navigation URL', 'https://www.google.com/maps/dir/?api=1&destination=${getCoordinatesCopyText(location)}&travelmode=driving'],
  ['current location section label', '📍 Τοποθεσία μου:'],
  ['test location section label', '📍 Τοποθεσία δοκιμής:'],
  ['navigation section label', '🧭 Πλοήγηση προς εμένα:'],
  ['test navigation section label', '🧭 Πλοήγηση προς το σημείο:'],
  ['Google Maps fallback message label', 'Αν δεν ανοίξει σωστά, δοκίμασε Google Maps:'],
  ['coordinates label', 'Συντεταγμένες:'],
  ['notification timestamp label', '🕒 Ώρα ειδοποίησης:'],
]) {
  if (!source.includes(pattern) && !sosMessageBody.includes(pattern)) {
    console.error(`Missing SOS message wording safeguard: ${label}`);
    process.exit(1);
  }
}

if (sosMessageBody.includes('112')) {
  console.error('SOS SMS/share message must focus on sender location links and not add 112 escalation copy.');
  process.exit(1);
}

for (const [label, pattern] of [
  ['individual SMS composer remains prepared-only', 'return `sms:${phone}?&body=${encodeURIComponent(message)}`;'],
  ['single-recipient composer avoids group SMS URLs', 'window.location.href = `sms:${cleanRecipient}?&body=${encodeURIComponent(message)}`;'],
]) {
  if (!source.includes(pattern)) {
    console.error(`Missing prepared SMS composer safeguard: ${label}`);
    process.exit(1);
  }
}

const sosRecipientStart = source.indexOf('function normalizeSmsRecipient(');
const sosRecipientEnd = source.indexOf('function getEmailCapableSosContacts()', sosRecipientStart);
const sosRecipientBody = source.slice(sosRecipientStart, sosRecipientEnd);

for (const [label, pattern] of [
  ['SMS recipient normalizer trims and collapses whitespace', "String(phone || '').trim().replace(/\\s+/g, ' ')"],
  ['SMS recipient dedupe helper exists', 'function getUniqueSmsRecipients(recipients = [])'],
  ['SMS recipient dedupe tracks normalized phones', 'seenRecipients.has(normalizedRecipient)'],
  ['SOS contact collection dedupes duplicate primary phone', 'seenPhones.has(normalizedPhone)'],
  ['SOS contact collection keeps all unique contact phones', 'return contacts.filter((contact) => {'],
  ['SMS queue signature uses unique contact phones', 'return contactsList.map((contact) => normalizeSmsRecipient(contact.phone)).join('|');'],
]) {
  if (!sosRecipientBody.includes(pattern)) {
    console.error(`Missing SOS SMS recipient dedupe safeguard: ${label}`);
    process.exit(1);
  }
}

const notifyAllStart = source.indexOf('async function notifyAllSosContacts()');
const notifyAllEnd = source.indexOf('function loadJson', notifyAllStart);
const notifyAllBody = source.slice(notifyAllStart, notifyAllEnd);

for (const [label, pattern] of [
  ['notify-all blocks empty SMS-capable contacts', 'if (smsQueue.contacts.length === 0)'],
  ['notify-all opens the current queue contact only', 'const contact = smsQueue.contacts[smsQueue.openedCount];'],
  ['notify-all advances the sequential SMS queue', 'smsQueue.openedCount += 1;'],
  ['notify-all empty state guides user to add phone contact', 'Δεν υπάρχουν έμπιστες επαφές με αριθμό τηλεφώνου'],
]) {
  if (!notifyAllBody.includes(pattern)) {
    console.error(`Missing notify-all SOS SMS safeguard: ${label}`);
    process.exit(1);
  }
}

const requiredPolishPatterns = [
  ['test mode sequential SMS action label', 'Δοκιμή SMS'],
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
