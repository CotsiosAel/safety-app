import { readFile } from 'node:fs/promises';

const source = await readFile('src/main.js', 'utf8');
const markup = await readFile('index.html', 'utf8');
const styles = await readFile('src/styles.css', 'utf8');
const i18n = await readFile('src/i18n.js', 'utf8');
const corpus = `${source}\n${markup}\n${i18n}`;

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
  ['post-SOS active title', 'id="active-sos-title"'],
  ['post-SOS primary SMS action', "'sos.sendSmsAll'"],
  ['post-SOS safety send note', "'sos.safetyNote'"],
  ['post-SOS compact test badge', "'common.testSos'"],
  ['post-SOS single test note', "'sos.testNoRealAlert'"],
  ['post-SOS diagnostics collapsed toggle', "'sos.diagnostics'"],
  ['post-SOS contacts collapsed toggle', "'sos.contactsAndSends'"],
  ['post-SOS information collapsed toggle', "'sos.sosInfo'"],
  ['post-SOS muted tracking unavailable state', "'sos.trackingUnavailable'"],
  ['no-contact post-SOS add contact action', "'sos.addContactForSms'"],
  ['no-contact post-SOS 112 backup', 'id="active-sos-call-112" href="tel:112"'],
  ['honest PWA send limitation text', "'sos.prepareNote'"],
  ['SOS tracking base uses Vercel production URL', "const SOS_TRACKING_BASE_URL = 'https://safety-app-vert.vercel.app/'"],
  ['compact SOS history summary card', 'class="sos-history-card sos-history-summary-card"'],
  ['SOS history collapsed by default', 'id="sos-history-list" aria-live="polite" hidden'],
  ['SOS history view button', "'profile.viewHistory'"],
];

