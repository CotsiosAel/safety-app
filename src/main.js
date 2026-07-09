import { t, getLocale, getDateLocale, getLanguageLabel, getPublicTrackingError, resolveLocaleFromUrl, readStoredLocale, persistLocale, setLocale, initLocale, registerLocaleChangeHandler, applyStaticTranslations, applyDomBindings, DEFAULT_LOCALE, STORAGE_KEY } from './i18n.js';

const DEFAULT_SUPABASE_URL = 'https://tkzgaejomyyrhbvfksas.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fIAQ-XIpZVUS2AoCdcfTLA_tXY6Ceq3';
const CONFIGURED_SUPABASE_URL = '__SAFE_ME_SUPABASE_URL__';
const CONFIGURED_SUPABASE_PUBLISHABLE_KEY = '__SAFE_ME_SUPABASE_PUBLISHABLE_KEY__';

function resolveSupabaseUrl() {
  const configured = String(CONFIGURED_SUPABASE_URL || '').trim();
  if (configured && !configured.startsWith('__SAFE_ME_')) return configured;
  return DEFAULT_SUPABASE_URL;
}

function resolveSupabasePublishableKey() {
  const configured = String(CONFIGURED_SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (configured && !configured.startsWith('__SAFE_ME_')) return configured;
  return DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}

const SUPABASE_URL = resolveSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = resolveSupabasePublishableKey();


let supabase = createOfflineSupabaseClient();
let isSupabaseReady = false;
let supabaseInitPromise = null;

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
    rpc: async () => ({ data: null, error: offlineError }),
  };
}

function hasSupabaseConfiguration() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

async function importSupabaseClientFactory() {
  const sources = [
    'https://esm.sh/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
  ];
  let lastError = null;

  for (const source of sources) {
    try {
      return await import(source);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Supabase SDK could not be loaded');
}

async function initializeSupabaseClientInternal() {
  if (!hasSupabaseConfiguration()) {
    isSupabaseReady = false;
    console.error('[SafeMe] Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for live tracking and account sync.');
    return false;
  }

  try {
    const { createClient } = await importSupabaseClientFactory();
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    isSupabaseReady = typeof supabase?.rpc === 'function' && typeof supabase?.from === 'function';
    if (!isSupabaseReady) {
      console.error('[SafeMe] Supabase client initialized without expected RPC/query methods.');
    }
    return isSupabaseReady;
  } catch (error) {
    isSupabaseReady = false;
    console.error('[SafeMe] Supabase SDK unavailable; continuing without remote sync', error);
    return false;
  }
}

function ensureSupabaseReady() {
  if (!supabaseInitPromise) {
    supabaseInitPromise = initializeSupabaseClientInternal();
  }
  return supabaseInitPromise;
}

async function initializeSupabaseClient() {
  return ensureSupabaseReady();
}

const SOS_TRACKING_BASE_URL = 'https://safety-app-vert.vercel.app/';
const APP_VERSION = 'startup-reliability-2026-07-03';
const APP_LOADED_AT = new Date();
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

function parsePublicTrackingToken() {
  const searchParams = new URLSearchParams(window.location.search);
  let rawToken = searchParams.get('track');
  if (rawToken === null) rawToken = searchParams.get('token');

  if (!rawToken && window.location.hash) {
    const hashValue = window.location.hash.replace(/^#/, '');
    if (hashValue.includes('=')) {
      const hashParams = new URLSearchParams(hashValue);
      rawToken = hashParams.get('track') ?? hashParams.get('token');
    }
  }

  if (!rawToken) return '';

  try {
    return decodeURIComponent(String(rawToken).replace(/\+/g, ' ')).trim();
  } catch {
    return String(rawToken).trim();
  }
}

const trackingParams = new URLSearchParams(window.location.search);
const trackingToken = parsePublicTrackingToken();
const hasTrackingTokenParam = trackingParams.has('track')
  || trackingParams.has('token')
  || Boolean(trackingToken);

if (hasTrackingTokenParam) {
  initLocale(resolveLocaleFromUrl() || readStoredLocale());
}

function getPageTitles() {
  return {
    home: t('pageTitle.home'),
    contacts: t('pageTitle.contacts'),
    'safety-tools': t('pageTitle.safetyTools'),
    profile: t('pageTitle.profile'),
    health: t('pageTitle.health'),
    settings: t('pageTitle.settings'),
  };
}

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
  safeWalkOutcome: 'safety-app-last-safe-walk-outcome',
  notificationHistory: 'safety-app-sos-notification-history',
  endedSosSession: 'safety-app-ended-sos-session',
  rememberedEmail: 'safeme_remembered_email',
  preferredLanguage: STORAGE_KEY,
};


function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });
}


function formatPublicTrackingDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(getDateLocale(), {
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

const SAFE_ME_SOS_LOCATION_LABEL = 'SafeMe SOS Location';

function getRoundedCoordinates(location) {
  return {
    lat: Number(location.latitude).toFixed(6),
    lng: Number(location.longitude).toFixed(6),
  };
}

function getCoordinatesCopyText(location) {
  const { lat, lng } = getRoundedCoordinates(location);
  return `${lat},${lng}`;
}

function getAppleMapsPinUrl(location) {
  const { lat, lng } = getRoundedCoordinates(location);
  return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(SAFE_ME_SOS_LOCATION_LABEL)}`;
}

function getAppleMapsNavigationUrl(location) {
  const { lat, lng } = getRoundedCoordinates(location);
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
}

function getLocationUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${getCoordinatesCopyText(location)}`;
}

function getNavigationUrl(location) {
  return `https://www.google.com/maps/dir/?api=1&destination=${getCoordinatesCopyText(location)}&travelmode=driving`;
}

function getGoogleMapsEmbedUrl(location) {
  const { lat, lng } = getRoundedCoordinates(location);
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}

function buildPublicTrackingDiagnosticCode(details = {}) {
  const segments = ['PT'];
  const transport = String(details.transport || 'app').replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase() || 'APP';
  segments.push(transport);

  const code = String(details.code || details.reason || 'unknown')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 16)
    .toUpperCase() || 'UNKNOWN';
  segments.push(code);

  if (details.status) segments.push(String(details.status));
  return segments.join('-');
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
        <p class="eyebrow">${escapeHtml(t('publicTracking.eyebrow'))}</p>
        <h1>${escapeHtml(t('publicTracking.title'))}</h1>
        ${content}
      </section>
    `;
  };

  if (state.loading) {
    renderShell(`<p class="public-tracking-muted">${escapeHtml(t('publicTracking.loading'))}</p>`);
    return;
  }

  if (state.error) {
    const diagnosticMarkup = state.diagnosticCode
      ? `<p class="public-tracking-diagnostics"><small>${escapeHtml(t('publicTracking.diagnosticCode', { code: state.diagnosticCode }))}</small></p>`
      : '';
    renderShell(`<p class="public-tracking-error">${escapeHtml(state.error)}</p>${diagnosticMarkup}`);
    return;
  }

  const session = state.session;
  const hasLocation = publicTrackingHasLocation(session);
  const trackingLocation = hasLocation
    ? { latitude: session.latestLatitude, longitude: session.latestLongitude }
    : null;
  const coordinates = trackingLocation ? getCoordinatesCopyText(trackingLocation) : '';
  const mapsUrl = trackingLocation ? getLocationUrl(trackingLocation) : '';
  const googleMapsNavigationUrl = trackingLocation ? getNavigationUrl(trackingLocation) : '';
  const appleMapsNavigationUrl = trackingLocation ? getAppleMapsNavigationUrl(trackingLocation) : '';
  const embedMapUrl = trackingLocation ? getGoogleMapsEmbedUrl(trackingLocation) : '';
  const isActive = session.status === 'active';
  const statusText = isActive ? t('publicTracking.statusActive') : t('publicTracking.statusEnded');
  const statusBanner = isActive
    ? `<p class="public-tracking-status-banner public-tracking-status-banner-active">${escapeHtml(t('publicTracking.bannerActive'))}</p>`
    : `<p class="public-tracking-status-banner public-tracking-status-banner-ended">${escapeHtml(t('publicTracking.bannerEnded'))}</p>`;

  page.innerHTML = `
    <section class="public-tracking-card" aria-live="polite">
      <p class="eyebrow">${escapeHtml(t('publicTracking.eyebrow'))}</p>
      <h1>${escapeHtml(t('publicTracking.title'))}</h1>
      ${statusBanner}
      <dl class="public-tracking-details">
        <div><dt>${escapeHtml(t('publicTracking.status'))}</dt><dd>${escapeHtml(statusText)}</dd></div>
        <div><dt>${escapeHtml(t('publicTracking.started'))}</dt><dd>${escapeHtml(formatPublicTrackingDate(session.startedAt))}</dd></div>
        <div><dt>${escapeHtml(t('publicTracking.lastLocation'))}</dt><dd>${escapeHtml(formatPublicTrackingDate(session.latestLocationAt))}</dd></div>
        <div><dt>${escapeHtml(t('publicTracking.lastRefresh'))}</dt><dd>${escapeHtml(formatPublicTrackingDate(state.refreshedAt))}</dd></div>
      </dl>

      <section class="public-tracking-guidance" aria-labelledby="public-tracking-guidance-title">
        <h2 id="public-tracking-guidance-title">${escapeHtml(t('publicTracking.guidanceTitle'))}</h2>
        <ol>
          <li>${escapeHtml(t('publicTracking.step1'))}</li>
          <li>${escapeHtml(t('publicTracking.step2'))}</li>
          <li>${escapeHtml(t('publicTracking.step3'))}</li>
        </ol>
      </section>

      ${hasLocation
        ? `<section class="public-tracking-location" aria-labelledby="public-tracking-location-title">
            <h2 id="public-tracking-location-title">${escapeHtml(t('publicTracking.locationTitle'))}</h2>
            <div class="public-tracking-map-embed">
              <iframe
                title="${escapeHtml(t('publicTracking.mapTitle'))}"
                src="${escapeHtml(embedMapUrl)}"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                allowfullscreen>
              </iframe>
            </div>
            <p class="public-tracking-location-note">${escapeHtml(t('publicTracking.locationNote'))}</p>
            <p class="public-tracking-coordinates">${escapeHtml(t('publicTracking.coordinates', { coords: coordinates }))}</p>
            <button class="public-tracking-copy-coordinates" id="public-tracking-copy-coordinates" type="button">${escapeHtml(t('publicTracking.copyCoordinates'))}</button>
          </section>`
        : `<p class="public-tracking-no-location">${escapeHtml(t('publicTracking.noLocation'))}</p>`}

      <div class="public-tracking-actions">
        ${hasLocation ? `<a class="public-tracking-action public-tracking-action-primary" href="${escapeHtml(googleMapsNavigationUrl)}" target="_blank" rel="noopener">${escapeHtml(t('publicTracking.navigateGoogle'))}</a>` : ''}
        ${hasLocation ? `<a class="public-tracking-action" href="${escapeHtml(appleMapsNavigationUrl)}" target="_blank" rel="noopener">${escapeHtml(t('publicTracking.navigateApple'))}</a>` : ''}
        ${hasLocation ? `<a class="public-tracking-action" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener">${escapeHtml(t('publicTracking.openGoogle'))}</a>` : ''}
        <button class="public-tracking-action" id="public-tracking-refresh" type="button">${escapeHtml(t('publicTracking.refreshLocation'))}</button>
        <a class="public-tracking-action public-tracking-call" href="tel:112">${escapeHtml(t('common.call112'))}</a>
        <a class="public-tracking-action public-tracking-call" href="tel:199">${escapeHtml(t('common.call199'))}</a>
      </div>

      ${isActive ? `<p class="public-tracking-auto-refresh">${escapeHtml(t('publicTracking.autoRefresh'))}</p>` : ''}
    </section>
  `;
  document.querySelector('#public-tracking-refresh')?.addEventListener('click', fetchPublicTrackingSession);
  document.querySelector('#public-tracking-copy-coordinates')?.addEventListener('click', async () => {
    if (!trackingLocation) return;

    const copyButton = document.querySelector('#public-tracking-copy-coordinates');
    const copyLabel = t('publicTracking.copyCoordinates');
    try {
      await copyTextToClipboard(getCoordinatesCopyText(trackingLocation));
      if (copyButton) {
        copyButton.textContent = t('common.copied');
        window.setTimeout(() => {
          copyButton.textContent = copyLabel;
        }, 2000);
      }
    } catch (error) {
      if (copyButton) {
        copyButton.textContent = t('common.copyFailed');
        window.setTimeout(() => {
          copyButton.textContent = copyLabel;
        }, 2000);
      }
    }
  });
}
let publicTrackingRefreshTimer = null;

function warnPublicTrackingError(error, details = {}) {
  const diagnosticCode = buildPublicTrackingDiagnosticCode({
    transport: details.transport,
    code: details.code || error?.code,
    reason: details.reason,
    status: details.status || error?.status || error?.details?.status || null,
  });
  const payload = {
    diagnosticCode,
    message: error?.message || String(error || ''),
    status: details.status || error?.status || error?.details?.status || null,
    code: details.code || error?.code || null,
    reason: details.reason || null,
    transport: details.transport || null,
    isSupabaseReady,
    hasSupabaseConfiguration: hasSupabaseConfiguration(),
    trackingTokenPresent: Boolean(trackingToken),
    ...details,
  };
  console.error('[SafeMe] Public tracking error', payload);
  return diagnosticCode;
}

function isPublicTrackingPermissionError(error) {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status || 0);

  return status === 401
    || status === 403
    || code === '42501'
    || code === 'PGRST301'
    || message.includes('permission denied')
    || message.includes('row-level security')
    || message.includes('invalid api key');
}

function isPublicTrackingNetworkError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('failed to fetch')
    || message.includes('networkerror')
    || message.includes('network request failed')
    || message.includes('load failed');
}

function isPublicTrackingRpcError(error) {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code.startsWith('PGRST')
    || message.includes('schema cache')
    || message.includes('could not find the function')
    || message.includes('rpc failed');
}

function isPublicTrackingRenderError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error instanceof ReferenceError
    || error instanceof TypeError
    || message.includes('is not defined')
    || message.includes('is not a function');
}

function resolvePublicTrackingLoadError(error, { reason } = {}) {
  if (reason === 'missing_config' || reason === 'supabase_not_ready') {
    return getPublicTrackingError('notReady');
  }
  if (isPublicTrackingPermissionError(error)) {
    return getPublicTrackingError('permissionDenied');
  }
  if (isPublicTrackingRpcError(error)) {
    return getPublicTrackingError('permissionDenied');
  }
  if (isPublicTrackingNetworkError(error)) {
    return getPublicTrackingError('networkError');
  }
  if (isPublicTrackingRenderError(error)) {
    return getPublicTrackingError('notReady');
  }
  return getPublicTrackingError('networkError');
}

function normalizePublicTrackingRpcResult(data) {
  if (Array.isArray(data)) return normalizePublicSosSession(data[0]);
  if (data && typeof data === 'object') return normalizePublicSosSession(data);
  return null;
}

async function loadPublicSosSessionByTokenViaRest(token, { viaFallback = false } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_sos_session_by_token`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `RPC failed (${response.status})`);
    error.status = response.status;
    error.code = payload?.code || null;
    error.transport = viaFallback ? 'rest_fallback' : 'rest';
    throw error;
  }

  return {
    session: normalizePublicTrackingRpcResult(payload),
    transport: viaFallback ? 'rest_fallback' : 'rest',
  };
}

async function loadPublicSosSessionByToken(token) {
  const ready = await ensureSupabaseReady();
  let sdkError = null;

  if (ready && typeof supabase?.rpc === 'function') {
    try {
      const { data, error } = await supabase.rpc('get_sos_session_by_token', { token });
      if (error) throw error;
      return {
        session: normalizePublicTrackingRpcResult(data),
        transport: 'sdk_rpc',
      };
    } catch (error) {
      sdkError = error;
      error.transport = 'sdk_rpc';
    }
  }

  try {
    return await loadPublicSosSessionByTokenViaRest(token, { viaFallback: Boolean(sdkError) });
  } catch (restError) {
    if (sdkError) restError.sdkErrorMessage = sdkError.message;
    throw restError;
  }
}

async function fetchPublicTrackingSession() {
  if (!trackingToken) {
    const error = new Error('Missing public tracking token');
    const diagnosticCode = warnPublicTrackingError(error, { code: 'missing_token', reason: 'invalid_token' });
    renderPublicTrackingPage({ error: getPublicTrackingError('invalidToken'), diagnosticCode });
    return;
  }

  if (!hasSupabaseConfiguration()) {
    const error = new Error('Missing Supabase configuration for public tracking');
    const diagnosticCode = warnPublicTrackingError(error, { code: 'missing_config', reason: 'not_ready' });
    renderPublicTrackingPage({ error: getPublicTrackingError('notReady'), diagnosticCode });
    return;
  }

  renderPublicTrackingPage({ loading: true });

  try {
    const { session, transport } = await loadPublicSosSessionByToken(trackingToken);
    if (!session) {
      const diagnosticCode = warnPublicTrackingError(new Error('No SOS session for token'), {
        code: 'invalid_token',
        reason: 'invalid_token',
        transport,
      });
      renderPublicTrackingPage({ error: getPublicTrackingError('invalidToken'), diagnosticCode });
      return;
    }

    renderPublicTrackingPage({ session, refreshedAt: new Date().toISOString() });

    window.clearInterval(publicTrackingRefreshTimer);
    publicTrackingRefreshTimer = session.status === 'active'
      ? window.setInterval(fetchPublicTrackingSession, 20000)
      : null;
  } catch (error) {
    window.clearInterval(publicTrackingRefreshTimer);
    publicTrackingRefreshTimer = null;

    let reason = 'network_error';
    if (isPublicTrackingRenderError(error)) reason = 'render_error';
    else if (isPublicTrackingPermissionError(error)) reason = 'permission_denied';
    else if (isPublicTrackingRpcError(error)) reason = 'rpc_error';
    else if (!isSupabaseReady) reason = 'not_ready';

    const diagnosticCode = warnPublicTrackingError(error, {
      code: error?.code || 'load_failed',
      reason,
      status: error?.status || null,
      transport: error?.transport || null,
    });
    renderPublicTrackingPage({
      error: resolvePublicTrackingLoadError(error, { reason }),
      diagnosticCode,
    });
  }
}

