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

<!-- Deployment trigger: refresh GitHub Pages workflow without app changes. -->

## Έλεγχος PR

Το repository κρατά μόνο text/code αλλαγές ώστε το Create PR να μη μπλοκάρεται από binary εικόνες ή άλλα binary assets.

```bash
npm run check:text-only
```

## SafeMe Manual QA before merge

Before merging UI/JS PRs, run:

```bash
npm run build
node --check src/main.js
npm run check:text-only
npm run check:sos-persistence
npm run check:home-quick-actions
npm run check:auth-session-ui
npm run check:contacts-sync
npm run check:settings-accordion
```

Then complete the manual checklist in `docs/manual-qa-checklist.md` on iPhone/mobile before merge.

For release planning, use the Greek store-readiness roadmap in `docs/store-readiness-checklist.md` before preparing App Store or Play Store submissions.

Privacy Policy draft: `docs/privacy-policy-draft.md`
Terms of Use draft: `docs/terms-of-use-draft.md`
Public Privacy Policy URL placeholder: `/privacy-policy.html`
Public Terms of Use URL placeholder: `/terms-of-use.html`
Store listing draft: `docs/store-listing-draft.md`


## Account/auth foundation

The app uses Supabase Auth (email/password) with Postgres tables for user profile, trusted contacts, SOS events, and active SOS sessions. The checked-in browser client uses the public publishable Supabase key in `src/main.js`; use `supabase/schema.sql.md` to recreate the database tables, row-level-security policies, and public tracking RPC in another Supabase project.

### Environment/configuration

This static app currently has no build-time environment variable injection. To point to another backend, update `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SOS_TRACKING_BASE_URL`, and `PASSWORD_RESET_REDIRECT_URL` in `src/main.js`.

For Vercel production deployments, add the production app URL (for example `https://<project>.vercel.app`) to Supabase Auth URL configuration: set it as the Site URL when appropriate and include it in the allowed redirect URLs for email confirmation and password recovery. Email/password sign-in should create a real Supabase session; local profile data alone must remain device-only and must not be treated as an authenticated account.
