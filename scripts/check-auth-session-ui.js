import { readFile } from 'node:fs/promises';

const source = await readFile('src/main.js', 'utf8');
const markup = await readFile('index.html', 'utf8');
const styles = await readFile('src/styles.css', 'utf8');
const i18n = await readFile('src/i18n.js', 'utf8');
const corpus = `${source}\n${markup}\n${i18n}`;

const renderAuthStart = source.indexOf('function renderAuth()');
const renderAuthEnd = source.indexOf('function showAuthMessage', renderAuthStart);
const renderAuthBody = source.slice(renderAuthStart, renderAuthEnd);

const requiredPatterns = [
  ['real Supabase user is the only signed-in flag', 'const signedIn = Boolean(currentUser);'],
  ['local profile label uses i18n', "t('common.signedIn')"],
  ['signed-in CSS class uses only real auth', "authIndicator.classList.toggle('signed-in', signedIn);"],
  ['login fields hidden only for real auth', 'authFields.hidden = signedIn;'],
  ['signed-in panel hidden unless real auth', 'authSignedIn.hidden = !signedIn;'],
  ['local storage mode explains device-only data', "t('auth.storageSignedIn')"],
  ['compact signed-in banner copy exists', "t('profile.signedInEmail'"],
  ['signed-in auth card title is compact', "t('profile.account')"],
  ['signed-in account status is compact', "t('common.syncActive')"],
  ['profile account sync button opens account accordion', "openProfileAccordion('account'"],
  ['login mobile helper copy is short', "t('auth.loginHelper')"],
  ['register mobile helper copy is short', "t('auth.signupHelper')"],
  ['login/register switch link is wired', "authSwitchModeButton?.addEventListener('click', () => setAuthMode(authMode === 'signup' ? 'login' : 'signup'));"],
  ['remember email remains login-only', 'if (rememberEmailOption) rememberEmailOption.hidden = signedIn || isSignup;'],
];

for (const [label, pattern] of requiredPatterns) {
  if (!renderAuthBody.includes(pattern) && !source.includes(pattern)) {
    console.error(`Missing auth session UI safeguard: ${label}`);
    process.exit(1);
  }
}

const markupPatterns = [
  ['remember email checkbox still exists', 'id="remember-email"'],
  ['remember email only-email helper exists', "'profile.rememberHelper'"],
  ['compact signed-out warning exists', "'accountBanner.notSignedIn'"],
  ['signed-out sync button exists', "'accountBanner.signInToSync'"],
  ['profile details accordion is collapsed by default', 'id="profile-details-panel" role="region" aria-labelledby="profile-edit-toggle" hidden'],
  ['profile accordion titles exist', "'profile.profileDetails'"],
  ['medical notes accordion title exists', "'profile.medicalNotes'"],
  ['SOS history accordion title exists', "'profile.sosHistory'"],
  ['login/register switch link exists', 'id="auth-switch-mode"'],
];

for (const [label, pattern] of markupPatterns) {
  if (!corpus.includes(pattern)) {
    console.error(`Missing auth markup safeguard: ${label}`);
    process.exit(1);
  }
}

const stylePatterns = [
  ['mobile auth breakpoint exists', '@media (max-width: 640px)'],
  ['mobile hides oversized auth tabs', '.auth-mode-tabs {\n    display: none;'],
  ['password toggle stays compact on mobile', '.password-toggle {\n    right: 6px;\n    width: auto;'],
  ['email input protects overflow', '#auth-email {'],
  ['signed-in email uses ellipsis', '.auth-signed-in strong,'],
  ['account banner email uses ellipsis', '.account-sync-banner strong {'],
  ['mobile signed-in account card is compact', '.account-sync-banner.signed-in {'],
  ['profile page hides duplicate global banner', '.profile-page-active .account-sync-banner {'],
  ['profile status email uses ellipsis', '.local-profile-status #profile-local-status-text {'],
  ['signed-out profile warning uses grid layout', 'grid-template-columns: auto minmax(0, 1fr) auto;'],
  ['signed-out profile sync button is not floating', '.local-profile-status .inline-button {\n  position: static;'],
  ['mobile signed-out sync button is full width below copy', '.local-profile-status #profile-status-login-button {\n    grid-column: 1 / -1;'],
  ['compact remember email checkbox size exists', '.remember-email-option input { flex: 0 0 auto; width: 13px; height: 13px;'],
];

for (const [label, pattern] of stylePatterns) {
  if (!styles.includes(pattern)) {
    console.error(`Missing auth style safeguard: ${label}`);
    process.exit(1);
  }
}

const forbiddenPatterns = [
  'LOCAL DEMO ACCOUNT',
  'indicatorSignedIn = signedIn || hasLocalDemoProfile',
  "authIndicator.classList.toggle('signed-in', indicatorSignedIn)",
  'Συνδεδεμένος με τοπικό demo προφίλ',
  'Τοπικό demo προφίλ σε localStorage',
  'localStorage.setItem(storageKeys.password',
  'localStorage.setItem(storageKeys.token',
  'authLiveTrackingNote.hidden = signedIn',
];

for (const pattern of forbiddenPatterns) {
  if (source.includes(pattern)) {
    console.error(`Forbidden auth/session UI pattern: ${pattern}`);
    process.exit(1);
  }
}

const contactsStart = source.indexOf('function renderContactsSyncStatus()');
const contactsEnd = source.indexOf('async function syncContactsToSupabaseBestEffort', contactsStart);
const contactsBody = source.slice(contactsStart, contactsEnd);

for (const pattern of [
  'if (!currentUser) {',
  "t('contacts.localOnly')",
  "contactsSyncStatus.classList.remove('error', 'signed-in');",
  "contactsSyncStatus.classList.toggle('signed-in', contactsSyncState === 'synced');",
]) {
  if (!contactsBody.includes(pattern)) {
    console.error(`Missing contacts local-only sync safeguard: ${pattern}`);
    process.exit(1);
  }
}

console.log('Auth/session UI regression safeguards are present.');