async function initializePublicTrackingMode() {
  document.body.classList.add('tracking-mode');
  renderPublicTrackingPage({ loading: true });
  await fetchPublicTrackingSession();
}

function initializeSafeMeAppUnsafe() {
const PASSWORD_RESET_REDIRECT_URL = 'https://safety-app-vert.vercel.app/';

if (!hasTrackingTokenParam) {
  initLocale(readStoredLocale());
}

function getAuthStatusMessages() {
  return {
    signedOut: t('auth.signedOut'),
    signedIn: t('auth.signedIn'),
    signupSuccess: t('auth.signupSuccess'),
    signupPendingConfirmation: t('auth.signupPending'),
    logoutSuccess: t('auth.logoutSuccess'),
    passwordResetSent: t('auth.passwordResetSent'),
    passwordResetReady: t('auth.passwordResetReady'),
    passwordResetSuccess: t('auth.passwordResetSuccess'),
    networkError: t('auth.networkError'),
  };
}

registerLocaleChangeHandler(refreshAllLocalizedUi);
applyStaticTranslations();

const navButtons = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.querySelector('#page-title');
const sosButton = document.querySelector('#sos-button');
const sosStatus = document.querySelector('#sos-status');
const sosAccountStatus = document.querySelector('#sos-account-status');
const accountSyncBanner = document.querySelector('#account-sync-banner');
const accountSyncTitle = document.querySelector('#account-sync-title');
const accountSyncMessage = document.querySelector('#account-sync-message');
const accountSyncLoginButton = document.querySelector('#account-sync-login-button');
const sosTestModeToggle = document.querySelector('#sos-test-mode');
const homeSosTestModeToggle = document.querySelector('#home-sos-test-mode');
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
const contactsSyncStatus = document.querySelector('#contacts-sync-status');
const contactsSyncDiagnostics = document.querySelector('#contacts-sync-diagnostics');
const contactsSummaryLine = document.querySelector('#contacts-summary-line');
const contactsAddCta = document.querySelector('#contacts-add-cta');
const contactsSyncSummary = document.querySelector('#contacts-sync-summary');
const contactsAccordionCards = Array.from(document.querySelectorAll('[data-contacts-accordion]'));
const refreshAccountContactsButton = document.querySelector('#refresh-account-contacts');
const uploadLocalContactsButton = document.querySelector('#upload-local-contacts');
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
const profileDetailName = document.querySelector('#profile-detail-name');
const profileDetailPhone = document.querySelector('#profile-detail-phone');
const profileEditToggle = document.querySelector('#profile-edit-toggle');
const profileStatusLoginButton = document.querySelector('#profile-status-login-button');
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
const settingsLanguageSelect = document.querySelector('#settings-language-select');
const settingsAccordionButtons = document.querySelectorAll('.settings-panel-toggle');
const settingsStatus = document.querySelector('#settings-status');
const settingsVersionValue = document.querySelector('#settings-app-version');
const settingsLoadedAtValue = document.querySelector('#settings-app-loaded-at');
const settingsHostValue = document.querySelector('#settings-app-host');
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
const rememberEmailCheckbox = document.querySelector('#remember-email');
const rememberEmailOption = document.querySelector('#remember-email-option');
const rememberEmailHelper = document.querySelector('#remember-email-helper');
const authRepeatPassword = document.querySelector('#auth-repeat-password');
const authModeTabs = document.querySelector('#auth-mode-tabs');
const authLoginTab = document.querySelector('#auth-login-tab');
const authSignupTab = document.querySelector('#auth-signup-tab');
const authSubmitButton = document.querySelector('#auth-submit-button');
const authTitle = document.querySelector('#auth-title');
const authHelper = document.querySelector('#auth-helper');
const authLiveTrackingNote = document.querySelector('.auth-live-tracking-note');
const authSwitchModeButton = document.querySelector('#auth-switch-mode');
const authSecondaryLinks = document.querySelector('#auth-secondary-links');
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
const homeReadinessCard = document.querySelector('#home-readiness-card');
const homeOnlineStatus = document.querySelector('#home-online-status');
const homeAccountStatus = document.querySelector('#home-account-status');
const homeContactsStatus = document.querySelector('#home-contacts-status');
const homeLocationStatus = document.querySelector('#home-location-status');
const homeSosModeStatus = document.querySelector('#home-sos-mode-status');
const homeReadinessMessage = document.querySelector('#home-readiness-message');
const homeTestModeBadge = document.querySelector('#home-test-mode-badge');
const homeTestModeHelper = document.querySelector('#home-test-mode-helper');
const accountReadinessText = document.querySelector('#account-readiness-text');
const homeLoginSyncCta = document.querySelector('#home-login-sync-cta');
const homeAddContactCta = document.querySelector('#home-add-contact-cta');
const safetyToolsTestSosButton = document.querySelector('#safety-tools-test-sos');
const profileAccordionCards = Array.from(document.querySelectorAll('[data-profile-accordion]'));
const profileDetailsSummary = document.querySelector('#profile-details-summary');
const profileSosSummary = document.querySelector('#profile-sos-summary');
const profileAccountSummary = document.querySelector('#profile-account-summary');

function setContactsAccordionOpen(card, isOpen) {
  if (!card) return;
  const button = card.querySelector('.profile-accordion-button');
  const panel = button ? document.querySelector(`#${button.getAttribute('aria-controls')}`) : null;
  button?.setAttribute('aria-expanded', String(isOpen));
  card.classList.toggle('is-open', isOpen);
  if (panel) panel.hidden = !isOpen;
}

function openContactsAccordion(name, { focusTarget = null } = {}) {
  const target = contactsAccordionCards.find((card) => card.dataset.contactsAccordion === name);
  contactsAccordionCards.forEach((card) => setContactsAccordionOpen(card, card === target));
  if (target) {
    const panel = target.querySelector('.profile-accordion-panel');
    window.setTimeout(() => focusElementAfterScroll(panel || target, focusTarget || panel || target), 80);
  }
  updateContactsAddCtaLabel();
}

contactsAccordionCards.forEach((card) => {
  const button = card.querySelector('.profile-accordion-button');
  if (!button) return;
  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    contactsAccordionCards.forEach((item) => setContactsAccordionOpen(item, false));
    setContactsAccordionOpen(card, !isOpen);
    updateContactsAddCtaLabel();
  });
});

function isContactsAddFormOpen() {
  return Boolean(document.querySelector('[data-contacts-accordion="add"]')?.classList.contains('is-open'));
}

function updateContactsAddCtaLabel() {
  if (!contactsAddCta) return;
  const emptyLabel = contacts.length === 0 ? t('contacts.addFirstContact') : t('contacts.addContact');
  contactsAddCta.textContent = isContactsAddFormOpen() ? t('contacts.closeForm') : emptyLabel;
}

function closeContactsAddForm() {
  const addCard = contactsAccordionCards.find((card) => card.dataset.contactsAccordion === 'add');
  setContactsAccordionOpen(addCard, false);
  updateContactsAddCtaLabel();
}

function toggleContactsAddForm() {
  if (isContactsAddFormOpen()) {
    closeContactsAddForm();
    contactsAddCta?.focus();
    return;
  }
  openContactsAccordion('add', { focusTarget: contactsForm?.elements?.name || contactsForm });
}

contactsAddCta?.addEventListener('click', toggleContactsAddForm);

function setProfileAccordionOpen(card, isOpen) {
  if (!card) return;
  const button = card.querySelector('.profile-accordion-button');
  const panel = button ? document.querySelector(`#${button.getAttribute('aria-controls')}`) : null;
  button?.setAttribute('aria-expanded', String(isOpen));
  card.classList.toggle('is-open', isOpen);
  if (panel) panel.hidden = !isOpen;
}

function openProfileAccordion(name, { focusTarget = null } = {}) {
  const target = profileAccordionCards.find((card) => card.dataset.profileAccordion === name);
  profileAccordionCards.forEach((card) => setProfileAccordionOpen(card, card === target));
  if (target) {
    const panel = target.querySelector('.profile-accordion-panel, #profile-form');
    window.setTimeout(() => focusElementAfterScroll(panel || target, focusTarget || panel || target), 80);
  }
}

profileAccordionCards.forEach((card) => {
  const button = card.querySelector('.profile-accordion-button');
  if (!button) return;
  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    profileAccordionCards.forEach((item) => setProfileAccordionOpen(item, false));
    setProfileAccordionOpen(card, !isOpen);
  });
});

const contactsReadinessText = document.querySelector('#contacts-readiness-text');
const locationReadinessText = document.querySelector('#location-readiness-text');
const sosHistoryList = document.querySelector('#sos-history-list');
const sosHistoryLast = document.querySelector('#sos-history-last');
const sosHistoryCount = document.querySelector('#sos-history-count');
const sosHistoryToggleButton = document.querySelector('#sos-history-toggle');
const sosHistoryShowAllButton = document.querySelector('#sos-history-show-all');
const sosHistoryCollapseButton = document.querySelector('#sos-history-collapse');
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
const copyActiveSosMessageButton = document.querySelector('#copy-active-sos-message');
const activeSosWhatsappButton = document.querySelector('#active-sos-whatsapp');
const activeSosEmailButton = document.querySelector('#active-sos-email');
const activeSosLocationNote = document.querySelector('#active-sos-location-note');
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
  showGlobalSafetyMessage(t('global.errorRecover'));
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[SafeMe] Unhandled promise rejection', event.reason);
  showGlobalSafetyMessage(t('global.errorRecover'));
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
    const shouldRefresh = window.confirm(t('pullRefresh.blocked'));
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
      if (currentUser) autoRefreshAccountContactsFromSupabase('visible').catch((error) => console.warn('[SafeMe] Background contacts refresh failed', error));
    }
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) checkForAppUpdate({ force: true });
  });
  window.addEventListener('online', () => {
    renderSettingsSummary();
    renderHomeReadinessCards();
    checkForAppUpdate({ force: true });
    if (currentUser) autoRefreshAccountContactsFromSupabase('online').catch((error) => console.warn('[SafeMe] Online contacts refresh failed', error));
    if (hasRequestedLocationPermission) refreshLocation();
  });
  window.addEventListener('offline', () => { renderSettingsSummary(); renderHomeReadinessCards(); });
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
  window.setTimeout(() => setPullRefreshState('idle', t('pullRefresh.pull')), delay);
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
      setPullRefreshState('idle', t('pullRefresh.pull'));
      return;
    }

    pullDistance = Math.min(maxPull, deltaY * 0.45);
    const ready = pullDistance >= threshold;
    setPullRefreshState(ready ? 'ready' : 'pulling', ready ? t('pullRefresh.release') : t('pullRefresh.pull'), { offset: pullDistance });
  }, { passive: true });

  window.addEventListener('touchend', async () => {
    if (!isPulling) return;
    isPulling = false;

    if (pullDistance < threshold) {
      setPullRefreshState('idle', t('pullRefresh.pull'));
      return;
    }

    if (isActiveSosInProgress()) {
      setPullRefreshState('blocked', t('pullRefresh.blocked'), { offset: 18, showManual: true });
      resetPullRefreshIndicator(4200);
      return;
    }

    isRefreshing = true;
    setPullRefreshState('refreshing', t('pullRefresh.refreshing'), { offset: 18 });
    try {
      await refreshAppDataForPull();
      setPullRefreshState('done', t('pullRefresh.done'), { offset: 18 });
    } catch {
      setPullRefreshState('done', t('pullRefresh.failed'), { offset: 18 });
    } finally {
      isRefreshing = false;
      resetPullRefreshIndicator(1600);
    }
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    isPulling = false;
    if (!isRefreshing) setPullRefreshState('idle', t('pullRefresh.pull'));
  }, { passive: true });
}

function getActiveSosEmergencyMessage() {
  return buildSosMessage(currentLocation, activeSosSession?.shareToken);
}

function normalizeSmsRecipient(phone) {
  return normalizePhone(String(phone || '').trim().replace(/\s+/g, ' '));
}

function getUniqueSmsRecipients(recipients = []) {
  const seenRecipients = new Set();

  return recipients.reduce((uniqueRecipients, recipient) => {
    const normalizedRecipient = normalizeSmsRecipient(recipient);
    if (!normalizedRecipient || seenRecipients.has(normalizedRecipient)) return uniqueRecipients;

    seenRecipients.add(normalizedRecipient);
    uniqueRecipients.push(normalizedRecipient);
    return uniqueRecipients;
  }, []);
}

function getSmsCapableSosContacts() {
  const seenPhones = new Set();

  return contacts.filter((contact) => {
    const normalizedPhone = normalizeSmsRecipient(contact.phone || '');
    if (!normalizedPhone || seenPhones.has(normalizedPhone)) return false;

    seenPhones.add(normalizedPhone);
    return true;
  });
}


function getContactDisplayName(contact) {
  return contact?.name?.trim() || t('common.contact');
}

function getActiveSosSmsQueueMode() {
  return isSosTestMode ? 'test' : 'live';
}

function getActiveSosSmsQueueSignature(contactsList) {
  return contactsList.map((contact) => normalizeSmsRecipient(contact.phone)).join('|');
}

function resetActiveSosSmsQueue() {
  const queueContacts = getSmsCapableSosContacts();
  activeSosSmsQueue = {
    mode: getActiveSosSmsQueueMode(),
    signature: getActiveSosSmsQueueSignature(queueContacts),
    contacts: queueContacts,
    openedCount: 0,
    lastSmsContact: null,
  };
  renderSosContactNotifications();
}

function ensureActiveSosSmsQueue() {
  const queueContacts = getSmsCapableSosContacts();
  const mode = getActiveSosSmsQueueMode();
  const signature = getActiveSosSmsQueueSignature(queueContacts);
  if (!activeSosSmsQueue || activeSosSmsQueue.mode !== mode || activeSosSmsQueue.signature !== signature) {
    activeSosSmsQueue = {
      mode,
      signature,
      contacts: queueContacts,
      openedCount: 0,
      lastSmsContact: null,
    };
  }
  return activeSosSmsQueue;
}

function getActiveSosSmsQueueButtonLabel(queue = ensureActiveSosSmsQueue()) {
  const total = queue.contacts.length;
  if (!total) return t('sos.notifyAllCapable');
  if (queue.openedCount >= total) return t('sos.smsQueueComplete');
  const contact = queue.contacts[queue.openedCount];
  const prefix = queue.mode === 'test' ? t('sos.testSms') : 'SMS';
  return t('sos.smsQueueProgress', { prefix, current: queue.openedCount + 1, total, name: getContactDisplayName(contact) });
}

function getActiveSosSmsQueueProgressText(queue = ensureActiveSosSmsQueue()) {
  const total = queue.contacts.length;
  const opened = Math.min(queue.openedCount, total);
  const status = total && opened >= total
    ? t('sos.queueComplete')
    : queue.lastSmsContact
      ? t('sos.openedForContact', { name: getContactDisplayName(queue.lastSmsContact) })
      : t('sos.willOpenSms');
  return t('sos.smsContactsProgress', { opened, total, status });
}

function getEmailCapableSosContacts() {
  return contacts.filter((contact) => contact.email);
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function isRemoteSosSession(session = activeSosSession) {
  return Boolean(currentUser && session && isValidUuid(session.id) && session.userId === currentUser.id);
}

function openSmsComposer(message, recipient) {
  const cleanRecipient = normalizeSmsRecipient(Array.isArray(recipient) ? recipient[0] : recipient);
  if (!cleanRecipient) return false;

  window.location.href = `sms:${cleanRecipient}?&body=${encodeURIComponent(message)}`;
  return true;
}

function logSosNotification(contact, method, status) {
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, contactName: contact?.name || t('common.allContacts'), method, status, at: new Date().toISOString() };
  sosNotificationHistory = [entry, ...sosNotificationHistory].slice(0, 12);
  saveJson(storageKeys.notificationHistory, sosNotificationHistory);
  renderSosNotificationHistory();
}

function formatSosNotificationStatus(status) {
  const translatedStatuses = {
    Opened: t('sos.opened'),
    Copied: t('common.copied'),
    Failed: t('sos.failed'),
    Sent: t('sos.sent'),
  };
  return translatedStatuses[status] || status;
}

function renderSosNotificationHistory() {
  if (!sosNotificationHistoryList) return;
  if (!sosNotificationHistory.length) {
    sosNotificationHistoryList.innerHTML = `<p class="sos-notification-empty">${escapeHtml(t('sos.notificationHistory'))}</p>`;
    return;
  }
  sosNotificationHistoryList.innerHTML = sosNotificationHistory.map((entry) => `
    <article class="sos-notification-history-item">
      <strong>${escapeHtml(entry.contactName)}</strong>
      <span>${escapeHtml(entry.method)} • ${escapeHtml(formatSosEventTime(entry.at))}</span>
      <em>${escapeHtml(formatSosNotificationStatus(entry.status))}</em>
    </article>
  `).join('');
}

