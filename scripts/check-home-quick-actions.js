import { readFile } from 'node:fs/promises';

const markup = await readFile('index.html', 'utf8');
const source = await readFile('src/main.js', 'utf8');

const buttonRequirements = [
  ['Check-in quick action button', 'class="home-quick-action" type="button" data-open-tool="checkin"'],
  ['Safe Walk quick action button', 'class="home-quick-action" type="button" data-open-tool="safe-walk"'],
  ['contacts quick action button', 'class="home-quick-action" type="button" data-open-tool="contacts"'],
];

for (const [label, pattern] of buttonRequirements) {
  if (!markup.includes(pattern)) {
    console.error(`Missing ${label}: ${pattern}`);
    process.exit(1);
  }
}

const sourceRequirements = [
  ['delegated home quick action listener', "homeQuickActions?.addEventListener('click'"],
  ['delegated data-open-tool lookup', "event.target.closest('[data-open-tool]')"],
  ['tap default prevention', 'event.preventDefault()'],
  ['dataset openTool read', 'button.dataset.openTool'],
  ['checkin handler branch', "if (action === 'checkin')"],
  ['safe-walk handler branch', "if (action === 'safe-walk')"],
  ['contacts handler branch', "if (action === 'contacts')"],
  ['safety tools page navigation', "showPage('safety-tools')"],
  ['contacts page navigation', "showPage('contacts')"],
  ['Check-in feedback', 'Άνοιγμα Check-in...'],
  ['Safe Walk feedback', 'Άνοιγμα Safe Walk...'],
  ['contacts feedback', 'Άνοιγμα επαφών...'],
];

for (const [label, pattern] of sourceRequirements) {
  if (!source.includes(pattern)) {
    console.error(`Missing quick action behavior: ${label} (${pattern})`);
    process.exit(1);
  }
}

const focusableTargets = [
  ['Check-in section focus target', 'id="checkin-section" tabindex="-1"'],
  ['Safe Walk section focus target', 'id="safe-walk-section" tabindex="-1"'],
  ['contacts list focus target', 'id="contacts-list" tabindex="-1"'],
  ['contacts form focus target', 'id="contact-form" tabindex="-1"'],
];

for (const [label, pattern] of focusableTargets) {
  if (!markup.includes(pattern)) {
    console.error(`Missing ${label}: ${pattern}`);
    process.exit(1);
  }
}

console.log('Home quick action regression safeguards are present.');
