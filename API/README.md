# Integracion API Contact Form Landing Page

Este documento esta escrito para implementar esta API en otras landings HTML/CSS/JS sin volver a decidir la arquitectura.

La API central recibe datos de formularios de contacto y guarda registros en la tabla `forms_clients_contact`.

## Decision por defecto

Para produccion, usar siempre la integracion con PHP intermedio:

```text
Formulario HTML de la landing
  -> contact-submit.php en la landing
  -> API central
  -> Base de datos
```

Motivo: la `API_KEY` queda en servidor y no queda visible en JavaScript.

Usar JavaScript directo solo para pruebas rapidas o si la landing no puede ejecutar PHP.

## API central

Endpoint:

```text
https://TU-DOMINIO-DE-LA-API.com/API/contact_form_landing_page/index.php
```

Ejemplos:

```text
https://impulsagroup.com/API/contact_form_landing_page/index.php
https://norumestudio.com.ar/API/contact_form_landing_page/index.php
```

Validacion rapida:

Abrir el endpoint en el navegador con metodo `GET`.

Resultado esperado si el archivo existe:

```json
{
  "status": "error",
  "message": "Metodo no permitido. Usa POST."
}
```

Si responde `404`, la API no esta publicada en esa ruta.

## Configuracion de la API central

La API lee variables desde el `.env` de la raiz del proyecto donde esta publicada:

```text
.env
```

Variables necesarias:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nombre_de_tu_base
DB_USER=usuario_de_base
DB_PASS=contrasena_de_base
API_KEY=tu_api_key_larga_y_segura
```

La API tambien lee dominios permitidos desde:

```text
API/contact_form_landing_page/allowed-domains.txt
```

Formato:

```text
https://norumestudio.com.ar
https://www.norumestudio.com.ar
https://impulsagroup.com
https://www.impulsagroup.com
http://localhost:5500
```

Reglas:

- Un dominio por linea.
- Sin barra final.
- No incluir paths.
- Correcto: `https://norumestudio.com.ar`.
- Incorrecto: `https://norumestudio.com.ar/`.
- Incorrecto: `https://norumestudio.com.ar/contacto`.

## Campos de formulario

La API espera JSON con estos campos:

```json
{
  "page": "landing-norum",
  "contact_nombre": "Juan Perez",
  "contact_whatsapp": "+5491123456789",
  "contact_email": "juan@email.com",
  "contact_description": "Descripcion general",
  "contact_consultation": "Consulta puntual"
}
```

Obligatorios:

```text
page
contact_nombre
```

Opcionales:

```text
contact_whatsapp
contact_email
contact_description
contact_consultation
```

`state` no se envia desde la landing. La API lo guarda como `recibido`.

## Implementacion recomendada para una nueva landing

Crear estos archivos en el proyecto de la landing:

```text
contact-submit.php
js/contact-form-api.js
```

Actualizar el formulario HTML para que tenga:

```text
id="contactForm"
```

Agregar un contenedor de mensajes:

```text
id="contactFormMessage"
```

Asegurar que los campos tengan estos `name`:

```text
contact_nombre
contact_whatsapp
contact_email
contact_description
contact_consultation
```

## HTML minimo esperado

Usar este HTML como referencia. Si la landing ya tiene formulario, adaptar solo `id`, `name` y el script.

```html
<form id="contactForm">
  <input type="text" name="contact_nombre" placeholder="Nombre" required>

  <input type="tel" name="contact_whatsapp" placeholder="WhatsApp">

  <input type="email" name="contact_email" placeholder="Email">

  <textarea name="contact_description" placeholder="Descripcion"></textarea>

  <textarea name="contact_consultation" placeholder="Consulta"></textarea>

  <button type="submit">Enviar</button>

  <p id="contactFormMessage" aria-live="polite"></p>
</form>

<script src="js/contact-form-api.js"></script>
```

## Archivo `contact-submit.php`

