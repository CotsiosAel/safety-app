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

  if (state.loading) {
    page.innerHTML = `
      <section class="public-tracking-card" aria-live="polite">
        <p class="eyebrow">SafeMe public link</p>
        <h1>SafeMe SOS Tracking</h1>
        <p class="public-tracking-muted">Φορτώνω την κατάσταση SOS...</p>
      </section>
    `;
    return;
  }

  if (state.error) {
    page.innerHTML = `
      <section class="public-tracking-card" aria-live="polite">
        <p class="eyebrow">SafeMe public link</p>
        <h1>SafeMe SOS Tracking</h1>
        <p class="public-tracking-error">${escapeHtml(state.error)}</p>
        <button class="primary-button inline-button" id="public-tracking-refresh" type="button">Ανανέωση τοποθεσίας</button>
      </section>
    `;
    document.querySelector('#public-tracking-refresh')?.addEventListener('click', fetchPublicTrackingSession);
    return;
  }

  const session = state.session;
  const hasLocation = publicTrackingHasLocation(session);
  const coordinates = hasLocation ? `${session.latestLatitude},${session.latestLongitude}` : '';
  const mapsUrl = hasLocation ? `https://maps.google.com/?q=${coordinates}` : '';
  const embedMapUrl = hasLocation ? `https://maps.google.com/maps?q=${coordinates}&z=16&output=embed` : '';
  const endedMessage = session.status === 'ended' ? '<p class="public-tracking-ended">Το SOS έχει τερματιστεί.</p>' : '';

  page.innerHTML = `
    <section class="public-tracking-card" aria-live="polite">
      <p class="eyebrow">SafeMe public link</p>
      <h1>SafeMe SOS Tracking</h1>
      ${endedMessage}
      <dl class="public-tracking-details">
        <div><dt>Status</dt><dd>${escapeHtml(session.status)}</dd></div>
        <div><dt>Started</dt><dd>${escapeHtml(formatPublicTrackingDate(session.startedAt))}</dd></div>
        ${session.endedAt ? `<div><dt>Ended</dt><dd>${escapeHtml(formatPublicTrackingDate(session.endedAt))}</dd></div>` : ''}
        ${session.latestLocationAt ? `<div><dt>Latest location time</dt><dd>${escapeHtml(formatPublicTrackingDate(session.latestLocationAt))}</dd></div>` : ''}
      </dl>
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
          <p class="public-tracking-coordinates">Συντεταγμένες: ${escapeHtml(coordinates)}</p>
          <p class="public-tracking-map-fallback">Αν ο χάρτης δεν εμφανίζεται, άνοιξέ τον στο Google Maps.</p>
          <a class="public-tracking-map" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener">Άνοιγμα στο Google Maps</a>`
        : '<p class="public-tracking-muted">Δεν υπάρχει διαθέσιμη τοποθεσία ακόμα.</p>'}
      <button class="primary-button inline-button" id="public-tracking-refresh" type="button">Ανανέωση τοποθεσίας</button>
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

    renderPublicTrackingPage({ session });

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
const authStatusMessages = {
  signedOut: 'Δεν έχεις συνδεθεί. Τα στοιχεία αποθηκεύονται τοπικά.',
  signedIn: 'Συνδεδεμένος/η στο Supabase. Τα στοιχεία συγχρονίζονται.',
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
const sosNativeShareButton = document.querySelector('#sos-native-share');
const sosConfirmButton = document.querySelector('#sos-confirm');
const sosCancelButtons = document.querySelectorAll('[data-close-sos]');
const contactsList = document.querySelector('#contacts-list');
const contactsForm = document.querySelector('#contact-form');
const contactCount = document.querySelector('#contact-count');
const clearContactsButton = document.querySelector('#clear-contacts-button');
const profileForm = document.querySelector('#profile-form');
const profileName = document.querySelector('#profile-name');
const profilePhone = document.querySelector('#profile-phone');
const profileNotes = document.querySelector('#profile-notes');
const profileAvatar = document.querySelector('#profile-avatar');
const profileStatus = document.querySelector('#profile-status');
const clearDataButton = document.querySelector('#clear-data-button');
const authForm = document.querySelector('#auth-form');
const authEmail = document.querySelector('#auth-email');
const authPassword = document.querySelector('#auth-password');
const authSignupButton = document.querySelector('#auth-signup-button');
const authLoginButton = document.querySelector('#auth-login-button');
const authLogoutButton = document.querySelector('#auth-logout-button');
const authStatus = document.querySelector('#auth-status');
const storageMode = document.querySelector('#storage-mode');
const locationText = document.querySelector('#location-text');
const refreshLocationButton = document.querySelector('#refresh-location-button');
const shareLocationButton = document.querySelector('#share-location-button');
const sosHistoryList = document.querySelector('#sos-history-list');
const activeSosSection = document.querySelector('#active-sos-section');
const activeSosStarted = document.querySelector('#active-sos-started');
const activeSosStatus = document.querySelector('#active-sos-status');
const activeSosLocation = document.querySelector('#active-sos-location');
const activeSosLastLiveUpdate = document.querySelector('#active-sos-last-live-update');
const activeSosFeedback = document.querySelector('#active-sos-feedback');
const activeSosLiveStatus = document.querySelector('#active-sos-live-status');
const updateActiveSosLocationButton = document.querySelector('#update-active-sos-location');
const endActiveSosButton = document.querySelector('#end-active-sos');
const copyActiveSosTrackingButton = document.querySelector('#copy-active-sos-tracking');
const disableActiveSosTrackingButton = document.querySelector('#disable-active-sos-tracking');

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
let preparedSosMessage = '';
let preparedSosContact = null;
let currentUser = null;
let authMode = 'login';
let isRemoteSyncing = false;
let sosHistoryEvents = [];
let sosHistoryStatus = '';
let activeSosSession = null;
let activeSosLocationUpdateTimer = null;
let isAutoUpdatingActiveSosLocation = false;
let activeSosLastAutoUpdateAt = null;


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
  setLocationButtonsLoading(true);
  showLocationMessage('Ψάχνω την τρέχουσα θέση σου...');

  try {
    const position = await requestCurrentPosition();
    currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      updatedAt: new Date().toISOString(),
    };

    saveJson(storageKeys.location, currentLocation);
    renderLocation();
  } catch (error) {
    showLocationMessage(getGeolocationErrorMessage(error));
  } finally {
    setLocationButtonsLoading(false);
  }
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
  const locationLine = location
    ? `Η τοποθεσία μου: ${getLocationUrl(location)}`
    : 'Δεν μπόρεσα να πάρω τοποθεσία από τη συσκευή μου.';
  const nameLine = profile?.name ? `Όνομα: ${profile.name}` : '';
  const phoneLine = profile?.phone ? `Τηλέφωνο: ${profile.phone}` : '';
  const medicalLine = profile?.medicalNotes ? `Ιατρικές σημειώσεις: ${profile.medicalNotes}` : '';
  const trackingUrl = getSosTrackingUrl(shareToken);
  const trackingIntro = trackingUrl ? 'Άνοιξε εδώ για να δεις την τελευταία μου τοποθεσία:' : '';

  return [
    getSosMessageIntro(),
    nameLine,
    phoneLine,
    locationLine,
    trackingIntro,
    trackingUrl,
    medicalLine,
  ]
    .filter(Boolean)
    .join('\n');
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