function renderSosContactNotifications() {
  if (!sosContactNotify || !sosContactList) return;
  const hasActive = isActiveSosInProgress();
  sosContactNotify.hidden = !hasActive;
  if (!hasActive) return;

  const trackingUrl = getSosTrackingUrl(activeSosSession?.shareToken);
  const smsCapableContacts = getSmsCapableSosContacts();
  const hasSmsCapableContacts = smsCapableContacts.length > 0;
  const smsQueue = ensureActiveSosSmsQueue();
  notifyAllSosContactsButton.disabled = !hasSmsCapableContacts;
  notifyAllSosContactsButton.textContent = getActiveSosSmsQueueButtonLabel(smsQueue);
  if (notifyAllSosContactsActionButton) {
    notifyAllSosContactsActionButton.disabled = !hasSmsCapableContacts;
    notifyAllSosContactsActionButton.textContent = getActiveSosSmsQueueButtonLabel(smsQueue);
  }
  const baseSosContactWarning = isSosTestMode
    ? t('sos.testSmsQueue')
    : !trackingUrl
      ? t('sos.noTrackingNote')
      : contacts.length === 0
        ? t('sos.noTrustedContacts')
        : !hasSmsCapableContacts
          ? t('sos.noPhoneContacts')
          : t('sos.prepareSmsEach');
  sosContactWarning.textContent = hasSmsCapableContacts
    ? `${baseSosContactWarning} ${getActiveSosSmsQueueProgressText(smsQueue)}`
    : baseSosContactWarning;

  if (contacts.length === 0) {
    sosContactList.innerHTML = `<article class="sos-contact-empty"><strong>${escapeHtml(t('sos.noTrustedContacts'))}</strong><p>${escapeHtml(t('sos.addContactForSms'))}</p><button class="ghost-button" type="button" data-sos-open-contacts>${escapeHtml(t('contacts.addContact'))}</button></article>`;
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
        <div><strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.relationship || t('common.emergencyContact'))}</span></div>
        ${!hasPhone && !hasEmail ? `<p class="sos-contact-missing">${escapeHtml(t('contacts.missingPhone'))}</p>` : ''}
        <div class="sos-contact-notify-actions">
          <a class="danger-button" href="${escapeHtml(getSmsLink(contact, message))}" data-sos-notify-index="${index}" data-sos-method="SMS" ${!hasPhone ? 'aria-disabled="true" tabindex="-1"' : ''}>SMS</a>
          <a class="ghost-button" href="${escapeHtml(getWhatsappLink(message, contact))}" target="_blank" rel="noopener" data-sos-notify-index="${index}" data-sos-method="WhatsApp" ${!hasPhone ? 'aria-disabled="true" tabindex="-1"' : ''}>WhatsApp</a>
          ${hasEmail ? `<a class="ghost-button" href="${escapeHtml(getEmailLink(contact, message))}" data-sos-notify-index="${index}" data-sos-method="Email">Email</a>` : ''}
          <button class="ghost-button" type="button" data-sos-copy-contact="${index}">${escapeHtml(t('common.copy'))}</button>
        </div>
      </article>`;
  }).join('') + (hasSmsCapableContacts ? `<article class="sos-contact-notify-card"><div><strong>${escapeHtml(t('sos.smsQueueComplete'))}</strong><span>` + escapeHtml(getActiveSosSmsQueueProgressText(smsQueue)) + `</span></div><div class="sos-contact-notify-actions"><button class="ghost-button" type="button" data-sos-reset-sms-queue>${escapeHtml(t('sos.resetSmsQueue'))}</button></div></article>` : '');
  renderSosNotificationHistory();
}

async function notifyAllSosContacts() {
  const message = getActiveSosEmergencyMessage();
  const smsQueue = ensureActiveSosSmsQueue();

  if (smsQueue.contacts.length === 0) {
    showPage('contacts');
    renderActiveSosSession(t('sos.addContactForSms'));
    return;
  }

  if (smsQueue.openedCount >= smsQueue.contacts.length) {
    renderActiveSosSession(t('runtime.smsOpenedAll'));
    renderSosContactNotifications();
    return;
  }

  const contact = smsQueue.contacts[smsQueue.openedCount];
  const contactName = getContactDisplayName(contact);
  const opened = openSmsComposer(message, contact.phone);
  if (!opened) {
    renderActiveSosSession(t('runtime.smsOpenFailed', { name: contactName }));
    renderSosContactNotifications();
    return;
  }

  smsQueue.openedCount += 1;
  smsQueue.lastSmsContact = contact;
  logSosNotification(contact, 'SMS', t('sos.opened'));

  if (smsQueue.openedCount >= smsQueue.contacts.length) {
    renderActiveSosSession(t('runtime.smsOpenedAllDetail', { name: contactName }));
  } else {
    renderActiveSosSession(t('runtime.smsOpenedContinue', { name: contactName }));
  }
  renderSosContactNotifications();
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
let isContactsRefreshInProgress = false;
let contactsSyncState = 'local';
let lastContactsAutoRefreshAt = 0;
const CONTACTS_AUTO_REFRESH_THROTTLE_MS = 30 * 1000;
let contactsSyncDiagnosticsState = {
  lastLoadAt: null,
  lastSaveAt: null,
  remoteCount: null,
  lastError: '',
  message: '',
};
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
let isSosHistoryExpanded = false;
let isSosHistoryShowingAll = false;
let activeSosSession = null;
let isActiveSosSessionRestored = false;
let activeSosLocationUpdateTimer = null;
let activeSosLocationWatcherId = null;
let isAutoUpdatingActiveSosLocation = false;
let activeSosLastAutoUpdateAt = null;
let activeSosDiagnostics = {
  permissionStatus: t('common.status'),
  lastGpsUpdateAt: currentLocation?.updatedAt || null,
  lastSupabaseSyncAt: null,
  lastSupabaseSyncResult: '—',
  lastErrorMessage: '',
};
let locationPermissionStatus = null;
let sosNotificationHistory = loadJson(storageKeys.notificationHistory, []);
let activeSosSmsQueue = null;
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

function clearActiveSosRuntimeState({ message = t('sos.previousEnded'), endedSession = activeSosSession, status = 'ended' } = {}) {
  if (endedSession) markSosSessionEnded(endedSession, status);
  stopActiveSosLocationAutoUpdate();
  activeSosSession = null;
  isActiveSosSessionRestored = false;
  isAutoUpdatingActiveSosLocation = false;
  activeSosLastAutoUpdateAt = null;
  activeSosSmsQueue = null;
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
  if (!name) return t('contacts.validationName');
  if (!relationship) return t('contacts.validationRelationship');
  if (!phone && !email) return t('contacts.validationPhoneOrEmail');
  if (phone && !isValidPhoneNumber(phone)) return t('contacts.validationPhone');
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return t('contacts.validationEmail');

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
  const remoteContactId = typeof contact.id === 'string' && !contact.id.startsWith('local-') ? contact.id : undefined;
  return {
    ...(remoteContactId ? { id: remoteContactId } : {}),
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
    medicalNotes: savedProfile.medical_note || savedProfile.medical_notes || savedProfile.medicalNotes || '',
    preferredLanguage: savedProfile.preferred_language || savedProfile.preferredLanguage || 'en',
    createdAt: savedProfile.created_at || savedProfile.createdAt || null,
    updatedAt: savedProfile.updated_at || savedProfile.updatedAt || null,
  });
}

function mapProfileToSupabase(savedProfile) {
  return {
    id: currentUser.id,
    name: savedProfile.name,
    phone: savedProfile.phone,
    medical_note: normalizeMedicalNotes(savedProfile.medicalNotes) || null,
    medical_notes: normalizeMedicalNotes(savedProfile.medicalNotes) || null,
    preferred_language: savedProfile.preferredLanguage || 'en',
    updated_at: new Date().toISOString(),
  };
}

function persistContactsLocally() {
  contacts = normalizeContactsForStorage(contacts);
  saveJsonOrThrow(storageKeys.contacts, contacts);
}

function formatContactsSyncTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString(getDateLocale(), { hour: '2-digit', minute: '2-digit' });
}

function getSupabaseErrorMessage(error) {
  return error?.message || error?.error_description || String(error || t('global.supabaseUnknown'));
}

function setContactsSyncState(state, details = {}) {
  contactsSyncState = state;
  contactsSyncDiagnosticsState = { ...contactsSyncDiagnosticsState, ...details };
  renderContactsSyncStatus();
}

function renderContactsSyncStatus() {
  const messages = {
    synced: contactsSyncDiagnosticsState.message || t('contacts.syncedAuto'),
    local: t('contacts.localOnly'),
    error: contactsSyncDiagnosticsState.lastError
      ? t('contacts.supabaseError', { error: contactsSyncDiagnosticsState.lastError })
      : t('contacts.syncError'),
    syncing: contactsSyncDiagnosticsState.message || t('contacts.syncing'),
  };

  if (contactsSyncStatus) {
    contactsSyncStatus.textContent = currentUser ? messages[contactsSyncState] || messages.synced : messages.local;
    if (!currentUser) {
      contactsSyncStatus.classList.remove('error', 'signed-in');
    } else {
      contactsSyncStatus.classList.toggle('error', contactsSyncState === 'error');
      contactsSyncStatus.classList.toggle('signed-in', contactsSyncState === 'synced');
    }
  }

  if (refreshAccountContactsButton) refreshAccountContactsButton.disabled = !currentUser || isContactsRefreshInProgress || isContactsMutationInProgress;
  if (uploadLocalContactsButton) uploadLocalContactsButton.disabled = !currentUser || contacts.length === 0 || isContactsMutationInProgress || isContactsRefreshInProgress;
  if (contactsSyncSummary) contactsSyncSummary.textContent = currentUser ? t('contacts.autoSync') : t('contacts.localMode');
  renderSettingsSummary();

  if (!contactsSyncDiagnostics) return;
  if (!currentUser) {
    contactsSyncDiagnostics.innerHTML = `
      <ul>
        <li>${escapeHtml(t('contacts.localOnly'))}</li>
        <li>${escapeHtml(t('contacts.signInToSync'))}</li>
        <li>${escapeHtml(t('contacts.syncDisabled'))}</li>
        <li><strong>${escapeHtml(t('contacts.signInToSync'))}</strong></li>
      </ul>
    `;
    return;
  }
  const accountLines = currentUser
    ? [
        t('contacts.signedInAs', { email: currentUser.email || t('profile.noEmail') }),
        `User ID: ${escapeHtml(shortenId(currentUser.id || '—'))}`,
        t('contacts.supabaseAutoSync'),
        t('contacts.syncedAuto'),
      ]
    : [t('contacts.localOnly')];
  const remoteCount = contactsSyncDiagnosticsState.remoteCount === null ? '—' : contactsSyncDiagnosticsState.remoteCount;
  contactsSyncDiagnostics.innerHTML = `
    <ul>
      ${accountLines.map((line) => `<li>${typeof line === 'string' && line.startsWith('User ID') ? line : escapeHtml(line)}</li>`).join('')}
      <li>${escapeHtml(t('contacts.remoteContacts', { count: remoteCount }))}</li>
      <li>${escapeHtml(t('contacts.lastLoad', { time: formatContactsSyncTime(contactsSyncDiagnosticsState.lastLoadAt) }))}</li>
      <li>${escapeHtml(t('contacts.lastSave', { time: formatContactsSyncTime(contactsSyncDiagnosticsState.lastSaveAt) }))}</li>
      ${contactsSyncDiagnosticsState.lastError ? `<li class="error">${escapeHtml(t('contacts.supabaseError', { error: contactsSyncDiagnosticsState.lastError }))}</li>` : ''}
    </ul>
  `;
}

function renderSignedOutAccountUi(message = getAuthStatusMessages().signedOut) {
  currentUser = null;
  setContactsSyncState('local');
  applyRememberedEmail({ overwrite: true });
  if (authPassword) authPassword.value = '';
  if (authRepeatPassword) authRepeatPassword.value = '';
  sosHistoryEvents = [];
  sosHistoryStatus = '';
  if (activeSosSession?.shareToken || isRemoteSosSession(activeSosSession)) {
    clearActiveSosRuntimeState({ message: '', endedSession: activeSosSession, status: 'ended' });
  } else {
    syncActiveSosLocationAutoUpdate();
    renderActiveSosSession();
  }
  renderSosHistory();
  renderAuth();
  renderProfile();
  renderContactsSyncStatus();
  renderSetupChecklist();
  renderSettingsSummary();
  showAuthMessage(message);
}

function shortenId(id) {
  const value = String(id || '');
  return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

async function persistContacts() {
  persistContactsLocally();
}

function sanitizeProfile(savedProfile) {
  if (!savedProfile || typeof savedProfile !== 'object') return null;

  if (savedProfile.phone === legacyDemoProfilePhone) return null;
  const name = String(savedProfile.name || '').trim();
  const phone = String(savedProfile.phone || '').trim();
  const medicalNotes = normalizeMedicalNotes(savedProfile.medicalNotes || savedProfile.medical_note || savedProfile.medical_notes || '');
  const preferredLanguage = savedProfile.preferredLanguage === 'el' ? 'el' : 'en';
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

function normalizeMedicalNotes(value) {
  const notes = String(value || '').trim();
  return notes === '.' ? '' : notes;
}

function getProfileMedicalNotesDisplay() {
  return normalizeMedicalNotes(profile?.medicalNotes) || t('profile.notesEmpty');
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
  if (!savedProfile?.name?.trim()) return t('profile.validationName');
  if (!savedProfile?.phone?.trim()) return t('profile.validationPhone');
  if (!isValidPhoneNumber(savedProfile.phone)) return t('contacts.validationPhone');

  return '';
}


function updateNavLabels() {
  navButtons.forEach((button) => {
    const page = button.dataset.page;
    if (!page) return;
    const navKey = page === 'safety-tools' ? 'safetyTools' : page;
    const labelSpan = button.querySelector('span:last-child');
    if (labelSpan) labelSpan.textContent = t(`nav.${navKey}`);
  });
}

function refreshAllLocalizedUi() {
  applyStaticTranslations();
  applyDomBindings();
  const activePage = document.querySelector('.page.active')?.id || 'home';
  if (pageTitle) pageTitle.textContent = getPageTitles()[activePage] || getPageTitles().home;
  renderSettingsSummary();
  renderHomeReadinessCards();
  renderSafetyStatusCard();
  renderContacts();
  renderContactsFormState();
  renderProfile();
  renderAuth();
  renderLocation();
  renderSetupChecklist();
  renderHealthPage();
  renderSosHistory();
  renderActiveSosSession();
  renderSafeWalk();
  renderCheckIn();
  renderAccountSyncStatus();
  updateNavLabels();
}

function showPage(nextPage) {
  if (!getPageTitles()[nextPage]) nextPage = 'home';
  navButtons.forEach((item) => {
    const isActive = item.dataset.page === nextPage;
    item.classList.toggle('active', isActive);
    item.toggleAttribute('aria-current', isActive);
  });

  pages.forEach((page) => page.classList.toggle('active', page.id === nextPage));
  document.body.classList.toggle('profile-page-active', nextPage === 'profile');
  if (pageTitle) pageTitle.textContent = getPageTitles()[nextPage];
  if (nextPage === 'health') renderHealthPage();
  if (nextPage === 'contacts' && currentUser) {
    autoRefreshAccountContactsFromSupabase('contacts-page', { force: true }).catch((error) => console.warn('[SafeMe] Contacts page refresh failed', error));
  }
}


function focusElementAfterScroll(element, fallbackElement = null) {
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => (fallbackElement || element).focus({ preventScroll: true }), 220);
}

function openProfileAuthCard() {
  showPage('profile');
  if (!currentUser) setAuthMode('login');

  const signedIn = Boolean(currentUser);
  const focusTarget = isPasswordRecoveryMode ? passwordResetForm : (signedIn ? authSignedIn : authEmail);
  openProfileAccordion('account', { focusTarget: focusTarget || authForm });
}

function focusProfileForm() {
  showPage('profile');
  openProfileAccordion('details', { focusTarget: profileForm?.elements?.name || profileForm });
}

function focusContactForm() {
  showPage('contacts');
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      openContactsAccordion('add', { focusTarget: contactsForm?.elements?.name || contactsForm });
    }, 0);
  });
}

function openSettingsProfile() {
  focusProfileForm();
}

function openSettingsContacts() {
  focusContactForm();
}


function getSettingsLanguageLabel() {
  return getLanguageLabel(profile?.preferredLanguage || getLocale());
}

function syncSettingsLanguageSelect() {
  if (!settingsLanguageSelect) return;
  settingsLanguageSelect.value = profile?.preferredLanguage || getLocale();
}

async function handleSettingsLanguageChange() {
  if (!settingsLanguageSelect) return;
  const nextLocale = settingsLanguageSelect.value;
  if (!nextLocale) return;
  persistLocale(nextLocale);
  if (profile) {
    profile.preferredLanguage = nextLocale;
    saveJson(storageKeys.profile, profile);
    if (currentUser) {
      try {
        await saveProfileToSupabase();
      } catch (error) {
        console.warn('[SafeMe] Could not sync preferred language to Supabase', error);
      }
    }
  }
  setLocale(nextLocale);
  refreshAllLocalizedUi();
}

function formatSettingsLoadedAt(date) {
  return date.toLocaleString(getDateLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function renderSettingsVersionInfo() {
  if (settingsVersionValue) settingsVersionValue.textContent = APP_VERSION;
  if (settingsLoadedAtValue) settingsLoadedAtValue.textContent = formatSettingsLoadedAt(APP_LOADED_AT);
  if (settingsHostValue) settingsHostValue.textContent = window.location.host || t('common.localFile');
}

function renderSettingsSummary() {
  const online = navigator.onLine !== false;
  const onlineChip = document.querySelector('#settings-online-chip');
  const accountChip = document.querySelector('#settings-account-chip');
  const sosModeChip = document.querySelector('#settings-sos-mode-chip');
  const sosSummary = document.querySelector('#settings-sos-summary');
  const locationSummary = document.querySelector('#settings-location-summary');
  const locationStatus = document.querySelector('#settings-location-status');
  const syncSummary = document.querySelector('#settings-sync-summary');
  const syncStatus = document.querySelector('#settings-sync-status');
  const languageSummary = document.querySelector('#settings-language-summary');
  const languageStatus = document.querySelector('#settings-language-status');

  if (onlineChip) {
    onlineChip.textContent = online ? t('common.online') : t('common.offline');
    onlineChip.classList.toggle('offline', !online);
  }
  if (accountChip) accountChip.textContent = currentUser ? t('common.signedIn') : t('common.localProfile');
  if (sosModeChip) {
    sosModeChip.textContent = isSosTestMode ? t('home.testModeBadge') : t('common.realSos');
    sosModeChip.classList.toggle('warning', !isSosTestMode);
  }
  if (sosSummary) sosSummary.textContent = isSosTestMode ? t('settings.testActive') : t('settings.realMode');
  if (locationSummary) locationSummary.textContent = currentLocation ? t('settings.locationAvailable') : t('settings.needsUpdate');
  if (locationStatus) {
    locationStatus.textContent = currentLocation
      ? t('settings.accuracyAbout', {
        location: formatLocation(currentLocation),
        meters: currentLocation.accuracy ? Math.round(currentLocation.accuracy) : '',
      })
      : t('settings.noLocationYet');
  }
  if (syncSummary) syncSummary.textContent = currentUser ? t('settings.autoSyncActive') : t('settings.localMode');
  if (syncStatus) syncStatus.textContent = currentUser
    ? t('settings.syncStatusSignedIn', { email: currentUser.email || t('profile.noEmail') })
    : t('settings.syncStatusLocal');
  renderSettingsVersionInfo();

  const languageLabel = getSettingsLanguageLabel();
  if (languageSummary) languageSummary.textContent = languageLabel;
  if (languageStatus) languageStatus.textContent = t('settings.currentLanguage', { language: languageLabel });
}

function setSettingsPanelOpen(panel, open) {
  const button = panel?.querySelector('.settings-panel-toggle');
  const body = button ? document.querySelector(`#${button.getAttribute('aria-controls')}`) : null;
  if (!button || !body) return;
  panel.classList.toggle('open', open);
  button.setAttribute('aria-expanded', String(open));
  body.hidden = !open;
}

