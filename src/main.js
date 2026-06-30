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

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextPage = button.dataset.page;

    navButtons.forEach((item) => item.classList.remove('active'));
    pages.forEach((page) => page.classList.remove('active'));

    button.classList.add('active');
    document.querySelector(`#${nextPage}`).classList.add('active');
    pageTitle.textContent = pageTitles[nextPage];
  });
});

sosButton.addEventListener('click', () => {
  const isActive = sosButton.classList.toggle('activated');

  sosButton.setAttribute('aria-pressed', String(isActive));
  sosStatus.textContent = isActive
    ? 'Η ειδοποίηση SOS είναι ενεργή. Οι επαφές θα ενημερωθούν.'
    : 'Πάτησε SOS όταν χρειάζεσαι άμεση βοήθεια.';
});
