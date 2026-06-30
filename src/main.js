const pageTitles = {
  home: 'Αρχική σελίδα',
  contacts: 'Έμπιστες επαφές',
  profile: 'Προφίλ χρήστη',
};

const navButtons = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.querySelector('#page-title');
const sosButton = document.querySelector('#sos-button');
const sosStatus = document.querySelector('#sos-status');

function showPage(nextPage) {
  navButtons.forEach((item) => {
    const isActive = item.dataset.page === nextPage;
    item.classList.toggle('active', isActive);
    item.toggleAttribute('aria-current', isActive);
  });

  pages.forEach((page) => page.classList.toggle('active', page.id === nextPage));
  pageTitle.textContent = pageTitles[nextPage];
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => showPage(button.dataset.page));
});

sosButton.addEventListener('click', () => {
  const isActive = sosButton.classList.toggle('activated');

  sosButton.setAttribute('aria-pressed', String(isActive));
  sosStatus.textContent = isActive
    ? 'Η ειδοποίηση SOS είναι ενεργή. Οι έμπιστες επαφές σου θα ενημερωθούν άμεσα.'
    : 'Πάτησε SOS όταν χρειάζεσαι άμεση βοήθεια.';
});
