import { readFile } from 'node:fs/promises';

const source = await readFile('src/main.js', 'utf8');

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
];

for (const [label, pattern] of requiredPatterns) {
  if (!renderAuthBody.includes(pattern)) {
    console.error(`Missing auth session UI safeguard: ${label}`);
    process.exit(1);
  }
}

const forbiddenPatterns = [
  'indicatorSignedIn = signedIn || hasLocalDemoProfile',
  "authIndicator.classList.toggle('signed-in', indicatorSignedIn)",
  "Συνδεδεμένος με τοπικό demo προφίλ",
  "Τοπικό demo προφίλ σε localStorage",
];

for (const pattern of forbiddenPatterns) {
  if (renderAuthBody.includes(pattern)) {
    console.error(`Local profile must not fake signed-in UI: ${pattern}`);
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