function renderActiveSosSession(message = '') {
  if (!activeSosSection) return;

  if (!activeSosSession || activeSosSession.status !== 'active') {
    activeSosSection.hidden = true;
    activeSosFeedback.textContent = '';
    if (activeSosLiveStatus) activeSosLiveStatus.hidden = true;
    if (activeSosLastLiveUpdate) activeSosLastLiveUpdate.textContent = '—';
    activeSosLastAutoUpdateAt = null;
    return;
  }

  activeSosSection.hidden = false;
  if (activeSosLiveStatus) activeSosLiveStatus.hidden = false;
  activeSosStarted.textContent = formatSosEventDate(activeSosSession.startedAt);
  activeSosStatus.textContent = activeSosSession.status;
  if (activeSosLastLiveUpdate) {
    activeSosLastLiveUpdate.textContent = activeSosLastAutoUpdateAt
      ? formatSosEventTime(activeSosLastAutoUpdateAt)
      : '—';
  }

  if (hasSosLocation(activeSosSession)) {
    const url = getActiveSosLocationUrl(activeSosSession);
    const updatedText = activeSosSession.latestLocationAt ? ` (${formatSosEventDate(activeSosSession.latestLocationAt)})` : '';
    activeSosLocation.innerHTML = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Άνοιγμα στο Google Maps</a>${escapeHtml(updatedText)}`;
  } else {
    activeSosLocation.textContent = 'Χωρίς τοποθεσία';
  }

  copyActiveSosTrackingButton.hidden = !activeSosSession.shareToken;
  copyActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  disableActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  activeSosFeedback.textContent = message;
}

function shouldAutoUpdateActiveSosLocation() {
  return Boolean(
    currentUser
      && activeSosSession
      && activeSosSession.status === 'active'
  );
}

function stopActiveSosLocationAutoUpdate() {
  window.clearInterval(activeSosLocationUpdateTimer);
  activeSosLocationUpdateTimer = null;
}

function syncActiveSosLocationAutoUpdate() {
  if (!shouldAutoUpdateActiveSosLocation()) {
    stopActiveSosLocationAutoUpdate();
    return;
  }

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
  updateActiveSosLocationButton.disabled = isLoading;
  endActiveSosButton.disabled = isLoading;
  copyActiveSosTrackingButton.disabled = isLoading || !activeSosSession?.shareToken;
  disableActiveSosTrackingButton.disabled = isLoading || !activeSosSession?.shareToken;
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
    const position = await requestCurrentPosition();
    const now = new Date().toISOString();
    currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      updatedAt: now,
    };
    saveJson(storageKeys.location, currentLocation);
    renderLocation();

    const { data, error } = await supabase
      .from('active_sos_sessions')
      .update({
        latest_latitude: currentLocation.latitude,
        latest_longitude: currentLocation.longitude,
        latest_location_at: now,
        updated_at: now,
      })
      .eq('id', activeSosSession.id)
      .eq('user_id', currentUser.id)
      .select('*')
      .single();

    if (error) throw error;

    activeSosSession = mapActiveSosSessionFromSupabase(data);
    if (isAutomaticUpdate) activeSosLastAutoUpdateAt = now;
    renderActiveSosSession(successMessage);
  } catch (error) {
    renderActiveSosSession(failureMessage || (error?.code ? getGeolocationErrorMessage(error) : `Δεν ενημερώθηκε το SOS: ${error.message}`));
  } finally {
    if (updateButtonState) setActiveSosButtonsLoading(false);
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
  if (!currentUser || !activeSosSession) return;

  const confirmed = window.confirm('Θέλεις σίγουρα να τερματίσεις το ενεργό SOS;');
  if (!confirmed) return;

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
  sosConfirmStep.hidden = true;
  sosActionPanel.hidden = false;
  sosMessagePreview.textContent = message;
  sosTestModeLabel.hidden = !isSosTestMode;
  const contactMessage = contact
    ? `Κύρια επαφή: ${contact.name} (${formatPhone(contact.phone)})`
    : 'Δεν βρέθηκε κύρια επαφή.';
  sosActionFeedback.textContent = historyMessage ? `${historyMessage} ${contactMessage}` : contactMessage;
  sosStatus.textContent = 'Το μήνυμα SOS είναι έτοιμο. Διάλεξε τρόπο αποστολής.';
  sosActionTitle.focus?.();
}

function resetSosModal() {
  sosConfirmStep.hidden = false;
  sosActionPanel.hidden = true;
  sosTestModeLabel.hidden = true;
  sosActionFeedback.textContent = '';
  sosMessagePreview.textContent = '';
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
      url: currentLocation ? getLocationUrl(currentLocation) : undefined,
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
}

async function clearTrustedContacts() {
  const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις όλες τις έμπιστες επαφές;');

  if (!confirmed) return;

  contacts = [];
  await persistContacts();
  renderContacts();
}

function handleContactsListClick(event) {
  const editButton = event.target.closest('.edit-contact-button');
  const primaryButton = event.target.closest('.primary-contact-button');
  const deleteButton = event.target.closest('.delete-contact-button');

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
}


function setAuthLoading(isLoading) {
  authSignupButton.disabled = isLoading;
  authLoginButton.disabled = isLoading;
  authLogoutButton.disabled = isLoading || !currentUser;
}

function renderAuth() {
  const signedIn = Boolean(currentUser);
  authLogoutButton.hidden = !signedIn;
  authEmail.disabled = signedIn;
  authPassword.disabled = signedIn;
  storageMode.textContent = signedIn ? 'Supabase + τοπικό αντίγραφο' : 'Τοπικά, χωρίς backend';

  if (!authStatus.textContent) {
    authStatus.textContent = signedIn ? authStatusMessages.signedIn : authStatusMessages.signedOut;
  }
}

function showAuthMessage(message, isError = false) {
  authStatus.textContent = message;
  authStatus.classList.toggle('error', isError);
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
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  setAuthLoading(true);

  const email = authEmail.value.trim();
  const password = authPassword.value;

  try {
    const authRequest = authMode === 'signup'
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { data, error } = await authRequest;

    if (error) throw error;

    currentUser = data.user || currentUser;
    authPassword.value = '';
    showAuthMessage(authMode === 'signup'
      ? 'Ο λογαριασμός δημιουργήθηκε. Έλεγξε email επιβεβαίωσης αν ζητηθεί.'
      : 'Συνδέθηκες επιτυχώς.');
    renderAuth();
    await loadSupabaseData();
  } catch (error) {
    showAuthMessage(error.message || 'Η σύνδεση απέτυχε.', true);
  } finally {
    setAuthLoading(false);
  }
}

async function logout() {
  setAuthLoading(true);

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    authEmail.value = '';
    authPassword.value = '';
    showAuthMessage(authStatusMessages.signedOut);
    sosHistoryEvents = [];
    sosHistoryStatus = '';
    activeSosSession = null;
    renderSosHistory();
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    renderAuth();
  } catch (error) {
    showAuthMessage(error.message || 'Η αποσύνδεση απέτυχε.', true);
  } finally {
    setAuthLoading(false);
  }
}

async function initializeAuth() {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  if (currentUser) authEmail.value = currentUser.email || '';
  renderAuth();
  await loadSupabaseData();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) authEmail.value = currentUser.email || '';
    if (!currentUser) {
      sosHistoryEvents = [];
      sosHistoryStatus = '';
      activeSosSession = null;
      renderSosHistory();
      renderActiveSosSession();
      syncActiveSosLocationAutoUpdate();
      showAuthMessage(authStatusMessages.signedOut);
    } else {
      loadSupabaseData();
    }
    renderAuth();
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
  syncSosTestModeToggle();

  renderContacts();
  renderProfile();
  renderLocation();
  activeSosSession = null;
  renderSosHistory();
  renderActiveSosSession();
  syncActiveSosLocationAutoUpdate();
  profileStatus.textContent = 'Τα αποθηκευμένα στοιχεία διαγράφηκαν από αυτή τη συσκευή.';
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
sosNativeShareButton.addEventListener('click', sharePreparedSosMessage);
sosModal.addEventListener('click', (event) => {
  if (event.target === sosModal) closeSosModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !sosModal.hidden) closeSosModal();
});
document.addEventListener('visibilitychange', () => {
  syncActiveSosLocationAutoUpdate();
  if (document.visibilityState === 'visible') autoUpdateActiveSosLocation();
});

authSignupButton.addEventListener('click', () => { authMode = 'signup'; });
authLoginButton.addEventListener('click', () => { authMode = 'login'; });
authForm.addEventListener('submit', handleAuthSubmit);
authLogoutButton.addEventListener('click', logout);
contactsForm.addEventListener('submit', addContact);
contactsList.addEventListener('click', handleContactsListClick);
clearContactsButton.addEventListener('click', clearTrustedContacts);
profileForm.addEventListener('submit', saveProfile);
clearDataButton.addEventListener('click', clearSafeMeData);
refreshLocationButton.addEventListener('click', refreshLocation);
shareLocationButton.addEventListener('click', shareLocation);
updateActiveSosLocationButton.addEventListener('click', updateActiveSosLocation);
copyActiveSosTrackingButton.addEventListener('click', copyActiveSosTrackingLink);
disableActiveSosTrackingButton.addEventListener('click', disableActiveSosTrackingLink);
endActiveSosButton.addEventListener('click', endActiveSosSession);

syncSosTestModeToggle();
renderContacts();
renderProfile();
renderLocation();
renderSosHistory();
renderActiveSosSession();
initializeAuth();
}

if (hasTrackingTokenParam) {
  initializePublicTrackingMode();
} else {
  initializeSafeMeApp();
}
