const SUPABASE_URL = 'https://tkzgaejomyyrhbvfksas.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fIAQ-XIpZVUS2AoCdcfTLA_tXY6Ceq3';

let supabase = createOfflineSupabaseClient();
let isSupabaseReady = false;

function createOfflineSupabaseClient() {
  const offlineError = { message: 'Supabase is unavailable; SafeMe is running in local demo mode.' };
  const offlineQuery = {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    limit() { return this; },
    insert() { return this; },
    upsert() { return this; },
    delete() { return this; },
    single: async () => ({ data: null, error: offlineError }),
    maybeSingle: async () => ({ data: null, error: null }),
    then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); },
  };

  return {
    from: () => ({ ...offlineQuery }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: null, error: offlineError }),
      signUp: async () => ({ data: null, error: offlineError }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: offlineError }),
      updateUser: async () => ({ error: offlineError }),
    },
  };
}

async function initializeSupabaseClient() {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    isSupabaseReady = true;
  } catch (error) {
    isSupabaseReady = false;
    console.warn('[SafeMe] Supabase SDK unavailable; continuing with local demo profile only', error);
  }
}

const SOS_TRACKING_BASE_URL = 'https://cotsiosael.github.io/safety-app/';
const APP_VERSION = 'startup-reliability-2026-07-03';
const APP_VERSION_URL = './version.json';
const EMERGENCY_PWA_RESET_VERSION = APP_VERSION;
const UPDATE_STORAGE_KEYS = [
  'updateAvailable',
  'pwaUpdateAvailable',
  'needRefresh',
  'offlineReady',
  'app-update-available',
  'safeme-app-update-available',
  'safeme-update-available',
  'safety-app-update-available',
  'safeme-waiting-service-worker',
];

function clearStoredAppUpdateFlags() {
  UPDATE_STORAGE_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  });
}

try {
  clearStoredAppUpdateFlags();
} catch (error) {
  console.warn('[SafeMe] Could not clear stale update flags during boot', error);
}

async function runEmergencyPwaResetIfRequested() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('resetPwa') !== '1') return false;

  const resetKey = `pwa-reset-complete-${EMERGENCY_PWA_RESET_VERSION}`;
  if (sessionStorage.getItem(resetKey) === '1') {
    params.delete('resetPwa');
    params.set('v', EMERGENCY_PWA_RESET_VERSION);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    return false;
  }

  sessionStorage.setItem(resetKey, '1');
  clearStoredAppUpdateFlags();

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch (error) {
    console.warn('[SafeMe] Emergency service worker reset failed', error);
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('[SafeMe] Emergency cache reset failed', error);
  }

  clearStoredAppUpdateFlags();
  const cleanParams = new URLSearchParams(window.location.search);
  cleanParams.delete('resetPwa');
  cleanParams.set('v', EMERGENCY_PWA_RESET_VERSION);
  window.location.replace(`${window.location.pathname}?${cleanParams.toString()}${window.location.hash}`);
  return true;
}

runEmergencyPwaResetIfRequested();

const trackingParams = new URLSearchParams(window.location.search);
const hasTrackingTokenParam = trackingParams.has('track');
const trackingToken = (trackingParams.get('track') || '').trim();

const pageTitles = {
  home: 'Αρχική σελίδα',
  contacts: 'Έμπιστες επαφές',
  'safety-tools': 'Εργαλεία Ασφάλειας',
  profile: 'Προφίλ χρήστη',
  health: 'Έλεγχος εφαρμογής',
  settings: 'Ρυθμίσεις & ασφάλεια',
};

const defaultContacts = [];

const defaultProfile = null;

const phoneValidationMessage = 'Συμπλήρωσε έγκυρο τηλέφωνο, π.χ. 99878765 ή +35799878765.';

const legacyDemoContactPhones = new Set([
  ['+30690', '1234567'].join(''),
  ['+30691', '2345678'].join(''),
  ['+30693', '2109876'].join(''),
]);

const legacyDemoProfilePhone = ['+30 694', ' 555', ' 0198'].join('');

const storageKeys = {
  contacts: 'safety-app-trusted-contacts',
  profile: 'safety-app-user-profile',
  location: 'safety-app-last-location',
  sosTestMode: 'safety-app-sos-test-mode',
  checkIn: 'safety-app-active-check-in',
  safeWalk: 'safety-app-active-safe-walk',
  locationPermissionRequested: 'safety-app-location-permission-requested',
  testSosCompleted: 'safety-app-test-sos-completed',
  setupChecklistCollapsed: 'safety-app-setup-checklist-collapsed',
  safeWalkOutcome: 'safety-app-last-safe-walk-outcome',
  notificationHistory: 'safety-app-sos-notification-history',
  endedSosSession: 'safety-app-ended-sos-session',
};


function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });
}


function formatPublicTrackingDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function normalizePublicSosSession(session) {
  if (!session) return null;

  return {
    status: session.status || 'ended',
    startedAt: session.started_at || session.startedAt || null,
    endedAt: session.ended_at || session.endedAt || null,
    latestLatitude: session.latest_latitude ?? session.latestLatitude ?? null,
    latestLongitude: session.latest_longitude ?? session.latestLongitude ?? null,
    latestLocationAt: session.latest_location_at || session.latestLocationAt || null,
  };
}

function publicTrackingHasLocation(session) {
  return session?.latestLatitude !== null && session?.latestLatitude !== undefined
    && session?.latestLongitude !== null && session?.latestLongitude !== undefined;
}

