import { readFile } from 'node:fs/promises';

const markup = await readFile('index.html', 'utf8');
const source = await readFile('src/main.js', 'utf8');

function requirePattern(sourceText, pattern, label) {
  if (!sourceText.includes(pattern)) {
    console.error(`Missing profile language save safeguard: ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

requirePattern(markup, 'id="settings-language-select"', 'settings language select exists');
requirePattern(markup, '<select id="settings-language-select" name="preferredLanguage"', 'language select keeps preferredLanguage field name');
requirePattern(markup, '<option value="el">Ελληνικά</option>', 'Greek option exists');
requirePattern(markup, '<option value="en">English</option>', 'English option exists');

requirePattern(source, 'const settingsLanguageSelect = document.querySelector(\'#settings-language-select\')', 'settings language select is referenced in main.js');
requirePattern(source, "settingsLanguageSelect?.addEventListener('change', handleSettingsLanguageChange)", 'settings language change handler is wired');
requirePattern(source, 'persistLocale(nextLocale)', 'language choice is persisted on change');
requirePattern(source, 'profile.preferredLanguage = nextLocale', 'profile preferredLanguage is updated on change');
requirePattern(source, 'preferredLanguage,', 'saveProfile stores preferredLanguage in the profile object');
requirePattern(source, 'function applyProfilePreferredLanguage()', 'account load applies stored profile language');
requirePattern(source, 'applyProfilePreferredLanguage();', 'loadSupabaseData applies profile language after sync');

console.log('Profile preferred language save safeguards are present.');
