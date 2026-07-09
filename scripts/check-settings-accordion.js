import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');
const i18n = fs.readFileSync('src/i18n.js', 'utf8');
const corpus = `${index}\n${main}\n${i18n}`;

function assertIncludes(source, needle, message) {
  if (!source.includes(needle)) {
    throw new Error(message);
  }
  console.log(`✓ ${message}`);
}

[
  "'settings.sosMode'",
  "'settings.locationGps'",
  "'settings.sync'",
  "'settings.privacy'",
  "'settings.displayLanguage'",
  "'settings.advanced'",
].forEach((title) => assertIncludes(corpus, title, `settings accordion title exists: ${title}`));

assertIncludes(index, 'id="sos-test-mode"', 'SOS test mode setting still exists');
assertIncludes(index, 'id="settings-refresh-location"', 'settings GPS refresh action still exists');
assertIncludes(corpus, "'settings.legal'", 'settings legal/privacy row exists');
assertIncludes(index, '<a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>', 'settings privacy policy link opens safely in new tab');
assertIncludes(index, '<a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Use</a>', 'settings terms link opens safely in new tab');
assertIncludes(index, '<a href="/support.html" target="_blank" rel="noopener noreferrer">Support</a>', 'settings support link opens safely in new tab');
assertIncludes(index, 'id="settings-advanced-panel" role="region" aria-labelledby="settings-advanced-toggle" hidden', 'advanced destructive actions are hidden by default');
assertIncludes(main, 'confirmSettingsLogout', 'settings logout requires confirmation');
assertIncludes(main, "t('profile.confirmClearData')", 'local data clearing requires confirmation');
assertIncludes(main, 'settingsAccordionButtons.forEach', 'settings accordion buttons are wired');
assertIncludes(styles, '.settings-panel.open .settings-chevron', 'settings chevron rotates when panel opens');
