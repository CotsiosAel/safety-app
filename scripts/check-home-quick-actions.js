import { readFile } from 'node:fs/promises';

const markup = await readFile('index.html', 'utf8');
const source = await readFile('src/main.js', 'utf8');
const i18n = await readFile('src/i18n.js', 'utf8');
const corpus = `${markup}\n${source}\n${i18n}`;

const markupRequirements = [
  ['Home readiness card', 'id="home-readiness-card"'],
  ['SOS button remains primary', 'class="sos-button" id="sos-button"'],
  ['test mode badge', 'id="home-test-mode-badge"'],
  ['test mode helper', 'id="home-test-mode-helper"'],
  ['no-contact CTA', 'id="home-add-contact-cta" type="button" data-open-tool="contacts"'],
  ['location status chip', 'id="home-location-status"'],
  ['signed-out sync CTA', 'id="home-login-sync-cta" type="button" data-open-tool="profile-login"'],
  ['contacts quick action button', 'class="home-quick-action" type="button" data-open-tool="contacts"'],
  ['GPS quick action button', 'class="home-quick-action" type="button" data-open-tool="gps"'],
  ['SOS settings quick action button', 'class="home-quick-action" type="button" data-open-tool="sos-settings"'],
  ['SOS history quick action button', 'class="home-quick-action" type="button" data-open-tool="sos-history"'],
  ['share location quick action button', 'class="home-quick-action" type="button" data-open-tool="share-location"'],
];

for (const [label, pattern] of markupRequirements) {
  if (!markup.includes(pattern)) {
    console.error(`Missing ${label}: ${pattern}`);
    process.exit(1);
  }
}

const homeReadinessIndex = markup.indexOf('id="home-readiness-card"');
const sosButtonIndex = markup.indexOf('id="sos-button"');
const readinessDetailsIndex = markup.indexOf('class="home-readiness-summary"');
if (!(homeReadinessIndex >= 0 && sosButtonIndex > homeReadinessIndex && readinessDetailsIndex > sosButtonIndex)) {
  console.error('Home mobile order must keep compact status chips before SOS and readiness details after SOS.');
  process.exit(1);
}

if (!corpus.includes("'home.testModeHelper'")) {
  console.error('Test mode helper must be wired through i18n.');
  process.exit(1);
}

if (!corpus.includes("'accountBanner.localSos'")) {
  console.error('Signed-out Home notice must use compact local-mode copy through i18n.');
  process.exit(1);
}

const sourceRequirements = [
  ['document delegated quick action listener', "document.addEventListener('click'"],
  ['delegated data-open-tool lookup', "event.target.closest('[data-open-tool]')"],
  ['tap default prevention', 'event.preventDefault()'],
  ['dataset openTool read', 'button.dataset.openTool'],
  ['contacts handler branch', "if (action === 'contacts')"],
  ['GPS handler branch', "if (action === 'gps')"],
  ['SOS settings handler branch', "if (action === 'sos-settings')"],
  ['SOS history handler branch', "if (action === 'sos-history')"],
  ['share location handler branch', "if (action === 'share-location')"],
  ['profile login handler branch', "if (action === 'profile-login')"],
  ['signed-out CTA opens Profile Account/Login', 'openProfileAuthCard()'],
  ['contacts CTA opens add form', 'focusContactForm()'],
  ['GPS refresh uses existing logic', 'refreshLocation()'],
  ['readiness ready message', "t('home.readyToUse')"],
  ['signed-out readiness message', "t('accountBanner.localSos')"],
  ['no-contact Home shortcut copy avoids duplicate setup prompt', "t('home.openContactsList')"],
  ['missing location Home shortcut copy avoids duplicate setup prompt', "t('home.openLocationCheck')"],
];

for (const [label, pattern] of sourceRequirements) {
  if (!source.includes(pattern)) {
    console.error(`Missing quick action behavior: ${label} (${pattern})`);
    process.exit(1);
  }
}

const focusableTargets = [
  ['contacts form focus target', 'id="contact-form" tabindex="-1"'],
  ['profile account accordion', 'data-profile-accordion="account"'],
  ['SOS test mode setting target', 'id="sos-test-mode"'],
];

for (const [label, pattern] of focusableTargets) {
  if (!markup.includes(pattern)) {
    console.error(`Missing ${label}: ${pattern}`);
    process.exit(1);
  }
}

console.log('Home emergency dashboard regression safeguards are present.');