Crear en la raiz de la landing:

```text
contact-submit.php
```

Contenido:

```php
<?php

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Metodo no permitido.',
    ]);
    exit;
}

$apiEndpoint = 'https://TU-DOMINIO-DE-LA-API.com/API/contact_form_landing_page/index.php';
$apiKey = 'TU_API_KEY_DEL_ENV';

$rawBody = file_get_contents('php://input');

if ($rawBody === false || trim($rawBody) === '') {
    http_response_code(422);
    echo json_encode([
        'status' => 'invalid',
        'message' => 'El formulario esta vacio.',
    ]);
    exit;
}

$ch = curl_init($apiEndpoint);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => $rawBody,
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $response === '') {
    http_response_code(502);
    echo json_encode([
        'status' => 'error',
        'message' => 'No se pudo conectar con la API.',
        'detail' => $curlError,
    ]);
    exit;
}

http_response_code($httpCode ?: 502);
echo $response;
```

Reemplazar:

```php
$apiEndpoint = 'https://TU-DOMINIO-DE-LA-API.com/API/contact_form_landing_page/index.php';
$apiKey = 'TU_API_KEY_DEL_ENV';
```

Por los valores reales de la API central.

## Archivo `js/contact-form-api.js`

Crear:

```text
js/contact-form-api.js
```

Contenido:

```js
const CONTACT_API_ENDPOINT = '/contact-submit.php';
const CONTACT_PAGE_NAME = 'NOMBRE_UNICO_DE_LA_LANDING';

const contactForm = document.querySelector('#contactForm');
const contactFormMessage = document.querySelector('#contactFormMessage');

if (contactForm) {
  contactForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);

    const payload = {
      page: CONTACT_PAGE_NAME,
      contact_nombre: formData.get('contact_nombre') || '',
      contact_whatsapp: formData.get('contact_whatsapp') || '',
      contact_email: formData.get('contact_email') || '',
      contact_description: formData.get('contact_description') || '',
      contact_consultation: formData.get('contact_consultation') || ''
    };

    if (submitButton) {
      submitButton.disabled = true;
    }

    if (contactFormMessage) {
      contactFormMessage.textContent = 'Enviando...';
    }

    try {
      const response = await fetch(CONTACT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'No se pudo enviar el formulario.');
      }

      contactForm.reset();

      if (contactFormMessage) {
        contactFormMessage.textContent = 'Gracias. Recibimos tu consulta.';
      }
    } catch (error) {
      if (contactFormMessage) {
        contactFormMessage.textContent = error.message || 'No se pudo enviar el formulario.';
      }

      console.error('Error enviando formulario:', error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}
```

Reemplazar:

```js
const CONTACT_PAGE_NAME = 'NOMBRE_UNICO_DE_LA_LANDING';
```

Por un identificador claro, por ejemplo:

```js
const CONTACT_PAGE_NAME = 'norum-home';
```

## Integracion alternativa: JavaScript directo

Usar solo para pruebas rapidas o si no se puede crear PHP en la landing.

Desventaja: la `API_KEY` queda visible en el navegador.

```js
const CONTACT_API_ENDPOINT = 'https://TU-DOMINIO-DE-LA-API.com/API/contact_form_landing_page/index.php';
const CONTACT_API_KEY = 'TU_API_KEY_DEL_ENV';
const CONTACT_PAGE_NAME = 'NOMBRE_UNICO_DE_LA_LANDING';

const contactForm = document.querySelector('#contactForm');
const contactFormMessage = document.querySelector('#contactFormMessage');

if (contactForm) {
  contactForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);

    const payload = {
      page: CONTACT_PAGE_NAME,
      contact_nombre: formData.get('contact_nombre') || '',
      contact_whatsapp: formData.get('contact_whatsapp') || '',
      contact_email: formData.get('contact_email') || '',
      contact_description: formData.get('contact_description') || '',
      contact_consultation: formData.get('contact_consultation') || ''
    };

    if (submitButton) {
      submitButton.disabled = true;
    }

    if (contactFormMessage) {
      contactFormMessage.textContent = 'Enviando...';
    }

    try {
      const response = await fetch(CONTACT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': CONTACT_API_KEY
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'No se pudo enviar el formulario.');
      }

      contactForm.reset();

      if (contactFormMessage) {
        contactFormMessage.textContent = 'Gracias. Recibimos tu consulta.';
      }
    } catch (error) {
      if (contactFormMessage) {
        contactFormMessage.textContent = error.message || 'No se pudo enviar el formulario.';
      }

      console.error('Error enviando formulario:', error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}
```

