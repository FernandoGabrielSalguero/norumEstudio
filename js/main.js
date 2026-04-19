const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const revealItems = document.querySelectorAll('.reveal');
const form = document.querySelector('[data-contact-form]');
const formNote = document.querySelector('[data-form-note]');
const contactApiUrl = '/API/contact_form_landing_page/index.php';
const contactApiKey = window.NORUM_CONTACT_API_KEY || '';

console.info('Norüm contact form API script loaded.', {
  version: 'contact-api-20260418',
  endpoint: contactApiUrl
});

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

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const payload = {
    page: 'norumEstudio',
    contact_nombre: String(data.get('name') || '').trim(),
    contact_whatsapp: String(data.get('phone') || '').trim(),
    contact_email: String(data.get('email') || '').trim(),
    contact_description: String(data.get('project') || '').trim(),
    contact_consultation: String(data.get('message') || '').trim()
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (contactApiKey) {
    headers['X-API-Key'] = contactApiKey;
  }

  submitButton.disabled = true;
  formNote.textContent = 'Enviando consulta...';

  try {
    const response = await fetch(contactApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const responseText = await response.text();
    let responseData = null;

    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error('La API no devolvió un JSON válido.', {
        parseError,
        responseText,
        status: response.status,
        statusText: response.statusText,
        url: contactApiUrl,
        payload
      });

      throw new Error('Respuesta inválida del servidor.');
    }

    if (!response.ok || responseData?.status !== 'success') {
      console.error('Error al enviar el formulario de contacto.', {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
        rawResponse: responseText,
        url: contactApiUrl,
        payload
      });

      throw new Error(responseData?.message || 'No se pudo enviar la consulta.');
    }

    form.reset();
    formNote.textContent = responseData.message || 'Consulta enviada correctamente. Te responderemos a la brevedad.';
  } catch (error) {
    console.error('Detalle completo del error del formulario de contacto:', {
      error,
      message: error.message,
      stack: error.stack,
      url: contactApiUrl,
      payload
    });

    formNote.textContent = 'No pudimos enviar la consulta. Intentá nuevamente en unos minutos.';
  } finally {
    submitButton.disabled = false;
  }
});

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });
