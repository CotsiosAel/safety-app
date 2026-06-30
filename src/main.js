const pageTitles = {
  home: 'Αρχική σελίδα',
  contacts: 'Έμπιστες επαφές',
  profile: 'Προφίλ χρήστη',
};

const defaultContacts = [
  { name: 'Μαρία Παπαδοπούλου', relationship: 'Αδελφή • Κύρια επαφή', phone: '+306901234567', tone: 'primary' },
  { name: 'Νίκος Γεωργίου', relationship: 'Φίλος • Κοντινή απόσταση', phone: '+306912345678', tone: 'default' },
  { name: 'Άννα Κωνσταντίνου', relationship: 'Μητέρα • Έμπιστη επαφή', phone: '+306932109876', tone: 'default' },
];

const defaultProfile = {
  name: 'Ελένη Αντωνίου',
  phone: '+30 694 555 0198',
  medicalNotes: 'Αλλεργία στην πενικιλίνη',
};

const storageKeys = {
  contacts: 'safety-app-trusted-contacts',
  profile: 'safety-app-user-profile',
  location: 'safety-app-last-location',
};

const navButtons = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.querySelector('#page-title');
const sosButton = document.querySelector('#sos-button');
const sosStatus = document.querySelector('#sos-status');
const sosModal = document.querySelector('#sos-modal');
const sosConfirmButton = document.querySelector('#sos-confirm');
const sosCancelButtons = document.querySelectorAll('[data-close-sos]');
const contactsList = document.querySelector('#contacts-list');
const contactsForm = document.querySelector('#contact-form');
const contactCount = document.querySelector('#contact-count');
const profileForm = document.querySelector('#profile-form');
const profileName = document.querySelector('#profile-name');
const profilePhone = document.querySelector('#profile-phone');
const profileNotes = document.querySelector('#profile-notes');
const profileAvatar = document.querySelector('#profile-avatar');
const profileStatus = document.querySelector('#profile-status');
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

let contacts = loadJson(storageKeys.contacts, defaultContacts);
let profile = loadJson(storageKeys.profile, defaultProfile);
let currentLocation = loadJson(storageKeys.location, null);

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

function buildSosMessage(location = currentLocation) {
  const locationLine = location
    ? `Η τοποθεσία μου: ${getLocationUrl(location)}`
    : 'Δεν μπόρεσα να πάρω τοποθεσία από τη συσκευή μου.';
  const medicalLine = profile.medicalNotes ? `Ιατρικές σημειώσεις: ${profile.medicalNotes}` : '';

  return [
    'SOS - Χρειάζομαι βοήθεια.',
    `Όνομα: ${profile.name}`,
    `Τηλέφωνο: ${profile.phone}`,
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

async function openPreparedSosMessage(message, contact) {
  const locationUrl = currentLocation ? getLocationUrl(currentLocation) : undefined;

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'SafeMe SOS',
        text: message,
        url: locationUrl,
      });
      sosStatus.textContent = 'Άνοιξε η κοινοποίηση SOS. Διάλεξε επαφή και πάτα αποστολή.';
      return;
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      sosStatus.textContent = 'Η αποστολή ακυρώθηκε.';
      return;
    }
  }

  if (contact) {
    window.location.href = getSmsLink(contact, message);
    sosStatus.textContent = `Άνοιξε έτοιμο SMS προς ${contact.name}. Πάτα αποστολή.`;
    return;
  }

  try {
    await copyTextToClipboard(message);
    sosStatus.textContent = 'Το μήνυμα αντιγράφηκε. Επικόλλησέ το σε SMS ή WhatsApp.';
  } catch {
    sosStatus.textContent = 'Δεν μπόρεσα να ανοίξω μήνυμα. Δοκίμασε από κινητό.';
  }
}

function openSosModal() {
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
  setSosConfirmLoading(true);
  sosStatus.textContent = 'Ετοιμάζω μήνυμα SOS με την τοποθεσία σου...';

  if (!currentLocation) {
    await refreshLocation();
  }

  const contact = getPrimaryContact();
  const message = buildSosMessage(currentLocation);

  sosButton.classList.add('activated');
  sosButton.setAttribute('aria-pressed', 'true');
  closeSosModal();
  setSosConfirmLoading(false);
  await openPreparedSosMessage(message, contact);
}

function renderContacts() {
  contactsList.innerHTML = contacts
    .map((contact) => {
      const extraClass = contact.tone === 'primary' ? ' primary-contact' : '';
      const phoneForLink = contact.phone.replace(/\s+/g, '');

      return `
        <article class="contact-card${extraClass}">
          <div class="avatar">${escapeHtml(getInitials(contact.name))}</div>
          <div class="contact-info">
            <h3>${escapeHtml(contact.name)}</h3>
            <p>${escapeHtml(contact.relationship)}</p>
          </div>
          <a href="tel:${escapeHtml(phoneForLink)}" class="call-link">☎ ${escapeHtml(formatPhone(contact.phone))}</a>
        </article>
      `;
    })
    .join('');

  contactCount.textContent = contacts.length;
}

function addContact(event) {
  event.preventDefault();
  const formData = new FormData(contactsForm);
  const newContact = {
    name: formData.get('name').trim(),
    relationship: formData.get('relationship').trim(),
    phone: formData.get('phone').trim(),
    tone: 'default',
  };

  contacts = [...contacts, newContact];
  saveJson(storageKeys.contacts, contacts);
  renderContacts();
  contactsForm.reset();
}

function renderProfile() {
  profileName.textContent = profile.name;
  profilePhone.textContent = profile.phone;
  profileNotes.textContent = profile.medicalNotes;
  profileAvatar.textContent = getInitials(profile.name);
  profileForm.elements.name.value = profile.name;
  profileForm.elements.phone.value = profile.phone;
  profileForm.elements.medicalNotes.value = profile.medicalNotes;
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

navButtons.forEach((button) => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

sosButton.addEventListener('click', openSosModal);
sosConfirmButton.addEventListener('click', confirmSos);
sosCancelButtons.forEach((button) => button.addEventListener('click', closeSosModal));
sosModal.addEventListener('click', (event) => {
  if (event.target === sosModal) closeSosModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !sosModal.hidden) closeSosModal();
});

contactsForm.addEventListener('submit', addContact);
profileForm.addEventListener('submit', saveProfile);
refreshLocationButton.addEventListener('click', refreshLocation);
shareLocationButton.addEventListener('click', shareLocation);

renderContacts();
renderProfile();
renderLocation();
