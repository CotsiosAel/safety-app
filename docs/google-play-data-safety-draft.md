# Google Play Data Safety — Draft Checklist (SafeMe)

**Status:** Draft for internal review only. Not legal advice. Confirm all answers against the current app build and your privacy policy before Play Console submission.

**App type:** Progressive Web App (PWA) with optional Supabase backend sync. If published via TWA/WebView wrapper, data behavior below still applies.

**Last reviewed against source:** 9 July 2026

---

## Summary

SafeMe is a personal safety helper. It collects user-provided profile and contact data, device location when safety features are used, and optional account credentials via Supabase. It does **not** include in-app advertising or analytics SDKs in the current source. SMS and other outbound messages are user-initiated from the device.

---

## Data collected

| Data type | Collected? | Where / how | Notes |
|-----------|------------|-------------|-------|
| **Name** | Yes (optional) | Profile form; local storage; Supabase `profiles` when signed in | User-provided |
| **Email address** | Yes (optional) | Supabase Auth when account created; optional remembered email in local storage | Account is optional |
| **Phone number** | Yes (optional) | Profile; trusted contacts; local + Supabase sync | User-provided |
| **Precise location** | Yes (when feature used) | Browser geolocation; SOS/live tracking; local cache; Supabase SOS tables when signed in | Not collected in background outside safety features |
| **Contacts (trusted contacts)** | Yes | User-entered names, phones, optional emails, relationship | Not device contact book import unless user copies manually |
| **Health info (medical notes)** | Yes (optional) | Profile field; Supabase `profiles` | Optional free-text notes |
| **App interactions** | Limited | Local notification log (last 12 SOS notify attempts), SOS history | No third-party analytics SDK found |
| **User IDs** | Yes | Supabase auth user UUID | For signed-in users |
| **Crash logs / diagnostics** | No dedicated SDK | — | No Sentry/Firebase Crashlytics in source |
| **Photos / videos / audio** | No | — | |
| **Financial info** | No | — | |
| **Web browsing history** | No | — | |

### Local storage (device only, not “collected” by server unless synced)

- Trusted contacts copy
- Profile copy
- Last location snapshot
- SOS test mode, Safe Walk / check-in state
- Language preference
- Optional remembered sign-in email
- SOS notification history (local)
- Supabase session tokens (via Supabase JS client)

---

## Data shared

| Shared with | Data | Purpose | User control |
|-------------|------|---------|--------------|
| **Supabase (processor/backend)** | Profile, contacts, SOS events, active SOS session + coordinates, auth data | Optional cloud sync | Sign-in is optional; sign out available |
| **Trusted contacts (user-initiated)** | SOS message text, map links, optional live-tracking URL | Emergency communication | User sends each SMS/email/share manually |
| **Anyone with public tracking link** | Session status, latest shared coordinates | Live tracking during active signed-in SOS | User creates/disables link; session can be ended |
| **Google Fonts CDN** | IP / request metadata (typical CDN behavior) | Font delivery | Loaded when app opens |
| **Google Maps / Apple Maps (external)** | Coordinates in URL when user opens map link | Navigation / map display | User or link viewer action |

**Not shared (based on current public tracking RPC behavior):** name, phone, email, medical notes, full contact list via public tracking link.

**Ads:** No ad SDK — data not shared for advertising in current build.

**Analytics:** No analytics SDK — no analytics partner sharing in current build.

---

## Purpose (Play Console mapping)

| Purpose | Applies? | Examples in SafeMe |
|---------|----------|-------------------|
| App functionality | Yes | SOS, contacts, profile, sync, live tracking |
| Account management | Yes | Optional sign-in, profile sync |
| Safety / fraud prevention | Partial | Manual review on deletion requests; no dedicated fraud SDK |
| Analytics | No | No analytics SDK in source |
| Advertising | No | |
| Personalization | Limited | Language preference only |
| Developer communications | If user emails support | Support contact |

---

## Required vs optional

| Data / feature | Required for basic SOS? | Notes |
|----------------|-------------------------|-------|
| Account / email | **No** | Local mode supported |
| Profile name / phone | **No** | Improves SOS message content |
| Trusted contacts | **No** | Needed to notify contacts via app helpers |
| Location permission | **No** | SOS works without GPS; location features degraded without it |
| Medical notes | **No** | Optional |
| Sign-in / Supabase sync | **No** | Optional |

---

## Encryption in transit

| Connection | Encrypted in transit? |
|------------|----------------------|
| App → Supabase (HTTPS) | **Yes** (TLS via HTTPS) |
| App → hosting (Vercel) | **Yes** (HTTPS) |
| User → Google Fonts | **Yes** (HTTPS) |
| SMS / tel / mailto / WhatsApp | Depends on carrier/app | Outside SafeMe server control |

**Encryption at rest:** Managed by Supabase/hosting provider. Do not claim specific at-rest configuration without verifying Supabase project settings.

---

## Account deletion support

| Item | Current state |
|------|---------------|
| In-app one-tap delete account | **No** — not implemented |
| Public deletion instructions | **Yes** — `/delete-account.html` |
| Settings link to deletion page | **Yes** — Settings → Legal & privacy |
| Clear local data only | **Yes** — Settings → Advanced actions |
| Manual email deletion request | **Yes** — `get.safeme@outlook.com` |
| Documented retention exceptions | **Yes** — legal/security/backup note on deletion page |

**Play requirement:** Provide a web link to deletion request flow. Confirm processing SLA and backend procedure before submission.

---

## Data deletion & retention (draft answers)

- Users can clear **local** data from the device.
- Users can request **account/server** deletion by email.
- Some records may be retained where legally or security required (draft disclosure only — confirm with counsel).
- Public tracking links stop exposing new updates when session ends or link disabled.

---

## Open questions / confirm before submission

1. **Legal review:** Privacy policy, terms, support, and deletion pages are marked draft. Have a qualified reviewer approve final text and support email (`get.safeme@outlook.com`).
2. **Account deletion procedure:** Document internal steps to delete Supabase Auth user + related rows (`profiles`, `trusted_contacts`, `sos_events`, `active_sos_sessions`). Test on staging.
3. **Deletion SLA:** Play may expect a stated timeframe (e.g. 30 days). Not committed in app yet.
4. **Contact email sync:** Contact `email` is in schema and local storage but may not always sync to Supabase on upsert — verify actual behavior and align disclosure.
5. **Medical notes classification:** Confirm whether Play “Health info” or regional sensitive-data rules apply in target countries.
6. **Google Fonts / third-party disclosure:** Confirm whether TWA/WebView build should list Google Fonts as third-party data sharing.
7. **Hosting logs:** Vercel/server access logs may contain IP addresses — confirm host privacy practices.
8. **Children / age rating:** App is not directed at children; confirm age rating and COPPA/GDPR-Kids applicability.
9. **Geographic scope:** GDPR, Greek law, and other jurisdictions — confirm lawful basis and DPA if needed.
10. **No analytics today:** Re-check before each release in case SDKs are added later.

---

## Suggested Play Console toggles (draft)

- **Collects data:** Yes
- **Shares data:** Yes (with backend; user-initiated sharing to contacts; public link when enabled)
- **Encrypted in transit:** Yes
- **Users can request deletion:** Yes (via web/email process)
- **Independent security review:** No (unless completed separately)

---

## Related files

- `public/privacy-policy.html`
- `public/terms-of-use.html`
- `public/support.html`
- `public/delete-account.html`
- In-app links: Settings → Privacy & important note → Legal & privacy
