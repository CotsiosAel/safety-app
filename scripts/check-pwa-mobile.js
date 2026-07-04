import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
const index = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.js', 'utf8');
const serviceWorker = readFileSync('sw.js', 'utf8');
const version = JSON.parse(readFileSync('version.json', 'utf8')).version;
const CURRENT_APP_VERSION = 'safe-me-ui-events-2026-07-04';

const checks = [
  ['manifest uses SafeMe name', manifest.name === 'SafeMe' && manifest.short_name === 'SafeMe'],
  ['manifest uses standalone display', manifest.display === 'standalone'],
  ['manifest scope and start_url are relative app root', manifest.start_url === './' && manifest.scope === './'],
  ['manifest has Greek/English safety description', /SafeMe/.test(manifest.description || '') && /SOS/.test(manifest.description || '') && /έμπιστες επαφές/.test(manifest.description || '')],
  ['index has iOS PWA meta tags', index.includes('apple-mobile-web-app-capable') && index.includes('apple-mobile-web-app-title') && index.includes('apple-mobile-web-app-status-bar-style') && index.includes('apple-touch-icon')],
  ['install help card copy exists', index.includes('Πρόσθεσε το SafeMe στην αρχική οθόνη') && index.includes('Πάτησε Κοινή χρήση → Προσθήκη στην οθόνη Αφετηρίας.') && index.includes('Πάτησε το μενού ⋮ → Προσθήκη στην αρχική οθόνη.')],
  ['install help card is hidden in standalone mode', main.includes('isSafeMeStandaloneMode') && main.includes('installHelpCard.hidden = standalone') && main.includes('standaloneStatus.hidden = !standalone')],
  ['old stuck update banner is not reintroduced', !main.includes('showAppUpdateBanner') && main.includes('hideAppUpdateBanner()')],
  ['app version is current and old cache-buster is gone', version === CURRENT_APP_VERSION && main.includes(`const APP_VERSION = '${CURRENT_APP_VERSION}'`) && !(`${index}\n${main}\n${serviceWorker}`).includes('startup-reliability-2026-07-03')],
  ['index cache-busters point at current app version', index.includes(`./src/styles.css?v=${CURRENT_APP_VERSION}`) && index.includes(`./src/main.js?v=${CURRENT_APP_VERSION}`) && serviceWorker.includes(`./src/main.js?v=${CURRENT_APP_VERSION}`) && serviceWorker.includes(`./src/styles.css?v=${CURRENT_APP_VERSION}`)],
  ['resetPwa path remains supported and redirects to versioned clean URL', main.includes("params.get('resetPwa') !== '1'") && main.includes('window.location.replace(replaceUrlWithVersion(cleanParams))') && main.includes('navigator.serviceWorker.getRegistrations') && main.includes('caches.keys()')],
  ['startup cache/version self-heal preserves user data scope', main.includes('APP_VERSION_STORAGE_KEY') && main.includes('selfHealStaleAppVersion()') && main.includes('clearOldSafeMeCaches()') && !main.includes('localStorage.clear()') && !main.includes('sessionStorage.clear()')],
];

const failures = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${label}`);
}

if (failures.length) {
  process.exitCode = 1;
}
