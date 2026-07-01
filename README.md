# SafeMe

Αρχική λειτουργική έκδοση μιας απλής εφαρμογής προσωπικής ασφάλειας με μοντέρνο web UI.

## Λειτουργίες

- Αρχική σελίδα με τίτλο εφαρμογής και καθαρή παρουσίαση.
- Κουμπί SOS με ενεργή/ανενεργή κατάσταση.
- Σελίδα έμπιστων επαφών με γρήγορη κλήση.
- Σελίδα προφίλ χρήστη με βασικές πληροφορίες.
- Βασικό μενού πλοήγησης.

## Εκτέλεση

```bash
npm run start
```

Η εφαρμογή σερβίρεται στο `http://localhost:4173`.

## Build

```bash
npm run build
```

## Έλεγχος PR

Το repository κρατά μόνο text/code αλλαγές ώστε το Create PR να μη μπλοκάρεται από binary εικόνες ή άλλα binary assets.

```bash
npm run check:text-only
```


## Account/auth foundation

The app uses Supabase Auth (email/password) with Postgres tables for user profile, trusted contacts, SOS events, and active SOS sessions. The checked-in browser client uses the public publishable Supabase key in `src/main.js`; use `supabase/schema.sql.md` to recreate the database tables, row-level-security policies, and public tracking RPC in another Supabase project.

### Environment/configuration

This static app currently has no build-time environment variable injection. To point to another backend, update `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SOS_TRACKING_BASE_URL`, and `PASSWORD_RESET_REDIRECT_URL` in `src/main.js`.
