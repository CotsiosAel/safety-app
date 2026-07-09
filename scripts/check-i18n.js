import { readFile } from 'node:fs/promises';
import { messages } from '../src/i18n.js';

const markup = await readFile('index.html', 'utf8');
const source = await readFile('src/main.js', 'utf8');
const i18n = await readFile('src/i18n.js', 'utf8');

const greekPattern = /[\u0370-\u03FF]/;
const allowedGreekSnippets = new Set([
  'Ελληνικά',
]);

function requirePattern(sourceText, pattern, label) {
  if (!sourceText.includes(pattern)) {
    console.error(`Missing i18n safeguard: ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

function findUnexpectedGreek(text, label) {
  const lines = text.split('\n');
  const offenders = [];

  lines.forEach((line, index) => {
    if (!greekPattern.test(line)) return;
    const allowed = [...allowedGreekSnippets].some((snippet) => line.includes(snippet) && line.replace(snippet, '').replace(/Ελληνικά/g, '').trim() === '');
    if (allowed) return;
    if ([...allowedGreekSnippets].some((snippet) => line.includes(snippet)) && !line.replace(new RegExp(allowedGreekSnippets.values().next().value, 'g'), '').match(greekPattern)) {
      return;
    }

    const stripped = [...allowedGreekSnippets].reduce((value, snippet) => value.replaceAll(snippet, ''), line);
    if (greekPattern.test(stripped)) {
      offenders.push({ line: index + 1, text: line.trim() });
    }
  });

  if (offenders.length > 0) {
    console.error(`Unexpected hardcoded Greek in ${label}:`);
    offenders.slice(0, 10).forEach((entry) => {
      console.error(`  ${entry.line}: ${entry.text}`);
    });
    process.exit(1);
  }

  console.log(`✓ no unexpected hardcoded Greek in ${label}`);
}

function flattenMessages(node, prefix = '') {
  const result = {};
  Object.entries(node).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') result[path] = value;
    else if (value && typeof value === 'object') Object.assign(result, flattenMessages(value, path));
  });
  return result;
}

const enMessages = flattenMessages(messages.en);
const elMessages = flattenMessages(messages.el);

requirePattern(i18n, "const DEFAULT_LOCALE = 'en'", 'default locale is English');
requirePattern(i18n, 'el:', 'Greek locale dictionary exists');
requirePattern(i18n, "english: 'English'", 'English language label exists');
requirePattern(i18n, "greek: 'Ελληνικά'", 'Greek language label exists');
requirePattern(i18n, 'export function t(', 'translation helper exists');
requirePattern(i18n, 'export function applyDomBindings', 'DOM translation bindings exist');
requirePattern(i18n, 'safety-app-preferred-language', 'language persistence key exists');
requirePattern(i18n, 'safety-app-preferred-language-updated-at', 'manual language timestamp key exists');
requirePattern(i18n, "title: 'Active SafeMe SOS'", 'English dictionary includes public SOS strings');
requirePattern(i18n, "openGoogle: 'Open in Google Maps'", 'English dictionary includes public SOS map action');

requirePattern(markup, 'lang="en"', 'HTML default language is English');
requirePattern(markup, 'id="settings-language-select"', 'settings language selector exists');
requirePattern(markup, '<option value="en">English</option>', 'English option exists');
requirePattern(markup, '<option value="el">Ελληνικά</option>', 'Greek option exists');

requirePattern(source, "from './i18n.js'", 'main.js imports i18n module');
requirePattern(source, 'initLocale(', 'locale initialization exists');
requirePattern(source, 'refreshAllLocalizedUi', 'UI refresh on locale change exists');
requirePattern(source, 'settingsLanguageSelect', 'settings language select is wired');
requirePattern(source, 'handleSettingsLanguageChange', 'language change handler exists');
requirePattern(source, 'persistManualLocale(', 'manual language persistence on change');
requirePattern(source, "preferredLanguage || 'en'", 'profile default language is English');
requirePattern(source, 'getSosTrackingUrl', 'SOS tracking URL builder exists');
requirePattern(source, "searchParams.set('lang'", 'tracking URL includes language param');
requirePattern(source, 'renderPublicTrackingPage', 'public tracking page renderer exists');
requirePattern(source, "t('publicTracking.title')", 'public tracking uses translations');

const missingElKeys = Object.keys(enMessages).filter((key) => !elMessages[key]);
if (missingElKeys.length > 0) {
  console.error(`Greek dictionary missing ${missingElKeys.length} English keys, e.g. ${missingElKeys.slice(0, 5).join(', ')}`);
  process.exit(1);
}
console.log('✓ Greek dictionary covers English keys');

findUnexpectedGreek(markup, 'index.html');
findUnexpectedGreek(source, 'src/main.js');

console.log('i18n safeguards are present.');
