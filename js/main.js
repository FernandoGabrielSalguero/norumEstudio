const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const revealItems = document.querySelectorAll('.reveal');
const contactForm = document.querySelector('#contactForm');
const contactFormMessage = document.querySelector('#contactFormMessage');

const CONTACT_API_ENDPOINT = 'https://gestion.impulsagroup.com/API/contact_form_landing_page/index.php';
const CONTACT_API_KEY = 'ElS0l&laLuN@C@ntandoV4*laC1uD4d';
const CONTACT_PAGE_NAME = 'norum-estudio';

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

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

function setContactMessage(message, type = '') {
  if (!contactFormMessage) return;

  contactFormMessage.textContent = message;
  contactFormMessage.dataset.status = type;
}

async function parseContactResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('La API no devolvio JSON valido.', {
      error,
      status: response.status,
      statusText: response.statusText,
      rawResponse: text
    });

    throw new Error('La respuesta del servidor no fue valida.');
  }
}

function getContactErrorMessage(status, responseData) {
  if (responseData?.message) {
    return responseData.message;
  }

  const messages = {
    400: 'No se pudo procesar la consulta. Revisa los datos e intenta nuevamente.',
    401: 'No se pudo autenticar el envio del formulario.',
    403: 'Este dominio no esta habilitado para enviar consultas.',
    405: 'El metodo de envio no esta permitido.',
    422: 'Faltan datos obligatorios o hay informacion invalida.',
    500: 'La API tuvo un error interno. Intenta nuevamente mas tarde.'
  };

  return messages[status] || 'No se pudo enviar la consulta. Intenta nuevamente.';
}

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);
    const payload = {
      page: CONTACT_PAGE_NAME,
      contact_nombre: String(formData.get('contact_nombre') || '').trim(),
      contact_whatsapp: String(formData.get('contact_whatsapp') || '').trim(),
      contact_email: String(formData.get('contact_email') || '').trim(),
      contact_description: String(formData.get('contact_description') || '').trim(),
      contact_consultation: String(formData.get('contact_consultation') || '').trim()
    };

    if (!payload.contact_nombre) {
      setContactMessage('Ingresa tu nombre para enviar la consulta.', 'error');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    setContactMessage('Enviando consulta...', 'pending');

    try {
      const response = await fetch(CONTACT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': CONTACT_API_KEY
        },
        body: JSON.stringify(payload)
      });
      const responseData = await parseContactResponse(response);

      if (!response.ok || responseData?.success !== true) {
        throw new Error(getContactErrorMessage(response.status, responseData));
      }

      contactForm.reset();
      setContactMessage(responseData.message || 'Consulta enviada correctamente', 'success');
    } catch (error) {
      console.error('Error enviando el formulario de contacto.', {
        error,
        endpoint: CONTACT_API_ENDPOINT,
        payload
      });

      setContactMessage(error.message || 'No se pudo enviar la consulta. Intenta nuevamente.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}
