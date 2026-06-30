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
const locationText = document.querySelector('#location-text');
const refreshLocationButton = document.querySelector('#refresh-location-button');
const shareLocationButton = document.querySelector('#share-location-button');

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

function persistContacts() {
  contacts = ensureSinglePrimaryContact(contacts);
  saveJson(storageKeys.contacts, contacts);
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

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return entities[character];
  });
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

function buildSosMessage(location = currentLocation) {
  const locationLine = location
    ? `Η τοποθεσία μου: ${getLocationUrl(location)}`
    : 'Δεν μπόρεσα να πάρω τοποθεσία από τη συσκευή μου.';
  const nameLine = profile?.name ? `Όνομα: ${profile.name}` : '';
  const phoneLine = profile?.phone ? `Τηλέφωνο: ${profile.phone}` : '';
  const medicalLine = profile?.medicalNotes ? `Ιατρικές σημειώσεις: ${profile.medicalNotes}` : '';

  return [
    getSosMessageIntro(),
    nameLine,
    phoneLine,
    locationLine,
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

function showSosActionPanel(message, contact) {
  preparedSosMessage = message;
  preparedSosContact = contact;
  sosConfirmStep.hidden = true;
  sosActionPanel.hidden = false;
  sosMessagePreview.textContent = message;
  sosTestModeLabel.hidden = !isSosTestMode;
  sosActionFeedback.textContent = contact
    ? `Κύρια επαφή: ${contact.name} (${formatPhone(contact.phone)})`
    : 'Δεν βρέθηκε κύρια επαφή.';
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
  const message = buildSosMessage(currentLocation);

  sosButton.classList.add('activated');
  sosButton.setAttribute('aria-pressed', 'true');
  setSosConfirmLoading(false);
  showSosActionPanel(message, contact);
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

function deleteContact(index) {
  const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή την επαφή;');

  if (!confirmed) return;

  contacts = contacts.filter((_, contactIndex) => contactIndex !== index);
  ensurePrimaryContact();
  persistContacts();
  renderContacts();
}

function editContact(index) {
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

  persistContacts();
  renderContacts();
}

function setPrimaryContact(index) {
  contacts = contacts.map((contact, contactIndex) => ({
    ...contact,
    tone: contactIndex === index ? 'primary' : 'default',
  }));

  persistContacts();
  renderContacts();
}

function clearTrustedContacts() {
  const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις όλες τις έμπιστες επαφές;');

  if (!confirmed) return;

  contacts = [];
  saveJson(storageKeys.contacts, contacts);
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

function addContact(event) {
  event.preventDefault();
  const formData = new FormData(contactsForm);
  const newContact = {
    name: formData.get('name').trim(),
    relationship: formData.get('relationship').trim(),
    phone: formData.get('phone').trim(),
    tone: contacts.length === 0 ? 'primary' : 'default',
  };

  contacts = [...contacts, newContact];
  persistContacts();
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

function saveProfile(event) {
  event.preventDefault();
  const formData = new FormData(profileForm);
  profile = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    medicalNotes: formData.get('medicalNotes').trim(),
  };

  saveJson(storageKeys.profile, profile);
  renderProfile();
  profileStatus.textContent = 'Τα στοιχεία αποθηκεύτηκαν τοπικά στη συσκευή σου.';
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

contactsForm.addEventListener('submit', addContact);
contactsList.addEventListener('click', handleContactsListClick);
clearContactsButton.addEventListener('click', clearTrustedContacts);
profileForm.addEventListener('submit', saveProfile);
clearDataButton.addEventListener('click', clearSafeMeData);
refreshLocationButton.addEventListener('click', refreshLocation);
shareLocationButton.addEventListener('click', shareLocation);

syncSosTestModeToggle();
renderContacts();
renderProfile();
renderLocation();