function renderPublicTrackingPage(state) {
  const existingPage = document.querySelector('#public-tracking-page');
  const page = existingPage || document.createElement('main');
  page.id = 'public-tracking-page';
  page.className = 'public-tracking-page';

  if (!existingPage) document.body.appendChild(page);

  const renderShell = (content) => {
    page.innerHTML = `
      <section class="public-tracking-card" aria-live="polite">
        <p class="eyebrow">SafeMe SOS link</p>
        <h1>Ενεργό SOS SafeMe</h1>
        ${content}
      </section>
    `;
  };

  if (state.loading) {
    renderShell('<p class="public-tracking-muted">Φορτώνω την κατάσταση SOS...</p>');
    return;
  }

  if (state.error) {
    renderShell(`<p class="public-tracking-error">${escapeHtml(state.error)}</p>`);
    return;
  }

  const session = state.session;
  const hasLocation = publicTrackingHasLocation(session);
  const coordinates = hasLocation ? `${session.latestLatitude},${session.latestLongitude}` : '';
  const encodedCoordinates = encodeURIComponent(coordinates);
  const mapsUrl = hasLocation ? `https://maps.google.com/?q=${encodedCoordinates}` : '';
  const embedMapUrl = hasLocation ? `https://maps.google.com/maps?q=${encodedCoordinates}&z=16&output=embed` : '';
  const isActive = session.status === 'active';
  const statusText = isActive ? 'Ενεργό' : 'Τερματισμένο';
  const statusBanner = isActive
    ? '<p class="public-tracking-status-banner public-tracking-status-banner-active">Υπάρχει ενεργό SOS.</p>'
    : '<p class="public-tracking-status-banner public-tracking-status-banner-ended">Το SOS έχει τερματιστεί.</p>';

  page.innerHTML = `
    <section class="public-tracking-card" aria-live="polite">
      <p class="eyebrow">SafeMe SOS link</p>
      <h1>Ενεργό SOS SafeMe</h1>
      ${statusBanner}
      <dl class="public-tracking-details">
        <div><dt>Κατάσταση</dt><dd>${escapeHtml(statusText)}</dd></div>
        <div><dt>Έναρξη SOS</dt><dd>${escapeHtml(formatPublicTrackingDate(session.startedAt))}</dd></div>
        <div><dt>Τελευταία τοποθεσία</dt><dd>${escapeHtml(formatPublicTrackingDate(session.latestLocationAt))}</dd></div>
        <div><dt>Τελευταία ανανέωση σελίδας</dt><dd>${escapeHtml(formatPublicTrackingDate(state.refreshedAt))}</dd></div>
      </dl>

      <section class="public-tracking-guidance" aria-labelledby="public-tracking-guidance-title">
        <h2 id="public-tracking-guidance-title">Τι να κάνεις τώρα</h2>
        <ol>
          <li>Προσπάθησε να επικοινωνήσεις με το άτομο.</li>
          <li>Άνοιξε την τελευταία τοποθεσία στο Google Maps.</li>
          <li>Αν πιστεύεις ότι υπάρχει άμεσος κίνδυνος, κάλεσε τις υπηρεσίες έκτακτης ανάγκης.</li>
        </ol>
      </section>

      ${hasLocation
        ? `<div class="public-tracking-map-embed">
            <iframe
              title="Τελευταία τοποθεσία SOS στο Google Maps"
              src="${escapeHtml(embedMapUrl)}"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen>
            </iframe>
          </div>
          <p class="public-tracking-coordinates">Συντεταγμένες: ${escapeHtml(coordinates)}</p>`
        : '<p class="public-tracking-no-location">Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα. Δοκίμασε ξανά σε λίγα δευτερόλεπτα.</p>'}

      <div class="public-tracking-actions">
        ${hasLocation ? `<a class="public-tracking-action public-tracking-action-primary" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener">Άνοιγμα στο Google Maps</a>` : ''}
        <button class="public-tracking-action" id="public-tracking-refresh" type="button">Ανανέωση τοποθεσίας</button>
        <a class="public-tracking-action public-tracking-call" href="tel:112">Κλήση 112</a>
        <a class="public-tracking-action public-tracking-call" href="tel:199">Κλήση 199</a>
      </div>

      ${isActive ? '<p class="public-tracking-auto-refresh">Η σελίδα ανανεώνεται αυτόματα όσο το SOS είναι ενεργό.</p>' : ''}
    </section>
  `;
  document.querySelector('#public-tracking-refresh')?.addEventListener('click', fetchPublicTrackingSession);
}
let publicTrackingRefreshTimer = null;

async function fetchPublicTrackingSession() {
  if (!trackingToken) {
    renderPublicTrackingPage({ error: 'Το tracking link δεν είναι πλέον διαθέσιμο.' });
    return;
  }

  renderPublicTrackingPage({ loading: true });

  try {
    const { data, error } = await supabase.rpc('get_sos_session_by_token', {
      token: trackingToken,
    });

    if (error) throw error;

    const session = normalizePublicSosSession(Array.isArray(data) ? data[0] : data);
    if (!session) throw new Error('Το tracking link δεν είναι πλέον διαθέσιμο.');

    renderPublicTrackingPage({ session, refreshedAt: new Date().toISOString() });

    window.clearInterval(publicTrackingRefreshTimer);
    publicTrackingRefreshTimer = session.status === 'active'
      ? window.setInterval(fetchPublicTrackingSession, 20000)
      : null;
  } catch (error) {
    window.clearInterval(publicTrackingRefreshTimer);
    publicTrackingRefreshTimer = null;
    renderPublicTrackingPage({ error: 'Το tracking link δεν είναι πλέον διαθέσιμο.' });
  }
}

function initializePublicTrackingMode() {
  document.body.classList.add('tracking-mode');
  renderPublicTrackingPage({ loading: true });
  fetchPublicTrackingSession();
}

function initializeSafeMeAppUnsafe() {
const PASSWORD_RESET_REDIRECT_URL = 'https://cotsiosael.github.io/safety-app/';

const authStatusMessages = {
  signedOut: 'Χωρίς σύνδεση. Τα στοιχεία αποθηκεύονται με ασφάλεια μόνο σε αυτή τη συσκευή.',
  signedIn: 'Συνδέθηκες επιτυχώς. Τα στοιχεία σου συγχρονίζονται με ασφάλεια.',
  signupSuccess: 'Ο λογαριασμός δημιουργήθηκε. Έλεγξε το email σου για επιβεβαίωση πριν συνδεθείς.',
  logoutSuccess: 'Αποσυνδέθηκες επιτυχώς.',
  passwordResetSent: 'Σου στείλαμε email για επαναφορά κωδικού, αν υπάρχει λογαριασμός με αυτό το email.',
  passwordResetReady: 'Άνοιξε η φόρμα για να ορίσεις νέο κωδικό.',
  passwordResetSuccess: 'Ο κωδικός άλλαξε. Μπορείς να συνδεθείς με τον νέο κωδικό.',
  networkError: 'Δεν ήταν δυνατή η επικοινωνία με την υπηρεσία σύνδεσης. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
};

const navButtons = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.querySelector('#page-title');
const sosButton = document.querySelector('#sos-button');
const sosStatus = document.querySelector('#sos-status');
const sosTestModeToggle = document.querySelector('#sos-test-mode');
const sosModal = document.querySelector('#sos-modal');
const sosActionPanel = document.querySelector('#sos-action-panel');
const sosActionTitle = document.querySelector('#sos-action-title');
const sosMessagePreview = document.querySelector('#sos-message-preview');
const sosTestModeLabel = document.querySelector('#sos-test-mode-label');
const sosActionFeedback = document.querySelector('#sos-action-feedback');
const sosSendSmsButton = document.querySelector('#sos-send-sms');
const sosSendWhatsappButton = document.querySelector('#sos-send-whatsapp');
const sosCopyMessageButton = document.querySelector('#sos-copy-message');
const sosCopyTrackingButton = document.querySelector('#sos-copy-tracking');
const sosNativeShareButton = document.querySelector('#sos-native-share');
const sosCancelButtons = document.querySelectorAll('[data-close-sos]');
const contactsList = document.querySelector('#contacts-list');
const contactsForm = document.querySelector('#contact-form');
const contactCount = document.querySelector('#contact-count');
const clearContactsButton = document.querySelector('#clear-contacts-button');
const contactInviteModal = document.querySelector('#contact-invite-modal');
const contactInviteCloseButton = document.querySelector('#contact-invite-close');
const contactInvitePreview = document.querySelector('#contact-invite-preview');
const contactInviteFeedback = document.querySelector('#contact-invite-feedback');
const contactInviteSmsButton = document.querySelector('#contact-invite-sms');
const contactInviteWhatsappButton = document.querySelector('#contact-invite-whatsapp');
const contactInviteCopyButton = document.querySelector('#contact-invite-copy');
const profileForm = document.querySelector('#profile-form');
const profileName = document.querySelector('#profile-name');
const profilePhone = document.querySelector('#profile-phone');
const profileNotes = document.querySelector('#profile-notes');
const profileLanguage = document.querySelector('#profile-language');
const profileCreatedAt = document.querySelector('#profile-created-at');
const profileUpdatedAt = document.querySelector('#profile-updated-at');
const profileAvatar = document.querySelector('#profile-avatar');
const profileStatus = document.querySelector('#profile-status');
const clearDataButton = document.querySelector('#clear-data-button');
const settingsOpenProfileButton = document.querySelector('#settings-open-profile');
const settingsOpenContactsButton = document.querySelector('#settings-open-contacts');
const settingsRefreshLocationButton = document.querySelector('#settings-refresh-location');
const settingsRefreshAppButton = document.querySelector('#settings-refresh-app');
const pullRefreshIndicator = document.querySelector('#pull-refresh-indicator');
const pullRefreshMessage = document.querySelector('#pull-refresh-message');
const pullRefreshManualButton = document.querySelector('#pull-refresh-manual');
const settingsClearDataButton = document.querySelector('#settings-clear-data');
const settingsLogoutButton = document.querySelector('#settings-logout');
const settingsStatus = document.querySelector('#settings-status');
const healthChecklist = document.querySelector('#health-checklist');
const healthSummaryTitle = document.querySelector('#health-summary-title');
const healthReportStatus = document.querySelector('#health-report-status');
const healthCopyReportButton = document.querySelector('#health-copy-report');
const healthOpenProfileButton = document.querySelector('#health-open-profile');
const healthOpenContactsButton = document.querySelector('#health-open-contacts');
const healthCheckLocationButton = document.querySelector('#health-check-location');
const healthTestSosButton = document.querySelector('#health-test-sos');
const healthTestCheckInButton = document.querySelector('#health-test-checkin');
const healthTestSafeWalkButton = document.querySelector('#health-test-safe-walk');
const authForm = document.querySelector('#auth-form');
const authEmail = document.querySelector('#auth-email');
const authPassword = document.querySelector('#auth-password');
const authRepeatPassword = document.querySelector('#auth-repeat-password');
const authModeTabs = document.querySelector('#auth-mode-tabs');
const authLoginTab = document.querySelector('#auth-login-tab');
const authSignupTab = document.querySelector('#auth-signup-tab');
const authSubmitButton = document.querySelector('#auth-submit-button');
const authForgotPasswordButton = document.querySelector('#auth-forgot-password');
const authPasswordToggle = document.querySelector('#auth-password-toggle');
const authFields = document.querySelector('#auth-fields');
const authPasswordField = document.querySelector('#auth-password-field');
const authRepeatPasswordField = document.querySelector('#auth-repeat-password-field');
const authSignupNote = document.querySelector('#auth-signup-note');
const authSignedIn = document.querySelector('#auth-signed-in');
const authUserEmail = document.querySelector('#auth-user-email');
const authIndicator = document.querySelector('#auth-indicator');
const onlineStatusPill = document.querySelector('#online-status-pill');
const currentLocationCard = document.querySelector('#current-location-card');
const authLogoutButton = document.querySelector('#auth-logout-button');
const authStatus = document.querySelector('#auth-status');
const localImportCard = document.querySelector('#local-import-card');
const localImportSummary = document.querySelector('#local-import-summary');
const localImportButton = document.querySelector('#local-import-button');
const localImportSkipButton = document.querySelector('#local-import-skip');
const localImportStatus = document.querySelector('#local-import-status');
const passwordResetForm = document.querySelector('#password-reset-form');
const passwordResetNew = document.querySelector('#password-reset-new');
const passwordResetRepeat = document.querySelector('#password-reset-repeat');
const passwordResetSubmit = document.querySelector('#password-reset-submit');
const passwordResetStatus = document.querySelector('#password-reset-status');
const storageMode = document.querySelector('#storage-mode');
const locationText = document.querySelector('#location-text');
const refreshLocationButton = document.querySelector('#refresh-location-button');
const shareLocationButton = document.querySelector('#share-location-button');
const homeQuickActions = document.querySelector('.home-quick-actions');
const homeQuickActionStatus = document.querySelector('#home-quick-action-status');
const safetyToolsTestSosButton = document.querySelector('#safety-tools-test-sos');
const contactsReadinessText = document.querySelector('#contacts-readiness-text');
const locationReadinessText = document.querySelector('#location-readiness-text');
const sosHistoryList = document.querySelector('#sos-history-list');
const activeSosSection = document.querySelector('#active-sos-section');
const activeSosStarted = document.querySelector('#active-sos-started');
const activeSosStatus = document.querySelector('#active-sos-status');
const activeSosIntro = document.querySelector('#active-sos-intro');
const activeSosLocation = document.querySelector('#active-sos-location');
const activeSosLatestLocationTime = document.querySelector('#active-sos-latest-location-time');
const activeSosLiveUpdateState = document.querySelector('#active-sos-live-update-state');
const activeSosTrackingStatus = document.querySelector('#active-sos-tracking-status');
const activeSosLastLiveUpdate = document.querySelector('#active-sos-last-live-update');
const activeSosFeedback = document.querySelector('#active-sos-feedback');
const activeSosLiveStatus = document.querySelector('#active-sos-live-status');
const activeSosPermissionStatus = document.querySelector('#active-sos-permission-status');
const activeSosLastGpsUpdate = document.querySelector('#active-sos-last-gps-update');
const activeSosDebugLastSync = document.querySelector('#active-sos-debug-last-sync');
const activeSosSyncResult = document.querySelector('#active-sos-sync-result');
const activeSosLastError = document.querySelector('#active-sos-last-error');
const testActiveSosLiveSyncButton = document.querySelector('#test-active-sos-live-sync');
const refreshActiveSosGpsButton = document.querySelector('#refresh-active-sos-gps');
const updateActiveSosLocationButton = document.querySelector('#update-active-sos-location');
const endActiveSosButton = document.querySelector('#end-active-sos');
const copyActiveSosTrackingButton = document.querySelector('#copy-active-sos-tracking');
const shareActiveSosLocationButton = document.querySelector('#share-active-sos-location');
const activeSosTestModeLabel = document.querySelector('#active-sos-test-mode-label');
const activeSosTrackingReady = document.querySelector('#active-sos-tracking-ready');
const disableActiveSosTrackingButton = document.querySelector('#disable-active-sos-tracking');
const safeWalkPresetButtons = document.querySelectorAll('.safe-walk-preset');
const safeWalkDestination = document.querySelector('#safe-walk-destination');
const safeWalkCustomMinutes = document.querySelector('#safe-walk-custom-minutes');
const safeWalkStartButton = document.querySelector('#safe-walk-start-button');
const safeWalkActivePanel = document.querySelector('#safe-walk-active-panel');
const safeWalkCountdown = document.querySelector('#safe-walk-countdown');
const safeWalkActiveDestination = document.querySelector('#safe-walk-active-destination');
const safeWalkStartedTime = document.querySelector('#safe-walk-started-time');
const safeWalkExpectedTime = document.querySelector('#safe-walk-expected-time');
const safeWalkStatusText = document.querySelector('#safe-walk-status-text');
const safeWalkLocationTime = document.querySelector('#safe-walk-location-time');
const safeWalkStatusPill = document.querySelector('#safe-walk-status-pill');
const safeWalkSafeButton = document.querySelector('#safe-walk-safe-button');
const safeWalkRefreshLocationButton = document.querySelector('#safe-walk-refresh-location');
const safeWalkCancelButton = document.querySelector('#safe-walk-cancel-button');
const safeWalkMessage = document.querySelector('#safe-walk-message');
const checkInPresetButtons = document.querySelectorAll('.checkin-preset');
const checkInCustomMinutes = document.querySelector('#checkin-custom-minutes');
const checkInStartButton = document.querySelector('#checkin-start-button');
const checkInActivePanel = document.querySelector('#checkin-active-panel');
const checkInCountdown = document.querySelector('#checkin-countdown');
const checkInStartedTime = document.querySelector('#checkin-started-time');
const checkInExpiryTime = document.querySelector('#checkin-expiry-time');
const checkInStatusText = document.querySelector('#checkin-status-text');
const checkInStatusPill = document.querySelector('#checkin-status-pill');
const checkInSafeButton = document.querySelector('#checkin-safe-button');
const checkInCancelButton = document.querySelector('#checkin-cancel-button');
const checkInMessage = document.querySelector('#checkin-message');
const safetyStatusCard = document.querySelector('#safety-status-card');
const safetyStatusIcon = document.querySelector('#safety-status-icon');
const safetyStatusTitle = document.querySelector('#safety-status-title');
const safetyStatusDescription = document.querySelector('#safety-status-description');
const setupChecklist = document.querySelector('#setup-checklist');
const setupChecklistItems = document.querySelector('#setup-checklist-items');
const setupChecklistProgress = document.querySelector('#setup-checklist-progress');
const setupChecklistSummary = document.querySelector('#setup-checklist-summary');
const sosContactNotify = document.querySelector('#sos-contact-notify');
const sosContactList = document.querySelector('#sos-contact-list');
const sosContactWarning = document.querySelector('#sos-contact-warning');
const notifyAllSosContactsButton = document.querySelector('#notify-all-sos-contacts');
const notifyAllSosContactsActionButton = document.querySelector('#notify-all-sos-contacts-action');
const sosNotificationHistoryList = document.querySelector('#sos-notification-history-list');

function showGlobalSafetyMessage(message) {
  const fallbackTarget = document.querySelector('#sos-status') || document.querySelector('#home-quick-action-status') || document.body;
  if (!fallbackTarget) return;

  if (fallbackTarget === document.body) {
    let notice = document.querySelector('#global-safety-error');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'global-safety-error';
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:9999;padding:.85rem 1rem;border-radius:14px;background:#7f1d1d;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.25);font-weight:700;';
      document.body.appendChild(notice);
    }
    notice.textContent = message;
    window.clearTimeout(showGlobalSafetyMessage.timeoutId);
    showGlobalSafetyMessage.timeoutId = window.setTimeout(() => notice.remove(), 5000);
    return;
  }

  fallbackTarget.textContent = message;
}

window.addEventListener('error', (event) => {
  console.error('[SafeMe] Uncaught runtime error', event.error || event.message);
  showGlobalSafetyMessage('Κάτι πήγε στραβά, αλλά η εφαρμογή παραμένει ανοιχτή. Δοκίμασε ξανά.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[SafeMe] Unhandled promise rejection', event.reason);
  showGlobalSafetyMessage('Κάτι πήγε στραβά, αλλά η εφαρμογή παραμένει ανοιχτή. Δοκίμασε ξανά.');
});


function isActiveSosInProgress() {
  return activeSosSession?.status === 'active';
}

function hideAppUpdateBanner() {
  hasAppUpdateAvailable = false;
  waitingServiceWorker = null;
  clearStoredAppUpdateFlags();
}

async function refreshAppSafely({ requireConfirmationForActiveSos = true } = {}) {
  if (isActiveSosInProgress() && requireConfirmationForActiveSos) {
    const shouldRefresh = window.confirm('SOS is active. Refresh manually only if needed.');
    if (!shouldRefresh) return false;
  }

  const registration = navigator.serviceWorker?.getRegistration
    ? await navigator.serviceWorker.getRegistration()
    : null;
  const worker = waitingServiceWorker || registration?.waiting || null;

  if (!worker) {
    hideAppUpdateBanner();
    return false;
  }

  if (isReloadingForServiceWorkerUpdate) return true;
  isReloadingForServiceWorkerUpdate = true;
  worker.postMessage({ type: 'SKIP_WAITING' });
  return true;
}

async function checkForAppUpdate() {
  hideAppUpdateBanner();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  clearStoredAppUpdateFlags();

  navigator.serviceWorker.register('./sw.js').then((registration) => {
    hideAppUpdateBanner();

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') {
          hideAppUpdateBanner();
        }
      });
    });
  }).catch(() => hideAppUpdateBanner());

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isReloadingForServiceWorkerUpdate) {
      hideAppUpdateBanner();
      return;
    }

    hideAppUpdateBanner();
    window.location.reload();
  });
}

function setupAppFreshnessChecks() {
  if (window.__safeMeFreshnessChecksBound) return;
  window.__safeMeFreshnessChecksBound = true;
  clearStoredAppUpdateFlags();
  hideAppUpdateBanner();
  registerServiceWorker();
  checkForAppUpdate({ force: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForAppUpdate({ force: true });
      if (currentUser) loadSupabaseData().catch((error) => console.warn('[SafeMe] Background account refresh failed', error));
    }
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) checkForAppUpdate({ force: true });
  });
  window.addEventListener('online', () => {
    checkForAppUpdate({ force: true });
    if (currentUser) loadSupabaseData().catch((error) => console.warn('[SafeMe] Online account refresh failed', error));
    if (hasRequestedLocationPermission) refreshLocation();
  });
}


function setPullRefreshState(state, message, { offset = 0, showManual = false } = {}) {
  if (!pullRefreshIndicator || !pullRefreshMessage) return;
  pullRefreshIndicator.dataset.state = state;
  pullRefreshMessage.textContent = message;
  pullRefreshIndicator.style.transform = `translate(-50%, ${Math.round(offset)}px)`;
  pullRefreshIndicator.setAttribute('aria-hidden', state === 'idle' ? 'true' : 'false');
  if (pullRefreshManualButton) pullRefreshManualButton.hidden = !showManual;
}

function resetPullRefreshIndicator(delay = 900) {
  window.setTimeout(() => setPullRefreshState('idle', 'Pull to refresh'), delay);
}

async function refreshAppDataForPull() {
  await checkForAppUpdate({ force: true });
  if (currentUser) await loadSupabaseData();
  if (hasRequestedLocationPermission) await refreshLocation();
}

function setupPullToRefresh() {
  if (window.__safeMePullToRefreshBound) return;
  if (!pullRefreshIndicator || !window.matchMedia('(pointer: coarse)').matches) return;
  window.__safeMePullToRefreshBound = true;

  const threshold = 78;
  const maxPull = 128;
  let startY = 0;
  let pullDistance = 0;
  let isPulling = false;
  let isRefreshing = false;

  const isAtPageTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

  window.addEventListener('touchstart', (event) => {
    if (isRefreshing || event.touches.length !== 1 || !isAtPageTop()) return;
    startY = event.touches[0].clientY;
    pullDistance = 0;
    isPulling = true;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (!isPulling || event.touches.length !== 1) return;
    const deltaY = event.touches[0].clientY - startY;
    if (deltaY <= 0 || !isAtPageTop()) {
      isPulling = false;
      setPullRefreshState('idle', 'Pull to refresh');
      return;
    }

    pullDistance = Math.min(maxPull, deltaY * 0.45);
    const ready = pullDistance >= threshold;
    setPullRefreshState(ready ? 'ready' : 'pulling', ready ? 'Release to refresh' : 'Pull to refresh', { offset: pullDistance });
  }, { passive: true });

  window.addEventListener('touchend', async () => {
    if (!isPulling) return;
    isPulling = false;

    if (pullDistance < threshold) {
      setPullRefreshState('idle', 'Pull to refresh');
      return;
    }

    if (isActiveSosInProgress()) {
      setPullRefreshState('blocked', 'SOS is active. Refresh manually only if needed.', { offset: 18, showManual: true });
      resetPullRefreshIndicator(4200);
      return;
    }

    isRefreshing = true;
    setPullRefreshState('refreshing', 'Refreshing', { offset: 18 });
    try {
      await refreshAppDataForPull();
      setPullRefreshState('done', 'App refreshed / Up to date', { offset: 18 });
    } catch {
      setPullRefreshState('done', 'Could not refresh. Check connection.', { offset: 18 });
    } finally {
      isRefreshing = false;
      resetPullRefreshIndicator(1600);
    }
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    isPulling = false;
    if (!isRefreshing) setPullRefreshState('idle', 'Pull to refresh');
  }, { passive: true });
}

function getActiveSosEmergencyMessage() {
  return buildSosMessage(currentLocation, activeSosSession?.shareToken);
}

function logSosNotification(contact, method, status) {
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, contactName: contact?.name || 'Όλες οι επαφές', method, status, at: new Date().toISOString() };
  sosNotificationHistory = [entry, ...sosNotificationHistory].slice(0, 12);
  saveJson(storageKeys.notificationHistory, sosNotificationHistory);
  renderSosNotificationHistory();
}

function renderSosNotificationHistory() {
  if (!sosNotificationHistoryList) return;
  if (!sosNotificationHistory.length) {
    sosNotificationHistoryList.innerHTML = '<p class="sos-notification-empty">Δεν υπάρχουν ειδοποιήσεις ακόμα.</p>';
    return;
  }
  sosNotificationHistoryList.innerHTML = sosNotificationHistory.map((entry) => `
    <article class="sos-notification-history-item">
      <strong>${escapeHtml(entry.contactName)}</strong>
      <span>${escapeHtml(entry.method)} • ${escapeHtml(formatSosEventTime(entry.at))}</span>
      <em>${escapeHtml(entry.status)}</em>
    </article>
  `).join('');
}

function renderSosContactNotifications() {
  if (!sosContactNotify || !sosContactList) return;
  const hasActive = isActiveSosInProgress();
  sosContactNotify.hidden = !hasActive;
  if (!hasActive) return;

  const trackingUrl = getSosTrackingUrl(activeSosSession?.shareToken);
  notifyAllSosContactsButton.disabled = contacts.length === 0 || isSosTestMode;
  if (notifyAllSosContactsActionButton) notifyAllSosContactsActionButton.disabled = contacts.length === 0 || isSosTestMode;
  sosContactWarning.textContent = isSosTestMode
    ? 'Λειτουργία δοκιμής SOS: δεν ετοιμάζεται πραγματικό μήνυμα έκτακτης ανάγκης.'
    : !trackingUrl
      ? 'Το SafeMe ετοιμάζει το μήνυμα. Η αποστολή γίνεται από τη συσκευή σου όπου απαιτείται. Δεν υπάρχει active tracking link.'
      : contacts.length === 0
        ? 'Δεν υπάρχουν emergency contacts. Πήγαινε στις Επαφές για setup.'
        : 'Το SafeMe ετοιμάζει το μήνυμα. Η αποστολή γίνεται από τη συσκευή σου όπου απαιτείται.';

  if (contacts.length === 0) {
    sosContactList.innerHTML = '<article class="sos-contact-empty"><strong>Δεν υπάρχουν emergency contacts</strong><p>Άνοιξε τις Επαφές και πρόσθεσε τουλάχιστον ένα άτομο.</p><button class="ghost-button" type="button" data-sos-open-contacts>Άνοιγμα επαφών</button></article>';
    renderSosNotificationHistory();
    return;
  }

  const message = getActiveSosEmergencyMessage();
  sosContactList.innerHTML = contacts.map((contact, index) => {
    const phone = normalizePhone(contact.phone || '');
    const hasPhone = Boolean(phone);
    const hasEmail = Boolean(contact.email);
    return `
      <article class="sos-contact-notify-card">
        <div><strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.relationship || 'Emergency contact')}</span></div>
        ${!hasPhone && !hasEmail ? '<p class="sos-contact-missing">Missing contact details</p>' : ''}
        <div class="sos-contact-notify-actions">
          <a class="danger-button" href="${escapeHtml(getSmsLink(contact, message))}" data-sos-notify-index="${index}" data-sos-method="SMS" ${!hasPhone ? 'aria-disabled="true" tabindex="-1"' : ''}>Send SMS</a>
          <a class="ghost-button" href="${escapeHtml(getWhatsappLink(message, contact))}" target="_blank" rel="noopener" data-sos-notify-index="${index}" data-sos-method="WhatsApp" ${!hasPhone ? 'aria-disabled="true" tabindex="-1"' : ''}>Open WhatsApp</a>
          <a class="ghost-button" href="${escapeHtml(getEmailLink(contact, message))}" data-sos-notify-index="${index}" data-sos-method="Email" ${!hasEmail ? 'aria-disabled="true" tabindex="-1"' : ''}>Send Email</a>
          <button class="ghost-button" type="button" data-sos-copy-contact="${index}">Copy emergency message</button>
        </div>
      </article>`;
  }).join('');
  renderSosNotificationHistory();
}

async function notifyAllSosContacts() {
  if (isSosTestMode) { renderActiveSosSession('Λειτουργία δοκιμής SOS: δεν ετοιμάστηκε πραγματικό μήνυμα έκτακτης ανάγκης.'); return; }
  const message = getActiveSosEmergencyMessage();
  const trackingUrl = getSosTrackingUrl(activeSosSession?.shareToken);
  if (navigator.share) {
    try { await navigator.share({ title: 'SafeMe SOS', text: message, url: trackingUrl }); logSosNotification(null, 'Share', 'Opened'); return; }
    catch (error) { if (error?.name === 'AbortError') return; }
  }
  await copyTextToClipboard(message);
  logSosNotification(null, 'Copy', 'Copied');
  renderActiveSosSession('Το SOS μήνυμα αντιγράφηκε για αποστολή σε όλες τις επαφές.');
}

function loadJson(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch (error) {
    console.warn('[SafeMe] Could not parse local data; using safe fallback', { key, error });
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('[SafeMe] Could not save local data', { key, error });
    return false;
  }
}

function saveJsonOrThrow(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new Error('localStorage save failed', { cause: error });
  }
}

function safeStartupValue(label, factory, fallback) {
  try {
    return factory();
  } catch (error) {
    console.warn(`[SafeMe] Could not load ${label}; using safe fallback`, error);
    return fallback;
  }
}

let contacts = safeStartupValue('contacts', () => normalizeContactsForStorage(loadJson(storageKeys.contacts, defaultContacts)), defaultContacts);
let isContactsMutationInProgress = false;
let profile = safeStartupValue('profile', () => sanitizeProfile(loadJson(storageKeys.profile, defaultProfile)), defaultProfile);
let currentLocation = safeStartupValue('location', () => loadJson(storageKeys.location, null), null);
let isSosTestMode = safeStartupValue('SOS test mode', () => loadJson(storageKeys.sosTestMode, false) === true, false);
let hasCompletedTestSos = safeStartupValue('test SOS status', () => loadJson(storageKeys.testSosCompleted, false) === true, false);
let hasRequestedLocationPermission = safeStartupValue('location permission status', () => loadJson(storageKeys.locationPermissionRequested, false) === true, false);
let isSetupChecklistCollapsed = safeStartupValue('setup checklist state', () => loadJson(storageKeys.setupChecklistCollapsed, true) === true, true);
let activeSafeWalk = safeStartupValue('safe walk', () => loadJson(storageKeys.safeWalk, null), null);
let selectedSafeWalkMinutes = 10;
let lastSafeWalkOutcome = safeStartupValue('safe walk outcome', () => loadJson(storageKeys.safeWalkOutcome, null), null);
let safeWalkTimer = null;
let safeWalkExpiryInProgress = false;
let activeCheckIn = safeStartupValue('check-in', () => loadJson(storageKeys.checkIn, null), null);
let selectedCheckInMinutes = 5;
let checkInTimer = null;
let checkInExpiryInProgress = false;
let preparedSosMessage = '';
let preparedSosContact = null;
let preparedContactInvite = null;
let preparedSosTrackingUrl = '';
let sosActivationInProgress = false;
let currentUser = null;
let authMode = 'login';
let isPasswordRecoveryMode = false;
let hasPendingLogoutMessage = false;
let isRemoteSyncing = false;
let sosHistoryEvents = [];
let sosHistoryStatus = '';
let activeSosSession = null;
let isActiveSosSessionRestored = false;
let activeSosLocationUpdateTimer = null;
let activeSosLocationWatcherId = null;
let isAutoUpdatingActiveSosLocation = false;
let activeSosLastAutoUpdateAt = null;
let activeSosDiagnostics = {
  permissionStatus: 'Άγνωστο',
  lastGpsUpdateAt: currentLocation?.updatedAt || null,
  lastSupabaseSyncAt: null,
  lastSupabaseSyncResult: '—',
  lastErrorMessage: '',
};
let locationPermissionStatus = null;
let sosNotificationHistory = loadJson(storageKeys.notificationHistory, []);
let lastEndedSosSession = loadJson(storageKeys.endedSosSession, null);
let waitingServiceWorker = null;
let hasAppUpdateAvailable = false;
let lastVersionCheckAt = 0;
let isReloadingForServiceWorkerUpdate = false;
let pendingLocalImport = null;



const legacyActiveSosStorageKeys = [
  'activeEmergency',
  'sosActive',
  'currentSession',
  'activeSosSession',
  'activeSOSSession',
  'safety-app-active-emergency',
  'safety-app-sos-active',
  'safety-app-current-session',
  'safety-app-active-sos-session',
];

function clearLegacyActiveSosStorage() {
  legacyActiveSosStorageKeys.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  });
}

function getSosSessionIdentity(session) {
  if (!session) return null;

  return {
    id: session.id || null,
    shareToken: session.shareToken || null,
    sosEventId: session.sosEventId || null,
  };
}

function isSameSosSession(session, endedSession) {
  if (!session || !endedSession) return false;
  return Boolean(
    (session.id && endedSession.id && session.id === endedSession.id)
      || (session.shareToken && endedSession.shareToken && session.shareToken === endedSession.shareToken)
      || (session.sosEventId && endedSession.sosEventId && session.sosEventId === endedSession.sosEventId)
  );
}

function markSosSessionEnded(session, status = 'ended') {
  lastEndedSosSession = {
    ...getSosSessionIdentity(session),
    status,
    endedAt: new Date().toISOString(),
    userId: session?.userId || currentUser?.id || null,
  };
  saveJson(storageKeys.endedSosSession, lastEndedSosSession);
  clearLegacyActiveSosStorage();
}

function clearActiveSosRuntimeState({ message = 'Το προηγούμενο SOS έχει τερματιστεί. Η εφαρμογή είναι σε κανονική κατάσταση.', endedSession = activeSosSession, status = 'ended' } = {}) {
  if (endedSession) markSosSessionEnded(endedSession, status);
  stopActiveSosLocationAutoUpdate();
  activeSosSession = null;
  isActiveSosSessionRestored = false;
  isAutoUpdatingActiveSosLocation = false;
  activeSosLastAutoUpdateAt = null;
  clearLegacyActiveSosStorage();
  renderActiveSosSession();
  sosButton?.classList.remove('activated');
  sosButton?.setAttribute('aria-pressed', 'false');
  if (sosStatus && message) sosStatus.textContent = message;
  renderSafetyStatusCard();
  renderSosContactNotifications();
}

function shouldRestoreActiveSosSession(session) {
  return Boolean(session?.status === 'active' && !isSameSosSession(session, lastEndedSosSession));
}

function isLegacyDemoContact(contact) {
  return legacyDemoContactPhones.has(contact.phone);
}

function sanitizeContacts(savedContacts) {
  if (!Array.isArray(savedContacts)) return [];

  const usedIds = new Set();

  return savedContacts
    .filter((contact) => contact && typeof contact === 'object' && !isLegacyDemoContact(contact))
    .map((contact) => {
      let id = typeof contact.id === 'string' && contact.id.trim() ? contact.id.trim() : createLocalContactId();
      while (usedIds.has(id)) id = createLocalContactId();
      usedIds.add(id);

      return {
        id,
        name: typeof contact.name === 'string' ? contact.name.trim() : '',
        relationship: typeof contact.relationship === 'string' ? contact.relationship.trim() : '',
        phone: typeof contact.phone === 'string' ? contact.phone.trim() : '',
        email: typeof contact.email === 'string' ? contact.email.trim() : '',
        tone: contact.tone === 'primary' ? 'primary' : 'default',
      };
    })
    .filter((contact) => contact.name || contact.relationship || contact.phone || contact.email);
}

function ensureSinglePrimaryContact(contactList) {
  if (!Array.isArray(contactList) || contactList.length === 0) return [];

  const primaryIndex = contactList.findIndex((contact) => contact?.tone === 'primary');
  const activePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return contactList.map((contact, index) => ({
    ...contact,
    tone: index === activePrimaryIndex ? 'primary' : 'default',
  }));
}

function normalizeContactsForStorage(contactList) {
  return ensureSinglePrimaryContact(sanitizeContacts(contactList));
}

function recoverContactsStorage() {
  contacts = normalizeContactsForStorage(loadJson(storageKeys.contacts, []));
  saveJson(storageKeys.contacts, contacts);
  return contacts;
}

function validateContactFields(contact) {
  const name = contact?.name?.trim() || '';
  const relationship = contact?.relationship?.trim() || '';
  const phone = contact?.phone?.trim() || '';
  const email = contact?.email?.trim() || '';
  if (!name) return 'Συμπλήρωσε όνομα επαφής.';
  if (!relationship) return 'Συμπλήρωσε τη σχέση της επαφής.';
  if (!phone && !email) return 'Συμπλήρωσε τηλέφωνο ή email για την επαφή.';
  if (phone && !isValidPhoneNumber(phone)) return phoneValidationMessage;
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return 'Συμπλήρωσε έγκυρο email ή άφησέ το κενό.';

  return '';
}

function showContactValidationMessage(message) {
  window.alert(message);
}

function mapContactFromSupabase(contact) {
  return {
    id: contact.id,
    name: contact.name || '',
    relationship: contact.relationship || '',
    phone: contact.phone || '',
    email: contact.email || '',
    tone: contact.tone || 'default',
  };
}

function mapContactToSupabase(contact) {
  return {
    user_id: currentUser.id,
    name: contact.name,
    relationship: contact.relationship,
    phone: contact.phone,
    email: contact.email || '',
    tone: contact.tone || 'default',
  };
}

function mapProfileFromSupabase(savedProfile) {
  if (!savedProfile) return null;

  return sanitizeProfile({
    name: savedProfile.name || '',
    phone: savedProfile.phone || '',
    medicalNotes: savedProfile.medical_note || savedProfile.medical_notes || savedProfile.medicalNotes || '',
    preferredLanguage: savedProfile.preferred_language || savedProfile.preferredLanguage || 'el',
    createdAt: savedProfile.created_at || savedProfile.createdAt || null,
    updatedAt: savedProfile.updated_at || savedProfile.updatedAt || null,
  });
}

function mapProfileToSupabase(savedProfile) {
  return {
    id: currentUser.id,
    name: savedProfile.name,
    phone: savedProfile.phone,
    medical_note: savedProfile.medicalNotes,
    medical_notes: savedProfile.medicalNotes,
    preferred_language: savedProfile.preferredLanguage || 'el',
    updated_at: new Date().toISOString(),
  };
}

function persistContactsLocally() {
  contacts = normalizeContactsForStorage(contacts);
  saveJsonOrThrow(storageKeys.contacts, contacts);
}

async function syncContactsToSupabaseBestEffort(context) {
  if (!currentUser || isRemoteSyncing) return;

  try {
    await saveContactsToSupabase();
  } catch (error) {
    console.warn(`[SafeMe] Contact ${context} saved locally but did not sync`, error);
  }
}

async function persistContacts() {
  persistContactsLocally();
  await syncContactsToSupabaseBestEffort('list');
}

function sanitizeProfile(savedProfile) {
  if (!savedProfile || typeof savedProfile !== 'object') return null;

  if (savedProfile.phone === legacyDemoProfilePhone) return null;
  const name = String(savedProfile.name || '').trim();
  const phone = String(savedProfile.phone || '').trim();
  const medicalNotes = String(savedProfile.medicalNotes || savedProfile.medical_note || savedProfile.medical_notes || '').trim();
  const preferredLanguage = savedProfile.preferredLanguage === 'en' ? 'en' : 'el';
  if (!name && !phone && !medicalNotes) return null;

  return {
    name,
    phone,
    medicalNotes,
    preferredLanguage,
    createdAt: savedProfile.createdAt || savedProfile.created_at || null,
    updatedAt: savedProfile.updatedAt || savedProfile.updated_at || null,
  };
}

function hasCompleteLocalProfile() {
  return Boolean(profile?.name?.trim() && profile?.phone?.trim());
}


function getProfileValue(field, fallback) {
  return profile?.[field] || fallback;
}

function getInitials(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || '👤';
}

function formatPhone(phone) {
  return phone.replace(/(\+30)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
}

function normalizePhone(phone) {
  return phone.replace(/[^\d+]/g, '');
}

function isValidPhoneNumber(phone) {
  const normalizedPhone = normalizePhone(String(phone || ''));
  const phoneDigits = normalizedPhone.replace(/\D/g, '');

  if (phoneDigits.length === 8) return true;
  if (/^(?:357\d{8}|00357\d{8})$/.test(phoneDigits)) return true;
  if (/^(?:\d{10,15}|00\d{10,15})$/.test(phoneDigits)) return true;

  return false;
}

function validateProfileFields(savedProfile) {
  if (!savedProfile?.name?.trim()) return 'Συμπλήρωσε όνομα προφίλ.';
  if (!savedProfile?.phone?.trim()) return 'Συμπλήρωσε τηλέφωνο προφίλ.';
  if (!isValidPhoneNumber(savedProfile.phone)) return phoneValidationMessage;

  return '';
}


function showPage(nextPage) {
  if (!pageTitles[nextPage]) nextPage = 'home';
  navButtons.forEach((item) => {
    const isActive = item.dataset.page === nextPage;
    item.classList.toggle('active', isActive);
    item.toggleAttribute('aria-current', isActive);
  });

  pages.forEach((page) => page.classList.toggle('active', page.id === nextPage));
  if (pageTitle) pageTitle.textContent = pageTitles[nextPage];
  if (nextPage === 'health') renderHealthPage();
}


function focusElementAfterScroll(element, fallbackElement = null) {
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => (fallbackElement || element).focus({ preventScroll: true }), 220);
}

function openProfileAuthCard() {
  showPage('profile');

  const signedIn = Boolean(currentUser);
  const focusTarget = isPasswordRecoveryMode ? passwordResetForm : (signedIn ? authSignedIn : authEmail);
  focusElementAfterScroll(focusTarget || authForm);
}

function focusProfileForm() {
  showPage('profile');
  focusElementAfterScroll(profileForm?.elements?.name || profileForm);
}

function focusContactForm() {
  showPage('contacts');
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      const contactTarget = contactsForm || contactsList;
      focusElementAfterScroll(contactTarget, contactsForm?.elements?.name || contactTarget);
    }, 0);
  });
}

function openSettingsProfile() {
  focusProfileForm();
}

function openSettingsContacts() {
  focusContactForm();
}

function focusSosButton() {
  showPage('home');
  focusElementAfterScroll(sosButton);
}


function focusCheckInSection() {
  showPage('safety-tools');
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      const checkInSection = document.querySelector('#checkin-section');
      focusElementAfterScroll(checkInSection, checkInStartButton || checkInSection);
    }, 0);
  });
}

function focusSafeWalkSection() {
  showPage('safety-tools');
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      const safeWalkSection = document.querySelector('#safe-walk-section');
      focusElementAfterScroll(safeWalkSection, safeWalkStartButton || safeWalkSection);
    }, 0);
  });
}

function setHomeQuickActionStatus(message) {
  if (homeQuickActionStatus) {
    homeQuickActionStatus.textContent = message;
    window.clearTimeout(setHomeQuickActionStatus.timeoutId);
    setHomeQuickActionStatus.timeoutId = window.setTimeout(() => {
      homeQuickActionStatus.textContent = '';
    }, 1800);
  }
  console.log(`[SafeMe Home] ${message}`);
}

function handleHomeQuickAction(action) {
  if (action === 'checkin') {
    setHomeQuickActionStatus('Άνοιγμα Check-in...');
    focusCheckInSection();
    return;
  }

  if (action === 'safe-walk') {
    setHomeQuickActionStatus('Άνοιγμα Safe Walk...');
    focusSafeWalkSection();
    return;
  }

  if (action === 'contacts') {
    setHomeQuickActionStatus('Άνοιγμα επαφών...');
    focusContactForm();
  }
}

function getHealthChecks() {
  const hasSignedInAccount = Boolean(currentUser);
  const hasProfile = hasRequiredProfileDetails();
  const hasContacts = contacts.length > 0;
  const hasLocation = Boolean(currentLocation);
  const hasActiveSignedInTracking = Boolean(currentUser && activeSosSession?.status === 'active' && activeSosSession.shareToken);
  const canCreateSignedInTracking = Boolean(currentUser);
  const checkInFeatureReady = Boolean(checkInStartButton && checkInActivePanel && typeof startCheckIn === 'function');
  const safeWalkFeatureReady = Boolean(safeWalkStartButton && safeWalkActivePanel && typeof startSafeWalk === 'function');

  return [
    {
      id: 'account',
      label: 'Λογαριασμός',
      status: hasSignedInAccount ? 'OK' : 'Προσοχή',
      explanation: hasSignedInAccount
        ? 'Υπάρχει ενεργή σύνδεση και οι δυνατότητες συγχρονισμού είναι διαθέσιμες.'
        : 'Χωρίς σύνδεση, το SafeMe δουλεύει τοπικά αλλά δεν έχει live tracking link.',
      actionLabel: hasSignedInAccount ? '' : 'Άνοιγμα προφίλ',
      action: 'profile',
      important: true,
    },
    {
      id: 'profile',
      label: 'Προφίλ',
      status: hasProfile ? 'OK' : 'Δεν ολοκληρώθηκε',
      explanation: hasProfile
        ? 'Το όνομα και το τηλέφωνο υπάρχουν στο προφίλ SOS.'
        : 'Συμπλήρωσε όνομα και τηλέφωνο για πιο χρήσιμο μήνυμα SOS.',
      actionLabel: hasProfile ? '' : 'Άνοιγμα προφίλ',
      action: 'profile',
      important: true,
    },
    {
      id: 'contacts',
      label: 'Έμπιστη επαφή',
      status: hasContacts ? 'OK' : 'Δεν ολοκληρώθηκε',
      explanation: hasContacts
        ? `Υπάρχουν ${contacts.length} έμπιστες επαφές διαθέσιμες.`
        : 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή για ειδοποίηση.',
      actionLabel: hasContacts ? '' : 'Άνοιγμα επαφών',
      action: 'contacts',
      important: true,
    },
    {
      id: 'location',
      label: 'Τοποθεσία',
      status: hasLocation ? 'OK' : 'Προσοχή',
      explanation: hasLocation
        ? 'Υπάρχει πρόσφατη τοποθεσία αποθηκευμένη στη συσκευή.'
        : 'Δεν υπάρχει ακόμα τοποθεσία. Κάνε έλεγχο permission/GPS στον browser.',
      actionLabel: hasLocation ? '' : 'Έλεγχος τοποθεσίας',
      action: 'location',
      important: true,
    },
    {
      id: 'live-tracking',
      label: 'Live tracking',
      status: hasActiveSignedInTracking ? 'OK' : (canCreateSignedInTracking ? 'Προσοχή' : 'Δεν ολοκληρώθηκε'),
      explanation: hasActiveSignedInTracking
        ? 'Υπάρχει ενεργό signed-in SOS με share token για δημόσιο tracking link.'
        : (canCreateSignedInTracking
          ? 'Το live tracking απαιτεί signed-in ενεργό SOS. Η εφαρμογή μπορεί να δημιουργήσει share token όταν ξεκινήσει SOS.'
          : 'Το live tracking απαιτεί σύνδεση και ενεργό SOS. Χωρίς σύνδεση το SOS μένει τοπικό.'),
      actionLabel: hasActiveSignedInTracking ? '' : 'Δοκιμή SOS',
      action: 'test-sos',
      important: false,
    },
    {
      id: 'test-sos',
      label: 'Δοκιμαστικό SOS',
      status: hasCompletedTestSos ? 'OK' : 'Δεν ολοκληρώθηκε',
      explanation: hasCompletedTestSos
        ? 'Έχει ολοκληρωθεί δοκιμαστικό SOS σε αυτή τη συσκευή.'
        : 'Ενεργοποίησε λειτουργία δοκιμής και ετοίμασε ένα SOS χωρίς πραγματική ανάγκη.',
      actionLabel: hasCompletedTestSos ? '' : 'Δοκιμή SOS',
      action: 'test-sos',
      important: true,
    },
    {
      id: 'checkin',
      label: 'Check-in Timer',
      status: checkInFeatureReady ? 'OK' : 'Προσοχή',
      explanation: checkInFeatureReady
        ? 'Η λειτουργία Check-in υπάρχει και είναι έτοιμη για δοκιμή από τα Εργαλεία Ασφάλειας.'
        : 'Δεν εντοπίστηκαν όλα τα στοιχεία του Check-in Timer στη σελίδα.',
      actionLabel: 'Δοκιμή Check-in',
      action: 'checkin',
      important: true,
    },
    {
      id: 'safe-walk',
      label: 'Safe Walk',
      status: safeWalkFeatureReady ? 'OK' : 'Προσοχή',
      explanation: safeWalkFeatureReady
        ? 'Η λειτουργία Safe Walk υπάρχει και είναι έτοιμη για δοκιμή από τα Εργαλεία Ασφάλειας.'
        : 'Δεν εντοπίστηκαν όλα τα στοιχεία του Safe Walk στη σελίδα.',
      actionLabel: 'Δοκιμή Safe Walk',
      action: 'safe-walk',
      important: true,
    },
  ];
}

function renderHealthPage() {
  if (!healthChecklist) return;

  const checks = getHealthChecks();
  healthChecklist.innerHTML = checks.map((check) => `
    <article class="health-card health-card-${check.status === 'OK' ? 'ok' : check.status === 'Προσοχή' ? 'warning' : 'incomplete'}">
      <div class="health-card-header">
        <h3>${escapeHtml(check.label)}</h3>
        <span class="health-status">${escapeHtml(check.status)}</span>
      </div>
      <p>${escapeHtml(check.explanation)}</p>
      ${check.actionLabel ? `<button class="ghost-button health-card-action" type="button" data-health-action="${escapeHtml(check.action)}">${escapeHtml(check.actionLabel)}</button>` : ''}
    </article>
  `).join('');

  const importantReady = checks.filter((check) => check.important).every((check) => check.status === 'OK');
  healthSummaryTitle.textContent = importantReady
    ? 'Το SafeMe είναι έτοιμο για beta δοκιμή.'
    : 'Υπάρχουν ακόμα σημεία που χρειάζονται έλεγχο.';
}

function handleHealthAction(action) {
  if (action === 'profile') focusProfileForm();
  if (action === 'contacts') focusContactForm();
  if (action === 'location') refreshLocation();
  if (action === 'test-sos') {
    isSosTestMode = true;
    saveJson(storageKeys.sosTestMode, true);
    syncSosTestModeToggle();
    focusSosButton();
  }
  if (action === 'checkin') focusCheckInSection();
  if (action === 'safe-walk') focusSafeWalkSection();
}

function buildHealthReport() {
  const statusById = Object.fromEntries(getHealthChecks().map((check) => [check.id, check.status]));

  return [
    'SafeMe αναφορά ελέγχου',
    `Ημερομηνία/ώρα: ${new Intl.DateTimeFormat('el-GR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`,
    `Λογαριασμός: ${statusById.account}`,
    `Προφίλ: ${statusById.profile}`,
    `Επαφές: ${statusById.contacts}`,
    `Τοποθεσία: ${statusById.location}`,
    `Live tracking: ${statusById['live-tracking']}`,
    `Δοκιμαστικό SOS: ${statusById['test-sos']}`,
    `Check-in: ${statusById.checkin}`,
    `Safe Walk: ${statusById['safe-walk']}`,
  ].join('\n');
}

