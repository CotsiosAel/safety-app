import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const checks = [
  ['contacts diagnostics container exists', html.includes('contacts-sync-diagnostics')],
  ['manual refresh button exists inside sync accordion', html.includes('Ανανέωση επαφών από λογαριασμό') && html.includes('data-contacts-accordion="sync"')],
  ['manual upload button exists', html.includes('Αποθήκευση τοπικών επαφών στον λογαριασμό')],
  ['signed-in copy says contacts sync automatically', main.includes('Οι επαφές συγχρονίζονται αυτόματα.')],
  ['signed-out copy says contacts stay local', main.includes('Τοπική λειτουργία: οι επαφές μένουν μόνο σε αυτή τη συσκευή.')],
  ['contacts page silently auto-refreshes with currentUser', /nextPage === 'contacts'[\s\S]*autoRefreshAccountContactsFromSupabase\('contacts-page', \{ force: true \}\)/.test(main)],
  ['visibility auto-refresh is throttled', main.includes('CONTACTS_AUTO_REFRESH_THROTTLE_MS = 30 * 1000') && main.includes("autoRefreshAccountContactsFromSupabase('visible')")],
  ['startup/account load fetches trusted_contacts before local import prompt', /async function loadSupabaseData\([\s\S]*trusted_contacts'\)\.select\('\*'\)[\s\S]*pendingLocalImport = \(!remoteProfile && remoteContactList\.length === 0\) \? getLocalImportCandidate\(\) : null/.test(main)],
  ['add path saves a single contact to Supabase', main.includes('await saveContactToSupabase(newContact)')],
  ['add path refreshes account contacts after save', main.includes('await refreshAccountContactsFromSupabase({ silent: true });\n      setContactsSyncState')],
  ['edit path upserts and refreshes remote truth', main.includes('await upsertContactToSupabase(updatedContact);\n      await refreshAccountContactsFromSupabase({ silent: true });')],
  ['delete path deletes and refreshes remote truth', main.includes('await deleteContactFromSupabase(contactToDelete);') && main.includes('if (currentUser) await refreshAccountContactsFromSupabase({ silent: true });')],
  ['primary path upserts and refreshes remote truth', main.includes('await upsertContactsToSupabase(nextContacts);\n      await refreshAccountContactsFromSupabase({ silent: true });')],
  ['refresh fetches by user_id ordered by created_at', main.includes(".eq('user_id', currentUser.id)\n      .order('created_at', { ascending: true })")],
  ['bulk delete is isolated to explicit deleteAllContactsFromSupabase', !/saveContactsToSupabase[\s\S]*?\.delete\(\)[\s\S]*?trusted_contacts/.test(main)],
  ['trusted contacts payload does not send unsupported email column', /function mapContactToSupabase\(contact\) {[\s\S]*?return {[\s\S]*?phone: contact\.phone,[\s\S]*?tone: contact\.tone \|\| 'default',[\s\S]*?};/.test(main) && !/function mapContactToSupabase\(contact\) {[\s\S]*?return {[\s\S]*?email: contact\.email/.test(main)],
  ['trusted contacts keeps optional email when reading from Supabase', main.includes("email: contact.email || '',")],
  ['top add contact CTA exists', html.includes('id="contacts-add-cta"') && html.includes('Προσθήκη επαφής')],
  ['lower add accordion header is hidden', html.includes('id="contacts-add-toggle"') && html.includes('contacts-add-hidden-toggle') && html.includes('hidden')],
  ['add contact form has close control', html.includes('data-close-add-contact') && html.includes('Κλείσιμο')],
  ['top add button opens/toggles add form', main.includes('contactsAddCta?.addEventListener(\'click\', toggleContactsAddForm)')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);
if (failed.length) process.exit(1);
