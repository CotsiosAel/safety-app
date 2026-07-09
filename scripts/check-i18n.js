import { readFile } from 'node:fs/promises';

const markup = await readFile('index.html', 'utf8');
const source = await readFile('src/main.js', 'utf8');
const i18n = await readFile('src/i18n.js', 'utf8');

function requirePattern(sourceText, pattern, label) {
  if (!sourceText.includes(pattern)) {
    console.error(`Missing i18n safeguard: ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

requirePattern(i18n, "const DEFAULT_LOCALE = 'en'", 'default locale is English');
requirePattern(i18n, 'el:', 'Greek locale dictionary exists');
requirePattern(i18n, "english: 'English'", 'English language label exists');
requirePattern(i18n, "greek: 'Ελληνικά'", 'Greek language label exists');
requirePattern(i18n, 'export function t(', 'translation helper exists');
requirePattern(i18n, 'export function applyDomBindings', 'DOM translation bindings exist');
requirePattern(i18n, 'safety-app-preferred-language', 'language persistence key exists');

requirePattern(markup, 'lang="en"', 'HTML default language is English');
requirePattern(markup, 'id="settings-language-select"', 'settings language selector exists');
requirePattern(markup, '<option value="en">English</option>', 'English option exists');
requirePattern(markup, '<option value="el">Ελληνικά</option>', 'Greek option exists');

requirePattern(source, "from './i18n.js'", 'main.js imports i18n module');
requirePattern(source, 'initLocale(', 'locale initialization exists');
requirePattern(source, 'refreshAllLocalizedUi', 'UI refresh on locale change exists');
requirePattern(source, 'settingsLanguageSelect', 'settings language select is wired');
requirePattern(source, 'handleSettingsLanguageChange', 'language change handler exists');
requirePattern(source, 'persistLocale(', 'language persistence on change');
requirePattern(source, "preferredLanguage || 'en'", 'profile default language is English');
requirePattern(source, 'getSosTrackingUrl', 'SOS tracking URL builder exists');
requirePattern(source, "searchParams.set('lang'", 'tracking URL includes language param');
requirePattern(source, 'renderPublicTrackingPage', 'public tracking page renderer exists');
requirePattern(source, "t('publicTracking.title')", 'public tracking uses translations');

console.log('i18n safeguards are present.');