## Checklist de implementacion

- [ ] Confirmar URL real de la API central.
- [ ] Abrir la URL de la API en navegador y verificar que no responda `404`.
- [ ] Confirmar que la tabla `forms_clients_contact` existe.
- [ ] Confirmar que el `.env` de la API tiene `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` y `API_KEY`.
- [ ] Agregar el dominio de la landing en `allowed-domains.txt`.
- [ ] Crear `contact-submit.php` en la landing.
- [ ] Crear `js/contact-form-api.js` en la landing.
- [ ] Agregar `<script src="js/contact-form-api.js"></script>` en el HTML.
- [ ] Confirmar que el formulario tiene `id="contactForm"`.
- [ ] Confirmar que existe `id="contactFormMessage"`.
- [ ] Confirmar que los campos tienen los `name` esperados.
- [ ] Enviar una prueba desde la landing.
- [ ] Confirmar que se creo un registro en `forms_clients_contact`.

## Prueba desde consola del navegador

Para probar la API central directamente:

```js
fetch('https://TU-DOMINIO-DE-LA-API.com/API/contact_form_landing_page/index.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'TU_API_KEY_DEL_ENV'
  },
  body: JSON.stringify({
    page: 'prueba-consola',
    contact_nombre: 'Prueba API',
    contact_whatsapp: '+5491123456789',
    contact_email: 'test@test.com',
    contact_description: 'Prueba desde consola',
    contact_consultation: 'Consulta de prueba'
  })
})
  .then(async response => {
    const text = await response.text();
    console.log(response.status, text);
  })
  .catch(console.error);
```

Resultado correcto:

```text
201 {"status":"success","message":"Contacto guardado correctamente."}
```

## Diagnostico de errores

### 404 Not Found

El archivo de la API no esta publicado en esa ruta.

Verificar:

```text
https://TU-DOMINIO-DE-LA-API.com/API/contact_form_landing_page/index.php
```

### 401 API key invalida

La API key enviada no coincide con la del `.env`.

Verificar en la API:

```env
API_KEY=tu_api_key_larga_y_segura
```

Verificar en `contact-submit.php`:

```php
$apiKey = 'tu_api_key_larga_y_segura';
```

### Error de CORS

El dominio de la landing no esta en:

```text
API/contact_form_landing_page/allowed-domains.txt
```

Agregar el dominio exacto:

```text
https://norumestudio.com.ar
https://www.norumestudio.com.ar
```

### 422 Datos invalidos

Falta `page`, falta `contact_nombre` o algun dato tiene formato invalido.

Minimo valido:

```json
{
  "page": "landing-norum",
  "contact_nombre": "Juan Perez"
}
```

### 500 Error de base de datos

Revisar:

- Credenciales del `.env`.
- Existencia de la tabla `forms_clients_contact`.
- Nombres de columnas.
- Permisos del usuario de base de datos para hacer `INSERT`.

## Notas de seguridad

- Nunca poner credenciales de base de datos en la landing.
- Para produccion, evitar JavaScript directo con `API_KEY`.
- Preferir `contact-submit.php` para mantener la `API_KEY` en servidor.
- Mantener `allowed-domains.txt` con dominios reales.
