import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const checks = [
  ['contacts diagnostics container exists', html.includes('contacts-sync-diagnostics')],
  ['manual refresh button exists', html.includes('Ανανέωση επαφών από λογαριασμό')],
  ['manual upload button exists', html.includes('Αποθήκευση τοπικών επαφών στον λογαριασμό')],
  ['add path saves a single contact to Supabase', main.includes('await saveContactToSupabase(newContact)')],
  ['add path refreshes account contacts after save', main.includes('await refreshAccountContactsFromSupabase({ silent: true });\n      setContactsSyncState')],
  ['refresh fetches by user_id ordered by created_at', main.includes(".eq('user_id', currentUser.id)\n      .order('created_at', { ascending: true })")],
  ['local mode diagnostic does not claim Supabase sync', main.includes('Τοπική λειτουργία: οι επαφές μένουν μόνο σε αυτή τη συσκευή.')],
  ['bulk delete is isolated to explicit deleteAllContactsFromSupabase', !/saveContactsToSupabase[\s\S]*?\.delete\(\)[\s\S]*?trusted_contacts/.test(main)],
  ['trusted contacts payload does not send unsupported email column', /function mapContactToSupabase\(contact\) {[\s\S]*?return {[\s\S]*?phone: contact\.phone,[\s\S]*?tone: contact\.tone \|\| 'default',[\s\S]*?};/.test(main) && !/function mapContactToSupabase\(contact\) {[\s\S]*?return {[\s\S]*?email: contact\.email/.test(main)],
  ['trusted contacts keeps optional email when reading from Supabase', main.includes("email: contact.email || '',")],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);
if (failed.length) process.exit(1);
