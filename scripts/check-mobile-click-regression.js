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

const criticalActions = [
  'navigate-home',
  'navigate-contacts',
  'navigate-safety-tools',
  'navigate-profile',
  'navigate-settings',
  'activate-sos',
  'post-sos-primary-sms',
  'terminate-sos',
  'call-112',
  'call-199',
  'copy-sos-message',
  'share-location',
  'update-gps',
  'open-add-contact',
  'save-contact',
  'edit-contact',
  'delete-contact',
  'set-primary-contact',
  'toggle-contacts-section',
  'toggle-profile-section',
  'toggle-settings-section',
  'open-login',
  'login',
  'logout',
  'toggle-password-visibility',
  'toggle-remember-email',
  'toggle-sos-test-mode',
];

for (const action of criticalActions) {
  requireIncludes(index + main, `data-action="${action}"`, `stable data-action ${action}`);
  requireIncludes(main, `case '${action}'`, `delegated handler case ${action}`);
}

requireIncludes(main, 'document.addEventListener(\'click\', handleCriticalDelegatedClick, true)', 'document-level delegated critical click handler in capture phase');
requireIncludes(main, 'CRITICAL_CLICK_ACTIONS', 'central critical action allow-list');
requireIncludes(main, 'Tapped action:', 'debug tap log behind flag');
requireIncludes(main, 'safeInitStep(\'central delegated critical click handler\'', 'safe init logging for delegated handler');
requireIncludes(main, 'console.warn(`[SafeMe] Init step failed: ${label}`', 'exact init-step error logging');
requireIncludes(main, 'contactsForm?.requestSubmit()', 'delegated save contact uses form submit path');
requireIncludes(main, 'authForm?.requestSubmit()', 'delegated login uses form submit path');

const interactiveControlSelectors = [
  'button,',
  'a[role="button"],',
  '.nav-item,',
  '.status-pill,',
  '.auth-indicator,',
  '.ghost-button,',
  '.primary-button,',
  '.secondary-button,',
  '.danger-button,',
  '.danger-outline-button,',
  '.profile-accordion-button,',
  '.settings-panel-toggle,',
  '.home-readiness-chip,',
  '.home-quick-actions button,',
  '.contact-card button,',
  '.contact-action,',
  '.sos-button,',
  '.install-help-dismiss,',
  '.emergency-call-button {'
];
for (const selector of interactiveControlSelectors) {
  requireIncludes(styles, selector, `mobile interaction CSS selector ${selector}`);
}
requireIncludes(styles, '-webkit-user-select: none;', 'iOS user-select disabled for app controls');
requireIncludes(styles, 'user-select: none;', 'user-select disabled for app controls');
requireIncludes(styles, '-webkit-touch-callout: none;', 'iOS touch callout disabled for app controls');
requireIncludes(styles, '-webkit-tap-highlight-color: transparent;', 'tap highlight disabled for app controls');
requireIncludes(styles, 'touch-action: manipulation;', 'mobile touch action manipulation for controls');
requireIncludes(styles, `button *,
.nav-item *,`, 'child labels inside buttons covered by non-select CSS');
requireIncludes(styles, 'pointer-events: none;', 'child spans/icons cannot capture pointer events');
requireIncludes(styles, `button,
a,
[data-action] {
  pointer-events: auto;`, 'actual buttons and data-action controls remain clickable');
requireIncludes(styles, `input,
textarea,
select,
[contenteditable="true"]`, 'forms keep selectable text CSS');
requireIncludes(styles, '-webkit-touch-callout: default;', 'inputs keep default iOS callout');
requireIncludes(styles, 'touch-action: auto;', 'inputs keep native touch behavior');
requireIncludes(styles, `.app-shell,
.sidebar,
.topbar,
.page,
.card,
.hero-card`, 'app chrome globally disables text selection');

requireIncludes(main, 'function handleCriticalDelegatedMobileTap(event)', 'mobile pointer/touch delegated tap fallback');
requireIncludes(main, "document.addEventListener('pointerup', handleCriticalDelegatedMobileTap, true)", 'pointerup fallback listener');
requireIncludes(main, "document.addEventListener('touchend', handleCriticalDelegatedMobileTap, true)", 'touchend fallback listener');
requireIncludes(main, 'lastHandledMobileTap', 'mobile tap double-fire guard');
requireIncludes(main, 'Date.now() - lastHandledMobileTap.time < 700', 'timestamp-based duplicate tap suppression');
requireIncludes(main, "actionElement.closest('#contacts') ? toggleContactsAddForm() : focusContactForm()", 'same add-contact action path used by click and mobile tap');
requireIncludes(main, 'shouldIgnoreInteractiveTapTarget(event.target)', 'fallback ignores form typing controls');
requireIncludes(main, `case 'call-112':
    case 'call-199':
      return false;`, 'tel links are not prevented by fallback');

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

const accordionButtons = index.match(/<button[^>]*(?:profile-accordion-button|settings-panel-toggle)[^>]*>/g) || [];
if (accordionButtons.length < 10) fail('Expected profile/contact/settings accordion headers to be real buttons.');
for (const button of accordionButtons) {
  if (!button.includes('type="button"') || !button.includes('aria-expanded=') || !button.includes('aria-controls=') || !button.includes('data-action=')) {
    fail(`Accordion button missing type/aria/data-action attributes: ${button}`);
  }
}

const renderContactCardStart = main.indexOf('contactsList.innerHTML = contacts');
const renderContactCardEnd = main.indexOf('contactCount.textContent = contacts.length', renderContactCardStart);
const renderContactCardBlock = main.slice(renderContactCardStart, renderContactCardEnd);
for (const action of ['open-contact-invite', 'edit-contact', 'set-primary-contact', 'delete-contact']) {
  requireIncludes(renderContactCardBlock, `data-action="${action}"`, `rendered contact cards keep delegated ${action} action`);
}
requireIncludes(renderContactCardBlock, 'title="Αυτή είναι ήδη η κύρια επαφή SOS"', 'disabled primary contact button explains disabled state');
requireIncludes(renderContactCardBlock, 'title="Περίμενε να ολοκληρωθεί ο συγχρονισμός επαφών"', 'sync-disabled contact buttons explain disabled state');

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