async function copyHealthReport() {
  try {
    await copyTextToClipboard(buildHealthReport());
    healthReportStatus.textContent = 'Η αναφορά ελέγχου αντιγράφηκε.';
    healthReportStatus.classList.remove('error');
  } catch {
    healthReportStatus.textContent = 'Δεν μπόρεσα να αντιγράψω την αναφορά. Δοκίμασε ξανά.';
    healthReportStatus.classList.add('error');
  }
}

function markTestSosCompleted() {
  if (!isSosTestMode || hasCompletedTestSos) return;

  hasCompletedTestSos = true;
  saveJson(storageKeys.testSosCompleted, true);
  renderSetupChecklist();
  renderHealthPage();
}

function getSetupChecklistItems() {
  return [
    {
      id: 'profile',
      label: '1. Προφίλ: όνομα και τηλέφωνο',
      completed: hasRequiredProfileDetails(),
      buttonLabel: hasRequiredProfileDetails() ? 'Επεξεργασία' : 'Συμπλήρωση',
      action: 'profile',
    },
    {
      id: 'contacts',
      label: '2. Έμπιστη επαφή για SOS',
      completed: contacts.length > 0,
      buttonLabel: contacts.length > 0 ? 'Διαχείριση' : 'Προσθήκη',
      action: 'contacts',
    },
    {
      id: 'location',
      label: '3. Άδεια τοποθεσίας browser',
      completed: Boolean(currentLocation),
      buttonLabel: 'Άδεια τοποθεσίας',
      action: 'location',
    },
    {
      id: 'test-sos',
      label: '4. Δοκιμαστικό SOS σε test mode',
      completed: hasCompletedTestSos,
      buttonLabel: 'Δοκιμή SOS',
      action: 'test-sos',
    },
  ];
}

function renderSetupChecklist() {
  if (!setupChecklist) return;

  const items = getSetupChecklistItems();
  const completedCount = items.filter((item) => item.completed).length;
  const allCompleted = completedCount === items.length;
  const shouldShowCompact = allCompleted && isSetupChecklistCollapsed;

  setupChecklist.classList.toggle('complete', allCompleted);
  setupChecklist.classList.toggle('compact', shouldShowCompact);

  if (shouldShowCompact) {
    setupChecklist.innerHTML = `
      <div class="setup-checklist-compact-content">
        <div>
          <p class="eyebrow">SafeMe readiness</p>
          <h3 id="setup-checklist-title">Το SafeMe είναι έτοιμο</h3>
          <p>Έχεις ολοκληρώσει τα βασικά βήματα ασφάλειας.</p>
        </div>
        <span class="setup-checklist-progress" aria-live="polite">4/4</span>
      </div>
      <button class="setup-checklist-toggle" type="button" data-setup-toggle="expand">Προβολή βημάτων</button>
    `;
    return;
  }

  setupChecklist.innerHTML = `
    <div class="setup-checklist-header">
      <div>
        <p class="eyebrow">SafeMe readiness</p>
        <h3 id="setup-checklist-title">Πρώτα βήματα ασφάλειας</h3>
        <p>Για χρήση SOS ολοκλήρωσε πρώτα τα βήματα με τη σειρά. Μπορείς πάντα να επεξεργαστείς επαφές και προφίλ.</p>
      </div>
      <div class="setup-checklist-header-actions">
        <span class="setup-checklist-progress" aria-live="polite">${completedCount}/${items.length}</span>
        ${allCompleted ? '<button class="setup-checklist-hide" type="button" data-setup-toggle="collapse">Απόκρυψη</button>' : ''}
      </div>
    </div>
    <ul class="setup-checklist-items" aria-live="polite">
      ${items.map((item) => `
        <li class="setup-checklist-item ${item.completed ? 'completed' : 'pending'}">
          <span class="setup-checklist-state" aria-hidden="true">${item.completed ? '✓' : '○'}</span>
          <span class="setup-checklist-label">${escapeHtml(item.label)}</span>
          <button class="setup-checklist-action" type="button" data-setup-action="${item.action}">${escapeHtml(item.buttonLabel)}</button>
        </li>
      `).join('')}
    </ul>
    <p class="setup-checklist-summary">${allCompleted ? 'Το SafeMe είναι έτοιμο για χρήση.' : 'Το SOS ξεκλειδώνει όταν ολοκληρωθούν όλα τα βήματα.'}</p>
  `;
}

function handleSetupChecklistAction(event) {
  const toggleButton = event.target.closest('[data-setup-toggle]');

  if (toggleButton) {
    isSetupChecklistCollapsed = toggleButton.dataset.setupToggle === 'collapse';
    saveJson(storageKeys.setupChecklistCollapsed, isSetupChecklistCollapsed);
    renderSetupChecklist();
    return;
  }

  const button = event.target.closest('[data-setup-action]');
  if (!button) return;

  const action = button.dataset.setupAction;
  if (action === 'profile') {
    focusProfileForm();
    return;
  }

  if (action === 'contacts') {
    focusContactForm();
    return;
  }

  if (action === 'location') {
    refreshLocation();
    return;
  }

  if (action === 'test-sos') {
    isSosTestMode = true;
    saveJson(storageKeys.sosTestMode, true);
    syncSosTestModeToggle();
    focusSosButton();
  }
}

function handleOnlineStatusClick() {
  showPage('safety-tools');
  showLocationMessage('Η εφαρμογή είναι online. Για συγχρονισμό λογαριασμού, συνδέσου από το Προφίλ.');
  focusElementAfterScroll(currentLocationCard || locationText);
}

function getLocationUrl(location) {
  return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
}

function formatLocation(location) {
  return `Πλάτος ${location.latitude.toFixed(5)}, μήκος ${location.longitude.toFixed(5)}`;
}

function setLocationButtonsLoading(isLoading) {
  if (refreshLocationButton) {
    refreshLocationButton.disabled = isLoading;
    refreshLocationButton.textContent = isLoading ? 'Εντοπισμός...' : 'Ανανέωση';
  }
  if (shareLocationButton) shareLocationButton.disabled = isLoading;
}