for (const [label, pattern] of requiredPatterns) {
  if (!corpus.includes(pattern)) {
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
  ['public tracking missing token error is specific', "getPublicTrackingError('invalidToken')"],
  ['public tracking Supabase not ready error is specific', "getPublicTrackingError('notReady')"],
  ['public tracking RPC permission error is specific', "getPublicTrackingError('permissionDenied')"],
  ['public tracking network error is specific', "getPublicTrackingError('networkError')"],
  ['public tracking REST RPC fallback exists', 'loadPublicSosSessionByTokenViaRest'],
  ['public tracking invalid token error is specific', "invalidToken: 'The SOS link is not valid.'"],
  ['public tracking ended state remains visible', "t('publicTracking.bannerEnded')"],
  ['public tracking active state remains visible', "t('publicTracking.bannerActive')"],
  ['public tracking developer diagnostics exist', "console.error('[SafeMe] Public tracking error'"],
  ['public tracking diagnostics do not expose token', 'trackingTokenPresent: Boolean(trackingToken)'],
  ['public tracking in-page diagnostic code exists', 'public-tracking-diagnostics'],
  ['public tracking map helpers are module scoped', 'function getNavigationUrl(location) {'],
  ['public tracking REST RPC fallback on SDK failure', 'viaFallback: Boolean(sdkError)'],
  ['public tracking auto-refreshes active sessions', 'window.setInterval(fetchPublicTrackingSession, 20000)'],
  ['public tracking parses token from URL', 'function parsePublicTrackingToken()'],
  ['public tracking loads session by RPC token', "rpc('get_sos_session_by_token'"],
  ['public tracking missing Supabase config logs clearly', 'Missing Supabase configuration'],
  ['public tracking SafeMe location heading', "t('publicTracking.locationTitle')"],
  ['public tracking last known location note', "t('publicTracking.locationNote')"],
  ['public tracking copy coordinates button', "t('publicTracking.copyCoordinates')"],
  ['public tracking Google Maps open action', "t('publicTracking.openGoogle')"],
  ['public tracking Google Maps navigation action', "t('publicTracking.navigateGoogle')"],
  ['public tracking Apple Maps navigation action', "t('publicTracking.navigateApple')"],
  ['public tracking refresh action', "t('publicTracking.refreshLocation')"],
  ['public tracking map embed helper', 'function getGoogleMapsEmbedUrl(location)'],
  ['public tracking coordinates copy helper', 'function getCoordinatesCopyText(location)'],
  ['public tracking Google Maps search uses coordinates', 'https://www.google.com/maps/search/?api=1&query=${getCoordinatesCopyText(location)}'],
  ['public tracking Google Maps navigation uses coordinates', 'destination=${getCoordinatesCopyText(location)}&travelmode=driving'],
  ['public tracking Apple Maps navigation uses coordinates', 'daddr=${lat},${lng}&dirflg=d'],
  ['public tracking map embed uses coordinates', 'maps?q=${lat},${lng}&z=16&output=embed'],
]) {
  if (!corpus.includes(pattern)) {
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
  ['real SOS SafeMe heading', "t('sos.messageRealHeader')"],
  ['real SOS emergency copy', "t('sos.messageNeedHelp')"],
  ['test SOS SafeMe heading', "t('sos.messageTestHeader')"],
  ['test SOS clearly states no emergency', "t('sos.messageTestNoEmergency')"],
  ['Apple Maps named location URL', 'encodeURIComponent(SAFE_ME_SOS_LOCATION_LABEL)'],
  ['Apple Maps navigation URL', 'daddr=${lat},${lng}&dirflg=d'],
  ['Google Maps coordinates search URL', 'https://www.google.com/maps/search/?api=1&query=${getCoordinatesCopyText(location)}'],
  ['Google Maps driving navigation URL', 'https://www.google.com/maps/dir/?api=1&destination=${getCoordinatesCopyText(location)}&travelmode=driving'],
  ['current location section label', "t('sos.messageMyLocation')"],
  ['test location section label', "t('sos.messageTestLocation')"],
  ['navigation section label', "t('sos.messageNavigate')"],
  ['test navigation section label', "t('sos.messageNavigateTest')"],
  ['Google Maps fallback message label', "t('sos.messageGoogleFallback')"],
  ['coordinates label', "t('sos.messageCoords'"],
  ['notification timestamp label', "t('sos.messageTime'"],
]) {
  if (!corpus.includes(pattern)) {
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
  ['notify-all empty state guides user to add phone contact', "t('sos.addContactForSms')"],
]) {
  if (!notifyAllBody.includes(pattern) && !i18n.includes(pattern)) {
    console.error(`Missing notify-all SOS SMS safeguard: ${label}`);
    process.exit(1);
  }
}

const requiredPolishPatterns = [
  ['test mode sequential SMS action label', "'sos.testSms'"],
  ['real mode primary action label remains', "'sos.sendSmsAll'"],
  ['SOS information disclosure', "'sos.sosInfo'"],
  ['tracking unavailable note inside SOS information', "'sos.trackingUnavailable'"],
  ['opened notification status', "'sos.opened'"],
  ['copied notification status', "'common.copied'"],
  ['failed notification status', "'sos.failed'"],
  ['sent notification status', "'sos.sent'"],
  ['mobile vertical SOS contacts header', '.sos-contact-notify-header {\n    flex-direction: column;'],
  ['mobile full-width all-contacts SMS button', '.sos-notify-primary { width: 100%; }'],
];

for (const [label, pattern] of requiredPolishPatterns) {
  if (!corpus.includes(pattern) && !styles.includes(pattern)) {
    console.error(`Missing post-SOS polish safeguard: ${label}`);
    process.exit(1);
  }
}

const forbiddenPostSosUiPatterns = [
  ['confusing unavailable tracking label', 'Tracking link μη διαθέσιμο'],
  ['large unavailable tracking action label', '>Live tracking μη διαθέσιμο</button>'],
];

