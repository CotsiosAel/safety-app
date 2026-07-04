import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');

function assertIncludes(source, needle, message) {
  if (!source.includes(needle)) {
    throw new Error(message);
  }
  console.log(`✓ ${message}`);
}

[
  'SOS λειτουργία',
  'Τοποθεσία &amp; GPS',
  'Συγχρονισμός',
  'Απόρρητο &amp; δεδομένα',
  'Εμφάνιση &amp; γλώσσα',
  'Προχωρημένες ενέργειες',
].forEach((title) => assertIncludes(index, title, `settings accordion title exists: ${title}`));

assertIncludes(index, 'id="sos-test-mode"', 'SOS test mode setting still exists');
assertIncludes(index, 'id="settings-refresh-location"', 'settings GPS refresh action still exists');
assertIncludes(index, 'id="settings-advanced-panel" role="region" aria-labelledby="settings-advanced-toggle" hidden', 'advanced destructive actions are hidden by default');
assertIncludes(main, 'confirmSettingsLogout', 'settings logout requires confirmation');
assertIncludes(main, 'window.confirm(\'Θέλεις σίγουρα να σβήσεις όλα τα αποθηκευμένα στοιχεία', 'local data clearing requires confirmation');
assertIncludes(main, 'settingsAccordionButtons.forEach', 'settings accordion buttons are wired');
assertIncludes(styles, '.settings-panel.open .settings-chevron', 'settings chevron rotates when panel opens');