function setSosConfirmLoading(isLoading) {
  if (!sosButton) return;
  sosButton.disabled = isLoading;
  const sosButtonHint = sosButton.querySelector('small');
  if (sosButtonHint) sosButtonHint.textContent = isLoading ? 'Ετοιμάζω...' : 'Πατήστε';
}

function showLocationMessage(message) {
  if (locationText) locationText.textContent = message;
}

function renderLocation() {
  if (!currentLocation) {
    showLocationMessage('Πάτησε ανανέωση για να βρεθεί η θέση σου.');
    renderHomeReadinessCards();
    return;
  }

  const accuracyText = currentLocation.accuracy ? ` • ακρίβεια περίπου ${Math.round(currentLocation.accuracy)}μ.` : '';
  showLocationMessage(`${formatLocation(currentLocation)}${accuracyText}`);
  renderHomeReadinessCards();
}

function getGeolocationErrorMessage(error) {
  if (error?.code === 1) return 'Δεν δόθηκε άδεια τοποθεσίας. Ενεργοποίησε Location permission για τον browser.';
  if (error?.code === 2) return 'Δεν μπόρεσα να βρω τη θέση. Δοκίμασε ξανά σε λίγα δευτερόλεπτα.';
  if (error?.code === 3) return 'Άργησε πολύ ο εντοπισμός. Δοκίμασε ξανά.';
  return 'Η τοποθεσία δεν είναι διαθέσιμη σε αυτή τη συσκευή.';
}

function getActiveSosGeolocationErrorMessage(error) {
  if (error?.code === 1) {
    return 'Η πρόσβαση στην τοποθεσία είναι μπλοκαρισμένη. Πάτα το λουκετάκι δίπλα από το URL και επίτρεψε Location.';
  }

  return getGeolocationErrorMessage(error);
}

function formatDiagnosticDateTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function setActiveSosDiagnosticState(updates = {}) {
  activeSosDiagnostics = { ...activeSosDiagnostics, ...updates };
  renderActiveSosDiagnostics();
}

function renderActiveSosDiagnostics() {
  if (!activeSosSection || !activeSosPermissionStatus) return;

  activeSosPermissionStatus.textContent = activeSosDiagnostics.permissionStatus || 'Άγνωστο';
  activeSosLastGpsUpdate.textContent = formatDiagnosticDateTime(activeSosDiagnostics.lastGpsUpdateAt);
  activeSosDebugLastSync.textContent = formatDiagnosticDateTime(activeSosDiagnostics.lastSupabaseSyncAt);
  activeSosSyncResult.textContent = activeSosDiagnostics.lastSupabaseSyncResult || '—';
  activeSosLastError.textContent = activeSosDiagnostics.lastErrorMessage || '—';
}

function getPermissionStatusLabel(status) {
  if (status === 'granted') return 'Επιτρέπεται';
  if (status === 'denied') return 'Μπλοκαρισμένη';
  if (status === 'prompt') return 'Θα ζητηθεί άδεια';
  return 'Άγνωστο';
}

async function refreshLocationPermissionStatus() {
  if (!navigator.permissions?.query) {
    setActiveSosDiagnosticState({ permissionStatus: 'Άγνωστο (δεν υποστηρίζεται από τον browser)' });
    return;
  }

  try {
    locationPermissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    setActiveSosDiagnosticState({ permissionStatus: getPermissionStatusLabel(locationPermissionStatus.state) });
    locationPermissionStatus.onchange = () => {
      setActiveSosDiagnosticState({ permissionStatus: getPermissionStatusLabel(locationPermissionStatus.state) });
    };
  } catch {
    setActiveSosDiagnosticState({ permissionStatus: 'Άγνωστο' });
  }
}

function updateCurrentLocationFromPosition(position) {
  const now = new Date().toISOString();
  currentLocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    updatedAt: now,
  };
  saveJson(storageKeys.location, currentLocation);
  setActiveSosDiagnosticState({
    lastGpsUpdateAt: now,
    permissionStatus: 'Επιτρέπεται',
    lastErrorMessage: '',
  });
  renderLocation();
  renderSafeWalk();
  renderSetupChecklist();
  renderHealthPage();
  return currentLocation;
}

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000,
    });
  });
}

async function refreshLocation() {
  hasRequestedLocationPermission = true;
  saveJson(storageKeys.locationPermissionRequested, true);
  setLocationButtonsLoading(true);
  showLocationMessage('Ψάχνω την τρέχουσα θέση σου...');

  try {
    const position = await requestCurrentPosition();
    updateCurrentLocationFromPosition(position);
  } catch (error) {
    showLocationMessage(getGeolocationErrorMessage(error));
  } finally {
    setLocationButtonsLoading(false);
    renderSetupChecklist();
    renderHealthPage();
  }
}

async function refreshLocationFromSettings() {
  if (settingsStatus) {
    settingsStatus.textContent = 'Γίνεται έλεγχος τοποθεσίας...';
    settingsStatus.classList.remove('error');
  }

  await refreshLocation();

  if (!settingsStatus) return;

  if (currentLocation) {
    settingsStatus.textContent = 'Η τοποθεσία ενημερώθηκε επιτυχώς.';
    settingsStatus.classList.remove('error');
    return;
  }

  settingsStatus.textContent = 'Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα. Έλεγξε τα δικαιώματα του browser.';
  settingsStatus.classList.add('error');
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
}

async function shareLocation() {
  if (!currentLocation) {
    await refreshLocation();
  }

  if (!currentLocation) return;

  const locationUrl = getLocationUrl(currentLocation);
  const shareText = `Η τρέχουσα θέση μου: ${locationUrl}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'SafeMe τοποθεσία',
        text: 'Η τρέχουσα θέση μου από το SafeMe.',
        url: locationUrl,
      });
      showLocationMessage(`${formatLocation(currentLocation)} • Η τοποθεσία είναι έτοιμη για κοινοποίηση.`);
      return;
    }

    await copyTextToClipboard(shareText);
    showLocationMessage(`${formatLocation(currentLocation)} • Ο σύνδεσμος αντιγράφηκε.`);
  } catch (error) {
    if (error?.name !== 'AbortError') {
      try {
        await copyTextToClipboard(shareText);
        showLocationMessage(`${formatLocation(currentLocation)} • Ο σύνδεσμος αντιγράφηκε.`);
      } catch {
        showLocationMessage('Δεν μπόρεσα να μοιραστώ τη θέση. Δοκίμασε ξανά.');
      }
    }
  }
}

function getPrimaryContact() {
  return contacts.find((contact) => contact.tone === 'primary') || contacts[0] || null;
}

const trustedContactInviteMessage = [
  'Σε έχω προσθέσει ως έμπιστη επαφή στο SafeMe.',
  'Αν λάβεις SOS από εμένα, άνοιξε το link τοποθεσίας και προσπάθησε να επικοινωνήσεις μαζί μου.',
  'Αν πιστεύεις ότι υπάρχει άμεσος κίνδυνος, κάλεσε τις υπηρεσίες έκτακτης ανάγκης στο 112 ή 199.',
].join('\n');

function getSosMessageIntro() {
  return isSosTestMode
    ? 'ΔΟΚΙΜΗ SOS - Δεν πρόκειται για πραγματική ανάγκη.'
    : 'Χρειάζομαι βοήθεια. Αυτή είναι η τοποθεσία μου:';
}

function getSosTrackingUrl(shareToken) {
  if (!shareToken) return '';

  const url = new URL(SOS_TRACKING_BASE_URL);
  url.searchParams.set('track', shareToken);
  return url.toString();
}

function buildSosMessage(location = currentLocation, shareToken = activeSosSession?.shareToken) {
  const locationText = location
    ? getLocationUrl(location)
    : 'Δεν μπόρεσα να πάρω τοποθεσία από τη συσκευή μου.';
  const trackingUrl = getSosTrackingUrl(shareToken);
  const trackingText = trackingUrl || 'Δεν είναι διαθέσιμο χωρίς σύνδεση στο SafeMe.';
  const sentAt = new Intl.DateTimeFormat('el-GR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  const lines = [];
  if (isSosTestMode) lines.push('Λειτουργία δοκιμής SOS - Δεν πρόκειται για πραγματική ανάγκη.', '');
  lines.push(`${getSosMessageIntro()} ${trackingUrl || locationText}`);
  if (profile?.name) lines.push(`Όνομα: ${profile.name}`);
  lines.push(`Ώρα: ${sentAt}`);
  lines.push(`Τοποθεσία: ${locationText}`);
  if (trackingUrl) lines.push(`Tracking link: ${trackingText}`);
  return lines.join('\n');
}

function getSmsLink(contact, message) {
  const phone = contact ? normalizePhone(contact.phone) : '';
  return `sms:${phone}?&body=${encodeURIComponent(message)}`;
}

function getWhatsappLink(message, contact = null) {
  const phone = contact ? normalizePhone(contact.phone).replace(/^\+/, '') : '';
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function getEmailLink(contact, message) {
  const email = contact?.email || '';
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('SafeMe SOS')}&body=${encodeURIComponent(message)}`;
}

function mapSosEventFromSupabase(event) {
  return {
    id: event.id,
    message: event.message || '',
    latitude: event.latitude,
    longitude: event.longitude,
    createdAt: event.created_at || event.createdAt || null,
  };
}

function mapSosEventToSupabase(message, location = currentLocation) {
  return {
    user_id: currentUser.id,
    message,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  };
}

async function saveSosEventToSupabase(message, location = currentLocation) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('sos_events')
    .insert(mapSosEventToSupabase(message, location))
    .select('*')
    .single();

  if (error) throw error;

  return mapSosEventFromSupabase(data);
}

function hasSosLocation(session) {
  return session?.latestLatitude !== null && session?.latestLatitude !== undefined
    && session?.latestLongitude !== null && session?.latestLongitude !== undefined;
}

function mapActiveSosSessionFromSupabase(session) {
  if (!session) return null;

  return {
    id: session.id,
    userId: session.user_id,
    sosEventId: session.sos_event_id,
    status: session.status || 'active',
    startedAt: session.started_at || null,
    endedAt: session.ended_at || null,
    latestLatitude: session.latest_latitude,
    latestLongitude: session.latest_longitude,
    latestLocationAt: session.latest_location_at || null,
    shareToken: session.share_token || session.shareToken || null,
    updatedAt: session.updated_at || null,
  };
}

function createShareToken() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  const randomValues = new Uint8Array(24);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues, (value) => value.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createLocalActiveSosSession(location = currentLocation, options = {}) {
  const now = new Date().toISOString();

  isActiveSosSessionRestored = false;
  activeSosSession = {
    id: `local-sos-${Date.now()}`,
    userId: null,
    sosEventId: null,
    status: 'active',
    startedAt: now,
    endedAt: null,
    latestLatitude: location?.latitude ?? null,
    latestLongitude: location?.longitude ?? null,
    latestLocationAt: location ? now : null,
    shareToken: null,
    updatedAt: now,
    testMode: options.testMode === true,
  };

  renderActiveSosSession(options.testMode ? 'Λειτουργία δοκιμής SOS. Το SOS ενεργοποιήθηκε για δοκιμή.' : 'Το SOS ενεργοποιήθηκε. Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.');
  syncActiveSosLocationAutoUpdate();
  return activeSosSession;
}

function mapActiveSosSessionToSupabase(sosEventId, location = currentLocation) {
  const now = new Date().toISOString();
  const hasLocation = Boolean(location);

  return {
    user_id: currentUser.id,
    sos_event_id: sosEventId || null,
    status: 'active',
    started_at: now,
    latest_latitude: hasLocation ? location.latitude : null,
    latest_longitude: hasLocation ? location.longitude : null,
    latest_location_at: hasLocation ? now : null,
    share_token: createShareToken(),
    updated_at: now,
  };
}

async function attachSosEventToActiveSession(sosEventId) {
  if (!currentUser || !activeSosSession || !sosEventId) return;

  const { data, error } = await supabase
    .from('active_sos_sessions')
    .update({ sos_event_id: sosEventId, updated_at: new Date().toISOString() })
    .eq('id', activeSosSession.id)
    .eq('user_id', currentUser.id)
    .select('*')
    .single();

  if (error) throw error;

  const restoredSession = mapActiveSosSessionFromSupabase(data);
  if (!shouldRestoreActiveSosSession(restoredSession)) {
    clearActiveSosRuntimeState({ message: '', endedSession: restoredSession || activeSosSession });
    return;
  }

  activeSosSession = restoredSession;
  renderActiveSosSession();
  syncActiveSosLocationAutoUpdate();
}

function getActiveSosLocationUrl(session) {
  return `https://maps.google.com/?q=${session.latestLatitude},${session.latestLongitude}`;
}

function renderHomeReadinessCards() {
  if (contactsReadinessText) {
    contactsReadinessText.textContent = contacts.length > 0
      ? `${contacts.length} έμπιστες επαφές είναι έτοιμες για SOS ειδοποιήσεις.`
      : 'Πρόσθεσε έμπιστες επαφές για SOS ειδοποιήσεις.';
  }

  if (locationReadinessText) {
    locationReadinessText.textContent = currentLocation
      ? `Η τοποθεσία είναι ενεργή: ${formatLocation(currentLocation)}.`
      : 'Ενεργοποίησε την τοποθεσία για πιο χρήσιμο SOS.';
  }
}

function renderSafetyStatusCard() {
  if (!safetyStatusCard || !safetyStatusTitle || !safetyStatusDescription) return;

  const hasActiveSos = activeSosSession?.status === 'active';
  const hasActiveSafeWalk = activeSafeWalk?.status === 'active';
  const hasActiveCheckIn = activeCheckIn?.status === 'active';
  const status = hasActiveSos ? 'sos' : hasActiveSafeWalk ? 'safe-walk' : hasActiveCheckIn ? 'checkin' : 'normal';
  const copy = {
    normal: {
      icon: '💗',
      title: 'Κατάσταση',
      description: 'Ασφαλής και διαθέσιμη για check-in',
    },
    'safe-walk': {
      icon: '🚶',
      title: 'Safe Walk ενεργό',
      description: 'Το SafeMe παρακολουθεί τη διαδρομή όσο η εφαρμογή είναι ανοιχτή.',
    },
    checkin: {
      icon: '⏱️',
      title: 'Check-in ενεργό',
      description: 'Το SafeMe παρακολουθεί το χρονόμετρο ασφαλείας.',
    },
    sos: {
      icon: '🚨',
      title: 'SOS ενεργό',
      description: 'Η κατάσταση ανάγκης είναι σε εξέλιξη.',
    },
  }[status];

  safetyStatusCard.classList.remove('status-normal', 'status-safe-walk', 'status-checkin', 'status-sos');
  safetyStatusCard.classList.add(`status-${status}`);
  if (safetyStatusIcon) safetyStatusIcon.textContent = copy.icon;
  safetyStatusTitle.textContent = copy.title;
  safetyStatusDescription.textContent = copy.description;
  renderHomeReadinessCards();
}