for (const [label, pattern] of forbiddenPostSosUiPatterns) {
  if (markup.includes(pattern) || styles.includes(pattern)) {
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
  ['emergency-first real message', "'sos.messageReady'"],
  ['emergency-first test message', "'sos.testNoRealAlert'"],
  ['terminate SOS action', 'id="end-active-sos"'],
  ['contacts disclosure before diagnostics', "'sos.contactsAndSends'"],
]) {
  if (!corpus.includes(pattern) && !activeSosMarkup.includes(pattern)) {
    console.error(`Missing emergency-first active SOS UI: ${label}`);
    process.exit(1);
  }
}

if (activeSosMarkup.includes('<p class="eyebrow">Επαφές έκτακτης ανάγκης</p>')) {
  console.error('Active SOS must not show the old full emergency contacts card heading immediately.');
  process.exit(1);
}

const testModeCopyMatches = corpus.match(/t\('common\.testSos'\)/g) || [];
if (testModeCopyMatches.length < 1) {
  console.error(`Active SOS should wire the test mode badge copy through i18n, found ${testModeCopyMatches.length}.`);
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

const escalationStart = source.indexOf('const SOS_ESCALATION_DELAY_MS = 60_000');
const escalationEnd = source.indexOf('function loadJson(key, fallback)', escalationStart);
const escalationBody = source.slice(escalationStart, escalationEnd);

for (const [label, pattern] of [
  ['SOS escalation 60-second delay constant', 'const SOS_ESCALATION_DELAY_MS = 60_000'],
  ['SOS escalation real-session gate', 'function isRealActiveSosSession('],
  ['SOS escalation reminder scheduler', 'function startSosEscalationReminder('],
  ['SOS escalation stops when SOS ends', 'stopSosEscalationReminder();'],
  ['SOS escalation send SMS handler', 'async function handleSosEscalationSendSms()'],
  ['SOS escalation remind-later handler', 'function handleSosEscalationRemindLater()'],
  ['SOS escalation already-contacted handler', 'function handleSosEscalationAlreadyContacted()'],
  ['SOS escalation optional vibration', 'navigator.vibrate([180, 120, 180])'],
  ['SOS escalation modal markup', 'id="sos-escalation-modal"'],
  ['SOS escalation runtime fallback uses i18n', "t('sos.escalationSmsBlocked')"],
  ['SOS escalation English prompt in dictionary', "escalationPrompt: 'SOS is still active. Send an emergency SMS to your trusted contacts now?'"],
  ['SOS escalation Greek prompt in dictionary', "escalationPrompt: 'Το SOS είναι ακόμα ενεργό. Να στείλεις SMS έκτακτης ανάγκης στις αξιόπιστες επαφές τώρα;'"],
  ['SOS escalation English SMS blocked fallback in dictionary', "escalationSmsBlocked: 'Your phone blocked automatic SMS opening. Tap Send SMS now.'"],
  ['SOS escalation Greek SMS blocked fallback in dictionary', "escalationSmsBlocked: 'Το κινητό μπλόκαρε το αυτόματο άνοιγμα SMS. Πάτησε Αποστολή SMS τώρα.'"],
  ['SOS escalation DOM bindings', "setDomText(root, '#sos-escalation-prompt', 'sos.escalationPrompt')"],
]) {
  if (!source.includes(pattern) && !markup.includes(pattern) && !escalationBody.includes(pattern) && !i18n.includes(pattern)) {
    console.error(`Missing SOS escalation safeguard: ${label}`);
    process.exit(1);
  }
}

const forbiddenSilentSmsClaims = [
  ['silent SMS sent claim', 'SMS sent automatically to'],
  ['silent emergency SMS claim', 'emergency SMS was sent automatically'],
  ['silent SMS sent claim Greek', 'Το SMS στάλθηκε αυτόματα'],
];

for (const [label, pattern] of forbiddenSilentSmsClaims) {
  if (source.includes(pattern) || markup.includes(pattern)) {
    console.error(`Forbidden silent SMS claim found: ${label}`);
    process.exit(1);
  }
}

console.log('SOS one-tap persistence regression safeguards are present.');
