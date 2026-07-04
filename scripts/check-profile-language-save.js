import { readFile } from 'node:fs/promises';

const markup = await readFile('index.html', 'utf8');
const source = await readFile('src/main.js', 'utf8');
const styles = await readFile('src/styles.css', 'utf8');

function requirePattern(sourceText, pattern, label) {
  if (!sourceText.includes(pattern)) {
    console.error(`Missing profile language save safeguard: ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

requirePattern(markup, 'id="profile-form"', 'profile form exists');
requirePattern(markup, '<select name="preferredLanguage">', 'preferred language select has the saved field name');
requirePattern(markup, '<option value="el">Ελληνικά</option>', 'preferred language select keeps the Greek value');
requirePattern(markup, '<option value="en">English</option>', 'preferred language select keeps the English value');
requirePattern(markup, '<button class="primary-button inline-button" type="submit">Αποθήκευση προφίλ</button>', 'profile save button remains a submit button');

requirePattern(source, 'const preferredLanguageSelect = profileForm?.elements?.preferredLanguage;', 'profile language select is scoped to the profile form');
requirePattern(source, "preferredLanguageSelect?.addEventListener('change', () => {", 'profile language change handler is scoped to the select');
requirePattern(source, 'preferredLanguageSelect.blur();', 'profile language select blurs after native mobile selection');
requirePattern(source, "const preferredLanguage = formData.get('preferredLanguage') === 'en' ? 'en' : 'el';", 'saveProfile reads and normalizes preferredLanguage from FormData');
requirePattern(source, 'preferredLanguage,', 'saveProfile stores preferredLanguage in the profile object');

const forbiddenStylePatterns = [
  '#profile-details-panel::before',
  '#profile-details-panel::after',
  '#profile-form::before',
  '#profile-form::after',
];

for (const pattern of forbiddenStylePatterns) {
  if (styles.includes(pattern)) {
    console.error(`Potential profile form overlay found: ${pattern}`);
    process.exit(1);
  }
}

console.log('Profile preferred language save safeguards are present.');
