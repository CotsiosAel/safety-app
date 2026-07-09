import { readFile, writeFile } from 'node:fs/promises';
import { messages } from '../src/i18n.js';

function flattenMessages(node, prefix = '') {
  const result = {};
  Object.entries(node).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[path] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(result, flattenMessages(value, path));
    }
  });
  return result;
}

const en = flattenMessages(messages.en);
const el = flattenMessages(messages.el);

const pairs = Object.keys(en)
  .map((key) => [el[key], en[key]])
  .filter(([greek, english]) => greek && english && greek !== english)
  .sort((a, b) => b[0].length - a[0].length);

const manualPairs = [
  ['π.χ. Γιώργος Δημητρίου', 'e.g. John Smith'],
  ['π.χ. Πατέρας', 'e.g. Father'],
  ['π.χ. 99878765 ή +35799878765', 'e.g. 99878765 or +35799878765'],
  ['π.χ. name@example.com', 'e.g. name@example.com'],
  ['π.χ. σπίτι, δουλειά, parking', 'e.g. home, work, parking'],
  ['π.χ. 25', 'e.g. 25'],
  ['π.χ. 15', 'e.g. 15'],
  ['10 λεπτά', '10 minutes'],
  ['20 λεπτά', '20 minutes'],
  ['30 λεπτά', '30 minutes'],
  ['45 λεπτά', '45 minutes'],
  ['60 λεπτά', '60 minutes'],
  ['5 λεπτά', '5 minutes'],
  ['Ρυθμίσεις SOS', 'SOS settings'],
  ['Ιστορικό SOS', 'SOS history'],
  ['Μοίρασμα θέσης', 'Share location'],
  ['Άνοιγμα επαφών', 'Open contacts'],
  ['Άνοιγμα ρυθμίσεων SOS', 'Open SOS settings'],
  ['Άνοιγμα ιστορικού SOS', 'Open SOS history'],
  ['Ετοιμότητα ασφάλειας', 'Safety readiness'],
  ['Έλεγχος εφαρμογής', 'App health check'],
  ['Ρυθμίσεις και ασφάλεια', 'Settings & safety'],
  ['Προφίλ χρήστη', 'User profile'],
  ['Εργαλεία Ασφάλειας', 'Safety Tools'],
  ['Έμπιστες επαφές', 'Trusted contacts'],
  ['Βασικό μενού πλοήγησης', 'Main navigation menu'],
  ['SafeMe αρχική', 'SafeMe home'],
  ['Μενού εφαρμογής', 'App menu'],
  ['Η εφαρμογή είναι online', 'App is online'],
  ['Άμεσες ενέργειες SOS', 'Immediate SOS actions'],
  ['Εφεδρικές ενέργειες SOS', 'Backup SOS actions'],
  ['Ενέργειες τοποθεσίας SOS', 'SOS location actions'],
  ['Πρόσθετες αποστολές SOS', 'Additional SOS sends'],
  ['Εκτιμώμενη διάρκεια', 'Estimated duration'],
  ['Γρήγορη επιλογή χρόνου', 'Quick time selection'],
  ['Γρήγορες ενέργειες ελέγχου', 'Quick health actions'],
  ['Γρήγορη κατάσταση ρυθμίσεων', 'Quick settings status'],
  ['Γρήγορες κλήσεις έκτακτης ανάγκης', 'Quick emergency calls'],
  ['Νομικά και απόρρητο', 'Legal & privacy'],
  ['Έκδοση εφαρμογής', 'App version'],
  ['Σύνοψη ιστορικού SOS', 'SOS history summary'],
  ['Επιλογή σύνδεσης ή δημιουργίας λογαριασμού', 'Sign in or create account'],
  ['Όνομα, σχέση, τηλέφωνο', 'Name, relationship, phone'],
  ['Συμπλήρωσε το προφίλ σου • Δεν έχει προστεθεί τηλέφωνο', 'Complete your profile • No phone added'],
  ['έμπιστες επαφές έτοιμες για ειδοποίηση', 'trusted contacts ready for alerts'],
  ['Check-in Ασφαλείας', 'Safety check-in'],
  ['Τρέχουσα Τοποθεσία', 'Current location'],
  ['Τρέχουσα τοποθεσία', 'Current location'],
  ['Check-in ασφαλείας', 'Safety check-in'],
  ['Σύνοψη ετοιμότητας SafeMe', 'SafeMe readiness summary'],
  ['Κατάσταση', 'Status'],
];

let html = await readFile('index.html', 'utf8');

[...pairs, ...manualPairs].forEach(([greek, english]) => {
  html = html.split(greek).join(english);
});

await writeFile('index.html', html);
console.log('Applied English defaults to index.html');
