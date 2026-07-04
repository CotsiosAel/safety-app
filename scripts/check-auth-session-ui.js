import { readFile } from 'node:fs/promises';

const source = await readFile('src/main.js', 'utf8');
const markup = await readFile('index.html', 'utf8');
const styles = await readFile('src/styles.css', 'utf8');

const renderAuthStart = source.indexOf('function renderAuth()');
const renderAuthEnd = source.indexOf('function showAuthMessage', renderAuthStart);
const renderAuthBody = source.slice(renderAuthStart, renderAuthEnd);

const requiredPatterns = [
  ['real Supabase user is the only signed-in flag', 'const signedIn = Boolean(currentUser);'],
  ['local profile label is not signed in', "authIndicator.textContent = signedIn ? 'Συνδεδεμένος' : (hasLocalDemoProfile ? 'Τοπικό προφίλ' : 'Χωρίς σύνδεση');"],
  ['signed-in CSS class uses only real auth', "authIndicator.classList.toggle('signed-in', signedIn);"],
  ['login fields hidden only for real auth', 'authFields.hidden = signedIn;'],
  ['signed-in panel hidden unless real auth', 'authSignedIn.hidden = !signedIn;'],
  ['local storage mode explains device-only data', "storageMode.textContent = signedIn ? 'Supabase + τοπικό αντίγραφο' : 'Τοπικό προφίλ σε αυτή τη συσκευή';"],
  ['login mobile helper copy exists', "'Συνδέσου για συγχρονισμό επαφών και ιστορικού SOS.'"],
  ['register mobile helper copy exists', "'Φτιάξε λογαριασμό για συγχρονισμό επαφών και ιστορικού SOS.'"],
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
  ['remember email only-email helper exists', 'Αποθηκεύεται μόνο το email σε αυτή τη συσκευή.'],
  ['short signed-out explanation exists', 'Χωρίς σύνδεση, το SOS λειτουργεί τοπικά. Συνδέσου για συγχρονισμό επαφών και ιστορικού.'],
  ['login/register switch link exists', 'id="auth-switch-mode"'],
];

for (const [label, pattern] of markupPatterns) {
  if (!markup.includes(pattern)) {
    console.error(`Missing auth markup safeguard: ${label}`);
    process.exit(1);
  }
}

const stylePatterns = [
  ['mobile auth breakpoint exists', '@media (max-width: 640px)'],
  ['mobile hides oversized auth tabs', '.auth-mode-tabs {\n    display: none;'],
  ['password toggle stays compact on mobile', '.password-toggle {\n    right: 6px;\n    width: auto;'],
  ['email input protects overflow', '#auth-email {'],
];

for (const [label, pattern] of stylePatterns) {
  if (!styles.includes(pattern)) {
    console.error(`Missing auth style safeguard: ${label}`);
    process.exit(1);
  }
}

const forbiddenPatterns = [
  'indicatorSignedIn = signedIn || hasLocalDemoProfile',
  "authIndicator.classList.toggle('signed-in', indicatorSignedIn)",
  'Συνδεδεμένος με τοπικό demo προφίλ',
  'Τοπικό demo προφίλ σε localStorage',
  'localStorage.setItem(storageKeys.password',
  'localStorage.setItem(storageKeys.token',
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
  'Οι επαφές είναι μόνο τοπικές σε αυτή τη συσκευή. Συνδέσου για συγχρονισμό Supabase.',
  "contactsSyncStatus.classList.remove('error', 'signed-in');",
  "contactsSyncStatus.classList.toggle('signed-in', contactsSyncState === 'synced');",
]) {
  if (!contactsBody.includes(pattern)) {
    console.error(`Missing contacts local-only sync safeguard: ${pattern}`);
    process.exit(1);
  }
}

console.log('Auth/session UI regression safeguards are present.');
