import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://tkzgaejomyyrhbvfksas.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fIAQ-XIpZVUS2AoCdcfTLA_tXY6Ceq3';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const SOS_TRACKING_BASE_URL = 'https://cotsiosael.github.io/safety-app/';
const trackingParams = new URLSearchParams(window.location.search);
const hasTrackingTokenParam = trackingParams.has('track');
const trackingToken = (trackingParams.get('track') || '').trim();

const pageTitles = {
  home: 'Αρχική σελίδα',
  contacts: 'Έμπιστες επαφές',
  profile: 'Προφίλ χρήστη',
  settings: 'Ρυθμίσεις & ασφάλεια',
};

const defaultContacts = [];

const defaultProfile = null;

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

function initializeSafeMeApp() {
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
const sosConfirmStep = document.querySelector('#sos-confirmation-step');
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
const sosConfirmButton = document.querySelector('#sos-confirm');
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
const profileAvatar = document.querySelector('#profile-avatar');
const profileStatus = document.querySelector('#profile-status');
const clearDataButton = document.querySelector('#clear-data-button');
const settingsOpenProfileButton = document.querySelector('#settings-open-profile');
const settingsOpenContactsButton = document.querySelector('#settings-open-contacts');
const settingsRefreshLocationButton = document.querySelector('#settings-refresh-location');
const settingsClearDataButton = document.querySelector('#settings-clear-data');
const settingsStatus = document.querySelector('#settings-status');
const authForm = document.querySelector('#auth-form');
const authEmail = document.querySelector('#auth-email');
const authPassword = document.querySelector('#auth-password');
const authRepeatPassword = document.querySelector('#auth-repeat-password');
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
const passwordResetForm = document.querySelector('#password-reset-form');
const passwordResetNew = document.querySelector('#password-reset-new');
const passwordResetRepeat = document.querySelector('#password-reset-repeat');
const passwordResetSubmit = document.querySelector('#password-reset-submit');
const passwordResetStatus = document.querySelector('#password-reset-status');
const storageMode = document.querySelector('#storage-mode');
const locationText = document.querySelector('#location-text');
const refreshLocationButton = document.querySelector('#refresh-location-button');
const shareLocationButton = document.querySelector('#share-location-button');
const sosHistoryList = document.querySelector('#sos-history-list');
const activeSosSection = document.querySelector('#active-sos-section');
const activeSosStarted = document.querySelector('#active-sos-started');
const activeSosStatus = document.querySelector('#active-sos-status');
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

function loadJson(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let contacts = ensureSinglePrimaryContact(sanitizeContacts(loadJson(storageKeys.contacts, defaultContacts)));
let profile = sanitizeProfile(loadJson(storageKeys.profile, defaultProfile));
let currentLocation = loadJson(storageKeys.location, null);
let isSosTestMode = loadJson(storageKeys.sosTestMode, false) === true;
let hasCompletedTestSos = loadJson(storageKeys.testSosCompleted, false) === true;
let hasRequestedLocationPermission = loadJson(storageKeys.locationPermissionRequested, false) === true;
let isSetupChecklistCollapsed = loadJson(storageKeys.setupChecklistCollapsed, true) === true;
let activeSafeWalk = loadJson(storageKeys.safeWalk, null);
let selectedSafeWalkMinutes = 10;
let safeWalkTimer = null;
let safeWalkExpiryInProgress = false;
let activeCheckIn = loadJson(storageKeys.checkIn, null);
let selectedCheckInMinutes = 5;
let checkInTimer = null;
let checkInExpiryInProgress = false;
let preparedSosMessage = '';
let preparedSosContact = null;
let preparedContactInvite = null;
let preparedSosTrackingUrl = '';
let currentUser = null;
let authMode = 'login';
let isPasswordRecoveryMode = false;
let hasPendingLogoutMessage = false;
let isRemoteSyncing = false;
let sosHistoryEvents = [];
let sosHistoryStatus = '';
let activeSosSession = null;
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


function isLegacyDemoContact(contact) {
  return legacyDemoContactPhones.has(contact.phone);
}

function sanitizeContacts(savedContacts) {
  if (!Array.isArray(savedContacts)) return [];

  return savedContacts.filter((contact) => !isLegacyDemoContact(contact));
}

function ensureSinglePrimaryContact(contactList) {
  const primaryIndex = contactList.findIndex((contact) => contact.tone === 'primary');
  const activePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return contactList.map((contact, index) => ({
    ...contact,
    tone: index === activePrimaryIndex ? 'primary' : 'default',
  }));
}

function mapContactFromSupabase(contact) {
  return {
    id: contact.id,
    name: contact.name || '',
    relationship: contact.relationship || '',
    phone: contact.phone || '',
    tone: contact.tone || 'default',
  };
}

function mapContactToSupabase(contact) {
  return {
    user_id: currentUser.id,
    name: contact.name,
    relationship: contact.relationship,
    phone: contact.phone,
    tone: contact.tone || 'default',
  };
}

function mapProfileFromSupabase(savedProfile) {
  if (!savedProfile) return null;

  return sanitizeProfile({
    name: savedProfile.name || '',
    phone: savedProfile.phone || '',
    medicalNotes: savedProfile.medical_notes || savedProfile.medicalNotes || '',
  });
}

function mapProfileToSupabase(savedProfile) {
  return {
    id: currentUser.id,
    name: savedProfile.name,
    phone: savedProfile.phone,
    medical_notes: savedProfile.medicalNotes,
    updated_at: new Date().toISOString(),
  };
}

async function persistContacts() {
  contacts = ensureSinglePrimaryContact(contacts);
  saveJson(storageKeys.contacts, contacts);

  if (currentUser && !isRemoteSyncing) {
    await saveContactsToSupabase();
  }
}

function sanitizeProfile(savedProfile) {
  if (!savedProfile) return null;

  return savedProfile.phone === legacyDemoProfilePhone ? null : savedProfile;
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


function showPage(nextPage) {
  navButtons.forEach((item) => {
    const isActive = item.dataset.page === nextPage;
    item.classList.toggle('active', isActive);
    item.toggleAttribute('aria-current', isActive);
  });

  pages.forEach((page) => page.classList.toggle('active', page.id === nextPage));
  pageTitle.textContent = pageTitles[nextPage];
}


function focusElementAfterScroll(element) {
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => element.focus({ preventScroll: true }), 220);
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
  focusElementAfterScroll(contactsForm?.elements?.name || contactsForm);
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

function markTestSosCompleted() {
  if (!isSosTestMode || hasCompletedTestSos) return;

  hasCompletedTestSos = true;
  saveJson(storageKeys.testSosCompleted, true);
  renderSetupChecklist();
}

function getSetupChecklistItems() {
  return [
    {
      id: 'profile',
      label: 'Συμπλήρωσε προφίλ',
      completed: hasRequiredProfileDetails(),
      buttonLabel: 'Συμπλήρωση',
      action: 'profile',
    },
    {
      id: 'contacts',
      label: 'Πρόσθεσε έμπιστη επαφή',
      completed: contacts.length > 0,
      buttonLabel: 'Προσθήκη',
      action: 'contacts',
    },
    {
      id: 'location',
      label: 'Επίτρεψε τοποθεσία',
      completed: Boolean(currentLocation) || hasRequestedLocationPermission,
      buttonLabel: 'Άδεια τοποθεσίας',
      action: 'location',
    },
    {
      id: 'test-sos',
      label: 'Κάνε δοκιμαστικό SOS',
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
        <p>Ολοκλήρωσε αυτά τα βήματα για να είναι έτοιμο το SafeMe σε περίπτωση ανάγκης.</p>
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
    <p class="setup-checklist-summary">${allCompleted ? 'Το SafeMe είναι έτοιμο για χρήση.' : 'Λείπουν ακόμα βήματα για πλήρη ετοιμότητα.'}</p>
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
  showPage('home');
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
  refreshLocationButton.disabled = isLoading;
  shareLocationButton.disabled = isLoading;
  refreshLocationButton.textContent = isLoading ? 'Εντοπισμός...' : 'Ανανέωση';
}

function setSosConfirmLoading(isLoading) {
  sosConfirmButton.disabled = isLoading;
  sosConfirmButton.textContent = isLoading ? 'Ετοιμάζω...' : 'Ναι, ετοίμασε SOS';
}

function showLocationMessage(message) {
  locationText.textContent = message;
}

function renderLocation() {
  if (!currentLocation) {
    showLocationMessage('Πάτησε ανανέωση για να βρεθεί η θέση σου.');
    return;
  }

  const accuracyText = currentLocation.accuracy ? ` • ακρίβεια περίπου ${Math.round(currentLocation.accuracy)}μ.` : '';
  showLocationMessage(`${formatLocation(currentLocation)}${accuracyText}`);
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
    : 'SOS - Χρειάζομαι βοήθεια.';
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
  const medicalText = profile?.medicalNotes || 'Δεν έχουν προστεθεί.';

  return [
    getSosMessageIntro(),
    '',
    `👤 Όνομα: ${profile?.name || 'Δεν έχει συμπληρωθεί.'}`,
    `☎️ Τηλέφωνο: ${profile?.phone || 'Δεν έχει συμπληρωθεί.'}`,
    '',
    `📍 Άμεση τοποθεσία Google Maps: ${locationText}`,
    '',
    `🔴 Live tracking SafeMe: ${trackingText}`,
    '',
    `🧾 Ιατρικές σημειώσεις: ${medicalText}`,
  ].join('\n');
}

function getSmsLink(contact, message) {
  const phone = contact ? normalizePhone(contact.phone) : '';
  return `sms:${phone}?&body=${encodeURIComponent(message)}`;
}

function getWhatsappLink(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
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

function createLocalActiveSosSession(location = currentLocation) {
  const now = new Date().toISOString();

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
  };

  renderActiveSosSession('Το SOS λειτουργεί τοπικά σε αυτή τη συσκευή. Συνδέσου για live tracking link.');
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

  activeSosSession = mapActiveSosSessionFromSupabase(data);
  renderActiveSosSession();
  syncActiveSosLocationAutoUpdate();
}

function getActiveSosLocationUrl(session) {
  return `https://maps.google.com/?q=${session.latestLatitude},${session.latestLongitude}`;
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
}

function renderActiveSosSession(message = '') {
  if (!activeSosSection) return;

  if (!activeSosSession || activeSosSession.status !== 'active') {
    activeSosSection.hidden = true;
    activeSosFeedback.textContent = '';
    if (activeSosLiveStatus) activeSosLiveStatus.hidden = true;
    if (activeSosLastLiveUpdate) activeSosLastLiveUpdate.textContent = '—';
    if (activeSosLatestLocationTime) activeSosLatestLocationTime.textContent = '—';
    if (activeSosLiveUpdateState) activeSosLiveUpdateState.textContent = '—';
    if (activeSosTrackingStatus) activeSosTrackingStatus.textContent = '—';
    activeSosLastAutoUpdateAt = null;
    renderActiveSosDiagnostics();
    renderSafetyStatusCard();
    return;
  }

  activeSosSection.hidden = false;
  renderActiveSosDiagnostics();
  if (activeSosLiveStatus) activeSosLiveStatus.hidden = false;
  activeSosStarted.textContent = formatSosEventDate(activeSosSession.startedAt);
  activeSosStatus.textContent = activeSosSession.status;
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
    activeSosTrackingStatus.textContent = activeSosSession.shareToken
      ? 'Ενεργό tracking link'
      : 'Live tracking: απαιτεί σύνδεση';
  }

  if (hasSosLocation(activeSosSession)) {
    const url = getActiveSosLocationUrl(activeSosSession);
    const updatedText = activeSosSession.latestLocationAt ? ` (${formatSosEventDate(activeSosSession.latestLocationAt)})` : '';
    activeSosLocation.innerHTML = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Άνοιγμα στο Google Maps</a>${escapeHtml(updatedText)}`;
  } else {
    activeSosLocation.textContent = 'Χωρίς τοποθεσία';
  }

  copyActiveSosTrackingButton.hidden = false;
  copyActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  copyActiveSosTrackingButton.textContent = activeSosSession.shareToken
    ? 'Αντιγραφή tracking link'
    : 'Συνδέσου για live tracking';
  disableActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  activeSosFeedback.textContent = message;
  renderSafetyStatusCard();
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
  renderActiveSosSession('Το ενεργό SOS ξεκίνησε.');
  syncActiveSosLocationAutoUpdate();
  return activeSosSession;
}

async function loadActiveSosSession() {
  if (!currentUser) {
    activeSosSession = null;
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

  activeSosSession = mapActiveSosSessionFromSupabase(data);
  renderActiveSosSession();
  syncActiveSosLocationAutoUpdate();
}

function setActiveSosButtonsLoading(isLoading) {
  testActiveSosLiveSyncButton.disabled = isLoading;
  refreshActiveSosGpsButton.disabled = isLoading;
  updateActiveSosLocationButton.disabled = isLoading;
  endActiveSosButton.disabled = isLoading;
  copyActiveSosTrackingButton.disabled = isLoading || !activeSosSession?.shareToken;
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

  if (!currentUser) {
    activeSosSession = null;
    renderActiveSosSession();
    sosButton.classList.remove('activated');
    sosButton.setAttribute('aria-pressed', 'false');
    sosStatus.textContent = 'Το ενεργό SOS τερματίστηκε σε αυτή τη συσκευή.';
    return;
  }

  setActiveSosButtonsLoading(true);

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('active_sos_sessions')
      .update({ status: 'ended', ended_at: now, updated_at: now })
      .eq('id', activeSosSession.id)
      .eq('user_id', currentUser.id)
      .select('*')
      .single();

    if (error) throw error;

    activeSosSession = mapActiveSosSessionFromSupabase(data);
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    sosButton.classList.remove('activated');
    sosButton.setAttribute('aria-pressed', 'false');
    sosStatus.textContent = 'Το ενεργό SOS τερματίστηκε.';
  } catch (error) {
    renderActiveSosSession(`Δεν τερματίστηκε το SOS: ${error.message}`);
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
  checkInPresetButtons.forEach((button) => {
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
  if (!currentLocation && !hasRequestedLocationPermission) return 'Πάτησε πρώτα «Ανανέωση» στην τοποθεσία ώστε ο browser να ζητήσει άδεια location.';
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
  safeWalkPresetButtons.forEach((button) => {
    button.disabled = isActive || safeWalkExpiryInProgress;
    button.classList.toggle('active', Number(button.dataset.minutes) === selectedSafeWalkMinutes && !safeWalkCustomMinutes.value);
  });
  if (!isActive) {
    safeWalkStatusPill.textContent = safeWalkExpiryInProgress ? 'ενεργοποίηση SOS' : 'έτοιμο';
    renderSafetyStatusCard();
    return;
  }
  const remainingMs = new Date(activeSafeWalk.expiresAt).getTime() - Date.now();
  safeWalkCountdown.textContent = formatCheckInDuration(remainingMs);
  safeWalkActiveDestination.textContent = activeSafeWalk.destination || 'Δεν ορίστηκε';
  safeWalkStartedTime.textContent = formatCheckInDateTime(activeSafeWalk.startedAt);
  safeWalkExpectedTime.textContent = formatCheckInDateTime(activeSafeWalk.expiresAt);
  safeWalkStatusText.textContent = 'active';
  safeWalkLocationTime.textContent = currentLocation?.updatedAt ? formatCheckInDateTime(currentLocation.updatedAt) : 'Δεν υπάρχει ακόμα';
  safeWalkStatusPill.textContent = 'active';
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
  activeSafeWalk = { status: 'active', destination: safeWalkDestination.value.trim(), minutes, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString() };
  saveActiveSafeWalk();
  setSafeWalkMessage('Το Safe Walk ξεκίνησε. Επιβεβαίωσε ότι έφτασες/είσαι καλά πριν λήξει.');
  scheduleSafeWalkTimer();
}

function completeSafeWalkSafely() {
  activeSafeWalk = null; saveActiveSafeWalk(); stopSafeWalkTimer(); renderSafeWalk();
  setSafeWalkMessage('Το Safe Walk ολοκληρώθηκε. Είσαι ασφαλής.');
}

function cancelSafeWalk() {
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
  if (!currentLocation && !hasRequestedLocationPermission) return 'Πάτησε πρώτα «Ανανέωση» στην τοποθεσία ώστε ο browser να ζητήσει άδεια location.';
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
  sosConfirmStep.hidden = true;
  sosActionPanel.hidden = false;
  sosMessagePreview.textContent = message;
  sosTestModeLabel.hidden = !isSosTestMode;
  const contactMessage = contact
    ? `Κύρια επαφή: ${contact.name} (${formatPhone(contact.phone)})`
    : 'Δεν βρέθηκε κύρια επαφή.';
  const localTrackingNote = !currentUser
    ? 'Το SOS λειτουργεί τοπικά σε αυτή τη συσκευή. Συνδέσου για live tracking link.'
    : '';
  sosActionFeedback.textContent = [historyMessage, localTrackingNote, contactMessage].filter(Boolean).join(' ');
  sosStatus.textContent = 'Το μήνυμα SOS είναι έτοιμο. Διάλεξε τρόπο αποστολής.';
  sosActionTitle.focus?.();
}

function resetSosModal() {
  sosConfirmStep.hidden = false;
  sosActionPanel.hidden = true;
  sosTestModeLabel.hidden = true;
  sosActionFeedback.textContent = '';
  sosMessagePreview.textContent = '';
  preparedSosTrackingUrl = '';
  sosCopyTrackingButton.hidden = true;
  sosCopyTrackingButton.disabled = true;
  sosCopyTrackingButton.textContent = 'Αντιγραφή tracking link';
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

function openSosModal() {
  const validationMessage = getSosValidationMessage();

  if (validationMessage) {
    sosStatus.textContent = validationMessage;
    sosButton.classList.remove('activated');
    sosButton.setAttribute('aria-pressed', 'false');
    return;
  }

  resetSosModal();
  sosModal.hidden = false;
  document.body.classList.add('modal-open');
  sosConfirmButton.focus();
}

function closeSosModal() {
  sosModal.hidden = true;
  document.body.classList.remove('modal-open');
  sosButton.focus();
}

async function confirmSos() {
  const validationMessage = getSosValidationMessage();

  if (validationMessage) {
    closeSosModal();
    sosStatus.textContent = validationMessage;
    return;
  }

  setSosConfirmLoading(true);
  sosStatus.textContent = 'Ετοιμάζω μήνυμα SOS με την τοποθεσία σου...';

  if (!currentLocation) {
    await refreshLocation();
  }

  const contact = getPrimaryContact();
  let historyMessage = '';

  if (currentUser) {
    try {
      await createActiveSosSession(null, currentLocation);
      historyMessage = 'Δημιουργήθηκε ενεργό SOS.';
    } catch (error) {
      historyMessage = 'Δεν δημιουργήθηκε ενεργό SOS.';
    }
  } else {
    createLocalActiveSosSession(currentLocation);
    historyMessage = 'Το SOS ενεργοποιήθηκε σε αυτή τη συσκευή. Συνδέσου για live tracking link.';
  }

  const message = buildSosMessage(currentLocation, activeSosSession?.shareToken);

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

  showSosActionPanel(message, contact, historyMessage);
  markTestSosCompleted();
}


function syncSosTestModeToggle() {
  sosTestModeToggle.checked = isSosTestMode;
}

function handleSosTestModeChange() {
  isSosTestMode = sosTestModeToggle.checked;
  saveJson(storageKeys.sosTestMode, isSosTestMode);

  if (preparedSosMessage) {
    preparedSosMessage = buildSosMessage(currentLocation);
    sosMessagePreview.textContent = preparedSosMessage;
    sosTestModeLabel.hidden = !isSosTestMode;
  }
}

function renderContacts() {
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
            ${isPrimary ? '<span class="primary-contact-badge">Κύρια επαφή SOS</span>' : ''}
          </div>
          <div class="contact-actions">
            <a href="tel:${escapeHtml(phoneForLink)}" class="call-link">☎ ${escapeHtml(formatPhone(contact.phone))}</a>
            <button class="ghost-button contact-invite-button" type="button" data-contact-index="${index}">Ενημέρωση επαφής</button>
            <button class="ghost-button edit-contact-button" type="button" data-contact-index="${index}">Επεξεργασία</button>
            <button class="secondary-button primary-contact-button" type="button" data-contact-index="${index}" ${isPrimary ? 'disabled aria-disabled="true"' : ''}>Κύρια επαφή</button>
            <button class="danger-outline-button delete-contact-button" type="button" data-contact-index="${index}">Διαγραφή</button>
          </div>
        </article>
      `;
    })
    .join('');

  contactCount.textContent = contacts.length;
}

function ensurePrimaryContact() {
  contacts = ensureSinglePrimaryContact(contacts);
}

async function deleteContact(index) {
  const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την επαφή;');

  if (!confirmed) return;

  contacts = contacts.filter((_, contactIndex) => contactIndex !== index);
  ensurePrimaryContact();
  await persistContacts();
  renderContacts();
  renderSetupChecklist();
}

async function editContact(index) {
  const contact = contacts[index];

  if (!contact) return;

  const name = window.prompt('Όνομα επαφής', contact.name);
  if (name === null) return;

  const relationship = window.prompt('Σχέση', contact.relationship);
  if (relationship === null) return;

  const phone = window.prompt('Τηλέφωνο', contact.phone);
  if (phone === null) return;

  contacts = contacts.map((savedContact, contactIndex) => (
    contactIndex === index
      ? {
          ...savedContact,
          name: name.trim() || savedContact.name,
          relationship: relationship.trim() || savedContact.relationship,
          phone: phone.trim() || savedContact.phone,
        }
      : savedContact
  ));

  await persistContacts();
  renderContacts();
}

async function setPrimaryContact(index) {
  contacts = contacts.map((contact, contactIndex) => ({
    ...contact,
    tone: contactIndex === index ? 'primary' : 'default',
  }));

  await persistContacts();
  renderContacts();
  renderSetupChecklist();
}

async function clearTrustedContacts() {
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
  const formData = new FormData(contactsForm);
  const newContact = {
    name: formData.get('name').trim(),
    relationship: formData.get('relationship').trim(),
    phone: formData.get('phone').trim(),
    tone: contacts.length === 0 ? 'primary' : 'default',
  };

  contacts = [...contacts, newContact];
  await persistContacts();
  renderContacts();
  renderSetupChecklist();
  contactsForm.reset();
}

function renderProfile() {
  const displayName = getProfileValue('name', 'Συμπλήρωσε το προφίλ σου');

  profileName.textContent = displayName;
  profilePhone.textContent = getProfileValue('phone', 'Δεν έχει προστεθεί τηλέφωνο');
  profileNotes.textContent = getProfileValue('medicalNotes', 'Δεν έχουν προστεθεί ιατρικές σημειώσεις');
  profileAvatar.textContent = profile?.name ? getInitials(profile.name) : '👤';
  profileForm.elements.name.value = profile?.name || '';
  profileForm.elements.phone.value = profile?.phone || '';
  profileForm.elements.medicalNotes.value = profile?.medicalNotes || '';
}

async function saveProfile(event) {
  event.preventDefault();
  const formData = new FormData(profileForm);
  profile = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    medicalNotes: formData.get('medicalNotes').trim(),
  };

  saveJson(storageKeys.profile, profile);

  try {
    if (currentUser) {
      await saveProfileToSupabase();
    }

    profileStatus.textContent = currentUser
      ? 'Τα στοιχεία αποθηκεύτηκαν και συγχρονίστηκαν στο Supabase.'
      : 'Τα στοιχεία αποθηκεύτηκαν τοπικά στη συσκευή σου.';
  } catch (error) {
    profileStatus.textContent = `Αποθηκεύτηκε τοπικά, αλλά απέτυχε ο συγχρονισμός Supabase: ${error.message}`;
  }

  renderProfile();
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
  const isSignup = authMode === 'signup';
  const userEmail = currentUser?.email || '';

  authLogoutButton.hidden = !signedIn;
  authFields.hidden = signedIn;
  authPasswordField.hidden = signedIn;
  authRepeatPasswordField.hidden = signedIn || !isSignup;
  authSignupNote.hidden = signedIn || !isSignup;
  authSubmitButton.hidden = signedIn;
  authForgotPasswordButton.hidden = signedIn;
  authLoginTab.hidden = signedIn;
  authSignupTab.hidden = signedIn;
  authSignedIn.hidden = !signedIn;
  authUserEmail.textContent = userEmail;
  authEmail.disabled = signedIn;
  authPassword.disabled = signedIn;
  authRepeatPassword.disabled = signedIn || !isSignup;
  authEmail.required = !signedIn;
  authPassword.required = !signedIn;
  authRepeatPassword.required = !signedIn && isSignup;
  authSubmitButton.textContent = isSignup ? 'Δημιουργία λογαριασμού' : 'Σύνδεση';
  authPassword.autocomplete = isSignup ? 'new-password' : 'current-password';
  if (!isSignup) authRepeatPassword.value = '';
  authLoginTab.classList.toggle('active', !isSignup);
  authSignupTab.classList.toggle('active', isSignup);
  authLoginTab.setAttribute('aria-selected', String(!isSignup));
  authSignupTab.setAttribute('aria-selected', String(isSignup));
  authIndicator.textContent = signedIn ? 'Συνδεδεμένος' : 'Χωρίς σύνδεση';
  authIndicator.setAttribute('aria-label', signedIn
    ? 'Συνδεδεμένος. Άνοιγμα λογαριασμού στο Προφίλ'
    : 'Χωρίς σύνδεση. Άνοιγμα σύνδεσης στο Προφίλ');
  authIndicator.classList.toggle('signed-in', signedIn);
  authIndicator.classList.toggle('signed-out', !signedIn);
  storageMode.textContent = signedIn ? 'Supabase + τοπικό αντίγραφο' : 'Τοπικά, χωρίς backend';
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

    profile = mapProfileFromSupabase(remoteProfile) || savedLocalProfile;
    contacts = ensureSinglePrimaryContact(sanitizeContacts((remoteContacts || []).map(mapContactFromSupabase)));
    sosHistoryEvents = (remoteSosEvents || []).map(mapSosEventFromSupabase);
    activeSosSession = mapActiveSosSessionFromSupabase(remoteActiveSos);
    sosHistoryStatus = '';

    if (contacts.length === 0 && savedLocalContacts.length > 0) contacts = savedLocalContacts;

    saveJson(storageKeys.profile, profile);
    saveJson(storageKeys.contacts, contacts);

    if (!remoteProfile && profile) await saveProfileToSupabase();
    if ((remoteContacts || []).length === 0 && contacts.length > 0) await saveContactsToSupabase();

    renderProfile();
    renderContacts();
    renderSosHistory();
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    showAuthMessage(authStatusMessages.signedIn);
  } catch (error) {
    activeSosSession = null;
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    sosHistoryStatus = `Δεν φορτώθηκε το ιστορικό SOS: ${error.message}`;
    renderSosHistory();
    showAuthMessage(`Δεν έγινε συγχρονισμός Supabase: ${error.message}`, true);
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
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  if (currentUser) authEmail.value = currentUser.email || '';
  renderAuth();
  if (shouldOpenRecoveryForm) activatePasswordRecoveryMode();
  await loadSupabaseData();

  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    if (currentUser) authEmail.value = currentUser.email || '';
    if (event === 'PASSWORD_RECOVERY') activatePasswordRecoveryMode();
    if (!currentUser) {
      sosHistoryEvents = [];
      sosHistoryStatus = '';
      activeSosSession = null;
      renderSosHistory();
      renderActiveSosSession();
      syncActiveSosLocationAutoUpdate();
      renderSetupChecklist();
      if (hasPendingLogoutMessage) {
        showAuthMessage(authStatusMessages.logoutSuccess);
        hasPendingLogoutMessage = false;
      } else {
        showAuthMessage(authStatusMessages.signedOut);
      }
    } else {
      loadSupabaseData();
    }
    renderAuth();
    renderSetupChecklist();
  });
}