function toggleSettingsPanel(button) {
  const panel = button.closest('.settings-panel');
  const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
  settingsAccordionButtons.forEach((otherButton) => setSettingsPanelOpen(otherButton.closest('.settings-panel'), false));
  setSettingsPanelOpen(panel, shouldOpen);
}

function confirmSettingsLogout() {
  const confirmed = window.confirm(t('profile.confirmLogout'));
  if (confirmed) logout();
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
    setHomeQuickActionStatus(t('health.testCheckIn'));
    focusCheckInSection();
    return;
  }

  if (action === 'safe-walk') {
    setHomeQuickActionStatus(t('health.testSafeWalk'));
    focusSafeWalkSection();
    return;
  }

  if (action === 'contacts') {
    setHomeQuickActionStatus(t('health.openContacts'));
    focusContactForm();
    return;
  }

  if (action === 'gps') {
    setHomeQuickActionStatus(t('home.updateGps'));
    refreshLocation();
    return;
  }

  if (action === 'sos-settings') {
    setHomeQuickActionStatus(t('settings.sosMode'));
    showPage('settings');
    window.setTimeout(() => focusElementAfterScroll(document.querySelector('#sos-test-mode') || document.querySelector('#settings')), 80);
    return;
  }

  if (action === 'sos-history') {
    setHomeQuickActionStatus(t('profile.sosHistory'));
    showPage('profile');
    openProfileAccordion('sos', { focusTarget: sosHistoryList || document.querySelector('#profile-sos-summary') });
    return;
  }

  if (action === 'share-location') {
    setHomeQuickActionStatus(t('topbar.shareLocation'));
    shareLocation();
    return;
  }

  if (action === 'profile-login') {
    setHomeQuickActionStatus(t('profile.signIn'));
    openProfileAuthCard();
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
  const ok = t('common.ok');
  const attention = t('common.attention');
  const incomplete = t('common.incomplete');

  return [
    {
      id: 'account',
      label: t('health.account'),
      status: hasSignedInAccount ? ok : attention,
      explanation: hasSignedInAccount ? t('health.accountOk') : t('health.accountWarn'),
      actionLabel: hasSignedInAccount ? '' : t('health.openProfile'),
      action: 'profile',
      important: true,
    },
    {
      id: 'profile',
      label: t('health.profile'),
      status: hasProfile ? ok : incomplete,
      explanation: hasProfile ? t('health.profileOk') : t('health.profileIncomplete'),
      actionLabel: hasProfile ? '' : t('health.openProfile'),
      action: 'profile',
      important: true,
    },
    {
      id: 'contacts',
      label: t('health.trustedContact'),
      status: hasContacts ? ok : incomplete,
      explanation: hasContacts
        ? t('health.contactsOk', { count: contacts.length })
        : t('health.contactsIncomplete'),
      actionLabel: hasContacts ? '' : t('health.openContacts'),
      action: 'contacts',
      important: true,
    },
    {
      id: 'location',
      label: t('health.location'),
      status: hasLocation ? ok : attention,
      explanation: hasLocation ? t('health.locationOk') : t('health.locationWarn'),
      actionLabel: hasLocation ? '' : t('health.checkLocation'),
      action: 'location',
      important: true,
    },
    {
      id: 'live-tracking',
      label: t('health.liveTracking'),
      status: hasActiveSignedInTracking ? ok : (canCreateSignedInTracking ? attention : incomplete),
      explanation: hasActiveSignedInTracking
        ? t('health.liveTrackingOk')
        : (canCreateSignedInTracking ? t('health.liveTrackingWarn') : t('health.liveTrackingIncomplete')),
      actionLabel: hasActiveSignedInTracking ? '' : t('health.testSos'),
      action: 'test-sos',
      important: false,
    },
    {
      id: 'test-sos',
      label: t('health.testSosLabel'),
      status: hasCompletedTestSos ? ok : incomplete,
      explanation: hasCompletedTestSos ? t('health.testSosOk') : t('health.testSosIncomplete'),
      actionLabel: hasCompletedTestSos ? '' : t('health.testSos'),
      action: 'test-sos',
      important: true,
    },
    {
      id: 'checkin',
      label: t('health.checkInTimer'),
      status: checkInFeatureReady ? ok : attention,
      explanation: checkInFeatureReady ? t('health.checkinOk') : t('health.checkinWarn'),
      actionLabel: t('health.testCheckIn'),
      action: 'checkin',
      important: true,
    },
    {
      id: 'safe-walk',
      label: t('health.safeWalk'),
      status: safeWalkFeatureReady ? ok : attention,
      explanation: safeWalkFeatureReady ? t('health.safeWalkOk') : t('health.safeWalkWarn'),
      actionLabel: t('health.testSafeWalk'),
      action: 'safe-walk',
      important: true,
    },
  ];
}