function renderActiveSosSession(message = '') {
  if (!activeSosSection) return;

  if (!activeSosSession || activeSosSession.status !== 'active') {
    activeSosSection.hidden = true;
    isActiveSosSessionRestored = false;
    sosButton.classList.remove('activated');
    sosButton.setAttribute('aria-pressed', 'false');
    activeSosFeedback.textContent = '';
    if (activeSosLiveStatus) activeSosLiveStatus.hidden = true;
    if (activeSosLastLiveUpdate) activeSosLastLiveUpdate.textContent = '—';
    if (activeSosLatestLocationTime) activeSosLatestLocationTime.textContent = '—';
    if (activeSosLiveUpdateState) activeSosLiveUpdateState.textContent = '—';
    if (activeSosTrackingStatus) activeSosTrackingStatus.textContent = '—';
    activeSosLastAutoUpdateAt = null;
    renderActiveSosDiagnostics();
    renderSafetyStatusCard();
    renderSosContactNotifications();
    return;
  }

  activeSosSection.hidden = false;
  sosButton.classList.add('activated');
  sosButton.setAttribute('aria-pressed', 'true');
  renderActiveSosDiagnostics();
  if (activeSosLiveStatus) activeSosLiveStatus.hidden = false;
  if (activeSosIntro) {
    activeSosIntro.textContent = 'Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.';
  }
  if (activeSosTestModeLabel) {
    activeSosTestModeLabel.hidden = !activeSosSession.testMode;
  }
  if (activeSosTrackingReady) {
    activeSosTrackingReady.textContent = activeSosSession.shareToken
      ? 'Tracking link έτοιμο'
      : 'Tracking link μη διαθέσιμο';
  }
  activeSosStarted.textContent = formatSosEventDate(activeSosSession.startedAt);
  activeSosStatus.textContent = activeSosSession.testMode ? 'Λειτουργία δοκιμής SOS' : activeSosSession.status;
  if (activeSosLatestLocationTime) {
    activeSosLatestLocationTime.textContent = activeSosSession.latestLocationAt
      ? formatSosEventDate(activeSosSession.latestLocationAt)
      : 'Δεν υπάρχει ακόμα';
  }
  if (activeSosLastLiveUpdate) {
    const lastBackendSyncAt = activeSosDiagnostics.lastSupabaseSyncAt || activeSosLastAutoUpdateAt || activeSosSession.latestLocationAt;
    activeSosLastLiveUpdate.textContent = lastBackendSyncAt
      ? formatSosEventDate(lastBackendSyncAt)
      : '—';
  }
  if (activeSosLiveUpdateState) {
    activeSosLiveUpdateState.textContent = shouldAutoUpdateActiveSosLocation()
      ? 'Ενεργή αυτόματη ενημέρωση'
      : 'Ανενεργή αυτόματη ενημέρωση';
  }
  if (activeSosTrackingStatus) {
    if (activeSosSession.shareToken) {
      const trackingUrl = getSosTrackingUrl(activeSosSession.shareToken);
      activeSosTrackingStatus.innerHTML = `<a href="${escapeHtml(trackingUrl)}" target="_blank" rel="noopener">Άνοιγμα public tracking link</a><br><small>${escapeHtml(trackingUrl)}</small>`;
    } else {
      activeSosTrackingStatus.textContent = currentUser
        ? 'Δεν δημιουργήθηκε link. Χρησιμοποίησε SMS/WhatsApp και δοκίμασε live sync.'
        : 'Live tracking: απαιτεί σύνδεση. Το SOS μένει ενεργό τοπικά σε αυτή τη συσκευή.';
    }
  }

  if (hasSosLocation(activeSosSession)) {
    const url = getActiveSosLocationUrl(activeSosSession);
    const updatedText = activeSosSession.latestLocationAt ? ` (${formatSosEventDate(activeSosSession.latestLocationAt)})` : '';
    activeSosLocation.innerHTML = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Άνοιγμα στο Google Maps</a>${escapeHtml(updatedText)}`;
  } else {
    activeSosLocation.textContent = 'Χωρίς τοποθεσία — επίτρεψε Location στον browser ή πάτα «Ανανέωση GPS τώρα». Το SOS παραμένει ενεργό.';
  }

  copyActiveSosTrackingButton.hidden = false;
  if (endActiveSosButton) {
    endActiveSosButton.textContent = isActiveSosSessionRestored ? 'Τερματισμός παλιού SOS' : 'Τερματισμός SOS';
    endActiveSosButton.setAttribute('aria-label', endActiveSosButton.textContent);
  }
  copyActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  copyActiveSosTrackingButton.textContent = activeSosSession.shareToken
    ? 'Αντιγραφή tracking link'
    : 'Συνδέσου για live tracking';
  disableActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  activeSosFeedback.textContent = message || (activeSosSession.testMode
    ? 'Λειτουργία δοκιμής SOS. Δεν πρόκειται για πραγματική ανάγκη.'
    : isActiveSosSessionRestored
    ? 'Υπάρχει ήδη ενεργό SOS από προηγούμενη χρήση. Αν ήταν δοκιμή, πάτησε Τερματισμός SOS.'
    : 'Το SOS είναι ενεργό. Κράτα την εφαρμογή ανοιχτή, αντέγραψε/μοιράσου το tracking link και κάλεσε 112 αν υπάρχει άμεσος κίνδυνος.');
  renderSafetyStatusCard();
  renderSosContactNotifications();
}

function shouldAutoUpdateActiveSosLocation() {
  return Boolean(
    currentUser
      && activeSosSession
      && activeSosSession.status === 'active'
  );
}

function stopActiveSosLocationWatcher() {
  if (activeSosLocationWatcherId === null) return;

  navigator.geolocation.clearWatch(activeSosLocationWatcherId);
  activeSosLocationWatcherId = null;
}

function stopActiveSosLocationAutoUpdate() {
  window.clearInterval(activeSosLocationUpdateTimer);
  activeSosLocationUpdateTimer = null;
  stopActiveSosLocationWatcher();
}

function startActiveSosLocationWatcher() {
  if (activeSosLocationWatcherId !== null || !shouldAutoUpdateActiveSosLocation()) return;

  if (!('geolocation' in navigator)) {
    renderActiveSosSession('Η συσκευή δεν υποστηρίζει live τοποθεσία.');
    return;
  }

  activeSosLocationWatcherId = navigator.geolocation.watchPosition(
    (position) => {
      updateCurrentLocationFromPosition(position);
    },
    (error) => {
      if (!activeSosSession || activeSosSession.status !== 'active') return;
      const message = getActiveSosGeolocationErrorMessage(error);
      setActiveSosDiagnosticState({
        lastErrorMessage: error?.message || message,
        permissionStatus: error?.code === 1 ? 'Μπλοκαρισμένη' : activeSosDiagnostics.permissionStatus,
      });
      renderActiveSosSession(`${message} Η εφαρμογή θα συνεχίσει να προσπαθεί όσο μένει ανοιχτή.`);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 20000,
    },
  );
}

function syncActiveSosLocationAutoUpdate() {
  if (!shouldAutoUpdateActiveSosLocation()) {
    stopActiveSosLocationAutoUpdate();
    return;
  }

  startActiveSosLocationWatcher();

  if (activeSosLocationUpdateTimer) return;

  activeSosLocationUpdateTimer = window.setInterval(() => {
    autoUpdateActiveSosLocation();
  }, 25000);
}

async function autoUpdateActiveSosLocation() {
  if (!shouldAutoUpdateActiveSosLocation() || isAutoUpdatingActiveSosLocation) return;

  isAutoUpdatingActiveSosLocation = true;

  try {
    await updateActiveSosLocation({
      successMessage: '',
      failureMessage: 'Η αυτόματη ενημέρωση τοποθεσίας απέτυχε. Μπορείς να πατήσεις χειροκίνητα ενημέρωση.',
      showLoadingMessage: false,
      updateButtonState: false,
      isAutomaticUpdate: true,
    });
  } finally {
    isAutoUpdatingActiveSosLocation = false;
    syncActiveSosLocationAutoUpdate();
  }
}

async function createActiveSosSession(sosEventId, location = currentLocation) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('active_sos_sessions')
    .insert(mapActiveSosSessionToSupabase(sosEventId, location))
    .select('*')
    .single();

  if (error) throw error;

  activeSosSession = mapActiveSosSessionFromSupabase(data);
  isActiveSosSessionRestored = false;
  renderActiveSosSession('Το ενεργό SOS ξεκίνησε.');
  syncActiveSosLocationAutoUpdate();
  return activeSosSession;
}

async function loadActiveSosSession() {
  if (!currentUser) {
    activeSosSession = null;
    isActiveSosSessionRestored = false;
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    return;
  }

  const { data, error } = await supabase
    .from('active_sos_sessions')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const restoredSession = mapActiveSosSessionFromSupabase(data);
  if (!shouldRestoreActiveSosSession(restoredSession)) {
    clearActiveSosRuntimeState({ message: '', endedSession: restoredSession || activeSosSession });
    return;
  }

  activeSosSession = restoredSession;
  renderActiveSosSession();
  syncActiveSosLocationAutoUpdate();
}

function setActiveSosButtonsLoading(isLoading) {
  testActiveSosLiveSyncButton.disabled = isLoading;
  refreshActiveSosGpsButton.disabled = isLoading;
  updateActiveSosLocationButton.disabled = isLoading;
  endActiveSosButton.disabled = isLoading;
  copyActiveSosTrackingButton.disabled = isLoading || !activeSosSession?.shareToken;
  if (shareActiveSosLocationButton) shareActiveSosLocationButton.disabled = isLoading;
  disableActiveSosTrackingButton.disabled = isLoading || !activeSosSession?.shareToken;
}

async function syncActiveSosLocationToSupabase(location, { successMessage = '', source = 'manual' } = {}) {
  if (!currentUser || !activeSosSession || !location) return false;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('active_sos_sessions')
    .update({
      latest_latitude: location.latitude,
      latest_longitude: location.longitude,
      latest_location_at: now,
      updated_at: now,
    })
    .eq('id', activeSosSession.id)
    .eq('user_id', currentUser.id)
    .select('*')
    .single();

  if (error) {
    setActiveSosDiagnosticState({
      lastSupabaseSyncAt: now,
      lastSupabaseSyncResult: `Σφάλμα (${source})`,
      lastErrorMessage: error.message,
    });
    throw error;
  }

  activeSosSession = mapActiveSosSessionFromSupabase(data);
  activeSosLastAutoUpdateAt = now;
  setActiveSosDiagnosticState({
    lastSupabaseSyncAt: now,
    lastSupabaseSyncResult: `Επιτυχία (${source})`,
    lastErrorMessage: '',
  });
  renderActiveSosSession(successMessage);
  return true;
}

async function updateActiveSosLocation(options = {}) {
  if (!currentUser || !activeSosSession) return;

  const {
    successMessage = 'Η τοποθεσία SOS ενημερώθηκε.',
    failureMessage = null,
    isAutomaticUpdate = false,
    showLoadingMessage = true,
    updateButtonState = true,
  } = options;

  if (updateButtonState) setActiveSosButtonsLoading(true);
  if (showLoadingMessage) renderActiveSosSession('Ενημερώνω την τοποθεσία SOS...');

  try {
    if (!isAutomaticUpdate) {
      const position = await requestCurrentPosition();
      updateCurrentLocationFromPosition(position);
    }

    if (!currentLocation) {
      renderActiveSosSession('Δεν υπάρχει διαθέσιμη τοποθεσία για live ενημέρωση ακόμα.');
      return;
    }

    await syncActiveSosLocationToSupabase(currentLocation, {
      successMessage,
      source: isAutomaticUpdate ? 'auto' : 'manual',
    });
  } catch (error) {
    const message = error?.code ? getActiveSosGeolocationErrorMessage(error) : `Δεν ενημερώθηκε το SOS: ${error.message}`;
    setActiveSosDiagnosticState({
      lastSupabaseSyncResult: error?.code ? activeSosDiagnostics.lastSupabaseSyncResult : 'Σφάλμα',
      lastErrorMessage: error?.message || message,
      permissionStatus: error?.code === 1 ? 'Μπλοκαρισμένη' : activeSosDiagnostics.permissionStatus,
    });
    renderActiveSosSession(failureMessage || message);
  } finally {
    if (updateButtonState) setActiveSosButtonsLoading(false);
    syncActiveSosLocationAutoUpdate();
  }
}

async function testActiveSosLiveSyncNow() {
  if (!currentUser || !activeSosSession) return;

  setActiveSosButtonsLoading(true);
  renderActiveSosSession('Δοκιμάζω live sync στο Supabase...');

  try {
    if (!currentLocation) {
      const position = await requestCurrentPosition();
      updateCurrentLocationFromPosition(position);
    }

    await syncActiveSosLocationToSupabase(currentLocation, {
      successMessage: 'Επιτυχία: το live sync ενημέρωσε το Supabase τώρα.',
      source: 'test',
    });
  } catch (error) {
    const message = error?.code
      ? getActiveSosGeolocationErrorMessage(error)
      : `Σφάλμα Supabase live sync: ${error.message}`;
    setActiveSosDiagnosticState({
      lastErrorMessage: error?.message || message,
      permissionStatus: error?.code === 1 ? 'Μπλοκαρισμένη' : activeSosDiagnostics.permissionStatus,
    });
    renderActiveSosSession(message);
  } finally {
    setActiveSosButtonsLoading(false);
    syncActiveSosLocationAutoUpdate();
  }
}

async function refreshActiveSosGpsNow() {
  if (!activeSosSession) return;

  setActiveSosButtonsLoading(true);
  renderActiveSosSession('Ζητάω νέα θέση GPS από τον browser...');

  try {
    const position = await requestCurrentPosition();
    const location = updateCurrentLocationFromPosition(position);
    renderActiveSosSession(`Ο browser επέστρεψε συντεταγμένες: ${formatLocation(location)}.`);
  } catch (error) {
    const message = getActiveSosGeolocationErrorMessage(error);
    setActiveSosDiagnosticState({
      lastErrorMessage: error?.message || message,
      permissionStatus: error?.code === 1 ? 'Μπλοκαρισμένη' : activeSosDiagnostics.permissionStatus,
    });
    renderActiveSosSession(message);
  } finally {
    setActiveSosButtonsLoading(false);
    syncActiveSosLocationAutoUpdate();
  }
}

async function copyActiveSosTrackingLink() {
  if (!activeSosSession?.shareToken) return;

  const trackingUrl = getSosTrackingUrl(activeSosSession.shareToken);

  try {
    await copyTextToClipboard(trackingUrl);
    renderActiveSosSession('Το tracking link αντιγράφηκε.');
  } catch {
    renderActiveSosSession('Δεν μπόρεσα να αντιγράψω το tracking link. Δοκίμασε ξανά.');
  }
}

async function disableActiveSosTrackingLink() {
  if (!currentUser || !activeSosSession?.shareToken) return;

  const confirmed = window.confirm('Θέλεις σίγουρα να απενεργοποιήσεις το tracking link; Η επαφή δεν θα μπορεί πλέον να βλέπει την τοποθεσία.');
  if (!confirmed) return;

  setActiveSosButtonsLoading(true);

  try {
    const { data, error } = await supabase
      .from('active_sos_sessions')
      .update({ share_token: null, updated_at: new Date().toISOString() })
      .eq('id', activeSosSession.id)
      .eq('user_id', currentUser.id)
      .select('*')
      .single();

    if (error) throw error;

    activeSosSession = mapActiveSosSessionFromSupabase(data);
    renderActiveSosSession('Το tracking link απενεργοποιήθηκε.');
  } catch (error) {
    renderActiveSosSession(`Δεν απενεργοποιήθηκε το tracking link: ${error.message}`);
  } finally {
    setActiveSosButtonsLoading(false);
  }
}

async function endActiveSosSession() {
  if (!activeSosSession) return;

  const confirmed = window.confirm('Θέλεις σίγουρα να τερματίσεις το ενεργό SOS;');
  if (!confirmed) return;

  const endingSession = activeSosSession;
  renderActiveSosSession('Τερματίζω το SOS...');
  markSosSessionEnded(endingSession, 'ending');
  stopActiveSosLocationAutoUpdate();

  if (!currentUser) {
    clearActiveSosRuntimeState({
      message: 'Το SOS τερματίστηκε σε αυτή τη συσκευή. Δεν θα αποκατασταθεί μετά από refresh.',
      endedSession: endingSession,
      status: 'ended',
    });
    return;
  }

  setActiveSosButtonsLoading(true);

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('active_sos_sessions')
      .update({ status: 'ended', ended_at: now, updated_at: now })
      .eq('id', endingSession.id)
      .eq('user_id', currentUser.id)
      .select('*')
      .single();

    if (error) throw error;

    clearActiveSosRuntimeState({
      message: 'Το SOS τερματίστηκε. Το public tracking link δείχνει πλέον τερματισμένο/inactive.',
      endedSession: mapActiveSosSessionFromSupabase(data) || endingSession,
      status: 'ended',
    });
  } catch (error) {
    clearActiveSosRuntimeState({
      message: `Το SOS έκλεισε τοπικά και δεν θα αποκατασταθεί μετά από refresh. Δεν ενημερώθηκε το public tracking link: ${error.message}`,
      endedSession: endingSession,
      status: 'ended',
    });
  } finally {
    setActiveSosButtonsLoading(false);
  }
}


function formatCheckInDateTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatCheckInDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const minuteSecond = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return hours > 0 ? `${hours}:${minuteSecond}` : minuteSecond;
}

function saveActiveCheckIn() {
  if (activeCheckIn?.status === 'active') {
    saveJson(storageKeys.checkIn, activeCheckIn);
    return;
  }

  localStorage.removeItem(storageKeys.checkIn);
}

function setCheckInMessage(message, isError = false) {
  checkInMessage.textContent = message;
  checkInMessage.classList.toggle('error', isError);
}

function renderCheckIn() {
  const isActive = activeCheckIn?.status === 'active';
  checkInActivePanel.hidden = !isActive;
  checkInStartButton.disabled = isActive || checkInExpiryInProgress;
  checkInCustomMinutes.disabled = isActive || checkInExpiryInProgress;
  checkInPresetButtons?.forEach((button) => {
    button.disabled = isActive || checkInExpiryInProgress;
    button.classList.toggle('active', Number(button.dataset.minutes) === selectedCheckInMinutes && !checkInCustomMinutes.value);
  });

  if (!isActive) {
    checkInStatusPill.textContent = checkInExpiryInProgress ? 'ενεργοποίηση SOS' : 'έτοιμο';
    renderSafetyStatusCard();
    return;
  }

  const remainingMs = new Date(activeCheckIn.expiresAt).getTime() - Date.now();
  checkInCountdown.textContent = formatCheckInDuration(remainingMs);
  checkInStartedTime.textContent = formatCheckInDateTime(activeCheckIn.startedAt);
  checkInExpiryTime.textContent = formatCheckInDateTime(activeCheckIn.expiresAt);
  checkInStatusText.textContent = 'active';
  checkInStatusPill.textContent = 'active';
  renderSafetyStatusCard();
}

function stopCheckInTimer() {
  window.clearInterval(checkInTimer);
  checkInTimer = null;
}

function scheduleCheckInTimer() {
  stopCheckInTimer();
  if (activeCheckIn?.status !== 'active') {
    renderCheckIn();
    return;
  }

  const tick = () => {
    if (!activeCheckIn || activeCheckIn.status !== 'active') {
      stopCheckInTimer();
      renderCheckIn();
      return;
    }

    if (Date.now() >= new Date(activeCheckIn.expiresAt).getTime()) {
      stopCheckInTimer();
      expireCheckInWhileOpen();
      return;
    }

    renderCheckIn();
  };

  tick();
  checkInTimer = window.setInterval(tick, 1000);
}

function getSafeWalkValidationMessage() {
  if (activeCheckIn?.status === 'active') return 'Υπάρχει ήδη ενεργό check-in. Τερμάτισέ το πριν ξεκινήσεις Safe Walk.';
  if (!hasRequiredProfileDetails()) return 'Συμπλήρωσε πρώτα το προφίλ σου με όνομα και τηλέφωνο.';
  if (contacts.length === 0) return 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή πριν ξεκινήσεις Safe Walk.';
  if (!currentLocation) return 'Πάτησε πρώτα «Ανανέωση» στην τοποθεσία και επίτρεψε Location στον browser για Safe Walk.';
  return '';
}

function getSelectedSafeWalkMinutes() {
  const customValue = Number(safeWalkCustomMinutes.value);
  if (Number.isFinite(customValue) && customValue >= 1) return Math.min(240, Math.floor(customValue));
  return selectedSafeWalkMinutes;
}

function saveActiveSafeWalk() {
  if (activeSafeWalk?.status === 'active') {
    saveJson(storageKeys.safeWalk, activeSafeWalk);
    return;
  }
  localStorage.removeItem(storageKeys.safeWalk);
}

function setSafeWalkMessage(message, isError = false) {
  safeWalkMessage.textContent = message;
  safeWalkMessage.classList.toggle('error', isError);
}

function renderSafeWalk() {
  const isActive = activeSafeWalk?.status === 'active';
  safeWalkActivePanel.hidden = !isActive;
  safeWalkStartButton.disabled = isActive || safeWalkExpiryInProgress;
  safeWalkDestination.disabled = isActive || safeWalkExpiryInProgress;
  safeWalkCustomMinutes.disabled = isActive || safeWalkExpiryInProgress;
  safeWalkPresetButtons?.forEach((button) => {
    button.disabled = isActive || safeWalkExpiryInProgress;
    button.classList.toggle('active', Number(button.dataset.minutes) === selectedSafeWalkMinutes && !safeWalkCustomMinutes.value);
  });
  if (!isActive) {
    safeWalkStatusPill.textContent = safeWalkExpiryInProgress ? 'failed / SOS' : (lastSafeWalkOutcome?.status || 'έτοιμο');
    safeWalkStatusPill.className = `safe-walk-status-pill ${lastSafeWalkOutcome?.status ? `safe-walk-status-${lastSafeWalkOutcome.status}` : ''}`;
    renderSafetyStatusCard();
    return;
  }
  const remainingMs = new Date(activeSafeWalk.expiresAt).getTime() - Date.now();
  safeWalkCountdown.textContent = formatCheckInDuration(remainingMs);
  safeWalkActiveDestination.textContent = activeSafeWalk.destination || 'Δεν ορίστηκε';
  safeWalkStartedTime.textContent = formatCheckInDateTime(activeSafeWalk.startedAt);
  safeWalkExpectedTime.textContent = formatCheckInDateTime(activeSafeWalk.expiresAt);
  safeWalkStatusText.textContent = 'active / σε εξέλιξη';
  safeWalkLocationTime.textContent = currentLocation?.updatedAt ? formatCheckInDateTime(currentLocation.updatedAt) : 'Δεν υπάρχει ακόμα';
  safeWalkStatusPill.textContent = `${activeSafeWalk.minutes === 1 ? '1-minute test • ' : ''}active`;
  safeWalkStatusPill.className = 'safe-walk-status-pill safe-walk-status-active';
  renderSafetyStatusCard();
}

function stopSafeWalkTimer() { window.clearInterval(safeWalkTimer); safeWalkTimer = null; }

function scheduleSafeWalkTimer() {
  stopSafeWalkTimer();
  if (activeSafeWalk?.status !== 'active') { renderSafeWalk(); return; }
  const tick = () => {
    if (!activeSafeWalk || activeSafeWalk.status !== 'active') { stopSafeWalkTimer(); renderSafeWalk(); return; }
    if (Date.now() >= new Date(activeSafeWalk.expiresAt).getTime()) { stopSafeWalkTimer(); expireSafeWalkWhileOpen(); return; }
    renderSafeWalk();
  };
  tick();
  safeWalkTimer = window.setInterval(tick, 1000);
}

function startSafeWalk() {
  const validationMessage = getSafeWalkValidationMessage();
  if (validationMessage) { setSafeWalkMessage(validationMessage, true); return; }
  const minutes = getSelectedSafeWalkMinutes();
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + minutes * 60 * 1000);
  lastSafeWalkOutcome = null; localStorage.removeItem(storageKeys.safeWalkOutcome);
  activeSafeWalk = { status: 'active', destination: safeWalkDestination.value.trim(), minutes, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString() };
  saveActiveSafeWalk();
  setSafeWalkMessage(minutes === 1 ? 'Ξεκίνησε 1-minute Safe Walk test. Πάτησε «Έφτασα / Είμαι καλά» πριν μηδενίσει για να ολοκληρωθεί.' : 'Το Safe Walk ξεκίνησε. Επιβεβαίωσε ότι έφτασες/είσαι καλά πριν λήξει.');
  scheduleSafeWalkTimer();
}

function completeSafeWalkSafely() {
  lastSafeWalkOutcome = { status: 'completed', at: new Date().toISOString() }; saveJson(storageKeys.safeWalkOutcome, lastSafeWalkOutcome);
  activeSafeWalk = null; saveActiveSafeWalk(); stopSafeWalkTimer(); renderSafeWalk();
  setSafeWalkMessage('Το Safe Walk ολοκληρώθηκε. Είσαι ασφαλής.');
}

function cancelSafeWalk() {
  lastSafeWalkOutcome = { status: 'cancelled', at: new Date().toISOString() }; saveJson(storageKeys.safeWalkOutcome, lastSafeWalkOutcome);
  activeSafeWalk = null; saveActiveSafeWalk(); stopSafeWalkTimer(); renderSafeWalk();
  setSafeWalkMessage('Το Safe Walk ακυρώθηκε.');
}

async function refreshSafeWalkLocation() {
  setSafeWalkMessage('Ανανεώνω την τοποθεσία Safe Walk...');
  await refreshLocation();
  renderSafeWalk();
  setSafeWalkMessage(currentLocation ? 'Η τοποθεσία Safe Walk ενημερώθηκε.' : 'Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα.', !currentLocation);
}

function restoreSafeWalkOnLoad() {
  if (activeSafeWalk?.status !== 'active') { activeSafeWalk = null; saveActiveSafeWalk(); renderSafeWalk(); return; }
  if (Date.now() >= new Date(activeSafeWalk.expiresAt).getTime()) {
    activeSafeWalk = null; saveActiveSafeWalk(); renderSafeWalk();
    setSafeWalkMessage('Το Safe Walk έληξε όσο η εφαρμογή δεν ήταν ενεργή. Πάτησε SOS αν χρειάζεσαι βοήθεια.', true);
    return;
  }
  safeWalkDestination.value = activeSafeWalk.destination || '';
  setSafeWalkMessage('Το ενεργό Safe Walk αποκαταστάθηκε σε αυτή τη συσκευή.');
  scheduleSafeWalkTimer();
}

async function expireSafeWalkWhileOpen() {
  if (safeWalkExpiryInProgress) return;
  safeWalkExpiryInProgress = true;
  const expiredWalk = activeSafeWalk;
  lastSafeWalkOutcome = { status: 'failed', at: new Date().toISOString() }; saveJson(storageKeys.safeWalkOutcome, lastSafeWalkOutcome);
  activeSafeWalk = null; saveActiveSafeWalk(); renderSafeWalk();
  setSafeWalkMessage('Το Safe Walk έληξε και ενεργοποιήθηκε SOS.');
  sosStatus.textContent = 'Το Safe Walk έληξε και ενεργοποιήθηκε SOS.';
  try {
    if (!currentLocation) { hasRequestedLocationPermission = true; saveJson(storageKeys.locationPermissionRequested, true); updateCurrentLocationFromPosition(await requestCurrentPosition()); }
  } catch (error) { showLocationMessage(getGeolocationErrorMessage(error)); }
  const contact = getPrimaryContact();
  let historyMessage = 'Το Safe Walk έληξε και ενεργοποιήθηκε SOS.';
  try {
    if (currentUser) {
      if (activeSosSession?.status === 'active') { if (currentLocation) await syncActiveSosLocationToSupabase(currentLocation, { successMessage: '', source: 'safe-walk' }); }
      else { await createActiveSosSession(null, currentLocation); }
    } else { createLocalActiveSosSession(currentLocation); }
  } catch (error) { historyMessage = `${historyMessage} Δεν ενημερώθηκε το active_sos_sessions: ${error.message}`; }
  const safeWalkNote = `Το Safe Walk έληξε χωρίς επιβεβαίωση.${expiredWalk?.destination ? ` Προορισμός: ${expiredWalk.destination}.` : ''}`;
  const message = `${buildSosMessage(currentLocation, activeSosSession?.shareToken)}\n\n${safeWalkNote}`;
  sosButton.classList.add('activated'); sosButton.setAttribute('aria-pressed', 'true');
  if (currentUser) {
    try { const savedEvent = await saveSosEventToSupabase(message, currentLocation); if (savedEvent) { sosHistoryEvents = [savedEvent, ...sosHistoryEvents].slice(0, 5); sosHistoryStatus = ''; renderSosHistory(); await attachSosEventToActiveSession(savedEvent.id); } }
    catch { historyMessage = `${historyMessage} Το SOS δεν αποθηκεύτηκε στο ιστορικό.`; }
  }
  resetSosModal(); sosModal.hidden = false; document.body.classList.add('modal-open');
  showSosActionPanel(message, contact, `${historyMessage} Δεν στάλθηκε αυτόματα SMS ή WhatsApp — διάλεξε παρακάτω χειροκίνητη αποστολή.`);
  showPage('home'); activeSosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  safeWalkExpiryInProgress = false; renderSafeWalk();
}

function getCheckInValidationMessage() {
  if (activeSafeWalk?.status === 'active') return 'Υπάρχει ήδη ενεργό Safe Walk. Τερμάτισέ το πριν ξεκινήσεις check-in.';
  if (!hasRequiredProfileDetails()) return 'Συμπλήρωσε πρώτα το προφίλ σου με όνομα και τηλέφωνο.';
  if (contacts.length === 0) return 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή πριν ξεκινήσεις check-in.';
  if (!currentLocation) return 'Πάτησε πρώτα «Ανανέωση» στην τοποθεσία και επίτρεψε Location στον browser για check-in.';
  return '';
}

function getSelectedCheckInMinutes() {
  const customValue = Number(checkInCustomMinutes.value);
  if (Number.isFinite(customValue) && customValue >= 1) return Math.min(240, Math.floor(customValue));
  return selectedCheckInMinutes;
}

function startCheckIn() {
  const validationMessage = getCheckInValidationMessage();
  if (validationMessage) {
    setCheckInMessage(validationMessage, true);
    return;
  }

  const minutes = getSelectedCheckInMinutes();
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + minutes * 60 * 1000);
  activeCheckIn = {
    status: 'active',
    minutes,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  saveActiveCheckIn();
  setCheckInMessage('Το check-in ξεκίνησε. Πάτησε «Είμαι καλά» πριν λήξει.');
  scheduleCheckInTimer();
}

function completeCheckInSafely() {
  activeCheckIn = null;
  saveActiveCheckIn();
  stopCheckInTimer();
  renderCheckIn();
  setCheckInMessage('Το check-in ολοκληρώθηκε. Είσαι ασφαλής.');
}

function cancelCheckIn() {
  activeCheckIn = null;
  saveActiveCheckIn();
  stopCheckInTimer();
  renderCheckIn();
  setCheckInMessage('Το check-in ακυρώθηκε.');
}

function restoreCheckInOnLoad() {
  if (activeCheckIn?.status !== 'active') {
    activeCheckIn = null;
    saveActiveCheckIn();
    renderCheckIn();
    return;
  }

  if (Date.now() >= new Date(activeCheckIn.expiresAt).getTime()) {
    activeCheckIn = null;
    saveActiveCheckIn();
    renderCheckIn();
    setCheckInMessage('Το check-in έληξε όσο η εφαρμογή δεν ήταν ενεργή. Πάτησε SOS αν χρειάζεσαι βοήθεια.', true);
    return;
  }

  setCheckInMessage('Το ενεργό check-in αποκαταστάθηκε σε αυτή τη συσκευή.');
  scheduleCheckInTimer();
}

async function expireCheckInWhileOpen() {
  if (checkInExpiryInProgress) return;
  checkInExpiryInProgress = true;
  activeCheckIn = null;
  saveActiveCheckIn();
  renderCheckIn();
  setCheckInMessage('Το check-in έληξε και ενεργοποιήθηκε SOS.');
  sosStatus.textContent = 'Το check-in έληξε και ενεργοποιήθηκε SOS.';

  try {
    if (!currentLocation) {
      hasRequestedLocationPermission = true;
      saveJson(storageKeys.locationPermissionRequested, true);
      const position = await requestCurrentPosition();
      updateCurrentLocationFromPosition(position);
    }
  } catch (error) {
    showLocationMessage(getGeolocationErrorMessage(error));
  }

  const contact = getPrimaryContact();
  let historyMessage = 'Το check-in έληξε και ενεργοποιήθηκε SOS.';

  try {
    if (currentUser) {
      if (activeSosSession?.status === 'active') {
        if (currentLocation) await syncActiveSosLocationToSupabase(currentLocation, { successMessage: '', source: 'check-in' });
      } else {
        await createActiveSosSession(null, currentLocation);
      }
    } else {
      const now = new Date().toISOString();
      isActiveSosSessionRestored = false;
      activeSosSession = {
        id: `local-checkin-${Date.now()}`,
        userId: null,
        sosEventId: null,
        status: 'active',
        startedAt: now,
        endedAt: null,
        latestLatitude: currentLocation?.latitude ?? null,
        latestLongitude: currentLocation?.longitude ?? null,
        latestLocationAt: currentLocation ? now : null,
        shareToken: null,
        updatedAt: now,
      };
      renderActiveSosSession('Το check-in έληξε και ενεργοποιήθηκε SOS τοπικά. Συνδέσου για live tracking link.');
    }
  } catch (error) {
    historyMessage = `${historyMessage} Δεν ενημερώθηκε το active_sos_sessions: ${error.message}`;
  }

  const message = buildSosMessage(currentLocation, activeSosSession?.shareToken);
  sosButton.classList.add('activated');
  sosButton.setAttribute('aria-pressed', 'true');

  if (currentUser) {
    try {
      const savedEvent = await saveSosEventToSupabase(message, currentLocation);
      if (savedEvent) {
        sosHistoryEvents = [savedEvent, ...sosHistoryEvents].slice(0, 5);
        sosHistoryStatus = '';
        renderSosHistory();
        await attachSosEventToActiveSession(savedEvent.id);
      }
    } catch (error) {
      historyMessage = `${historyMessage} Το SOS δεν αποθηκεύτηκε στο ιστορικό.`;
    }
  }

  resetSosModal();
  sosModal.hidden = false;
  document.body.classList.add('modal-open');
  showSosActionPanel(message, contact, `${historyMessage} Δεν στάλθηκε αυτόματα SMS ή WhatsApp — διάλεξε παρακάτω χειροκίνητη αποστολή.`);
  showPage('home');
  activeSosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  checkInExpiryInProgress = false;
  renderCheckIn();
}

function formatSosEventDate(value) {
  if (!value) return 'Άγνωστη ώρα';

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatSosEventTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getMessagePreview(message) {
  return message.length > 92 ? `${message.slice(0, 92).trim()}…` : message;
}

function renderSosHistory() {
  if (!sosHistoryList) return;

  if (!currentUser) {
    sosHistoryList.innerHTML = `
      <article class="empty-state compact-empty">
        <div class="empty-icon" aria-hidden="true">🕘</div>
        <h3>Συνδέσου για ιστορικό SOS</h3>
        <p>Χωρίς σύνδεση, το SOS λειτουργεί τοπικά και δεν αποθηκεύεται στο ιστορικό.</p>
      </article>
    `;
    return;
  }

  if (sosHistoryStatus) {
    sosHistoryList.innerHTML = `<p class="save-status error">${escapeHtml(sosHistoryStatus)}</p>`;
    return;
  }

  if (sosHistoryEvents.length === 0) {
    sosHistoryList.innerHTML = `
      <article class="empty-state compact-empty">
        <div class="empty-icon" aria-hidden="true">🆘</div>
        <h3>Δεν υπάρχει ιστορικό SOS</h3>
        <p>Τα νέα SOS που επιβεβαιώνεις θα εμφανίζονται εδώ.</p>
      </article>
    `;
    return;
  }

  sosHistoryList.innerHTML = sosHistoryEvents
    .map((event) => {
      const hasLocation = event.latitude !== null && event.latitude !== undefined && event.longitude !== null && event.longitude !== undefined;
      const locationUrl = hasLocation ? getLocationUrl(event) : '';

      return `
        <article class="sos-history-item">
          <time datetime="${escapeHtml(event.createdAt || '')}">${escapeHtml(formatSosEventDate(event.createdAt))}</time>
          <p>${escapeHtml(getMessagePreview(event.message))}</p>
          ${hasLocation ? `<a href="${escapeHtml(locationUrl)}" target="_blank" rel="noopener">Άνοιγμα τοποθεσίας</a>` : '<span>Χωρίς τοποθεσία</span>'}
        </article>
      `;
    })
    .join('');
}

async function loadSosHistory() {
  sosHistoryStatus = '';

  if (!currentUser) {
    sosHistoryEvents = [];
    renderSosHistory();
    return;
  }

  const { data, error } = await supabase
    .from('sos_events')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;

  sosHistoryEvents = (data || []).map(mapSosEventFromSupabase);
  renderSosHistory();
}

function showSosActionPanel(message, contact, historyMessage = '') {
  preparedSosMessage = message;
  preparedSosContact = contact;
  preparedSosTrackingUrl = getSosTrackingUrl(activeSosSession?.shareToken);
  const shouldPromptLoginForTracking = !currentUser && !preparedSosTrackingUrl;
  sosCopyTrackingButton.hidden = !preparedSosTrackingUrl && !shouldPromptLoginForTracking;
  sosCopyTrackingButton.disabled = !preparedSosTrackingUrl;
  sosCopyTrackingButton.textContent = preparedSosTrackingUrl
    ? 'Αντιγραφή tracking link'
    : 'Συνδέσου για live tracking';
  if (sosModal) sosModal.hidden = false;
  document.body.classList.add('modal-open');
  sosActionPanel.hidden = false;
  sosMessagePreview.textContent = message;
  sosTestModeLabel.hidden = !isSosTestMode;
  sosSendSmsButton.disabled = isSosTestMode;
  sosSendWhatsappButton.disabled = isSosTestMode;
  sosNativeShareButton.disabled = isSosTestMode;
  const contactMessage = contact
    ? `Κύρια επαφή: ${contact.name} (${formatPhone(contact.phone)})`
    : 'Δεν βρέθηκε κύρια επαφή.';
  const localTrackingNote = !currentUser
    ? 'Το SOS λειτουργεί τοπικά σε αυτή τη συσκευή. Συνδέσου για live tracking link.'
    : '';
  sosActionFeedback.textContent = [historyMessage, localTrackingNote, contactMessage].filter(Boolean).join(' ');
  sosStatus.textContent = isSosTestMode ? 'Λειτουργία δοκιμής SOS. Δεν πρόκειται για πραγματική ανάγκη.' : 'Το SOS ενεργοποιήθηκε. Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.';
  sosActionTitle.focus?.();
}

function resetSosModal() {
  sosActionPanel.hidden = true;
  sosTestModeLabel.hidden = true;
  sosActionFeedback.textContent = '';
  sosMessagePreview.textContent = '';
  preparedSosTrackingUrl = '';
  sosCopyTrackingButton.hidden = true;
  sosCopyTrackingButton.disabled = true;
  sosCopyTrackingButton.textContent = 'Αντιγραφή tracking link';
  sosSendSmsButton.disabled = false;
  sosSendWhatsappButton.disabled = false;
  sosNativeShareButton.disabled = false;
}

function sendPreparedSosSms() {
  if (!preparedSosMessage || !preparedSosContact) return;

  window.location.href = getSmsLink(preparedSosContact, preparedSosMessage);
  sosActionFeedback.textContent = `Άνοιξε έτοιμο SMS προς ${preparedSosContact.name}. Πάτα αποστολή.`;
  sosStatus.textContent = `Άνοιξε έτοιμο SMS προς ${preparedSosContact.name}. Πάτα αποστολή.`;
}

function sendPreparedSosWhatsapp() {
  if (!preparedSosMessage) return;

  window.open(getWhatsappLink(preparedSosMessage), '_blank', 'noopener');
  sosActionFeedback.textContent = 'Άνοιξε WhatsApp με προσυμπληρωμένο μήνυμα SOS.';
  sosStatus.textContent = 'Άνοιξε WhatsApp με προσυμπληρωμένο μήνυμα SOS.';
}

async function copyPreparedSosMessage() {
  if (!preparedSosMessage) return;

  try {
    await copyTextToClipboard(preparedSosMessage);
    sosActionFeedback.textContent = 'Το μήνυμα SOS αντιγράφηκε.';
    sosStatus.textContent = 'Το μήνυμα SOS αντιγράφηκε.';
  } catch {
    sosActionFeedback.textContent = 'Δεν μπόρεσα να αντιγράψω το μήνυμα. Δοκίμασε ξανά.';
    sosStatus.textContent = 'Δεν μπόρεσα να αντιγράψω το μήνυμα. Δοκίμασε ξανά.';
  }
}

async function copyPreparedSosTrackingLink() {
  if (!preparedSosTrackingUrl) return;

  try {
    await copyTextToClipboard(preparedSosTrackingUrl);
    sosActionFeedback.textContent = 'Το tracking link αντιγράφηκε.';
    sosStatus.textContent = 'Το tracking link αντιγράφηκε.';
  } catch {
    sosActionFeedback.textContent = 'Δεν μπόρεσα να αντιγράψω το tracking link. Δοκίμασε ξανά.';
    sosStatus.textContent = 'Δεν μπόρεσα να αντιγράψω το tracking link. Δοκίμασε ξανά.';
  }
}

async function sharePreparedSosMessage() {
  if (!preparedSosMessage) return;

  if (!navigator.share) {
    sosActionFeedback.textContent = 'Η κοινή χρήση δεν υποστηρίζεται σε αυτόν τον browser.';
    sosStatus.textContent = 'Η κοινή χρήση δεν υποστηρίζεται σε αυτόν τον browser.';
    return;
  }

  try {
    await navigator.share({
      title: 'SafeMe SOS',
      text: preparedSosMessage,
    });
    sosActionFeedback.textContent = 'Άνοιξε η κοινή χρήση SOS.';
    sosStatus.textContent = 'Άνοιξε η κοινή χρήση SOS.';
  } catch (error) {
    if (error?.name === 'AbortError') {
      sosActionFeedback.textContent = 'Η κοινή χρήση ακυρώθηκε.';
      sosStatus.textContent = 'Η κοινή χρήση ακυρώθηκε.';
      return;
    }

    sosActionFeedback.textContent = 'Δεν μπόρεσα να ανοίξω την κοινή χρήση.';
    sosStatus.textContent = 'Δεν μπόρεσα να ανοίξω την κοινή χρήση.';
  }
}

function hasRequiredProfileDetails() {
  return Boolean(profile?.name?.trim() && profile?.phone?.trim());
}

function getSosValidationMessage() {
  if (contacts.length === 0) {
    return 'Πρόσθεσε τουλάχιστον μία έμπιστη επαφή πριν χρησιμοποιήσεις το SOS.';
  }

  if (!hasRequiredProfileDetails()) {
    return 'Συμπλήρωσε το όνομα και το τηλέφωνό σου πριν χρησιμοποιήσεις το SOS.';
  }

  return '';
}

async function activateSosFromMainButton() {
  if (sosActivationInProgress) return;
  await confirmSos();
}

function closeSosModal() {
  if (sosModal) sosModal.hidden = true;
  document.body.classList.remove('modal-open');
  sosButton?.focus();
}

async function confirmSos() {
  if (sosActivationInProgress) return;
  sosActivationInProgress = true;

  try {

  setSosConfirmLoading(true);
  sosStatus.textContent = isSosTestMode
    ? 'Λειτουργία δοκιμής SOS. Το SOS ενεργοποιήθηκε για δοκιμή.'
    : 'Το SOS ενεργοποιήθηκε. Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.';

  const contact = getPrimaryContact();
  let historyMessage = '';

  if (isSosTestMode) {
    createLocalActiveSosSession(currentLocation, { testMode: true });
    preparedSosMessage = buildSosMessage(currentLocation, null);
    preparedSosContact = contact;
    preparedSosTrackingUrl = '';
    renderActiveSosSession('Λειτουργία δοκιμής SOS. Το SOS ενεργοποιήθηκε για δοκιμή.');
    showPage('home');
    activeSosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSosConfirmLoading(false);
    sosActivationInProgress = false;
    markTestSosCompleted();
    return;
  }

  createLocalActiveSosSession(currentLocation);
  showPage('home');
  activeSosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    if (!currentLocation) {
      await refreshLocation();
      if (activeSosSession?.status === 'active') {
        activeSosSession.latestLatitude = currentLocation?.latitude ?? activeSosSession.latestLatitude;
        activeSosSession.latestLongitude = currentLocation?.longitude ?? activeSosSession.latestLongitude;
        activeSosSession.latestLocationAt = currentLocation ? new Date().toISOString() : activeSosSession.latestLocationAt;
        renderActiveSosSession('Το SOS ενεργοποιήθηκε. Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.');
      }
    }
  } catch {
    historyMessage = 'Το SOS ενεργοποιήθηκε χωρίς διαθέσιμη τοποθεσία. Μπορείς να πατήσεις «Ενημέρωση τοποθεσίας τώρα».';
  }

  if (currentUser) {
    try {
      await createActiveSosSession(null, currentLocation);
      historyMessage = historyMessage || 'Δημιουργήθηκε ενεργό SOS.';
    } catch (error) {
      historyMessage = historyMessage || 'Το SOS ενεργοποιήθηκε τοπικά σε αυτή τη συσκευή. Δεν δημιουργήθηκε ακόμη live tracking link.';
    }
  } else {
    historyMessage = historyMessage || 'Το SOS ενεργοποιήθηκε σε αυτή τη συσκευή. Συνδέσου για live tracking link.';
  }

  const message = buildSosMessage(currentLocation, activeSosSession?.shareToken);
  preparedSosMessage = message;
  preparedSosContact = contact;
  preparedSosTrackingUrl = getSosTrackingUrl(activeSosSession?.shareToken);

  sosButton.classList.add('activated');
  sosButton.setAttribute('aria-pressed', 'true');
  setSosConfirmLoading(false);

  if (currentUser) {
    let savedEvent = null;

    try {
      savedEvent = await saveSosEventToSupabase(message, currentLocation);
      historyMessage = `${historyMessage || 'Το SOS ετοιμάστηκε.'} Το SOS αποθηκεύτηκε στο ιστορικό.`;
      if (savedEvent) {
        sosHistoryEvents = [savedEvent, ...sosHistoryEvents].slice(0, 5);
        sosHistoryStatus = '';
        renderSosHistory();
        await attachSosEventToActiveSession(savedEvent.id);
      }
    } catch (error) {
      historyMessage = `${historyMessage || 'Το SOS ετοιμάστηκε.'} Το SOS δεν αποθηκεύτηκε στο ιστορικό.`;
    }
  }

  renderActiveSosSession(historyMessage || 'Το SOS ενεργοποιήθηκε. Ετοιμάσαμε μήνυμα βοήθειας με την τοποθεσία σου.');
  markTestSosCompleted();
  } catch (error) {
    console.error('[SafeMe] SOS activation failed', error);
    const message = 'Δεν μπόρεσα να ενεργοποιήσω SOS. Δοκίμασε ξανά.';
    if (sosStatus) sosStatus.textContent = message;
    showGlobalSafetyMessage(message);
  } finally {
    setSosConfirmLoading(false);
    sosActivationInProgress = false;
  }
}

function syncSosTestModeToggle() {
  if (sosTestModeToggle) sosTestModeToggle.checked = isSosTestMode;
}

function handleSosTestModeChange() {
  isSosTestMode = Boolean(sosTestModeToggle?.checked);
  saveJson(storageKeys.sosTestMode, isSosTestMode);

  if (preparedSosMessage) {
    preparedSosMessage = buildSosMessage(currentLocation);
    if (sosMessagePreview) sosMessagePreview.textContent = preparedSosMessage;
    if (sosTestModeLabel) sosTestModeLabel.hidden = !isSosTestMode;
  }
}

function renderContactsFormState() {
  if (clearContactsButton) clearContactsButton.disabled = isContactsMutationInProgress;
  if (!contactsForm) return;

  const fields = contactsForm.querySelectorAll('input, button');
  fields.forEach((field) => {
    field.disabled = isContactsMutationInProgress;
  });
}

function renderContacts() {
  renderContactsFormState();
  if (contacts.length === 0) {
    contactsList.innerHTML = `
      <article class="empty-state">
        <div class="empty-icon" aria-hidden="true">👥</div>
        <h3>Δεν έχεις προσθέσει έμπιστες επαφές</h3>
        <p>Πρόσθεσε το πρώτο άτομο που θέλεις να ειδοποιείται σε ανάγκη.</p>
      </article>
    `;
    contactCount.textContent = '0';
    return;
  }

  contactsList.innerHTML = contacts
    .map((contact, index) => {
      const isPrimary = contact.tone === 'primary';
      const extraClass = isPrimary ? ' primary-contact' : '';
      const phoneForLink = contact.phone.replace(/\s+/g, '');

      return `
        <article class="contact-card${extraClass}">
          <div class="avatar">${escapeHtml(getInitials(contact.name))}</div>
          <div class="contact-info">
            <h3>${escapeHtml(contact.name)}</h3>
            <p>${escapeHtml(contact.relationship)}</p>
            ${contact.email ? `<p>${escapeHtml(contact.email)}</p>` : ''}
            ${isPrimary ? '<span class="primary-contact-badge">Κύρια επαφή SOS</span>' : ''}
          </div>
          <div class="contact-actions">
            ${phoneForLink ? `<a href="tel:${escapeHtml(phoneForLink)}" class="call-link">☎ ${escapeHtml(formatPhone(contact.phone))}</a>` : '<span class="missing-contact-inline">Missing phone</span>'}
            <button class="ghost-button contact-invite-button" type="button" data-contact-index="${index}" ${isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>Ενημέρωση επαφής</button>
            <button class="ghost-button edit-contact-button" type="button" data-contact-index="${index}" ${isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>Επεξεργασία</button>
            <button class="secondary-button primary-contact-button" type="button" data-contact-index="${index}" ${isPrimary || isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>Κύρια επαφή</button>
            <button class="danger-outline-button delete-contact-button" type="button" data-contact-index="${index}" ${isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>Διαγραφή</button>
          </div>
        </article>
      `;
    })
    .join('');

  contactCount.textContent = contacts.length;
}


function createLocalContactId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function updateContacts(nextContacts) {
  contacts = normalizeContactsForStorage(typeof nextContacts === 'function' ? nextContacts(contacts) : nextContacts);
  saveJsonOrThrow(storageKeys.contacts, contacts);
  renderContacts();
  renderSetupChecklist();
  renderHealthPage();
}

function ensurePrimaryContact() {
  contacts = ensureSinglePrimaryContact(contacts);
}

async function deleteContact(index) {
  if (isContactsMutationInProgress) return;

  const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την επαφή;');

  if (!confirmed) return;

  const contactToDelete = contacts[index];
  if (!contactToDelete) return;

  const previousContacts = contacts;
  isContactsMutationInProgress = true;

  try {
    updateContacts((currentContacts) => currentContacts.filter((contact) => contact.id !== contactToDelete.id));
    persistContactsLocally();
    await syncContactsToSupabaseBestEffort('delete');
  } catch (error) {
    console.warn('[SafeMe] Contact delete failed', error);
    updateContacts(previousContacts);
    window.alert('Δεν μπόρεσα να διαγράψω την επαφή. Δοκίμασε ξανά.');
  } finally {
    isContactsMutationInProgress = false;
    renderContacts();
  }
}

async function editContact(index) {
  const contact = contacts[index];

  if (!contact) return;

  recoverContactsStorage();

  const name = window.prompt('Όνομα επαφής', contact.name);
  if (name === null) return;

  const relationship = window.prompt('Σχέση', contact.relationship);
  if (relationship === null) return;

  const phone = window.prompt('Τηλέφωνο', contact.phone || '');
  if (phone === null) return;

  const email = window.prompt('Email (προαιρετικό)', contact.email || '');
  if (email === null) return;

  const updatedContact = {
    ...contact,
    name: name.trim(),
    relationship: relationship.trim(),
    phone: phone.trim(),
    email: email.trim(),
  };
  const validationMessage = validateContactFields(updatedContact);
  if (validationMessage) {
    showContactValidationMessage(validationMessage);
    return;
  }

  const previousContacts = contacts;
  try {
    contacts = contacts.map((savedContact, contactIndex) => (contactIndex === index ? updatedContact : savedContact));
    persistContactsLocally();
    await syncContactsToSupabaseBestEffort('update');
    renderContacts();
  } catch (error) {
    console.warn('[SafeMe] Contact update failed', error);
    contacts = previousContacts;
    saveJson(storageKeys.contacts, contacts);
    window.alert('Δεν μπόρεσα να αποθηκεύσω την επαφή. Δοκίμασε ξανά.');
  }
}

async function setPrimaryContact(index) {
  recoverContactsStorage();
  contacts = contacts.map((contact, contactIndex) => ({
    ...contact,
    tone: contactIndex === index ? 'primary' : 'default',
  }));

  try {
    persistContactsLocally();
    await syncContactsToSupabaseBestEffort('primary update');
  } catch (error) {
    console.warn('[SafeMe] Contact primary update failed', error);
    window.alert('Δεν μπόρεσα να ορίσω κύρια επαφή SOS. Δοκίμασε ξανά.');
  }
  renderContacts();
  renderAuth();
  renderSetupChecklist();
}


async function clearTrustedContacts() {
  if (isContactsMutationInProgress) return;

  const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις όλες τις έμπιστες επαφές;');

  if (!confirmed) return;

  contacts = [];
  await persistContacts();
  renderContacts();
  renderSetupChecklist();
}

function openContactInviteModal(index) {
  const contact = contacts[index];
  if (!contact) return;

  preparedContactInvite = contact;
  contactInvitePreview.textContent = trustedContactInviteMessage;
  contactInviteFeedback.textContent = `Έτοιμο μήνυμα για ${contact.name}. Διάλεξε SMS ή WhatsApp και πάτα αποστολή στην εφαρμογή που θα ανοίξει.`;
  contactInviteSmsButton.disabled = !normalizePhone(contact.phone);
  contactInviteModal.hidden = false;
  document.body.classList.add('modal-open');
  contactInviteSmsButton.focus();
}

function closeContactInviteModal() {
  contactInviteModal.hidden = true;
  document.body.classList.remove('modal-open');
  preparedContactInvite = null;
  contactInviteFeedback.textContent = '';
}

function sendContactInviteSms() {
  if (!preparedContactInvite) return;

  window.location.href = getSmsLink(preparedContactInvite, trustedContactInviteMessage);
  contactInviteFeedback.textContent = `Άνοιξε έτοιμο SMS προς ${preparedContactInvite.name}. Πάτα αποστολή αν θέλεις να το στείλεις.`;
}

function sendContactInviteWhatsapp() {
  window.open(getWhatsappLink(trustedContactInviteMessage), '_blank', 'noopener');
  contactInviteFeedback.textContent = 'Άνοιξε WhatsApp με προσυμπληρωμένο μήνυμα. Διάλεξε παραλήπτη και πάτα αποστολή.';
}

async function copyContactInviteMessage() {
  try {
    await copyTextToClipboard(trustedContactInviteMessage);
    contactInviteFeedback.textContent = 'Το μήνυμα αντιγράφηκε.';
  } catch {
    contactInviteFeedback.textContent = 'Δεν μπόρεσα να αντιγράψω το μήνυμα. Δοκίμασε ξανά.';
  }
}

function handleContactsListClick(event) {
  const inviteButton = event.target.closest('.contact-invite-button');
  const editButton = event.target.closest('.edit-contact-button');
  const primaryButton = event.target.closest('.primary-contact-button');
  const deleteButton = event.target.closest('.delete-contact-button');

  if (inviteButton) {
    openContactInviteModal(Number(inviteButton.dataset.contactIndex));
    return;
  }

  if (editButton) {
    editContact(Number(editButton.dataset.contactIndex));
    return;
  }

  if (primaryButton) {
    setPrimaryContact(Number(primaryButton.dataset.contactIndex));
    return;
  }

  if (deleteButton) {
    deleteContact(Number(deleteButton.dataset.contactIndex));
  }
}

async function addContact(event) {
  event.preventDefault();
  if (isContactsMutationInProgress) return;

  recoverContactsStorage();
  const formData = new FormData(contactsForm);
  const newContact = {
    id: createLocalContactId(),
    name: (formData.get('name') || '').trim(),
    relationship: (formData.get('relationship') || '').trim(),
    phone: (formData.get('phone') || '').trim(),
    email: (formData.get('email') || '').trim(),
    tone: contacts.length === 0 ? 'primary' : 'default',
  };

  const validationMessage = validateContactFields(newContact);
  if (validationMessage) {
    showContactValidationMessage(validationMessage);
    return;
  }

  const previousContacts = contacts;
  let savedLocally = false;
  isContactsMutationInProgress = true;

  try {
    updateContacts((currentContacts) => [...currentContacts, newContact]);
    savedLocally = true;
    contactsForm.reset();
    if (currentUser && !isRemoteSyncing) {
      const savedContact = await saveContactToSupabase(newContact);
      updateContacts((currentContacts) => currentContacts.map((contact) => (
        contact.id === newContact.id ? savedContact : contact
      )));
    }
  } catch (error) {
    if (savedLocally) {
      console.warn('[SafeMe] Contact save synced locally only', error);
    } else {
      console.warn('[SafeMe] Contact save failed', error);
      updateContacts(previousContacts);
      window.alert('Δεν μπόρεσα να αποθηκεύσω την επαφή. Δοκίμασε ξανά.');
    }
  } finally {
    isContactsMutationInProgress = false;
    renderContacts();
  }
}

function renderProfile() {
  const hasProfile = hasCompleteLocalProfile();
  const displayName = getProfileValue('name', 'Συμπλήρωσε το προφίλ σου');

  document.querySelector('#profile-local-status')?.classList.toggle('signed-in', hasProfile);
  const localStatusText = document.querySelector('#profile-local-status-text');
  if (localStatusText) localStatusText.textContent = hasProfile ? 'Συνδεδεμένος' : 'Χωρίς σύνδεση';
  const localStatusHint = document.querySelector('#profile-local-status-hint');
  if (localStatusHint) localStatusHint.textContent = hasProfile
    ? 'Το τοπικό demo προφίλ είναι αποθηκευμένο σε αυτή τη συσκευή.'
    : 'Δημιούργησε ένα τοπικό demo προφίλ για να εμφανίζεταις ως συνδεδεμένος.';

  profileName.textContent = displayName;
  profilePhone.textContent = getProfileValue('phone', 'Δεν έχει προστεθεί τηλέφωνο');
  profileNotes.textContent = getProfileValue('medicalNotes', 'Δεν έχουν προστεθεί ιατρικές σημειώσεις');
  profileLanguage.textContent = (profile?.preferredLanguage || 'el') === 'en' ? 'English' : 'Ελληνικά';
  profileCreatedAt.textContent = formatDiagnosticDateTime(profile?.createdAt);
  profileUpdatedAt.textContent = formatDiagnosticDateTime(profile?.updatedAt);
  profileAvatar.textContent = profile?.name ? getInitials(profile.name) : '👤';
  profileForm.elements.name.value = profile?.name || '';
  profileForm.elements.phone.value = profile?.phone || '';
  profileForm.elements.medicalNotes.value = profile?.medicalNotes || '';
  profileForm.elements.preferredLanguage.value = profile?.preferredLanguage || 'el';
}

async function saveProfile(event) {
  event.preventDefault();
  const formData = new FormData(profileForm);
  profile = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    medicalNotes: formData.get('medicalNotes')?.trim() || '',
    preferredLanguage: formData.get('preferredLanguage') || 'el',
    createdAt: profile?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const validationMessage = validateProfileFields(profile);
  if (validationMessage) {
    profileStatus.textContent = validationMessage;
    return;
  }

  const savedLocally = saveJson(storageKeys.profile, profile);

  try {
    if (currentUser) {
      await saveProfileToSupabase();
    }

    profileStatus.textContent = currentUser
      ? 'Τα στοιχεία αποθηκεύτηκαν και συγχρονίστηκαν στο Supabase.'
      : (savedLocally ? 'Τα στοιχεία αποθηκεύτηκαν τοπικά στη συσκευή σου.' : 'Το προφίλ ενημερώθηκε για αυτή τη συνεδρία, αλλά ο browser δεν επέτρεψε localStorage.');
  } catch (error) {
    profileStatus.textContent = `Αποθηκεύτηκε τοπικά, αλλά απέτυχε ο συγχρονισμός Supabase: ${error.message}`;
  }

  renderProfile();
  renderAuth();
  renderSetupChecklist();
}


function setPasswordResetLoading(isLoading) {
  passwordResetSubmit.disabled = isLoading;
  passwordResetNew.disabled = isLoading;
  passwordResetRepeat.disabled = isLoading;
}

function setAuthLoading(isLoading) {
  authSubmitButton.disabled = isLoading || Boolean(currentUser);
  authForgotPasswordButton.disabled = isLoading || Boolean(currentUser);
  authLoginTab.disabled = isLoading || Boolean(currentUser);
  authSignupTab.disabled = isLoading || Boolean(currentUser);
  authPasswordToggle.disabled = isLoading || Boolean(currentUser);
  authLogoutButton.disabled = isLoading || !currentUser;
}

function getFriendlyAuthErrorMessage(error) {
  const rawMessage = String(error?.message || '').toLowerCase();

  if (rawMessage.includes('invalid login credentials') || rawMessage.includes('invalid credentials')) {
    return 'Το email ή ο κωδικός δεν είναι σωστός. Έλεγξέ τα και δοκίμασε ξανά.';
  }

  if (rawMessage.includes('email not confirmed') || rawMessage.includes('not confirmed')) {
    return 'Το email σου δεν έχει επιβεβαιωθεί ακόμη. Άνοιξε το email επιβεβαίωσης και δοκίμασε ξανά.';
  }

  if (rawMessage.includes('failed to fetch') || rawMessage.includes('network') || rawMessage.includes('fetch')) {
    return authStatusMessages.networkError;
  }

  if (rawMessage.includes('already registered') || rawMessage.includes('user already registered')) {
    return 'Υπάρχει ήδη λογαριασμός με αυτό το email. Δοκίμασε σύνδεση ή επαναφορά κωδικού.';
  }

  if (rawMessage.includes('password')) {
    return 'Ο κωδικός δεν έγινε δεκτός. Χρησιμοποίησε τουλάχιστον 6 χαρακτήρες.';
  }

  return 'Κάτι πήγε στραβά με τη σύνδεση. Δοκίμασε ξανά σε λίγο.';
}

function setAuthMode(nextMode) {
  if (authMode === 'signup' && nextMode === 'login') authRepeatPassword.value = '';
  authMode = nextMode;
  renderAuth();
}

function hasPasswordRecoveryUrlParams() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  const urlType = hashParams.get('type') || queryParams.get('type');

  return urlType === 'recovery'
    || hashParams.has('access_token')
    || hashParams.has('refresh_token')
    || queryParams.has('code');
}

function removeRecoveryTokensFromUrl() {
  if (!hasPasswordRecoveryUrlParams()) return;

  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function activatePasswordRecoveryMode() {
  isPasswordRecoveryMode = true;
  showPage('profile');
  renderAuth();
  showAuthMessage(authStatusMessages.passwordResetReady);
  passwordResetStatus.textContent = '';
  passwordResetStatus.classList.remove('error');
  removeRecoveryTokensFromUrl();
  focusElementAfterScroll(passwordResetNew || passwordResetForm);
}

function clearPasswordRecoveryMode() {
  isPasswordRecoveryMode = false;
  passwordResetForm.reset();
  passwordResetStatus.classList.remove('error');
  renderAuth();
}

function renderAuth() {
  const signedIn = Boolean(currentUser);
  const hasLocalDemoProfile = hasCompleteLocalProfile();
  const indicatorSignedIn = signedIn || hasLocalDemoProfile;
  const isSignup = authMode === 'signup';
  const userEmail = currentUser?.email || '';
  const hideSignupFields = signedIn || !isSignup;

  if (signedIn) {
    authPassword.value = '';
    authRepeatPassword.value = '';
  } else if (hideSignupFields) {
    authRepeatPassword.value = '';
  }

  authForm.classList.toggle('auth-card-signed-in', signedIn);
  authLogoutButton.hidden = !signedIn;
  authFields.hidden = signedIn;
  authPasswordField.hidden = signedIn;
  authPasswordToggle.hidden = signedIn;
  authRepeatPasswordField.hidden = signedIn || !isSignup;
  authSignupNote.hidden = signedIn || !isSignup;
  authSubmitButton.hidden = signedIn;
  authForgotPasswordButton.hidden = signedIn || isSignup;
  authModeTabs.hidden = signedIn;
  authLoginTab.hidden = signedIn;
  authSignupTab.hidden = signedIn;
  authSignedIn.hidden = !signedIn;
  authUserEmail.textContent = userEmail;
  authEmail.disabled = signedIn;
  authPassword.disabled = signedIn;
  authRepeatPassword.disabled = hideSignupFields;
  authEmail.required = !signedIn;
  authPassword.required = !signedIn;
  authRepeatPassword.required = !signedIn && isSignup;
  authSubmitButton.textContent = isSignup ? 'Δημιουργία λογαριασμού' : 'Σύνδεση';
  authPassword.autocomplete = isSignup ? 'new-password' : 'current-password';
  authLoginTab.classList.toggle('active', !isSignup);
  authSignupTab.classList.toggle('active', isSignup);
  authLoginTab.setAttribute('aria-selected', String(!isSignup));
  authSignupTab.setAttribute('aria-selected', String(isSignup));
  authIndicator.textContent = indicatorSignedIn ? 'Συνδεδεμένος' : 'Χωρίς σύνδεση';
  authIndicator.setAttribute('aria-label', indicatorSignedIn
    ? (signedIn ? 'Συνδεδεμένος. Άνοιγμα λογαριασμού στο Προφίλ' : 'Συνδεδεμένος με τοπικό demo προφίλ. Άνοιγμα Προφίλ')
    : 'Χωρίς σύνδεση. Άνοιγμα σύνδεσης στο Προφίλ');
  authIndicator.classList.toggle('signed-in', indicatorSignedIn);
  authIndicator.classList.toggle('signed-out', !indicatorSignedIn);
  storageMode.textContent = signedIn ? 'Supabase + τοπικό αντίγραφο' : 'Τοπικό demo προφίλ σε localStorage';
  passwordResetForm.hidden = !isPasswordRecoveryMode;
  passwordResetNew.required = isPasswordRecoveryMode;
  passwordResetRepeat.required = isPasswordRecoveryMode;

  if (!authStatus.textContent) {
    authStatus.textContent = signedIn ? authStatusMessages.signedIn : authStatusMessages.signedOut;
  }
}

function showAuthMessage(message, isError = false) {
  authStatus.textContent = message;
  authStatus.classList.toggle('error', isError);
}

function togglePasswordVisibility() {
  const showPassword = authPassword.type === 'password';
  authPassword.type = showPassword ? 'text' : 'password';
  authRepeatPassword.type = showPassword ? 'text' : 'password';
  authPasswordToggle.textContent = showPassword ? 'Απόκρυψη' : 'Εμφάνιση';
}

async function sendPasswordResetEmail() {
  const email = authEmail.value.trim();

  if (!email) {
    showAuthMessage('Συμπλήρωσε πρώτα το email σου για να στείλουμε οδηγίες επαναφοράς.', true);
    authEmail.focus();
    return;
  }

  setAuthLoading(true);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PASSWORD_RESET_REDIRECT_URL,
    });

    if (error) throw error;

    showAuthMessage(authStatusMessages.passwordResetSent);
  } catch (error) {
    showAuthMessage(getFriendlyAuthErrorMessage(error), true);
  } finally {
    setAuthLoading(false);
  }
}

function showPasswordResetMessage(message, isError = false) {
  passwordResetStatus.textContent = message;
  passwordResetStatus.classList.toggle('error', isError);
}

async function handlePasswordResetSubmit(event) {
  event.preventDefault();

  const newPassword = passwordResetNew.value;
  const repeatPassword = passwordResetRepeat.value;

  if (newPassword.length < 6) {
    showPasswordResetMessage('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.', true);
    passwordResetNew.focus();
    return;
  }

  if (repeatPassword !== newPassword) {
    showPasswordResetMessage('Οι κωδικοί δεν ταιριάζουν.', true);
    passwordResetRepeat.focus();
    return;
  }

  setPasswordResetLoading(true);

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    showAuthMessage(authStatusMessages.passwordResetSuccess);
    showPasswordResetMessage(authStatusMessages.passwordResetSuccess);
    clearPasswordRecoveryMode();
    showPage('profile');
  } catch (error) {
    showPasswordResetMessage(getFriendlyAuthErrorMessage(error), true);
  } finally {
    setPasswordResetLoading(false);
  }
}

async function saveProfileToSupabase() {
  if (!currentUser || !profile) return;

  const { error } = await supabase
    .from('profiles')
    .upsert(mapProfileToSupabase(profile), { onConflict: 'id' });

  if (error) throw error;
}

async function saveContactToSupabase(contact) {
  if (!currentUser || isRemoteSyncing) return contact;

  const { data, error } = await supabase
    .from('trusted_contacts')
    .insert(mapContactToSupabase(contact))
    .select('*')
    .single();

  if (error) throw error;
  return mapContactFromSupabase(data);
}

async function deleteContactFromSupabase(contact) {
  if (!currentUser || isRemoteSyncing || !contact?.id) return;

  const { error } = await supabase
    .from('trusted_contacts')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('id', contact.id);

  if (error) throw error;
}

async function saveContactsToSupabase() {
  if (!currentUser) return;

  const { error: deleteError } = await supabase
    .from('trusted_contacts')
    .delete()
    .eq('user_id', currentUser.id);

  if (deleteError) throw deleteError;

  if (contacts.length === 0) return;

  const { error: insertError } = await supabase
    .from('trusted_contacts')
    .insert(contacts.map(mapContactToSupabase));

  if (insertError) throw insertError;
}


function getLocalImportCandidate() {
  const localProfile = sanitizeProfile(loadJson(storageKeys.profile, null));
  const localContacts = normalizeContactsForStorage(loadJson(storageKeys.contacts, []));
  if (!localProfile && localContacts.length === 0) return null;
  return { profile: localProfile, contacts: localContacts };
}

function renderLocalImportPrompt() {
  if (!localImportCard) return;
  const hasCandidate = Boolean(currentUser && pendingLocalImport && (pendingLocalImport.profile || pendingLocalImport.contacts.length > 0));
  localImportCard.hidden = !hasCandidate;
  if (!hasCandidate) return;
  const parts = [];
  if (pendingLocalImport.profile) parts.push('προφίλ');
  if (pendingLocalImport.contacts.length) parts.push(`${pendingLocalImport.contacts.length} επαφή/ές`);
  localImportSummary.textContent = `Βρήκαμε ${parts.join(' και ')} αποθηκευμένα σε αυτή τη συσκευή. Θέλεις να τα αποθηκεύσεις στον λογαριασμό σου;`;
}

async function importLocalEmergencyInfo() {
  if (!currentUser || !pendingLocalImport) return;
  localImportButton.disabled = true;
  localImportStatus.textContent = 'Αποθηκεύω τα τοπικά στοιχεία στον λογαριασμό...';
  try {
    if (pendingLocalImport.profile) {
      profile = { ...pendingLocalImport.profile, updatedAt: new Date().toISOString() };
      await saveProfileToSupabase();
    }
    if (pendingLocalImport.contacts.length > 0) {
      contacts = ensureSinglePrimaryContact(pendingLocalImport.contacts);
      await saveContactsToSupabase();
    }
    saveJson(storageKeys.profile, profile);
    saveJson(storageKeys.contacts, contacts);
    pendingLocalImport = null;
    localImportStatus.textContent = 'Τα τοπικά στοιχεία αποθηκεύτηκαν στον λογαριασμό.';
    renderProfile(); renderContacts(); renderSetupChecklist(); renderHealthPage(); renderLocalImportPrompt();
  } catch (error) {
    localImportStatus.textContent = 'Δεν αποθηκεύτηκαν στον λογαριασμό. Τα στοιχεία παραμένουν στη συσκευή και μπορείς να δοκιμάσεις ξανά.';
    localImportStatus.classList.add('error');
  } finally {
    localImportButton.disabled = false;
  }
}

function skipLocalEmergencyImport() {
  pendingLocalImport = null;
  if (localImportStatus) localImportStatus.textContent = 'Παράλειψη εισαγωγής. Τα τοπικά στοιχεία παραμένουν σε αυτή τη συσκευή.';
  renderLocalImportPrompt();
}

async function loadSupabaseData() {
  if (!currentUser) return;

  isRemoteSyncing = true;

  try {
    const [
      { data: remoteProfile, error: profileError },
      { data: remoteContacts, error: contactsError },
      { data: remoteSosEvents, error: sosHistoryError },
      { data: remoteActiveSos, error: activeSosError },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
      supabase.from('trusted_contacts').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true }),
      supabase.from('sos_events').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('active_sos_sessions').select('*').eq('user_id', currentUser.id).eq('status', 'active').order('started_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (profileError) throw profileError;
    if (contactsError) throw contactsError;
    if (sosHistoryError) throw sosHistoryError;
    if (activeSosError) throw activeSosError;

    const savedLocalProfile = profile;
    const savedLocalContacts = contacts;
    const remoteContactList = ensureSinglePrimaryContact(sanitizeContacts((remoteContacts || []).map(mapContactFromSupabase)));

    pendingLocalImport = (!remoteProfile && remoteContactList.length === 0) ? getLocalImportCandidate() : null;
    profile = mapProfileFromSupabase(remoteProfile) || null;
    contacts = remoteContactList;
    if (!remoteProfile && !pendingLocalImport) profile = savedLocalProfile;
    if (remoteContactList.length === 0 && !pendingLocalImport) contacts = savedLocalContacts;
    sosHistoryEvents = (remoteSosEvents || []).map(mapSosEventFromSupabase);
    const restoredActiveSosSession = mapActiveSosSessionFromSupabase(remoteActiveSos);
    activeSosSession = shouldRestoreActiveSosSession(restoredActiveSosSession) ? restoredActiveSosSession : null;
    isActiveSosSessionRestored = activeSosSession?.status === 'active';
    sosHistoryStatus = '';

    saveJson(storageKeys.profile, profile);
    saveJson(storageKeys.contacts, contacts);
    renderLocalImportPrompt();

    renderProfile();
    renderContacts();
    renderSosHistory();
    renderActiveSosSession(isActiveSosSessionRestored
      ? 'Υπάρχει έγκυρο ενεργό SOS από προηγούμενη χρήση. Αν ήταν δοκιμή, πάτησε Τερματισμός SOS.'
      : (restoredActiveSosSession ? 'Το προηγούμενο SOS είχε τερματιστεί και δεν αποκαταστάθηκε.' : ''));
    syncActiveSosLocationAutoUpdate();
    if (isActiveSosSessionRestored) {
      sosButton?.classList.add('activated');
      sosButton?.setAttribute('aria-pressed', 'true');
      sosStatus.textContent = 'Αποκαταστάθηκε ενεργό SOS από προηγούμενη χρήση.';
      showPage('home');
    }
    showAuthMessage(authStatusMessages.signedIn);
  } catch (error) {
    activeSosSession = null;
    isActiveSosSessionRestored = false;
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    sosHistoryStatus = `Δεν φορτώθηκε το ιστορικό SOS: ${error.message}`;
    renderSosHistory();
    showAuthMessage('Δεν έγινε συγχρονισμός λογαριασμού. Το SOS παραμένει διαθέσιμο τοπικά και μπορείς να δοκιμάσεις ξανά.', true);
  } finally {
    isRemoteSyncing = false;
    renderSetupChecklist();
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  setAuthLoading(true);

  const email = authEmail.value.trim();
  const password = authPassword.value;
  const repeatPassword = authRepeatPassword.value;

  if (authMode === 'signup') {
    if (password.length < 6) {
      showAuthMessage('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.', true);
      authPassword.focus();
      setAuthLoading(false);
      return;
    }

    if (repeatPassword !== password) {
      showAuthMessage('Οι κωδικοί δεν ταιριάζουν.', true);
      authRepeatPassword.focus();
      setAuthLoading(false);
      return;
    }
  }

  try {
    const authRequest = authMode === 'signup'
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { data, error } = await authRequest;

    if (error) throw error;

    const isSignup = authMode === 'signup';
    currentUser = isSignup ? (data.session?.user || currentUser) : (data.user || currentUser);
    authPassword.value = '';
    authRepeatPassword.value = '';
    showAuthMessage(isSignup
      ? authStatusMessages.signupSuccess
      : authStatusMessages.signedIn);
    renderAuth();
    if (!isSignup || data.session) await loadSupabaseData();
  } catch (error) {
    showAuthMessage(getFriendlyAuthErrorMessage(error), true);
  } finally {
    setAuthLoading(false);
  }
}

async function logout() {
  setAuthLoading(true);

  try {
    hasPendingLogoutMessage = true;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    authEmail.value = '';
    authPassword.value = '';
    authRepeatPassword.value = '';
    showAuthMessage(authStatusMessages.logoutSuccess);
    sosHistoryEvents = [];
    sosHistoryStatus = '';
    activeSosSession = null;
    isActiveSosSessionRestored = false;
    renderSosHistory();
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    renderAuth();
    renderSetupChecklist();
  } catch (error) {
    hasPendingLogoutMessage = false;
    showAuthMessage(getFriendlyAuthErrorMessage(error), true);
  } finally {
    setAuthLoading(false);
  }
}

async function initializeAuth() {
  const shouldOpenRecoveryForm = hasPasswordRecoveryUrlParams();
  await initializeSupabaseClient();
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  if (currentUser) authEmail.value = currentUser.email || '';
  renderAuth();
  if (shouldOpenRecoveryForm) activatePasswordRecoveryMode();
  try {
    await loadSupabaseData();
  } catch (error) {
    console.warn('[SafeMe] Initial account data load failed', error);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    if (currentUser) authEmail.value = currentUser.email || '';
    if (event === 'PASSWORD_RECOVERY') activatePasswordRecoveryMode();
    if (!currentUser) {
      sosHistoryEvents = [];
      sosHistoryStatus = '';
      clearActiveSosRuntimeState({ message: '', endedSession: activeSosSession, status: 'ended' });
      renderSosHistory();
      renderSetupChecklist();
      if (hasPendingLogoutMessage) {
        showAuthMessage(authStatusMessages.logoutSuccess);
        hasPendingLogoutMessage = false;
      } else {
        showAuthMessage(authStatusMessages.signedOut);
      }
    } else {
      loadSupabaseData().catch((error) => console.warn('[SafeMe] Auth account data refresh failed', error));
    }
    renderAuth();
    renderSetupChecklist();
  });
}

function clearSafeMeData() {
  const confirmed = window.confirm('Θέλεις σίγουρα να σβήσεις όλα τα αποθηκευμένα στοιχεία από αυτή τη συσκευή;');

  if (!confirmed) return;

  Object.values(storageKeys).forEach((key) => { try { localStorage.removeItem(key); } catch (error) { console.warn('[SafeMe] Could not clear local data', { key, error }); } });
  contacts = [];
  profile = null;
  currentLocation = null;
  isSosTestMode = false;
  hasRequestedLocationPermission = false;
  hasCompletedTestSos = false;
  isSetupChecklistCollapsed = true;
  activeCheckIn = null;
  activeSafeWalk = null;
  stopCheckInTimer();
  stopSafeWalkTimer();
  syncSosTestModeToggle();

  renderContacts();
  renderProfile();
  renderLocation();
  clearActiveSosRuntimeState({ message: '', endedSession: activeSosSession, status: 'ended' });
  renderSosHistory();
  renderSafeWalk();
  renderCheckIn();
  renderSetupChecklist();
  profileStatus.textContent = 'Τα αποθηκευμένα στοιχεία διαγράφηκαν από αυτή τη συσκευή.';
  if (settingsStatus) {
    settingsStatus.textContent = 'Τα τοπικά δεδομένα διαγράφηκαν από αυτή τη συσκευή.';
    settingsStatus.classList.remove('error');
  }
}

if (!window.__safeMeUiEventsBound) {

navButtons.forEach((button) => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-open-tool]');
  if (!button) return;

  event.preventDefault();
  handleHomeQuickAction(button.dataset.openTool);
});

safetyToolsTestSosButton?.addEventListener('click', () => handleHealthAction('test-sos'));

if (sosButton) sosButton.addEventListener('click', activateSosFromMainButton);
sosTestModeToggle?.addEventListener('change', handleSosTestModeChange);
sosCancelButtons?.forEach((button) => button.addEventListener('click', closeSosModal));
sosSendSmsButton?.addEventListener('click', sendPreparedSosSms);
sosSendWhatsappButton?.addEventListener('click', sendPreparedSosWhatsapp);
sosCopyMessageButton?.addEventListener('click', copyPreparedSosMessage);
sosCopyTrackingButton?.addEventListener('click', copyPreparedSosTrackingLink);
sosNativeShareButton?.addEventListener('click', sharePreparedSosMessage);
sosModal?.addEventListener('click', (event) => {
  if (event.target === sosModal) closeSosModal();
});
contactInviteCloseButton?.addEventListener('click', closeContactInviteModal);
contactInviteSmsButton?.addEventListener('click', sendContactInviteSms);
contactInviteWhatsappButton?.addEventListener('click', sendContactInviteWhatsapp);
contactInviteCopyButton?.addEventListener('click', copyContactInviteMessage);
contactInviteModal?.addEventListener('click', (event) => {
  if (event.target === contactInviteModal) closeContactInviteModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (contactInviteModal && !contactInviteModal.hidden) {
    closeContactInviteModal();
    return;
  }
  if (sosModal && !sosModal.hidden) closeSosModal();
});
authSignupTab?.addEventListener('click', () => setAuthMode('signup'));
authLoginTab?.addEventListener('click', () => setAuthMode('login'));
authForgotPasswordButton?.addEventListener('click', sendPasswordResetEmail);
authPasswordToggle?.addEventListener('click', togglePasswordVisibility);
authForm?.addEventListener('submit', handleAuthSubmit);
passwordResetForm?.addEventListener('submit', handlePasswordResetSubmit);
authLogoutButton?.addEventListener('click', logout);
authIndicator?.addEventListener('click', openProfileAuthCard);
onlineStatusPill?.addEventListener('click', handleOnlineStatusClick);
contactsForm?.addEventListener('submit', addContact);
contactsList?.addEventListener('click', handleContactsListClick);
clearContactsButton?.addEventListener('click', clearTrustedContacts);
profileForm?.addEventListener('submit', saveProfile);
clearDataButton?.addEventListener('click', clearSafeMeData);
settingsOpenProfileButton?.addEventListener('click', openSettingsProfile);
settingsOpenContactsButton?.addEventListener('click', openSettingsContacts);
settingsRefreshLocationButton?.addEventListener('click', refreshLocationFromSettings);
settingsRefreshAppButton?.addEventListener('click', () => refreshAppSafely());
pullRefreshManualButton?.addEventListener('click', () => refreshAppSafely());
settingsClearDataButton?.addEventListener('click', clearSafeMeData);
settingsLogoutButton?.addEventListener('click', logout);
localImportButton?.addEventListener('click', importLocalEmergencyInfo);
localImportSkipButton?.addEventListener('click', skipLocalEmergencyImport);
healthOpenProfileButton?.addEventListener('click', () => handleHealthAction('profile'));
healthOpenContactsButton?.addEventListener('click', () => handleHealthAction('contacts'));
healthCheckLocationButton?.addEventListener('click', () => handleHealthAction('location'));
healthTestSosButton?.addEventListener('click', () => handleHealthAction('test-sos'));
healthTestCheckInButton?.addEventListener('click', () => handleHealthAction('checkin'));
healthTestSafeWalkButton?.addEventListener('click', () => handleHealthAction('safe-walk'));
healthCopyReportButton?.addEventListener('click', copyHealthReport);
healthChecklist?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-health-action]');
  if (actionButton) handleHealthAction(actionButton.dataset.healthAction);
});
refreshLocationButton?.addEventListener('click', refreshLocation);
setupChecklist?.addEventListener('click', handleSetupChecklistAction);
shareLocationButton?.addEventListener('click', shareLocation);
testActiveSosLiveSyncButton?.addEventListener('click', testActiveSosLiveSyncNow);
refreshActiveSosGpsButton?.addEventListener('click', refreshActiveSosGpsNow);
updateActiveSosLocationButton?.addEventListener('click', updateActiveSosLocation);
copyActiveSosTrackingButton?.addEventListener('click', copyActiveSosTrackingLink);
shareActiveSosLocationButton?.addEventListener('click', shareLocation);
disableActiveSosTrackingButton?.addEventListener('click', disableActiveSosTrackingLink);
notifyAllSosContactsActionButton?.addEventListener('click', notifyAllSosContacts);
endActiveSosButton?.addEventListener('click', endActiveSosSession);
safeWalkPresetButtons?.forEach((button) => {
  button.addEventListener('click', () => {
    selectedSafeWalkMinutes = Number(button.dataset.minutes);
    if (safeWalkCustomMinutes) safeWalkCustomMinutes.value = '';
    renderSafeWalk();
  });
});
safeWalkCustomMinutes?.addEventListener('input', renderSafeWalk);
safeWalkStartButton?.addEventListener('click', startSafeWalk);
safeWalkSafeButton?.addEventListener('click', completeSafeWalkSafely);
safeWalkRefreshLocationButton?.addEventListener('click', refreshSafeWalkLocation);
safeWalkCancelButton?.addEventListener('click', cancelSafeWalk);
checkInPresetButtons?.forEach((button) => {
  button.addEventListener('click', () => {
    selectedCheckInMinutes = Number(button.dataset.minutes);
    if (checkInCustomMinutes) checkInCustomMinutes.value = '';
    renderCheckIn();
  });
});
checkInCustomMinutes?.addEventListener('input', renderCheckIn);
checkInStartButton?.addEventListener('click', startCheckIn);
checkInSafeButton?.addEventListener('click', completeCheckInSafely);
checkInCancelButton?.addEventListener('click', cancelCheckIn);
notifyAllSosContactsButton?.addEventListener('click', notifyAllSosContacts);
sosContactList?.addEventListener('click', async (event) => {
  const disabledAction = event.target.closest('[aria-disabled="true"]');
  if (disabledAction) { event.preventDefault(); return; }
  const openContactsButton = event.target.closest('[data-sos-open-contacts]');
  if (openContactsButton) { focusContactForm(); return; }
  const copyButton = event.target.closest('[data-sos-copy-contact]');
  if (copyButton) {
    const contact = contacts[Number(copyButton.dataset.sosCopyContact)];
    await copyTextToClipboard(getActiveSosEmergencyMessage());
    logSosNotification(contact, 'Copy', 'Copied');
    renderActiveSosSession(`Το SOS μήνυμα αντιγράφηκε για ${contact?.name || 'την επαφή'}.`);
    return;
  }
  const action = event.target.closest('[data-sos-notify-index]');
  if (action) {
    const contact = contacts[Number(action.dataset.sosNotifyIndex)];
    logSosNotification(contact, action.dataset.sosMethod, 'Opened');
  }
});
window.__safeMeUiEventsBound = true;
}

clearLegacyActiveSosStorage();
syncSosTestModeToggle();
renderContacts();
renderProfile();
renderLocation();
renderSetupChecklist();
renderHealthPage();
renderSosHistory();
renderActiveSosSession();
restoreSafeWalkOnLoad();
restoreCheckInOnLoad();
refreshLocationPermissionStatus();
setupAppFreshnessChecks();
setupPullToRefresh();
initializeAuth().catch((error) => console.warn('[SafeMe] Auth startup failed', error));
}


function showPageFallback(nextPage) {
  const pageName = pageTitles[nextPage] ? nextPage : 'home';
  document.querySelectorAll('.nav-item').forEach((item) => {
    const isActive = item.dataset.page === pageName;
    item.classList.toggle('active', isActive);
    item.toggleAttribute('aria-current', isActive);
  });
  document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === pageName));
  const title = document.querySelector('#page-title');
  if (title) title.textContent = pageTitles[pageName];
}

function bindStartupNavigationFallback() {
  if (window.__safeMeStartupNavigationBound) return;
  window.__safeMeStartupNavigationBound = true;
  document.addEventListener('click', (event) => {
    const navButton = event.target.closest('.nav-item[data-page]');
    if (navButton) {
      showPageFallback(navButton.dataset.page);
      return;
    }

    const quickAction = event.target.closest('[data-open-tool]');
    if (!quickAction) return;
    const tool = quickAction.dataset.openTool;
    if (tool === 'contacts') {
      event.preventDefault();
      showPageFallback('contacts');
      document.querySelector('#contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (tool === 'checkin' || tool === 'safe-walk') {
      event.preventDefault();
      showPageFallback('safety-tools');
      document.querySelector(`#${tool}-section`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, true);
}

function clearStartupBlockingState() {
  document.body?.classList.remove('loading', 'app-loading', 'is-loading');
  document.documentElement?.classList.remove('loading', 'app-loading', 'is-loading');
  document.querySelectorAll('[aria-busy="true"]').forEach((element) => element.setAttribute('aria-busy', 'false'));
  document.querySelectorAll('[data-startup-disabled]').forEach((element) => {
    element.disabled = false;
    element.removeAttribute('data-startup-disabled');
  });
}

let isSafeMeAppInitialized = false;

function initializeSafeMeApp() {
  if (isSafeMeAppInitialized) {
    clearStartupBlockingState();
    return;
  }

  try {
    initializeSafeMeAppUnsafe();
    isSafeMeAppInitialized = true;
  } catch (error) {
    console.warn('[SafeMe] Startup failed before full app initialization', error);
    clearStartupBlockingState();
  } finally {
    clearStartupBlockingState();
  }
}

function startSafeMeWhenDomReady() {
  const start = () => {
    if (hasTrackingTokenParam) {
      try {
        initializePublicTrackingMode();
      } catch (error) {
        console.warn('[SafeMe] Public tracking startup failed', error);
        clearStartupBlockingState();
      } finally {
        clearStartupBlockingState();
      }
    } else {
      bindStartupNavigationFallback();
      initializeSafeMeApp();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.addEventListener('pageshow', () => {
    if (!hasTrackingTokenParam) initializeSafeMeApp();
  });
}

startSafeMeWhenDomReady();