function clearSafeMeData() {
  const confirmed = window.confirm('Θέλεις σίγουρα να σβήσεις όλα τα αποθηκευμένα στοιχεία από αυτή τη συσκευή;');

  if (!confirmed) return;

  Object.values(storageKeys).forEach((key) => localStorage.removeItem(key));
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
  activeSosSession = null;
  renderSosHistory();
  renderActiveSosSession();
  syncActiveSosLocationAutoUpdate();
  renderSafeWalk();
  renderCheckIn();
  renderSetupChecklist();
  profileStatus.textContent = 'Τα αποθηκευμένα στοιχεία διαγράφηκαν από αυτή τη συσκευή.';
  if (settingsStatus) {
    settingsStatus.textContent = 'Τα τοπικά δεδομένα διαγράφηκαν από αυτή τη συσκευή.';
    settingsStatus.classList.remove('error');
  }
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

sosButton.addEventListener('click', openSosModal);
sosTestModeToggle.addEventListener('change', handleSosTestModeChange);
sosConfirmButton.addEventListener('click', confirmSos);
sosCancelButtons.forEach((button) => button.addEventListener('click', closeSosModal));
sosSendSmsButton.addEventListener('click', sendPreparedSosSms);
sosSendWhatsappButton.addEventListener('click', sendPreparedSosWhatsapp);
sosCopyMessageButton.addEventListener('click', copyPreparedSosMessage);
sosCopyTrackingButton.addEventListener('click', copyPreparedSosTrackingLink);
sosNativeShareButton.addEventListener('click', sharePreparedSosMessage);
sosModal.addEventListener('click', (event) => {
  if (event.target === sosModal) closeSosModal();
});
contactInviteCloseButton.addEventListener('click', closeContactInviteModal);
contactInviteSmsButton.addEventListener('click', sendContactInviteSms);
contactInviteWhatsappButton.addEventListener('click', sendContactInviteWhatsapp);
contactInviteCopyButton.addEventListener('click', copyContactInviteMessage);
contactInviteModal.addEventListener('click', (event) => {
  if (event.target === contactInviteModal) closeContactInviteModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!contactInviteModal.hidden) {
    closeContactInviteModal();
    return;
  }
  if (!sosModal.hidden) closeSosModal();
});
authSignupTab.addEventListener('click', () => setAuthMode('signup'));
authLoginTab.addEventListener('click', () => setAuthMode('login'));
authForgotPasswordButton.addEventListener('click', sendPasswordResetEmail);
authPasswordToggle.addEventListener('click', togglePasswordVisibility);
authForm.addEventListener('submit', handleAuthSubmit);
passwordResetForm.addEventListener('submit', handlePasswordResetSubmit);
authLogoutButton.addEventListener('click', logout);
authIndicator.addEventListener('click', openProfileAuthCard);
onlineStatusPill.addEventListener('click', handleOnlineStatusClick);
contactsForm.addEventListener('submit', addContact);
contactsList.addEventListener('click', handleContactsListClick);
clearContactsButton.addEventListener('click', clearTrustedContacts);
profileForm.addEventListener('submit', saveProfile);
clearDataButton.addEventListener('click', clearSafeMeData);
settingsOpenProfileButton.addEventListener('click', openSettingsProfile);
settingsOpenContactsButton.addEventListener('click', openSettingsContacts);
settingsRefreshLocationButton.addEventListener('click', refreshLocationFromSettings);
settingsClearDataButton.addEventListener('click', clearSafeMeData);
refreshLocationButton.addEventListener('click', refreshLocation);
setupChecklist?.addEventListener('click', handleSetupChecklistAction);
shareLocationButton.addEventListener('click', shareLocation);
testActiveSosLiveSyncButton.addEventListener('click', testActiveSosLiveSyncNow);
refreshActiveSosGpsButton.addEventListener('click', refreshActiveSosGpsNow);
updateActiveSosLocationButton.addEventListener('click', updateActiveSosLocation);
copyActiveSosTrackingButton.addEventListener('click', copyActiveSosTrackingLink);
disableActiveSosTrackingButton.addEventListener('click', disableActiveSosTrackingLink);
endActiveSosButton.addEventListener('click', endActiveSosSession);
safeWalkPresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedSafeWalkMinutes = Number(button.dataset.minutes);
    safeWalkCustomMinutes.value = '';
    renderSafeWalk();
  });
});
safeWalkCustomMinutes.addEventListener('input', renderSafeWalk);
safeWalkStartButton.addEventListener('click', startSafeWalk);
safeWalkSafeButton.addEventListener('click', completeSafeWalkSafely);
safeWalkRefreshLocationButton.addEventListener('click', refreshSafeWalkLocation);
safeWalkCancelButton.addEventListener('click', cancelSafeWalk);
checkInPresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedCheckInMinutes = Number(button.dataset.minutes);
    checkInCustomMinutes.value = '';
    renderCheckIn();
  });
});
checkInCustomMinutes.addEventListener('input', renderCheckIn);
checkInStartButton.addEventListener('click', startCheckIn);
checkInSafeButton.addEventListener('click', completeCheckInSafely);
checkInCancelButton.addEventListener('click', cancelCheckIn);

syncSosTestModeToggle();
renderContacts();
renderProfile();
renderLocation();
renderSetupChecklist();
renderSosHistory();
renderActiveSosSession();
restoreSafeWalkOnLoad();
restoreCheckInOnLoad();
refreshLocationPermissionStatus();
initializeAuth();
}

if (hasTrackingTokenParam) {
  initializePublicTrackingMode();
} else {
  initializeSafeMeApp();
}
