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

function confirmSos() {
  sosButton.classList.add('activated');
  sosButton.setAttribute('aria-pressed', 'true');
  sosStatus.textContent = 'Η ειδοποίηση SOS στάλθηκε στις έμπιστες επαφές';
  closeSosModal();
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

renderContacts();
renderProfile();
