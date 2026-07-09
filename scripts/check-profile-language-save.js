import { readFile } from 'node:fs/promises';
import {
  STORAGE_KEY,
  STORAGE_UPDATED_AT_KEY,
  persistLocale,
  persistManualLocale,
  readStoredLocale,
  hasManualLocalePreference,
  readStoredLocaleUpdatedAt,
} from '../src/i18n.js';

const markup = await readFile('index.html', 'utf8');
const source = await readFile('src/main.js', 'utf8');
const i18n = await readFile('src/i18n.js', 'utf8');

function requirePattern(sourceText, pattern, label) {
  if (!sourceText.includes(pattern)) {
    console.error(`Missing profile language save safeguard: ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

function simulateRefreshLocale({ profilePreferredLanguage, manualLocale }) {
  if (manualLocale) {
    persistManualLocale(manualLocale);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_UPDATED_AT_KEY);
  }

  if (hasManualLocalePreference()) {
    return readStoredLocale() === 'el' ? 'el' : 'en';
  }

  return profilePreferredLanguage === 'el' ? 'el' : 'en';
}

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
};

requirePattern(markup, 'id="settings-language-select"', 'settings language select exists');
requirePattern(markup, '<select id="settings-language-select" name="preferredLanguage"', 'language select keeps preferredLanguage field name');
requirePattern(markup, '<option value="el">Ελληνικά</option>', 'Greek option exists');
requirePattern(markup, '<option value="en">English</option>', 'English option exists');

requirePattern(i18n, 'safety-app-preferred-language-updated-at', 'manual language timestamp key exists');
requirePattern(i18n, 'export function persistManualLocale', 'manual locale persistence helper exists');
requirePattern(i18n, 'export function hasManualLocalePreference', 'manual locale preference guard exists');

requirePattern(source, 'const settingsLanguageSelect = document.querySelector(\'#settings-language-select\')', 'settings language select is referenced in main.js');
requirePattern(source, "settingsLanguageSelect?.addEventListener('change', handleSettingsLanguageChange)", 'settings language change handler is wired');
requirePattern(source, 'persistManualLocale(nextLocale)', 'manual language choice is persisted on change');
requirePattern(source, 'profile.preferredLanguage = nextLocale', 'profile preferredLanguage is updated on change');
requirePattern(source, 'preferredLanguage,', 'saveProfile stores preferredLanguage in the profile object');
requirePattern(source, 'function applyProfilePreferredLanguage()', 'account load applies stored profile language');
requirePattern(source, 'applyProfilePreferredLanguage();', 'loadSupabaseData applies profile language after sync');
requirePattern(source, 'hasManualLocalePreference()', 'profile language load respects manual local preference');
requirePattern(source, 'syncProfilePreferredLanguageFromLocal', 'manual local language syncs back to profile');

storage.clear();
const greekAfterRefresh = simulateRefreshLocale({ profilePreferredLanguage: 'en', manualLocale: 'el' });
if (greekAfterRefresh !== 'el') {
  console.error('Regression failed: Greek manual selection should survive refresh simulation');
  process.exit(1);
}
console.log('✓ Greek manual selection survives refresh simulation');

storage.clear();
const englishAfterRefresh = simulateRefreshLocale({ profilePreferredLanguage: 'el', manualLocale: 'en' });
if (englishAfterRefresh !== 'en') {
  console.error('Regression failed: English manual selection should survive refresh simulation');
  process.exit(1);
}
console.log('✓ English manual selection survives refresh simulation');

storage.clear();
const profileApplied = simulateRefreshLocale({ profilePreferredLanguage: 'el', manualLocale: null });
if (profileApplied !== 'el') {
  console.error('Regression failed: profile preferred language should apply when no manual local preference exists');
  process.exit(1);
}
console.log('✓ profile preferred language applies when no manual local preference exists');

storage.clear();
persistManualLocale('el');
if (!hasManualLocalePreference() || readStoredLocaleUpdatedAt() === null) {
  console.error('Regression failed: manual language selection should record updated-at timestamp');
  process.exit(1);
}
console.log('✓ manual language selection records updated-at timestamp');

console.log('Profile preferred language save safeguards are present.');
