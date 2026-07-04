import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireIncludes(source, needle, label) {
  if (!source.includes(needle)) fail(`Missing ${label}: ${needle}`);
}

const requiredIds = [
  'sos-button',
  'notify-all-sos-contacts-action',
  'active-sos-call-112',
  'end-active-sos',
  'account-sync-login-button',
  'share-location-button',
  'refresh-location-button',
  'contacts-add-cta',
  'contact-form',
  'auth-submit-button',
  'auth-logout-button',
  'auth-password-toggle',
  'settings-refresh-location',
];

for (const id of requiredIds) {
  requireIncludes(index, `id="${id}"`, `critical button/control #${id}`);
}

const clickBindings = [
  ['SOS main button', 'sosButton.addEventListener(\'click\'', 'activateSosFromMainButton'],
  ['account sync login', 'accountSyncLoginButton?.addEventListener(\'click\'', 'openProfileAuthCard'],
  ['share location', 'shareLocationButton?.addEventListener(\'click\'', 'shareLocation'],
  ['refresh location', 'refreshLocationButton?.addEventListener(\'click\'', 'refreshLocation'],
  ['contacts add CTA', 'contactsAddCta?.addEventListener(\'click\'', 'toggleContactsAddForm'],
  ['contact list delegation', 'contactsList?.addEventListener(\'click\'', 'handleContactsListClick'],
  ['profile save', 'profileForm?.addEventListener(\'submit\'', 'saveProfile'],
  ['auth submit', 'authForm?.addEventListener(\'submit\'', 'handleAuthSubmit'],
  ['auth logout', 'authLogoutButton?.addEventListener(\'click\'', 'logout'],
  ['settings accordions', 'settingsAccordionButtons.forEach', 'toggleSettingsPanel'],
  ['SOS notify all', 'notifyAllSosContactsActionButton?.addEventListener(\'click\'', 'notifyAllSosContacts'],
  ['end active SOS', 'endActiveSosButton?.addEventListener(\'click\'', 'endActiveSosSession'],
  ['home quick action delegation', "event.target.closest('[data-open-tool]')", 'handleHomeQuickAction'],
];

for (const [label, binding, handler] of clickBindings) {
  requireIncludes(main, binding, `${label} binding`);
  requireIncludes(main, handler, `${label} handler`);
}

const accordionButtons = index.match(/<button class="(?:profile-accordion-button|settings-panel-toggle)[^>]*>/g) || [];
if (accordionButtons.length < 10) fail('Expected profile/contact/settings accordion headers to be real buttons.');
for (const button of accordionButtons) {
  if (!button.includes('type="button"') || !button.includes('aria-expanded=') || !button.includes('aria-controls=')) {
    fail(`Accordion button missing type/aria attributes: ${button}`);
  }
}

if ((index.match(/class="home-quick-action"/g) || []).length !== 4) fail('Home quick action buttons should not be duplicated or missing.');

requireIncludes(main, 'warnMissingCriticalButtons();', 'critical missing-button warnings');
requireIncludes(main, 'Missing button:', 'clear missing button warning text');

const forbiddenOverlayPatterns = [
  ['pull refresh default capture', '.pull-refresh-indicator {', 'pointer-events: none;'],
  ['SOS decorative rings', '.sos-ring {', 'pointer-events: none;'],
  ['hero decoration', '.hero-card::before', 'pointer-events: none;'],
];
for (const [label, selector, property] of forbiddenOverlayPatterns) {
  const start = styles.indexOf(selector);
  if (start === -1) fail(`Missing style block for ${label}`);
  const block = styles.slice(start, styles.indexOf('}', start) + 1);
  if (!block.includes(property)) fail(`${label} must include ${property}`);
}

console.log('Mobile click/tap regression safeguards are present.');