function renderHealthPage() {
  if (!healthChecklist) return;

  const checks = getHealthChecks();
  const ok = t('common.ok');
  const attention = t('common.attention');
  healthChecklist.innerHTML = checks.map((check) => `
    <article class="health-card health-card-${check.status === ok ? 'ok' : check.status === attention ? 'warning' : 'incomplete'}">
      <div class="health-card-header">
        <h3>${escapeHtml(check.label)}</h3>
        <span class="health-status">${escapeHtml(check.status)}</span>
      </div>
      <p>${escapeHtml(check.explanation)}</p>
      ${check.actionLabel ? `<button class="ghost-button health-card-action" type="button" data-health-action="${escapeHtml(check.action)}">${escapeHtml(check.actionLabel)}</button>` : ''}
    </article>
  `).join('');

  const importantReady = checks.filter((check) => check.important).every((check) => check.status === ok);
  healthSummaryTitle.textContent = importantReady
    ? t('health.readyBeta')
    : t('health.needsAttention');
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

  const reportTime = new Intl.DateTimeFormat(getDateLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  return [
    t('health.reportTitle'),
    t('health.reportDateTime', { datetime: reportTime }),
    `${t('health.account')}: ${statusById.account}`,
    `${t('health.profile')}: ${statusById.profile}`,
    `${t('health.contacts')}: ${statusById.contacts}`,
    `${t('health.location')}: ${statusById.location}`,
    `${t('health.liveTracking')}: ${statusById['live-tracking']}`,
    `${t('health.testSosLabel')}: ${statusById['test-sos']}`,
    `${t('health.checkin')}: ${statusById.checkin}`,
    `${t('health.safeWalk')}: ${statusById['safe-walk']}`,
  ].join('\n');
}

async function copyHealthReport() {
  try {
    await copyTextToClipboard(buildHealthReport());
    healthReportStatus.textContent = t('health.reportCopied');
    healthReportStatus.classList.remove('error');
  } catch {
    healthReportStatus.textContent = t('health.reportCopyFailed');
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
      label: t('setup.completeProfile'),
      completed: hasRequiredProfileDetails(),
      buttonLabel: t('setup.openProfile'),
      action: 'profile',
    },
    {
      id: 'contacts',
      label: t('setup.addContact'),
      completed: contacts.length > 0,
      buttonLabel: t('setup.openContacts'),
      action: 'contacts',
    },
    {
      id: 'location',
      label: t('setup.checkGps'),
      completed: Boolean(currentLocation),
      buttonLabel: t('home.updateGps'),
      action: 'location',
    },
    {
      id: 'test-sos',
      label: t('setup.testSos'),
      completed: hasCompletedTestSos,
      buttonLabel: t('health.testSos'),
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
          <p class="eyebrow">${escapeHtml(t('home.readinessEyebrow'))}</p>
          <h3 id="setup-checklist-title">${escapeHtml(t('home.setupCompleteTitle'))}</h3>
          <p>${escapeHtml(t('home.setupCompleteSubtitle'))}</p>
        </div>
        <span class="setup-checklist-progress" aria-live="polite">${completedCount}/${items.length}</span>
      </div>
      <button class="setup-checklist-toggle" type="button" data-setup-toggle="expand">${escapeHtml(t('home.showSteps'))}</button>
    `;
    return;
  }

  setupChecklist.innerHTML = `
    <div class="setup-checklist-header">
      <div>
        <p class="eyebrow">${escapeHtml(t('home.readinessEyebrow'))}</p>
        <h3 id="setup-checklist-title">${escapeHtml(t('home.setupTitle'))}</h3>
        <p>${escapeHtml(t('home.setupSubtitle'))}</p>
      </div>
      <div class="setup-checklist-header-actions">
        <span class="setup-checklist-progress" aria-live="polite">${completedCount}/${items.length}</span>
        ${allCompleted ? `<button class="setup-checklist-hide" type="button" data-setup-toggle="collapse">${escapeHtml(t('home.hideSteps'))}</button>` : ''}
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
    <p class="setup-checklist-summary">${allCompleted ? t('home.setupReady') : t('home.setupSummary')}</p>
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
  showLocationMessage(t('location.onlineSyncHint'));
  focusElementAfterScroll(currentLocationCard || locationText);
}

function formatLocation(location) {
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

function setLocationButtonsLoading(isLoading) {
  if (refreshLocationButton) {
    refreshLocationButton.disabled = isLoading;
    refreshLocationButton.textContent = isLoading ? t('common.locating') : t('common.refresh');
  }
  if (shareLocationButton) shareLocationButton.disabled = isLoading;
}

function setSosConfirmLoading(isLoading) {
  if (!sosButton) return;
  sosButton.disabled = isLoading;
  const sosButtonHint = sosButton.querySelector('small');
  if (sosButtonHint) sosButtonHint.textContent = isLoading ? t('common.preparing') : t('common.tap');
}

function showLocationMessage(message) {
  if (locationText) locationText.textContent = message;
}

function renderLocation() {
  if (!currentLocation) {
    showLocationMessage(t('location.refreshPrompt'));
    renderHomeReadinessCards();
    renderSettingsSummary();
    return;
  }

  const accuracyText = currentLocation.accuracy ? t('home.accuracySuffix', { meters: Math.round(currentLocation.accuracy) }) : '';
  showLocationMessage(`${formatLocation(currentLocation)}${accuracyText}`);
  renderHomeReadinessCards();
  renderSettingsSummary();
}

function getGeolocationErrorMessage(error) {
  if (error?.code === 1) return t('location.permissionDenied');
  if (error?.code === 2) return t('location.unavailableRetry');
  if (error?.code === 3) return t('location.unavailableRetry');
  return t('location.deviceUnavailable');
}

function getActiveSosGeolocationErrorMessage(error) {
  if (error?.code === 1) return t('location.blocked');
  return getGeolocationErrorMessage(error);
}

function formatDiagnosticDateTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(getDateLocale(), {
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

  activeSosPermissionStatus.textContent = activeSosDiagnostics.permissionStatus || t('runtime.unknownPermission');
  activeSosLastGpsUpdate.textContent = formatDiagnosticDateTime(activeSosDiagnostics.lastGpsUpdateAt);
  activeSosDebugLastSync.textContent = formatDiagnosticDateTime(activeSosDiagnostics.lastSupabaseSyncAt);
  activeSosSyncResult.textContent = activeSosDiagnostics.lastSupabaseSyncResult || '—';
  activeSosLastError.textContent = activeSosDiagnostics.lastErrorMessage || '—';
}

function getPermissionStatusLabel(status) {
  if (status === 'granted') return t('location.permissionGranted');
  if (status === 'denied') return t('location.permissionDeniedShort');
  if (status === 'prompt') return t('location.permissionPrompt');
  return t('common.status');
}

async function refreshLocationPermissionStatus() {
  if (!navigator.permissions?.query) {
    setActiveSosDiagnosticState({ permissionStatus: t('runtime.unknownPermissionUnsupported') });
    return;
  }

  try {
    locationPermissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    setActiveSosDiagnosticState({ permissionStatus: getPermissionStatusLabel(locationPermissionStatus.state) });
    locationPermissionStatus.onchange = () => {
      setActiveSosDiagnosticState({ permissionStatus: getPermissionStatusLabel(locationPermissionStatus.state) });
    };
  } catch {
    setActiveSosDiagnosticState({ permissionStatus: t('runtime.unknownPermission') });
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
    permissionStatus: t('runtime.permissionGranted'),
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
  showLocationMessage(t('location.searching'));

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
    settingsStatus.textContent = t('location.checking');
    settingsStatus.classList.remove('error');
  }

  await refreshLocation();

  if (!settingsStatus) return;

  if (currentLocation) {
    settingsStatus.textContent = t('location.updated');
    settingsStatus.classList.remove('error');
    return;
  }

  settingsStatus.textContent = t('location.unavailable');
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
  const shareText = t('runtime.myCurrentLocation', { url: locationUrl });

  try {
    if (navigator.share) {
      await navigator.share({
        title: t('runtime.shareLocationTitle'),
        text: t('location.shareText'),
        url: locationUrl,
      });
      showLocationMessage(t('runtime.shareLocationReady', { location: formatLocation(currentLocation) }));
      return;
    }

    await copyTextToClipboard(shareText);
    showLocationMessage(t('runtime.shareLinkCopied', { location: formatLocation(currentLocation) }));
  } catch (error) {
    if (error?.name !== 'AbortError') {
      try {
        await copyTextToClipboard(shareText);
        showLocationMessage(t('runtime.shareLinkCopied', { location: formatLocation(currentLocation) }));
      } catch {
        showLocationMessage(t('location.shareFailed'));
      }
    }
  }
}

function getPrimaryContact() {
  return contacts.find((contact) => contact.tone === 'primary') || contacts[0] || null;
}

function getTrustedContactInviteMessage() {
  return [
    t('sos.inviteMessage1'),
    t('sos.inviteMessage2'),
    t('sos.inviteMessage3'),
  ].join('\n');
}

function getSosMessageIntro() {
  return isSosTestMode ? t('sos.messageIntroTest') : t('sos.messageIntroReal');
}

function getSosTrackingUrl(shareToken) {
  if (!shareToken) return '';

  const url = new URL(SOS_TRACKING_BASE_URL);
  url.searchParams.set('track', shareToken);
  url.searchParams.set('lang', getLocale());
  return url.toString();
}

function buildSosMessage(location = currentLocation, shareToken = activeSosSession?.shareToken) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
  const alertTime = new Intl.DateTimeFormat(getDateLocale(), { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  const lines = [];

  if (isSosTestMode) {
    lines.push(t('sos.messageTestHeader'), t('sos.messageTestNoEmergency'), '');
  } else {
    lines.push(t('sos.messageRealHeader'), t('sos.messageNeedHelp'), '');
  }

  if (hasLocation) {
    const location = { latitude, longitude };
    const { lat, lng } = getRoundedCoordinates(location);
    const appleMapsPinLink = getAppleMapsPinUrl(location);
    const appleMapsNavigationLink = getAppleMapsNavigationUrl(location);
    const googleMapsPinLink = getLocationUrl(location);
    const googleMapsNavigationLink = getNavigationUrl(location);

    if (isSosTestMode) {
      lines.push(t('sos.messageTestLocation'), appleMapsPinLink, '');
      lines.push(t('sos.messageNavigateTest'), appleMapsNavigationLink, '');
      lines.push('Google Maps:', googleMapsPinLink, googleMapsNavigationLink, '');
    } else {
      lines.push(t('sos.messageMyLocation'), appleMapsPinLink, '');
      lines.push(t('sos.messageNavigate'), appleMapsNavigationLink, '');
      lines.push(t('sos.messageGoogleFallback'), googleMapsPinLink, googleMapsNavigationLink, '');
    }

    lines.push(t('sos.messageCoords', { lat, lng }));
  } else {
    lines.push(t('sos.location'), t('sos.messageLocationUnavailable'));
  }

  const trackingUrl = getSosTrackingUrl(shareToken);
  if (trackingUrl) {
    lines.push('', t('sos.messageLiveTracking'), trackingUrl);
  }

  if (profile?.name?.trim()) lines.push('', t('sos.messageName', { name: profile.name.trim() }));
  if (profile?.phone?.trim()) lines.push(t('sos.messagePhone', { phone: profile.phone.trim() }));
  lines.push(t('sos.messageTime', { time: alertTime }));

  return lines.join('\n');
}


function getSmsLink(contact, message) {
  const phone = contact ? normalizeSmsRecipient(contact.phone) : '';
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

  renderActiveSosSession(options.testMode ? t('sos.activatedTest') : t('sos.activatedReal'));
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
  if (!isRemoteSosSession(activeSosSession) || !sosEventId) return;

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

  const wasTestMode = activeSosSession?.testMode === true;
  activeSosSession = restoredSession;
  activeSosSession.testMode = wasTestMode;
  renderActiveSosSession();
  syncActiveSosLocationAutoUpdate();
}

function getActiveSosLocationUrl(session) {
  return `https://maps.google.com/?q=${session.latestLatitude},${session.latestLongitude}`;
}

function renderHomeReadinessCards() {
  const isOnline = navigator.onLine !== false;
  const hasAccount = Boolean(currentUser);
  const hasContacts = contacts.length > 0;
  const primaryContact = contacts.find((contact) => contact.tone === 'primary') || contacts[0];
  const hasLocation = Boolean(currentLocation);

  if (homeOnlineStatus) {
    homeOnlineStatus.textContent = isOnline ? t('home.onlineChip') : t('home.offlineChip');
    homeOnlineStatus.classList.toggle('warning', !isOnline);
  }
  if (homeAccountStatus) homeAccountStatus.textContent = hasAccount ? t('common.signedIn') : t('common.localProfile');
  if (homeContactsStatus) homeContactsStatus.textContent = t('home.contactsChip', { count: contacts.length });
  if (homeLocationStatus) {
    homeLocationStatus.textContent = hasLocation ? t('home.locationAvailable') : t('home.locationNeeded');
    homeLocationStatus.classList.toggle('warning', !hasLocation);
  }
  if (homeSosModeStatus) {
    homeSosModeStatus.textContent = isSosTestMode ? t('common.testSos') : t('common.realSos');
    homeSosModeStatus.classList.toggle('test', isSosTestMode);
  }
  if (homeTestModeBadge) homeTestModeBadge.hidden = !isSosTestMode;
  if (homeTestModeHelper) homeTestModeHelper.hidden = !isSosTestMode;

  if (homeReadinessMessage) {
    homeReadinessMessage.textContent = !hasAccount || !hasContacts || !hasLocation
      ? t('home.setupGuide')
      : t('home.readyToUse');
  }

  if (contactsReadinessText) {
    contactsReadinessText.textContent = hasContacts
      ? t('home.contactsAvailable', {
        count: contacts.length,
        primary: primaryContact?.name ? t('home.primaryContact', { name: primaryContact.name }) : '',
      })
      : t('home.openContactsList');
  }
  if (homeAddContactCta) homeAddContactCta.hidden = hasContacts;

  if (locationReadinessText) {
    locationReadinessText.textContent = hasLocation
      ? t('home.locationAccuracy', {
        accuracy: currentLocation.accuracy ? t('home.accuracySuffix', { meters: Math.round(currentLocation.accuracy) }) : '',
      })
      : t('home.openLocationCheck');
  }

  if (accountReadinessText) accountReadinessText.textContent = hasAccount ? t('home.accountSyncActive') : t('home.openSignIn');
  if (homeLoginSyncCta) homeLoginSyncCta.hidden = hasAccount;
  if (homeReadinessCard) homeReadinessCard.classList.toggle('is-ready', hasAccount && hasContacts && hasLocation && isOnline);
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
      title: t('home.safetyStatus'),
      description: t('home.safetyReady'),
    },
    'safe-walk': {
      icon: '🚶',
      title: t('safetyTools.safeWalkActive'),
      description: t('safetyTools.safeWalkMonitoring'),
    },
    checkin: {
      icon: '⏱️',
      title: t('safetyTools.checkInActive'),
      description: t('safetyTools.checkInMonitoring'),
    },
    sos: {
      icon: '🚨',
      title: t('sos.activeTitle'),
      description: t('auth.emergencyInProgress'),
    },
  }[status];

  safetyStatusCard.classList.remove('status-normal', 'status-safe-walk', 'status-checkin', 'status-sos');
  safetyStatusCard.classList.add(`status-${status}`);
  if (safetyStatusIcon) safetyStatusIcon.textContent = copy.icon;
  safetyStatusTitle.textContent = copy.title;
  safetyStatusDescription.textContent = copy.description;
  renderHomeReadinessCards();
}

function updateActiveSosEmergencyActions() {
  const message = getActiveSosEmergencyMessage();
  const hasSmsCapableContacts = getSmsCapableSosContacts().length > 0;
  const smsQueue = ensureActiveSosSmsQueue();
  const emailContacts = getEmailCapableSosContacts();

  if (notifyAllSosContactsActionButton) {
    notifyAllSosContactsActionButton.textContent = getActiveSosSmsQueueButtonLabel(smsQueue);
    notifyAllSosContactsActionButton.disabled = !hasSmsCapableContacts;
  }
  if (activeSosLocationNote) {
    activeSosLocationNote.textContent = currentLocation || hasSosLocation(activeSosSession)
      ? t('sos.locationInMessage')
      : t('sos.locationMissing');
  }
  if (activeSosWhatsappButton) {
    activeSosWhatsappButton.hidden = !hasSmsCapableContacts || isSosTestMode;
    activeSosWhatsappButton.href = getWhatsappLink(message);
  }
  if (activeSosEmailButton) {
    activeSosEmailButton.hidden = emailContacts.length === 0 || isSosTestMode;
    activeSosEmailButton.href = getEmailLink({ email: emailContacts.map((contact) => contact.email).join(',') }, message);
  }
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
    activeSosIntro.textContent = activeSosSession.testMode ? t('sos.testNoRealAlert') : t('sos.messageReady');
  }
  updateActiveSosEmergencyActions();
  if (activeSosTestModeLabel) {
    activeSosTestModeLabel.hidden = !activeSosSession.testMode;
  }
  if (activeSosTrackingReady) {
    activeSosTrackingReady.textContent = activeSosSession.shareToken ? t('sos.trackingReady') : t('sos.trackingUnavailable');
  }
  activeSosStarted.textContent = formatSosEventDate(activeSosSession.startedAt);
  activeSosStatus.textContent = activeSosSession.testMode ? t('common.testSos') : t('common.active');
  if (activeSosLatestLocationTime) {
    activeSosLatestLocationTime.textContent = activeSosSession.latestLocationAt
      ? formatSosEventDate(activeSosSession.latestLocationAt)
      : t('sos.notYet');
  }
  if (activeSosLastLiveUpdate) {
    const lastBackendSyncAt = activeSosDiagnostics.lastSupabaseSyncAt || activeSosLastAutoUpdateAt || activeSosSession.latestLocationAt;
    activeSosLastLiveUpdate.textContent = lastBackendSyncAt
      ? formatSosEventDate(lastBackendSyncAt)
      : '—';
  }
  if (activeSosLiveUpdateState) {
    activeSosLiveUpdateState.textContent = shouldAutoUpdateActiveSosLocation()
      ? t('sos.autoUpdateActive')
      : t('sos.autoUpdateInactive');
  }
  if (activeSosTrackingStatus) {
    if (activeSosSession.shareToken) {
      const trackingUrl = getSosTrackingUrl(activeSosSession.shareToken);
      activeSosTrackingStatus.innerHTML = `<a href="${escapeHtml(trackingUrl)}" target="_blank" rel="noopener">${escapeHtml(t('sos.openLiveTracking'))}</a><br><small>${escapeHtml(trackingUrl)}</small>`;
    } else {
      activeSosTrackingStatus.textContent = t('sos.trackingUnavailable');
    }
  }

  if (hasSosLocation(activeSosSession)) {
    const url = getActiveSosLocationUrl(activeSosSession);
    const updatedText = activeSosSession.latestLocationAt ? ` (${formatSosEventDate(activeSosSession.latestLocationAt)})` : '';
    activeSosLocation.innerHTML = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(t('sos.openGoogleMaps'))}</a>${escapeHtml(updatedText)}`;
  } else {
    activeSosLocation.textContent = t('sos.noLocationHint');
  }

  copyActiveSosTrackingButton.hidden = !activeSosSession.shareToken;
  if (endActiveSosButton) {
    endActiveSosButton.textContent = isActiveSosSessionRestored ? t('sos.endOldSos') : t('sos.endSos');
    endActiveSosButton.setAttribute('aria-label', endActiveSosButton.textContent);
  }
  copyActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  copyActiveSosTrackingButton.textContent = t('sos.copyTracking');
  disableActiveSosTrackingButton.disabled = !activeSosSession.shareToken;
  const compactFeedback = [
    t('runtime.sosActivated'),
    t('runtime.activeSosStarted'),
    t('runtime.checkInExpiredSos'),
  ].some((prefix) => message.startsWith(prefix)) ? '' : message;
  activeSosFeedback.textContent = activeSosSession.testMode ? message : compactFeedback;
  renderSafetyStatusCard();
  renderSosContactNotifications();
}

function shouldAutoUpdateActiveSosLocation() {
  return Boolean(
    currentUser
      && activeSosSession
      && activeSosSession.status === 'active'
      && isRemoteSosSession(activeSosSession)
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
    renderActiveSosSession(t('runtime.noLiveLocationSupport'));
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
        permissionStatus: error?.code === 1 ? t('runtime.permissionBlocked') : activeSosDiagnostics.permissionStatus,
      });
      renderActiveSosSession(t('runtime.appWillKeepTrying', { message }));
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
      failureMessage: t('runtime.autoLocationUpdateFailed'),
      showLoadingMessage: false,
      updateButtonState: false,
      isAutomaticUpdate: true,
    });
  } finally {
    isAutoUpdatingActiveSosLocation = false;
    syncActiveSosLocationAutoUpdate();
  }
}

async function createActiveSosSession(sosEventId, location = currentLocation, options = {}) {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('active_sos_sessions')
    .insert(mapActiveSosSessionToSupabase(sosEventId, location))
    .select('*')
    .single();

  if (error) throw error;

  activeSosSession = mapActiveSosSessionFromSupabase(data);
  isActiveSosSessionRestored = false;
  activeSosSession.testMode = options.testMode === true;
  renderActiveSosSession(options.successMessage || t('sos.activated'));
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
  if (!isRemoteSosSession(activeSosSession) || !location) return false;

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
      lastSupabaseSyncResult: t('runtime.syncErrorSource', { source }),
      lastErrorMessage: error.message,
    });
    throw error;
  }

  const wasTestMode = activeSosSession?.testMode === true;
  activeSosSession = mapActiveSosSessionFromSupabase(data);
  activeSosSession.testMode = wasTestMode;
  activeSosLastAutoUpdateAt = now;
  setActiveSosDiagnosticState({
    lastSupabaseSyncAt: now,
    lastSupabaseSyncResult: t('runtime.syncSuccessSource', { source }),
    lastErrorMessage: '',
  });
  renderActiveSosSession(successMessage);
  return true;
}

async function updateActiveSosLocation(options = {}) {
  if (!isRemoteSosSession(activeSosSession)) return;

  const {
    successMessage = t('runtime.sosLocationUpdated'),
    failureMessage = null,
    isAutomaticUpdate = false,
    showLoadingMessage = true,
    updateButtonState = true,
  } = options;

  if (updateButtonState) setActiveSosButtonsLoading(true);
  if (showLoadingMessage) renderActiveSosSession(t('runtime.updatingSosLocation'));

  try {
    if (!isAutomaticUpdate) {
      const position = await requestCurrentPosition();
      updateCurrentLocationFromPosition(position);
    }

    if (!currentLocation) {
      renderActiveSosSession(t('runtime.noLocationForLiveUpdate'));
      return;
    }

    await syncActiveSosLocationToSupabase(currentLocation, {
      successMessage,
      source: isAutomaticUpdate ? 'auto' : 'manual',
    });
  } catch (error) {
    const message = error?.code ? getActiveSosGeolocationErrorMessage(error) : t('runtime.sosNotUpdated', { error: error.message });
    setActiveSosDiagnosticState({
      lastSupabaseSyncResult: error?.code ? activeSosDiagnostics.lastSupabaseSyncResult : t('runtime.errorLabel'),
      lastErrorMessage: error?.message || message,
      permissionStatus: error?.code === 1 ? t('runtime.permissionBlocked') : activeSosDiagnostics.permissionStatus,
    });
    renderActiveSosSession(failureMessage || message);
  } finally {
    if (updateButtonState) setActiveSosButtonsLoading(false);
    syncActiveSosLocationAutoUpdate();
  }
}

async function testActiveSosLiveSyncNow() {
  if (!isRemoteSosSession(activeSosSession)) return;

  setActiveSosButtonsLoading(true);
  renderActiveSosSession(t('runtime.testingLiveSync'));

  try {
    if (!currentLocation) {
      const position = await requestCurrentPosition();
      updateCurrentLocationFromPosition(position);
    }

    await syncActiveSosLocationToSupabase(currentLocation, {
      successMessage: t('runtime.liveSyncSuccess'),
      source: 'test',
    });
  } catch (error) {
    const message = error?.code
      ? getActiveSosGeolocationErrorMessage(error)
      : t('runtime.supabaseLiveSyncError', { error: error.message });
    setActiveSosDiagnosticState({
      lastErrorMessage: error?.message || message,
      permissionStatus: error?.code === 1 ? t('runtime.permissionBlocked') : activeSosDiagnostics.permissionStatus,
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
  renderActiveSosSession(t('runtime.requestingGps'));

  try {
    const position = await requestCurrentPosition();
    const location = updateCurrentLocationFromPosition(position);
    renderActiveSosSession(t('runtime.browserReturnedCoords', { location: formatLocation(location) }));
  } catch (error) {
    const message = getActiveSosGeolocationErrorMessage(error);
    setActiveSosDiagnosticState({
      lastErrorMessage: error?.message || message,
      permissionStatus: error?.code === 1 ? t('runtime.permissionBlocked') : activeSosDiagnostics.permissionStatus,
    });
    renderActiveSosSession(message);
  } finally {
    setActiveSosButtonsLoading(false);
    syncActiveSosLocationAutoUpdate();
  }
}

async function copyActiveSosMessage() {
  if (!activeSosSession) return;

  try {
    await copyTextToClipboard(getActiveSosEmergencyMessage());
    renderActiveSosSession(t('runtime.sosMessageCopied'));
  } catch {
    renderActiveSosSession(t('runtime.sosMessageCopyFailed'));
  }
}

async function copyActiveSosTrackingLink() {
  if (!activeSosSession?.shareToken) return;

  const trackingUrl = getSosTrackingUrl(activeSosSession.shareToken);

  try {
    await copyTextToClipboard(trackingUrl);
    renderActiveSosSession(t('runtime.trackingLinkCopied'));
  } catch {
    renderActiveSosSession(t('runtime.trackingLinkCopyFailed'));
  }
}

async function disableActiveSosTrackingLink() {
  if (!isRemoteSosSession(activeSosSession) || !activeSosSession?.shareToken) return;

  const confirmed = window.confirm(t('sos.confirmDisableTracking'));
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

    const wasTestMode = activeSosSession?.testMode === true;
    activeSosSession = mapActiveSosSessionFromSupabase(data);
    activeSosSession.testMode = wasTestMode;
    renderActiveSosSession(t('runtime.trackingLinkDisabled'));
  } catch (error) {
    renderActiveSosSession(t('runtime.trackingDisableFailed', { error: error.message }));
  } finally {
    setActiveSosButtonsLoading(false);
  }
}

async function endActiveSosSession() {
  if (!activeSosSession) return;

  const confirmed = window.confirm(t('sos.confirmEnd'));
  if (!confirmed) return;

  const endingSession = activeSosSession;
  renderActiveSosSession(t('runtime.endingSos'));
  markSosSessionEnded(endingSession, 'ending');
  stopActiveSosLocationAutoUpdate();

  if (!isRemoteSosSession(endingSession)) {
    clearActiveSosRuntimeState({
      message: t('runtime.sosEndedLocal'),
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
      message: t('runtime.sosEndedPublic'),
      endedSession: mapActiveSosSessionFromSupabase(data) || endingSession,
      status: 'ended',
    });
  } catch (error) {
    clearActiveSosRuntimeState({
      message: t('runtime.sosEndedNoPublicUpdate', { error: error.message }),
      endedSession: endingSession,
      status: 'ended',
    });
  } finally {
    setActiveSosButtonsLoading(false);
  }
}


function formatCheckInDateTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(getDateLocale(), {
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
    checkInStatusPill.textContent = checkInExpiryInProgress ? t('runtime.activatingSos') : t('common.ready');
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
  if (activeCheckIn?.status === 'active') return t('runtime.checkInActiveBlockSafeWalk');
  if (!hasRequiredProfileDetails()) return t('runtime.completeProfileFirst');
  if (contacts.length === 0) return t('runtime.addContactFirst');
  if (!currentLocation) return t('runtime.refreshLocationFirst');
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
    safeWalkStatusPill.textContent = safeWalkExpiryInProgress ? 'failed / SOS' : (lastSafeWalkOutcome?.status || t('common.ready'));
    safeWalkStatusPill.className = `safe-walk-status-pill ${lastSafeWalkOutcome?.status ? `safe-walk-status-${lastSafeWalkOutcome.status}` : ''}`;
    renderSafetyStatusCard();
    return;
  }
  const remainingMs = new Date(activeSafeWalk.expiresAt).getTime() - Date.now();
  safeWalkCountdown.textContent = formatCheckInDuration(remainingMs);
  safeWalkActiveDestination.textContent = activeSafeWalk.destination || t('runtime.destinationNotSet');
  safeWalkStartedTime.textContent = formatCheckInDateTime(activeSafeWalk.startedAt);
  safeWalkExpectedTime.textContent = formatCheckInDateTime(activeSafeWalk.expiresAt);
  safeWalkStatusText.textContent = t('runtime.safeWalkInProgress');
  safeWalkLocationTime.textContent = currentLocation?.updatedAt ? formatCheckInDateTime(currentLocation.updatedAt) : t('runtime.notYetAvailable');
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
  setSafeWalkMessage(minutes === 1 ? t('runtime.safeWalkTestStarted') : t('runtime.safeWalkStarted'));
  scheduleSafeWalkTimer();
}

function completeSafeWalkSafely() {
  lastSafeWalkOutcome = { status: 'completed', at: new Date().toISOString() }; saveJson(storageKeys.safeWalkOutcome, lastSafeWalkOutcome);
  activeSafeWalk = null; saveActiveSafeWalk(); stopSafeWalkTimer(); renderSafeWalk();
  setSafeWalkMessage(t('runtime.safeWalkCompleted'));
}

function cancelSafeWalk() {
  lastSafeWalkOutcome = { status: 'cancelled', at: new Date().toISOString() }; saveJson(storageKeys.safeWalkOutcome, lastSafeWalkOutcome);
  activeSafeWalk = null; saveActiveSafeWalk(); stopSafeWalkTimer(); renderSafeWalk();
  setSafeWalkMessage(t('runtime.safeWalkCancelled'));
}

async function refreshSafeWalkLocation() {
  setSafeWalkMessage(t('runtime.safeWalkRefreshingLocation'));
  await refreshLocation();
  renderSafeWalk();
  setSafeWalkMessage(currentLocation ? t('runtime.safeWalkLocationUpdated') : t('runtime.safeWalkNoLocation'), !currentLocation);
}

function restoreSafeWalkOnLoad() {
  if (activeSafeWalk?.status !== 'active') { activeSafeWalk = null; saveActiveSafeWalk(); renderSafeWalk(); return; }
  if (Date.now() >= new Date(activeSafeWalk.expiresAt).getTime()) {
    activeSafeWalk = null; saveActiveSafeWalk(); renderSafeWalk();
    setSafeWalkMessage(t('runtime.safeWalkExpiredBackground'), true);
    return;
  }
  safeWalkDestination.value = activeSafeWalk.destination || '';
  setSafeWalkMessage(t('runtime.safeWalkRestored'));
  scheduleSafeWalkTimer();
}

async function expireSafeWalkWhileOpen() {
  if (safeWalkExpiryInProgress) return;
  safeWalkExpiryInProgress = true;
  const expiredWalk = activeSafeWalk;
  lastSafeWalkOutcome = { status: 'failed', at: new Date().toISOString() }; saveJson(storageKeys.safeWalkOutcome, lastSafeWalkOutcome);
  activeSafeWalk = null; saveActiveSafeWalk(); renderSafeWalk();
  setSafeWalkMessage(t('runtime.safeWalkExpiredSos'));
  sosStatus.textContent = t('runtime.safeWalkExpiredSos');
  try {
    if (!currentLocation) { hasRequestedLocationPermission = true; saveJson(storageKeys.locationPermissionRequested, true); updateCurrentLocationFromPosition(await requestCurrentPosition()); }
  } catch (error) { showLocationMessage(getGeolocationErrorMessage(error)); }
  const contact = getPrimaryContact();
  let historyMessage = t('runtime.safeWalkExpiredSos');
  try {
    if (currentUser) {
      if (activeSosSession?.status === 'active') { if (currentLocation) await syncActiveSosLocationToSupabase(currentLocation, { successMessage: '', source: 'safe-walk' }); }
      else { await createActiveSosSession(null, currentLocation); }
    } else { createLocalActiveSosSession(currentLocation); }
  } catch (error) { historyMessage = t('runtime.activeSosUpdateFailed', { message: historyMessage, error: error.message }); }
  const safeWalkNote = t('runtime.safeWalkExpiredNote', {
    destination: expiredWalk?.destination ? t('runtime.destinationPrefix', { name: expiredWalk.destination }) : '',
  });
  const message = `${buildSosMessage(currentLocation, activeSosSession?.shareToken)}\n\n${safeWalkNote}`;
  sosButton.classList.add('activated'); sosButton.setAttribute('aria-pressed', 'true');
  if (currentUser) {
    try { const savedEvent = await saveSosEventToSupabase(message, currentLocation); if (savedEvent) { sosHistoryEvents = [savedEvent, ...sosHistoryEvents].slice(0, 5); sosHistoryStatus = ''; renderSosHistory(); await attachSosEventToActiveSession(savedEvent.id); } }
    catch { historyMessage = `${historyMessage} ${t('runtime.sosHistoryNotSaved')}`; }
  }
  resetSosModal(); sosModal.hidden = false; document.body.classList.add('modal-open');
  showSosActionPanel(message, contact, t('runtime.manualSendNote', { message: historyMessage }));
  showPage('home'); activeSosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  safeWalkExpiryInProgress = false; renderSafeWalk();
}

function getCheckInValidationMessage() {
  if (activeSafeWalk?.status === 'active') return t('runtime.safeWalkActiveBlockCheckIn');
  if (!hasRequiredProfileDetails()) return t('runtime.completeProfileFirst');
  if (contacts.length === 0) return t('runtime.addContactFirstCheckIn');
  if (!currentLocation) return t('runtime.refreshLocationFirst');
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
  setCheckInMessage(t('runtime.checkInStarted'));
  scheduleCheckInTimer();
}

function completeCheckInSafely() {
  activeCheckIn = null;
  saveActiveCheckIn();
  stopCheckInTimer();
  renderCheckIn();
  setCheckInMessage(t('runtime.checkInCompleted'));
}

function cancelCheckIn() {
  activeCheckIn = null;
  saveActiveCheckIn();
  stopCheckInTimer();
  renderCheckIn();
  setCheckInMessage(t('runtime.checkInCancelled'));
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
    setCheckInMessage(t('runtime.checkInExpiredBackground'), true);
    return;
  }

  setCheckInMessage(t('runtime.checkInRestored'));
  scheduleCheckInTimer();
}

async function expireCheckInWhileOpen() {
  if (checkInExpiryInProgress) return;
  checkInExpiryInProgress = true;
  activeCheckIn = null;
  saveActiveCheckIn();
  renderCheckIn();
  setCheckInMessage(t('runtime.checkInExpiredSos'));
  sosStatus.textContent = t('runtime.checkInExpiredSos');

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
  let historyMessage = t('runtime.checkInExpiredSos');

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
      renderActiveSosSession(t('runtime.checkInExpiredSosLocal'));
    }
  } catch (error) {
    historyMessage = t('runtime.activeSosUpdateFailed', { message: historyMessage, error: error.message });
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
      historyMessage = `${historyMessage} ${t('runtime.sosHistoryNotSaved')}`;
    }
  }

  resetSosModal();
  sosModal.hidden = false;
  document.body.classList.add('modal-open');
  showSosActionPanel(message, contact, t('runtime.manualSendNote', { message: historyMessage }));
  showPage('home');
  activeSosSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  checkInExpiryInProgress = false;
  renderCheckIn();
}

function formatSosEventDate(value) {
  if (!value) return t('runtime.unknownTime');

  return new Intl.DateTimeFormat(getDateLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatSosEventTime(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(getDateLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getMessagePreview(message = '') {
  const text = String(message || 'SOS');
  return text.length > 92 ? `${text.slice(0, 92).trim()}…` : text;
}

function updateSosHistorySummary() {
  if (sosHistoryLast) {
    sosHistoryLast.textContent = sosHistoryEvents.length > 0
      ? formatSosEventDate(sosHistoryEvents[0].createdAt)
      : '—';
  }

  if (sosHistoryCount) sosHistoryCount.textContent = String(sosHistoryEvents.length);
}

function renderSosHistory() {
  if (!sosHistoryList) return;

  updateSosHistorySummary();
  sosHistoryList.hidden = !isSosHistoryExpanded;
  if (sosHistoryToggleButton) sosHistoryToggleButton.hidden = isSosHistoryExpanded;
  if (sosHistoryCollapseButton) sosHistoryCollapseButton.hidden = !isSosHistoryExpanded;
  if (profileSosSummary) {
    profileSosSummary.textContent = sosHistoryEvents.length > 0
      ? t('profile.sosHistorySummary', {
        count: sosHistoryEvents.length,
        lastPart: sosHistoryEvents[0]?.createdAt
          ? t('profile.sosHistoryLastPart', { date: formatSosEventDate(sosHistoryEvents[0].createdAt) })
          : '',
      })
      : t('profile.noHistory');
  }

  const hasMoreThanThree = sosHistoryEvents.length > 3;
  if (sosHistoryShowAllButton) {
    sosHistoryShowAllButton.hidden = !isSosHistoryExpanded || !hasMoreThanThree || isSosHistoryShowingAll;
  }

  if (!isSosHistoryExpanded) {
    sosHistoryList.innerHTML = '';
    return;
  }

  if (!currentUser) {
    sosHistoryList.innerHTML = `<p class="sos-history-empty">${escapeHtml(t('runtime.noSosHistory'))}</p>`;
    return;
  }

  if (sosHistoryStatus) {
    sosHistoryList.innerHTML = `<p class="save-status error">${escapeHtml(sosHistoryStatus)}</p>`;
    return;
  }

  if (sosHistoryEvents.length === 0) {
    sosHistoryList.innerHTML = `<p class="sos-history-empty">${escapeHtml(t('runtime.noSosHistory'))}</p>`;
    return;
  }

  const visibleEvents = isSosHistoryShowingAll ? sosHistoryEvents : sosHistoryEvents.slice(0, 3);
  sosHistoryList.innerHTML = visibleEvents
    .map((event) => {
      const hasLocation = event.latitude !== null && event.latitude !== undefined && event.longitude !== null && event.longitude !== undefined;
      const locationUrl = hasLocation ? getLocationUrl(event) : '';

      return `
        <article class="sos-history-item">
          <time datetime="${escapeHtml(event.createdAt || '')}">${escapeHtml(formatSosEventDate(event.createdAt))}</time>
          <p>${escapeHtml(getMessagePreview(event.message))}</p>
          ${hasLocation ? `<a href="${escapeHtml(locationUrl)}" target="_blank" rel="noopener">${escapeHtml(t('runtime.openLocation'))}</a>` : `<span>${escapeHtml(t('sos.noLocation'))}</span>`}
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
    ? t('common.copy')
    : t('sos.trackingUnavailable');
  if (sosModal) sosModal.hidden = false;
  document.body.classList.add('modal-open');
  sosActionPanel.hidden = false;
  sosMessagePreview.textContent = message;
  sosTestModeLabel.hidden = !isSosTestMode;
  sosSendSmsButton.disabled = false;
  sosSendWhatsappButton.disabled = isSosTestMode;
  sosNativeShareButton.disabled = isSosTestMode;
  const contactMessage = contact
    ? t('runtime.primaryContactLine', { name: contact.name, phone: formatPhone(contact.phone) })
    : t('runtime.noPrimaryContact');
  const localTrackingNote = !currentUser
    ? t('runtime.sosLocalOnly')
    : '';
  sosActionFeedback.textContent = [historyMessage, localTrackingNote, contactMessage].filter(Boolean).join(' ');
  sosStatus.textContent = isSosTestMode ? t('runtime.testModeActive') : t('sos.activatedReal');
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
  sosCopyTrackingButton.textContent = t('runtime.copyTrackingLink');
  sosSendSmsButton.disabled = false;
  sosSendWhatsappButton.disabled = false;
  sosNativeShareButton.disabled = false;
}

function sendPreparedSosSms() {
  if (!preparedSosMessage) return;

  if (isSosTestMode) {
    const smsCapableContacts = getSmsCapableSosContacts();
    if (smsCapableContacts.length === 0) {
      showPage('contacts');
      sosActionFeedback.textContent = t('runtime.noContactsForTestSms');
      sosStatus.textContent = sosActionFeedback.textContent;
      return;
    }

    notifyAllSosContacts();
    sosActionFeedback.textContent = getActiveSosSmsQueueProgressText(ensureActiveSosSmsQueue());
    sosStatus.textContent = sosActionFeedback.textContent;
    return;
  }

  if (!preparedSosContact) return;

  window.location.href = getSmsLink(preparedSosContact, preparedSosMessage);
  sosActionFeedback.textContent = t('runtime.smsReadyFor', { name: preparedSosContact.name });
  sosStatus.textContent = t('runtime.smsReadyFor', { name: preparedSosContact.name });
}

function sendPreparedSosWhatsapp() {
  if (!preparedSosMessage) return;

  window.open(getWhatsappLink(preparedSosMessage), '_blank', 'noopener');
  sosActionFeedback.textContent = t('runtime.whatsappReady');
  sosStatus.textContent = t('runtime.whatsappReady');
}

async function copyPreparedSosMessage() {
  if (!preparedSosMessage) return;

  try {
    await copyTextToClipboard(preparedSosMessage);
    sosActionFeedback.textContent = t('runtime.sosMessageCopied');
    sosStatus.textContent = t('runtime.sosMessageCopied');
  } catch {
    sosActionFeedback.textContent = t('runtime.sosMessageCopyFailed');
    sosStatus.textContent = t('runtime.sosMessageCopyFailed');
  }
}

async function copyPreparedSosTrackingLink() {
  if (!preparedSosTrackingUrl) return;

  try {
    await copyTextToClipboard(preparedSosTrackingUrl);
    sosActionFeedback.textContent = t('runtime.trackingLinkCopied');
    sosStatus.textContent = t('runtime.trackingLinkCopied');
  } catch {
    sosActionFeedback.textContent = t('runtime.trackingLinkCopyFailed');
    sosStatus.textContent = t('runtime.trackingLinkCopyFailed');
  }
}

async function sharePreparedSosMessage() {
  if (!preparedSosMessage) return;

  if (!navigator.share) {
    sosActionFeedback.textContent = t('runtime.shareNotSupported');
    sosStatus.textContent = t('runtime.shareNotSupported');
    return;
  }

  try {
    await navigator.share({
      title: 'SafeMe SOS',
      text: preparedSosMessage,
    });
    sosActionFeedback.textContent = t('runtime.shareOpened');
    sosStatus.textContent = t('runtime.shareOpened');
  } catch (error) {
    if (error?.name === 'AbortError') {
      sosActionFeedback.textContent = t('runtime.shareCancelled');
      sosStatus.textContent = t('runtime.shareCancelled');
      return;
    }

    sosActionFeedback.textContent = t('runtime.shareFailed');
    sosStatus.textContent = t('runtime.shareFailed');
  }
}

function hasRequiredProfileDetails() {
  return Boolean(profile?.name?.trim() && profile?.phone?.trim());
}

function getSosValidationMessage() {
  if (contacts.length === 0) {
    return t('runtime.needContactForSos');
  }

  if (!hasRequiredProfileDetails()) {
    return t('runtime.needProfileForSos');
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
    ? t('sos.activatedTest')
    : t('sos.activatedReal');

  const contact = getPrimaryContact();
  let historyMessage = '';

  if (isSosTestMode) {
    createLocalActiveSosSession(currentLocation, { testMode: true });
    let testSosMessage = t('sos.activatedTest');
    if (currentUser) {
      try {
        await createActiveSosSession(null, currentLocation, { testMode: true, successMessage: t('runtime.testSosWithTracking') });
        testSosMessage = t('runtime.testSosWithTracking');
      } catch {
        testSosMessage = t('runtime.testTrackingNotCreated');
        renderActiveSosSession(testSosMessage);
      }
    }
    preparedSosMessage = buildSosMessage(currentLocation, activeSosSession?.shareToken);
    preparedSosContact = contact;
    preparedSosTrackingUrl = '';
    renderActiveSosSession(testSosMessage);
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
        renderActiveSosSession(t('sos.activatedReal'));
      }
    }
  } catch {
    historyMessage = t('runtime.sosWithoutLocation');
  }

  if (currentUser) {
    try {
      await createActiveSosSession(null, currentLocation);
      historyMessage = historyMessage || t('runtime.sosCreated');
    } catch (error) {
      historyMessage = historyMessage || t('runtime.sosLocalNoTracking');
    }
  } else {
    historyMessage = historyMessage || t('runtime.sosLocalSignInTracking');
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
      historyMessage = `${historyMessage || t('sos.messageReady')} ${t('runtime.sosPreparedSaved')}`;
      if (savedEvent) {
        sosHistoryEvents = [savedEvent, ...sosHistoryEvents].slice(0, 5);
        sosHistoryStatus = '';
        renderSosHistory();
        await attachSosEventToActiveSession(savedEvent.id);
      }
    } catch (error) {
      historyMessage = `${historyMessage || t('sos.messageReady')} ${t('runtime.sosPreparedNotSaved')}`;
    }
  }

  renderActiveSosSession(historyMessage || t('sos.activatedReal'));
  markTestSosCompleted();
  } catch (error) {
    console.error('[SafeMe] SOS activation failed', error);
    const message = t('runtime.sosActivateFailed');
    if (sosStatus) sosStatus.textContent = message;
    showGlobalSafetyMessage(message);
  } finally {
    setSosConfirmLoading(false);
    sosActivationInProgress = false;
  }
}

