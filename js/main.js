const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const revealItems = document.querySelectorAll('.reveal');
const form = document.querySelector('[data-contact-form]');
const formNote = document.querySelector('[data-form-note]');

function setHeaderState() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
}

function closeNav() {
  nav.classList.remove('is-open');
  header.classList.remove('nav-active');
  document.body.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  header.classList.toggle('nav-active', isOpen);
  document.body.classList.toggle('nav-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener('click', closeNav);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
  revealObserver.observe(item);
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    navLinks.forEach((link) => {
      const targetId = link.getAttribute('href').replace('#', '');
      link.classList.toggle('is-active', targetId === entry.target.id);
    });
  });
}, { rootMargin: '-42% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach((section) => {
  sectionObserver.observe(section);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const subject = encodeURIComponent(`Consulta web Norüm Estudio - ${data.get('project')}`);
  const body = encodeURIComponent([
    `Nombre: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Tipo de proyecto: ${data.get('project')}`,
    '',
    'Mensaje:',
    data.get('message')
  ].join('\n'));

  window.location.href = `mailto:info@norhumstudio.com?subject=${subject}&body=${body}`;
  formNote.textContent = 'Se abrió tu cliente de correo con la consulta preparada.';
});

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });
