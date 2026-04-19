const CONTACT_API_ENDPOINT = '/contact-submit.php';
const CONTACT_PAGE_NAME = 'norumEstudio';

const contactForm = document.querySelector('#contactForm');
const contactFormMessage = document.querySelector('#contactFormMessage');

console.info('Norum contact form API script loaded.', {
  version: 'contact-api-20260418c',
  endpoint: CONTACT_API_ENDPOINT,
  page: CONTACT_PAGE_NAME
});

function setContactMessage(message) {
  if (contactFormMessage) {
    contactFormMessage.textContent = message;
  }
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {
      data: null,
      raw: ''
    };
  }

  try {
    return {
      data: JSON.parse(text),
      raw: text
    };
  } catch (error) {
    console.error('El servidor no devolvio JSON valido.', {
      error,
      status: response.status,
      statusText: response.statusText,
      rawResponse: text
    });

    throw new Error('Respuesta invalida del servidor.');
  }
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

    if (submitButton) {
      submitButton.disabled = true;
    }

    setContactMessage('Enviando consulta...');

    try {
      const response = await fetch(CONTACT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await readJsonResponse(response);

      if (!response.ok || result.data?.status !== 'success') {
        console.error('Error enviando formulario.', {
          status: response.status,
          statusText: response.statusText,
          response: result.data,
          rawResponse: result.raw,
          endpoint: CONTACT_API_ENDPOINT,
          payload
        });

        throw new Error(result.data?.message || 'No se pudo enviar el formulario.');
      }

      contactForm.reset();
      setContactMessage(result.data.message || 'Gracias. Recibimos tu consulta.');
    } catch (error) {
      console.error('Detalle completo del error enviando formulario:', {
        error,
        message: error.message,
        stack: error.stack,
        endpoint: CONTACT_API_ENDPOINT,
        payload
      });

      setContactMessage(error.message || 'No se pudo enviar el formulario.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}