function syncSosTestModeToggle() {
  if (sosTestModeToggle) sosTestModeToggle.checked = isSosTestMode;
  if (homeSosTestModeToggle) homeSosTestModeToggle.checked = isSosTestMode;
  renderSettingsSummary();
  renderHomeReadinessCards();
}

function setSosTestMode(enabled) {
  isSosTestMode = Boolean(enabled);
  saveJson(storageKeys.sosTestMode, isSosTestMode);
  syncSosTestModeToggle();

  if (preparedSosMessage) {
    preparedSosMessage = buildSosMessage(currentLocation, activeSosSession?.shareToken);
    if (sosMessagePreview) sosMessagePreview.textContent = preparedSosMessage;
    if (sosTestModeLabel) sosTestModeLabel.hidden = !isSosTestMode;
  }
}

function handleSosTestModeChange(event) {
  setSosTestMode(Boolean(event?.target?.checked));
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
  renderContactsSyncStatus();
  updateContactsAddCtaLabel();
  const primaryContact = contacts.find((contact) => contact.tone === 'primary');
  if (contactsSummaryLine) {
    contactsSummaryLine.textContent = contacts.length === 0
      ? t('contacts.noneYet')
      : `${contacts.length} ${t('common.contact')}${primaryContact ? ` • ${t('contacts.setPrimary')}: ${primaryContact.name}` : ''}`;
  }
  if (contacts.length === 0) {
    contactsList.innerHTML = `
      <article class="empty-state">
        <div class="empty-icon" aria-hidden="true">👥</div>
        <h3>${escapeHtml(t('contacts.noneYet'))}</h3>
        <p>${escapeHtml(t('contacts.addFirstContact'))}</p>
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
            ${isPrimary ? `<span class="primary-contact-badge">${escapeHtml(t('contacts.setPrimary'))}</span>` : ''}
          </div>
          <div class="contact-actions">
            ${phoneForLink ? `<a href="tel:${escapeHtml(phoneForLink)}" class="call-link">${escapeHtml(t('contacts.call'))} · ${escapeHtml(formatPhone(contact.phone))}</a>` : `<span class="missing-contact-inline">${escapeHtml(t('contacts.missingPhone'))}</span>`}
            <button class="ghost-button contact-invite-button" type="button" data-contact-index="${index}" ${isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>${escapeHtml(t('contacts.invite'))}</button>
            <button class="ghost-button edit-contact-button" type="button" data-contact-index="${index}" ${isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>${escapeHtml(t('contacts.edit'))}</button>
            <button class="secondary-button primary-contact-button" type="button" data-contact-index="${index}" ${isPrimary || isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>${escapeHtml(t('contacts.setPrimary'))}</button>
            <button class="danger-outline-button delete-contact-button" type="button" data-contact-index="${index}" ${isContactsMutationInProgress ? 'disabled aria-disabled="true"' : ''}>${escapeHtml(t('contacts.delete'))}</button>
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
  if (!currentUser) setContactsSyncState('local');
  renderContacts();
  renderSetupChecklist();
  renderHealthPage();
  renderSosContactNotifications();
}

function ensurePrimaryContact() {
  contacts = ensureSinglePrimaryContact(contacts);
}

async function deleteContact(index) {
  if (isContactsMutationInProgress) return;

  const confirmed = window.confirm(t('contacts.confirmDelete'));

  if (!confirmed) return;

  const contactToDelete = contacts[index];
  if (!contactToDelete) return;

  const previousContacts = contacts;
  isContactsMutationInProgress = true;

  try {
    if (currentUser) await deleteContactFromSupabase(contactToDelete);
    updateContacts((currentContacts) => currentContacts.filter((contact) => contact.id !== contactToDelete.id));
    persistContactsLocally();
    if (currentUser) await refreshAccountContactsFromSupabase({ silent: true });
  } catch (error) {
    console.warn('[SafeMe] Contact delete failed', error);
    setContactsSyncState('error', { lastError: getSupabaseErrorMessage(error), message: '' });
    updateContacts(previousContacts);
    window.alert(t('contacts.deleteFailed'));
  } finally {
    isContactsMutationInProgress = false;
    renderContacts();
  }
}

async function editContact(index) {
  const contact = contacts[index];

  if (!contact) return;

  if (!currentUser) recoverContactsStorage();

  const name = window.prompt(t('contacts.name'), contact.name);
  if (name === null) return;

  const relationship = window.prompt(t('contacts.relationship'), contact.relationship);
  if (relationship === null) return;

  const phone = window.prompt(t('contacts.phone'), contact.phone || '');
  if (phone === null) return;

  const email = window.prompt(t('contacts.emailOptional'), contact.email || '');
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
    if (currentUser) {
      await upsertContactToSupabase(updatedContact);
      await refreshAccountContactsFromSupabase({ silent: true });
    } else {
      contacts = contacts.map((savedContact, contactIndex) => (contactIndex === index ? updatedContact : savedContact));
      persistContactsLocally();
    }
    renderContacts();
    renderSetupChecklist();
    renderHealthPage();
    renderSosContactNotifications();
  } catch (error) {
    console.warn('[SafeMe] Contact update failed', error);
    setContactsSyncState('error', { lastError: getSupabaseErrorMessage(error), message: '' });
    contacts = previousContacts;
    saveJson(storageKeys.contacts, contacts);
    window.alert(t('contacts.saveFailed'));
  }
}

async function setPrimaryContact(index) {
  if (!currentUser) recoverContactsStorage();
  const nextContacts = contacts.map((contact, contactIndex) => ({
    ...contact,
    tone: contactIndex === index ? 'primary' : 'default',
  }));

  const previousContacts = contacts;
  try {
    contacts = nextContacts;
    persistContactsLocally();
    if (currentUser) {
      await upsertContactsToSupabase(nextContacts);
      await refreshAccountContactsFromSupabase({ silent: true });
    }
  } catch (error) {
    contacts = previousContacts;
    saveJson(storageKeys.contacts, contacts);
    console.warn('[SafeMe] Contact primary update failed', error);
    setContactsSyncState('error', { lastError: getSupabaseErrorMessage(error), message: '' });
    window.alert(t('contacts.setPrimaryFailed'));
  }
  renderContacts();
  renderAuth();
  renderSetupChecklist();
  renderHealthPage();
  renderSosContactNotifications();
}


async function clearTrustedContacts() {
  if (isContactsMutationInProgress) return;

  const confirmed = window.confirm(currentUser
    ? t('contacts.confirmClearSignedIn')
    : t('contacts.confirmClear'));

  if (!confirmed) return;

  isContactsMutationInProgress = true;
  try {
    contacts = [];
    persistContactsLocally();
    if (currentUser) await deleteAllContactsFromSupabase();
    renderContacts();
    renderSetupChecklist();
    renderHealthPage();
    renderSosContactNotifications();
  } catch (error) {
    setContactsSyncState('error', { lastError: getSupabaseErrorMessage(error), message: '' });
    console.warn('[SafeMe] Clear trusted contacts failed', error);
  } finally {
    isContactsMutationInProgress = false;
    renderContacts();
  }
}

function openContactInviteModal(index) {
  const contact = contacts[index];
  if (!contact) return;

  preparedContactInvite = contact;
  contactInvitePreview.textContent = getTrustedContactInviteMessage();
  contactInviteFeedback.textContent = t('runtime.inviteReady', { name: contact.name });
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

  window.location.href = getSmsLink(preparedContactInvite, getTrustedContactInviteMessage());
  contactInviteFeedback.textContent = t('runtime.inviteSmsReady', { name: preparedContactInvite.name });
}

function sendContactInviteWhatsapp() {
  window.open(getWhatsappLink(getTrustedContactInviteMessage()), '_blank', 'noopener');
  contactInviteFeedback.textContent = t('runtime.inviteWhatsappReady');
}

async function copyContactInviteMessage() {
  try {
    await copyTextToClipboard(getTrustedContactInviteMessage());
    contactInviteFeedback.textContent = t('runtime.inviteCopied');
  } catch {
    contactInviteFeedback.textContent = t('runtime.inviteCopyFailed');
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

  if (!currentUser) recoverContactsStorage();
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
      await saveContactToSupabase(newContact);
      await refreshAccountContactsFromSupabase({ silent: true });
      setContactsSyncState('synced', { message: t('contacts.savedToAccount') });
    }
  } catch (error) {
    if (savedLocally) {
      if (currentUser) setContactsSyncState('error', { lastError: getSupabaseErrorMessage(error), message: '' });
      console.warn('[SafeMe] Contact save synced locally only', error);
    } else {
      console.warn('[SafeMe] Contact save failed', error);
      updateContacts(previousContacts);
      window.alert(t('contacts.saveFailed'));
    }
  } finally {
    isContactsMutationInProgress = false;
    renderContacts();
    renderSetupChecklist();
    renderHealthPage();
    renderSosContactNotifications();
  }
}

function renderProfile() {
  const hasProfile = hasCompleteLocalProfile();
  const displayName = getProfileValue('name', t('profile.fillProfile'));

  document.querySelector('#profile-local-status')?.classList.toggle('signed-in', Boolean(currentUser));
  const accountStatusLabel = document.querySelector('#profile-account-label');
  const localStatusText = document.querySelector('#profile-local-status-text');
  const localStatusHint = document.querySelector('#profile-local-status-hint');
  if (accountStatusLabel) {
    accountStatusLabel.textContent = currentUser ? t('common.signedIn') : t('common.localProfile');
    accountStatusLabel.classList.toggle('signed-in', Boolean(currentUser));
  }
  if (localStatusText) {
    localStatusText.textContent = currentUser
      ? t('profile.signedInEmail', { email: currentUser.email || t('profile.noEmail') })
      : t('profile.notSignedIn');
  }
  if (localStatusText) localStatusText.title = currentUser ? (currentUser.email || '') : '';
  if (localStatusHint) {
    localStatusHint.textContent = currentUser ? t('common.syncActive') : t('profile.localHint');
  }
  if (profileStatusLoginButton) profileStatusLoginButton.hidden = Boolean(currentUser);

  profileName.textContent = displayName;
  profilePhone.textContent = getProfileValue('phone', t('profile.noPhone'));
  if (profileDetailName) profileDetailName.textContent = displayName;
  if (profileDetailPhone) profileDetailPhone.textContent = getProfileValue('phone', t('profile.noPhone'));
  const displayPhone = getProfileValue('phone', t('profile.noPhone'));
  if (profileDetailsSummary) profileDetailsSummary.textContent = `${displayName} • ${displayPhone}`;
  if (profileNotes) profileNotes.textContent = getProfileMedicalNotesDisplay();
  if (profileLanguage) profileLanguage.textContent = getSettingsLanguageLabel();
  renderSettingsSummary();
  if (profileCreatedAt) profileCreatedAt.textContent = formatDiagnosticDateTime(profile?.createdAt);
  if (profileUpdatedAt) profileUpdatedAt.textContent = formatDiagnosticDateTime(profile?.updatedAt);
  profileAvatar.textContent = profile?.name ? getInitials(profile.name) : '👤';
  profileForm.elements.name.value = profile?.name || '';
  profileForm.elements.phone.value = profile?.phone || '';
  profileForm.elements.medicalNotes.value = profile?.medicalNotes || '';
}

async function saveProfile(event) {
  event.preventDefault();
  const formData = new FormData(profileForm);
  const preferredLanguage = profile?.preferredLanguage || 'en';
  profile = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    medicalNotes: normalizeMedicalNotes(formData.get('medicalNotes')),
    preferredLanguage,
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
      ? t('profile.savedSynced')
      : (savedLocally ? t('profile.savedLocal') : t('profile.savedSessionOnly'));
  } catch (error) {
    profileStatus.textContent = t('profile.savedLocalSyncFailed', { error: error.message });
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

function getSafeAuthErrorValue(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAuthErrorDetails(error) {
  return {
    message: getSafeAuthErrorValue(error?.message || error),
    status: getSafeAuthErrorValue(error?.status),
    code: getSafeAuthErrorValue(error?.code),
    isSupabaseReady,
  };
}

function isExistingAccountSignupError(details) {
  const rawMessage = details.message.toLowerCase();
  const rawCode = details.code.toLowerCase();

  return rawCode === 'user_already_exists'
    || rawMessage.includes('user already registered')
    || rawMessage.includes('already exists')
    || rawMessage.includes('email already registered')
    || rawMessage.includes('user_already_exists');
}

function getFriendlyAuthErrorMessage(error, options = {}) {
  const details = getAuthErrorDetails(error);
  const rawMessage = details.message.toLowerCase();

  if (!isSupabaseReady) {
    return t('auth.serviceNotLoaded');
  }

  if (rawMessage.includes('supabase is unavailable')) {
    return t('auth.supabaseLocal');
  }

  if (details.code === 'invalid_credentials' || rawMessage.includes('invalid login credentials') || rawMessage.includes('invalid credentials')) {
    return t('auth.invalidCredentials');
  }

  if (rawMessage.includes('email not confirmed') || rawMessage.includes('not confirmed')) {
    return t('auth.emailNotConfirmed');
  }

  if (rawMessage.includes('failed to fetch') || rawMessage.includes('network') || rawMessage.includes('fetch')) {
    return t('auth.noConnection');
  }

  if (options.isSignup && isExistingAccountSignupError(details)) {
    return t('auth.accountExists');
  }

  if (rawMessage.includes('password')) {
    return t('auth.passwordRejected');
  }

  return t('auth.genericError');
}

function warnAuthError(error) {
  const details = getAuthErrorDetails(error);
  console.warn('[SafeMe] Auth error', details);
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
  showAuthMessage(getAuthStatusMessages().passwordResetReady);
  passwordResetStatus.textContent = '';
  passwordResetStatus.classList.remove('error');
  removeRecoveryTokensFromUrl();
  focusElementAfterScroll(passwordResetNew || passwordResetForm);
}

function readRememberedEmail() {
  try { return localStorage.getItem(storageKeys.rememberedEmail) || ''; } catch { return ''; }
}

function applyRememberedEmail({ overwrite = false } = {}) {
  if (!authEmail || !rememberEmailCheckbox || currentUser) return;
  const rememberedEmail = readRememberedEmail();
  rememberEmailCheckbox.checked = Boolean(rememberedEmail);
  if (rememberedEmail && (overwrite || !authEmail.value)) authEmail.value = rememberedEmail;
  if (authPassword) authPassword.value = '';
}

function syncRememberedEmailPreference(email) {
  try {
    if (rememberEmailCheckbox?.checked) localStorage.setItem(storageKeys.rememberedEmail, email);
    else localStorage.removeItem(storageKeys.rememberedEmail);
  } catch (error) {
    console.warn('[SafeMe] Remember email preference could not be saved', error);
  }
}

function renderAccountSyncStatus() {
  const signedIn = Boolean(currentUser);
  if (accountSyncBanner) accountSyncBanner.classList.toggle('signed-in', signedIn), accountSyncBanner.classList.toggle('signed-out', !signedIn);
  if (accountSyncTitle) {
    accountSyncTitle.textContent = signedIn
      ? t('profile.signedInEmail', { email: currentUser.email || t('profile.noEmail') })
      : t('accountBanner.notSignedIn');
  }
  if (accountSyncTitle) accountSyncTitle.title = signedIn ? (currentUser.email || '') : '';
  if (accountSyncMessage) {
    accountSyncMessage.textContent = signedIn
      ? t('common.syncActive')
      : t('accountBanner.localSos');
  }
  if (accountSyncLoginButton) accountSyncLoginButton.hidden = signedIn;
  if (sosAccountStatus) {
    sosAccountStatus.textContent = signedIn
      ? t('auth.accountActiveSos')
      : t('auth.sosOnDevice');
    sosAccountStatus.classList.toggle('signed-in', signedIn);
  }
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
  const isSignup = authMode === 'signup';
  const userEmail = currentUser?.email || '';
  const hideSignupFields = signedIn || !isSignup;

  if (!signedIn) applyRememberedEmail();

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
  if (rememberEmailOption) rememberEmailOption.hidden = signedIn || isSignup;
  if (rememberEmailHelper) rememberEmailHelper.hidden = signedIn || isSignup;
  authSubmitButton.hidden = signedIn;
  if (authSecondaryLinks) authSecondaryLinks.hidden = signedIn;
  authForgotPasswordButton.hidden = signedIn || isSignup;
  authModeTabs.hidden = signedIn;
  authLoginTab.hidden = signedIn;
  authSignupTab.hidden = signedIn;
  authSignedIn.hidden = !signedIn;
  authUserEmail.textContent = userEmail;
  authUserEmail.title = userEmail;
  authEmail.disabled = signedIn;
  authPassword.disabled = signedIn;
  authRepeatPassword.disabled = hideSignupFields;
  authEmail.required = !signedIn;
  authPassword.required = !signedIn;
  authRepeatPassword.required = !signedIn && isSignup;
  authSubmitButton.textContent = isSignup ? t('profile.createAccount') : t('profile.signIn');
  if (authTitle) authTitle.textContent = signedIn ? t('profile.account') : (isSignup ? t('profile.createAccount') : t('profile.signIn'));
  if (authHelper) {
    authHelper.hidden = signedIn;
    authHelper.textContent = isSignup ? t('auth.signupHelper') : t('auth.loginHelper');
  }
  if (authLiveTrackingNote) authLiveTrackingNote.hidden = true;
  if (authSwitchModeButton) {
    authSwitchModeButton.textContent = isSignup ? t('profile.hasAccount') : t('profile.noAccount');
  }
  authPassword.autocomplete = isSignup ? 'new-password' : 'current-password';
  authLoginTab.classList.toggle('active', !isSignup);
  authSignupTab.classList.toggle('active', isSignup);
  authLoginTab.setAttribute('aria-selected', String(!isSignup));
  authSignupTab.setAttribute('aria-selected', String(isSignup));
  authIndicator.textContent = signedIn ? t('common.signedIn') : (hasLocalDemoProfile ? t('common.localProfile') : t('common.notSignedIn'));
  authIndicator.setAttribute('aria-label', signedIn
    ? t('auth.openProfile')
    : (hasLocalDemoProfile ? t('auth.openProfile') : t('auth.openProfile')));
  authIndicator.classList.toggle('signed-in', signedIn);
  authIndicator.classList.toggle('signed-out', !signedIn);
  if (profileAccountSummary) {
    profileAccountSummary.textContent = signedIn
      ? `${t('profile.signedInAs')} ${userEmail || t('profile.noEmail')}`
      : t('profile.notSignedIn');
    profileAccountSummary.title = signedIn ? userEmail : '';
  }
  if (storageMode) storageMode.textContent = signedIn ? t('auth.storageSignedIn') : t('auth.storageLocal');
  passwordResetForm.hidden = !isPasswordRecoveryMode;
  passwordResetNew.required = isPasswordRecoveryMode;
  passwordResetRepeat.required = isPasswordRecoveryMode;

  if (!signedIn && authStatus.textContent === getAuthStatusMessages().signedIn) {
    authStatus.textContent = getAuthStatusMessages().signedOut;
    authStatus.classList.remove('error');
  }

  renderAccountSyncStatus();

  if (!authStatus.textContent) {
    authStatus.textContent = signedIn ? getAuthStatusMessages().signedIn : getAuthStatusMessages().signedOut;
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
  authPasswordToggle.textContent = showPassword ? t('common.hide') : t('common.show');
}

async function sendPasswordResetEmail() {
  const email = authEmail.value.trim();

  if (!email) {
    showAuthMessage(t('auth.resetEmailRequired'), true);
    authEmail.focus();
    return;
  }

  setAuthLoading(true);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PASSWORD_RESET_REDIRECT_URL,
    });

    if (error) throw error;

    showAuthMessage(getAuthStatusMessages().passwordResetSent);
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
    showPasswordResetMessage(t('auth.passwordRejected'), true);
    passwordResetNew.focus();
    return;
  }

  if (repeatPassword !== newPassword) {
    showPasswordResetMessage(t('auth.passwordMismatch'), true);
    passwordResetRepeat.focus();
    return;
  }

  setPasswordResetLoading(true);

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    showAuthMessage(getAuthStatusMessages().passwordResetSuccess);
    showPasswordResetMessage(getAuthStatusMessages().passwordResetSuccess);
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
    .insert(mapContactToSupabase({ ...contact, id: undefined }))
    .select('*')
    .single();

  if (error) throw error;
  setContactsSyncState('synced', { lastSaveAt: new Date().toISOString(), lastError: '' });
  return mapContactFromSupabase(data);
}

async function upsertContactToSupabase(contact) {
  if (!currentUser || isRemoteSyncing) return contact;

  const payload = mapContactToSupabase(contact);
  const hasRemoteId = Boolean(payload.id);
  const query = hasRemoteId
    ? supabase.from('trusted_contacts').upsert(payload, { onConflict: 'id' })
    : supabase.from('trusted_contacts').insert(payload);
  const { data, error } = await query.select('*').single();

  if (error) throw error;
  setContactsSyncState('synced', { lastSaveAt: new Date().toISOString(), lastError: '' });
  return mapContactFromSupabase(data);
}

async function upsertContactsToSupabase(contactList) {
  if (!currentUser || isRemoteSyncing || !Array.isArray(contactList)) return [];
  const savedContacts = [];
  for (const contact of contactList) {
    savedContacts.push(await upsertContactToSupabase(contact));
  }
  return savedContacts;
}

async function deleteContactFromSupabase(contact) {
  if (!currentUser || isRemoteSyncing || !contact?.id) return;

  const { error } = await supabase
    .from('trusted_contacts')
    .delete()
    .eq('user_id', currentUser.id)
    .eq('id', contact.id);

  if (error) throw error;
  setContactsSyncState('synced', { lastSaveAt: new Date().toISOString(), lastError: '' });
}

async function deleteAllContactsFromSupabase() {
  if (!currentUser || isRemoteSyncing) return;
  const { error } = await supabase
    .from('trusted_contacts')
    .delete()
    .eq('user_id', currentUser.id);
  if (error) throw error;
  setContactsSyncState('synced', { lastSaveAt: new Date().toISOString(), remoteCount: 0, lastError: '' });
}

async function saveContactsToSupabase() {
  if (!currentUser) return;
  await upsertContactsToSupabase(contacts);
}

async function autoRefreshAccountContactsFromSupabase(reason = 'auto', { force = false } = {}) {
  if (!currentUser) return contacts;
  const now = Date.now();
  if (!force && now - lastContactsAutoRefreshAt < CONTACTS_AUTO_REFRESH_THROTTLE_MS) return contacts;
  lastContactsAutoRefreshAt = now;
  return refreshAccountContactsFromSupabase({ silent: true, reason });
}

async function refreshAccountContactsFromSupabase({ silent = true } = {}) {
  if (!currentUser || isContactsRefreshInProgress) return contacts;

  isContactsRefreshInProgress = true;
  lastContactsAutoRefreshAt = Date.now();
  if (!silent) setContactsSyncState('syncing', { message: t('contacts.syncing'), lastError: '' });

  try {
    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    contacts = ensureSinglePrimaryContact(sanitizeContacts((data || []).map(mapContactFromSupabase)));
    saveJson(storageKeys.contacts, contacts);
    if (contacts.length === 0 && !pendingLocalImport) pendingLocalImport = getLocalImportCandidate();
    setContactsSyncState('synced', {
      lastLoadAt: new Date().toISOString(),
      remoteCount: contacts.length,
      lastError: '',
      message: silent ? '' : t('contacts.syncedAuto'),
    });
    renderContacts();
    renderSetupChecklist();
    renderHealthPage();
    renderSosContactNotifications();
    return contacts;
  } catch (error) {
    const message = getSupabaseErrorMessage(error);
    setContactsSyncState('error', { lastError: message, message: '' });
    if (!silent) showAuthMessage(t('runtime.supabaseErrorPrefix', { error: message }), true);
    renderContacts();
    throw error;
  } finally {
    isContactsRefreshInProgress = false;
    renderContactsSyncStatus();
  }
}

async function manuallyRefreshAccountContacts() {
  try {
    await refreshAccountContactsFromSupabase({ silent: false });
  } catch (error) {
    console.warn('[SafeMe] Manual contacts refresh failed', error);
  }
}

async function uploadLocalContactsToAccount() {
  if (!currentUser || contacts.length === 0 || isContactsMutationInProgress) return;
  isContactsMutationInProgress = true;
  setContactsSyncState('syncing', { message: t('runtime.uploadingContacts'), lastError: '' });
  try {
    await upsertContactsToSupabase(contacts);
    await refreshAccountContactsFromSupabase({ silent: true });
    setContactsSyncState('synced', { message: t('runtime.contactsUploaded') });
  } catch (error) {
    setContactsSyncState('error', { lastError: getSupabaseErrorMessage(error), message: '' });
    console.warn('[SafeMe] Manual local contacts upload failed', error);
  } finally {
    isContactsMutationInProgress = false;
    renderContacts();
  }
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
  if (pendingLocalImport.profile) parts.push(t('runtime.profilePart'));
  if (pendingLocalImport.contacts.length) parts.push(t('runtime.contactsCount', { count: pendingLocalImport.contacts.length }));
  localImportSummary.textContent = t('runtime.localImportFound', { parts: parts.join(t('runtime.andJoin')) });
}

async function importLocalEmergencyInfo() {
  if (!currentUser || !pendingLocalImport) return;
  localImportButton.disabled = true;
  localImportStatus.textContent = t('runtime.importingLocal');
  try {
    if (pendingLocalImport.profile) {
      profile = { ...pendingLocalImport.profile, updatedAt: new Date().toISOString() };
      await saveProfileToSupabase();
    }
    if (pendingLocalImport.contacts.length > 0) {
      contacts = ensureSinglePrimaryContact(pendingLocalImport.contacts);
      await upsertContactsToSupabase(contacts);
      await refreshAccountContactsFromSupabase({ silent: true });
    }
    saveJson(storageKeys.profile, profile);
    if (contacts.length > 0 || !pendingLocalImport?.contacts?.length) saveJson(storageKeys.contacts, contacts);
    pendingLocalImport = null;
    localImportStatus.textContent = t('runtime.importSaved');
    setContactsSyncState('synced');
    renderProfile(); renderContacts(); renderSetupChecklist(); renderHealthPage(); renderSosContactNotifications(); renderLocalImportPrompt();
  } catch (error) {
    localImportStatus.textContent = t('runtime.importFailed');
    localImportStatus.classList.add('error');
  } finally {
    localImportButton.disabled = false;
  }
}

function skipLocalEmergencyImport() {
  pendingLocalImport = null;
  if (localImportStatus) localImportStatus.textContent = t('runtime.importSkipped');
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
    const remoteContactList = ensureSinglePrimaryContact(sanitizeContacts((remoteContacts || []).map(mapContactFromSupabase)));

    pendingLocalImport = (!remoteProfile && remoteContactList.length === 0) ? getLocalImportCandidate() : null;
    profile = mapProfileFromSupabase(remoteProfile) || null;
    contacts = remoteContactList;
    if (!remoteProfile && !pendingLocalImport) profile = savedLocalProfile;
    setContactsSyncState('synced', { lastLoadAt: new Date().toISOString(), remoteCount: contacts.length, lastError: '', message: '' });
    sosHistoryEvents = (remoteSosEvents || []).map(mapSosEventFromSupabase);
    const restoredActiveSosSession = mapActiveSosSessionFromSupabase(remoteActiveSos);
    activeSosSession = shouldRestoreActiveSosSession(restoredActiveSosSession) ? restoredActiveSosSession : null;
    isActiveSosSessionRestored = activeSosSession?.status === 'active';
    sosHistoryStatus = '';

    saveJson(storageKeys.profile, profile);
    if (contacts.length > 0 || !pendingLocalImport?.contacts?.length) saveJson(storageKeys.contacts, contacts);
    renderLocalImportPrompt();

    renderProfile();
    renderContacts();
    renderSosContactNotifications();
    renderSosHistory();
    renderActiveSosSession(isActiveSosSessionRestored
      ? t('runtime.restoredActiveSos')
      : (restoredActiveSosSession ? t('runtime.previousSosEnded') : ''));
    syncActiveSosLocationAutoUpdate();
    if (isActiveSosSessionRestored) {
      sosButton?.classList.add('activated');
      sosButton?.setAttribute('aria-pressed', 'true');
      sosStatus.textContent = t('runtime.restoredSosStatus');
      showPage('home');
    }
    showAuthMessage(getAuthStatusMessages().signedIn);
  } catch (error) {
    activeSosSession = null;
    isActiveSosSessionRestored = false;
    renderActiveSosSession();
    syncActiveSosLocationAutoUpdate();
    sosHistoryStatus = t('runtime.sosHistoryLoadFailed', { error: error.message });
    renderSosHistory();
    setContactsSyncState('error', { lastError: getSupabaseErrorMessage(error), message: '' });
    showAuthMessage(t('runtime.accountSyncFailed'), true);
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
      showAuthMessage(t('runtime.passwordMinLength'), true);
      authPassword.focus();
      setAuthLoading(false);
      return;
    }

    if (repeatPassword !== password) {
      showAuthMessage(t('runtime.passwordsMismatch'), true);
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
    if (!isSignup) syncRememberedEmailPreference(email);
    authPassword.value = '';
    authRepeatPassword.value = '';
    showAuthMessage(isSignup
      ? (data.session ? getAuthStatusMessages().signupSuccess : getAuthStatusMessages().signupPendingConfirmation)
      : getAuthStatusMessages().signedIn);
    renderAuth();
    if (!isSignup || data.session) await loadSupabaseData();
  } catch (error) {
    warnAuthError(error);
    showAuthMessage(getFriendlyAuthErrorMessage(error, { isSignup: authMode === 'signup' }), true);
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

    renderSignedOutAccountUi(getAuthStatusMessages().logoutSuccess);
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
  else applyRememberedEmail({ overwrite: true });
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
    else applyRememberedEmail({ overwrite: true });
    if (event === 'PASSWORD_RECOVERY') activatePasswordRecoveryMode();
    if (!currentUser) {
      if (hasPendingLogoutMessage) {
        renderSignedOutAccountUi(getAuthStatusMessages().logoutSuccess);
        hasPendingLogoutMessage = false;
      } else {
        renderSignedOutAccountUi(getAuthStatusMessages().signedOut);
      }
    } else {
      loadSupabaseData().catch((error) => console.warn('[SafeMe] Auth account data refresh failed', error));
    }
    renderAuth();
    renderSetupChecklist();
  });
}

function clearSafeMeData() {
  const confirmed = window.confirm(t('profile.confirmClearData'));

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
  profileStatus.textContent = t('runtime.dataCleared');
  if (settingsStatus) {
    settingsStatus.textContent = t('runtime.localDataCleared');
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
authSwitchModeButton?.addEventListener('click', () => setAuthMode(authMode === 'signup' ? 'login' : 'signup'));
accountSyncLoginButton?.addEventListener('click', openProfileAuthCard);
profileStatusLoginButton?.addEventListener('click', openProfileAuthCard);
authLoginTab?.addEventListener('click', () => setAuthMode('login'));
authForgotPasswordButton?.addEventListener('click', sendPasswordResetEmail);
authPasswordToggle?.addEventListener('click', togglePasswordVisibility);
authForm?.addEventListener('submit', handleAuthSubmit);
passwordResetForm?.addEventListener('submit', handlePasswordResetSubmit);
authLogoutButton?.addEventListener('click', logout);
authIndicator?.addEventListener('click', openProfileAuthCard);
sosHistoryToggleButton?.addEventListener('click', () => {
  isSosHistoryExpanded = true;
  isSosHistoryShowingAll = false;
  renderSosHistory();
});
sosHistoryShowAllButton?.addEventListener('click', () => {
  isSosHistoryExpanded = true;
  isSosHistoryShowingAll = true;
  renderSosHistory();
});
sosHistoryCollapseButton?.addEventListener('click', () => {
  isSosHistoryExpanded = false;
  isSosHistoryShowingAll = false;
  renderSosHistory();
});
onlineStatusPill?.addEventListener('click', handleOnlineStatusClick);
contactsForm?.addEventListener('submit', addContact);
contactsForm?.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-add-contact]')) closeContactsAddForm();
});
contactsList?.addEventListener('click', (event) => {
  if (event.target.closest('[data-open-add-contact]')) {
    openContactsAccordion('add', { focusTarget: contactsForm?.elements?.name || contactsForm });
    return;
  }
  handleContactsListClick(event);
});
clearContactsButton?.addEventListener('click', clearTrustedContacts);
refreshAccountContactsButton?.addEventListener('click', manuallyRefreshAccountContacts);
uploadLocalContactsButton?.addEventListener('click', uploadLocalContactsToAccount);
profileForm?.addEventListener('submit', saveProfile);
clearDataButton?.addEventListener('click', clearSafeMeData);
settingsOpenProfileButton?.addEventListener('click', openSettingsProfile);
settingsOpenContactsButton?.addEventListener('click', openSettingsContacts);
settingsRefreshLocationButton?.addEventListener('click', refreshLocationFromSettings);
settingsRefreshAppButton?.addEventListener('click', () => refreshAppSafely());
pullRefreshManualButton?.addEventListener('click', () => refreshAppSafely());
settingsClearDataButton?.addEventListener('click', clearSafeMeData);
settingsLogoutButton?.addEventListener('click', confirmSettingsLogout);
settingsLanguageSelect?.addEventListener('change', handleSettingsLanguageChange);
settingsAccordionButtons.forEach((button) => button.addEventListener('click', () => toggleSettingsPanel(button)));
homeSosTestModeToggle?.addEventListener('change', handleSosTestModeChange);
renderSettingsSummary();
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
homeLoginSyncCta?.addEventListener('click', openProfileAuthCard);
homeAddContactCta?.addEventListener('click', focusContactForm);
setupChecklist?.addEventListener('click', handleSetupChecklistAction);
shareLocationButton?.addEventListener('click', shareLocation);
testActiveSosLiveSyncButton?.addEventListener('click', testActiveSosLiveSyncNow);
refreshActiveSosGpsButton?.addEventListener('click', refreshActiveSosGpsNow);
updateActiveSosLocationButton?.addEventListener('click', updateActiveSosLocation);
copyActiveSosTrackingButton?.addEventListener('click', copyActiveSosTrackingLink);
copyActiveSosMessageButton?.addEventListener('click', copyActiveSosMessage);
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
  const resetSmsQueueButton = event.target.closest('[data-sos-reset-sms-queue]');
  if (resetSmsQueueButton) {
    resetActiveSosSmsQueue();
    renderActiveSosSession(t('sos.resetSmsQueue'));
    return;
  }
  const copyButton = event.target.closest('[data-sos-copy-contact]');
  if (copyButton) {
    const contact = contacts[Number(copyButton.dataset.sosCopyContact)];
    await copyTextToClipboard(getActiveSosEmergencyMessage());
    logSosNotification(contact, t('common.copy'), t('common.copied'));
    renderActiveSosSession(t('runtime.copiedForContact', { name: contact?.name || t('common.contact') }));
    return;
  }
  const action = event.target.closest('[data-sos-notify-index]');
  if (action) {
    const contact = contacts[Number(action.dataset.sosNotifyIndex)];
    logSosNotification(contact, action.dataset.sosMethod, t('sos.opened'));
  }
});
window.__safeMeUiEventsBound = true;
}

clearLegacyActiveSosStorage();
syncSosTestModeToggle();
syncSettingsLanguageSelect();
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
syncSettingsLanguageSelect();
refreshAllLocalizedUi();
initializeAuth().catch((error) => console.warn('[SafeMe] Auth startup failed', error));
}


function showPageFallback(nextPage) {
  const pageName = getPageTitles()[nextPage] ? nextPage : 'home';
  document.querySelectorAll('.nav-item').forEach((item) => {
    const isActive = item.dataset.page === pageName;
    item.classList.toggle('active', isActive);
    item.toggleAttribute('aria-current', isActive);
  });
  document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === pageName));
  const title = document.querySelector('#page-title');
  if (title) title.textContent = getPageTitles()[pageName];
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
  const start = async () => {
    if (hasTrackingTokenParam) {
      document.body.classList.add('tracking-mode');
      renderPublicTrackingPage({ loading: true });
      try {
        await initializePublicTrackingMode();
      } catch (error) {
        const diagnosticCode = warnPublicTrackingError(error, { code: 'startup_exception', reason: 'not_ready' });
        renderPublicTrackingPage({
          error: resolvePublicTrackingLoadError(error, { reason: 'not_ready' }),
          diagnosticCode,
        });
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
