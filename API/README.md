# API Contact Form Landing Page

API PHP para recibir contactos desde landings y guardarlos en la tabla `forms_clients_contact`.

Esta API solo permite una accion: guardar contactos en la base de datos.

## Archivos

- `index.php`: endpoint principal de la API.
- `allowed-domains.txt`: listado de dominios permitidos para llamar a la API desde el navegador.

## 1. Tabla de base de datos

La API guarda datos en la tabla `forms_clients_contact`. La tabla debe existir en MySQL/MariaDB con esta estructura:

```sql
CREATE TABLE forms_clients_contact (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  page VARCHAR(150) NOT NULL,
  contact_nombre VARCHAR(150) NOT NULL,
  contact_whatsapp VARCHAR(50) NULL,
  contact_email VARCHAR(150) NULL,
  contact_description TEXT NULL,
  contact_consultation VARCHAR(255) NULL,
  state ENUM('recibido', 'cancelado', 'aprobado') NOT NULL DEFAULT 'recibido',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2. Configurar el `.env`

La API carga variables desde el `.env` de la raiz del proyecto:

```text
.env
```

Tambien puede cargar un `.env` local de esta carpeta si existe:

```text
API/contact_form_landing_page/.env
```

El `.env` local es opcional y sirve para sobrescribir valores especificos de esta API.

Variables necesarias:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nombre_de_tu_base
DB_USER=usuario_de_base
DB_PASS=contrasena_de_base
API_KEY=coloca_una_clave_larga_y_segura
```

Notas:

- `DB_PASS` guarda la password de la base de datos.
- `API_KEY` es opcional, pero recomendado. Si tiene valor, la landing debe enviarlo en el header `X-API-Key`.
- Los dominios permitidos ya no se cargan desde el `.env`; se cargan desde `allowed-domains.txt`.

## 3. Configurar dominios permitidos

Edita el archivo `allowed-domains.txt`.

Formato recomendado:

```text
# Dominios permitidos para llamar a esta API desde el navegador.
# Escribir un dominio por linea, siempre con https:// y sin barra final.

https://norumestudio.com.ar
https://www.norumestudio.com.ar
https://impulsagroup.com
https://www.impulsagroup.com
```

Notas:

- Usa dominios sin barra final. Correcto: `https://norumestudio.com.ar`.
- Evita poner rutas completas. No uses `https://norumestudio.com.ar/contacto`.
- Para pruebas locales puedes agregar `http://localhost:3000` o el puerto que uses.
- CORS controla llamadas desde navegador, pero no reemplaza la `API_KEY`.

## 4. Endpoint

```http
POST /API/contact_form_landing_page/index.php
```

El cuerpo debe enviarse como JSON.

## 5. Campos aceptados

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `page` | texto, maximo 150 | Si | Nombre o identificador de la pagina/landing |
| `contact_nombre` | texto, maximo 150 | Si | Nombre del contacto |
| `contact_whatsapp` | texto, maximo 50 | No | Telefono o WhatsApp |
| `contact_email` | texto, maximo 150 | No | Email del contacto |
| `contact_description` | texto | No | Descripcion general |
| `contact_consultation` | texto, maximo 255 | No | Consulta puntual del contacto |

El campo `state` no se envia desde la landing. La API lo guarda automaticamente como `recibido`.

## 6. Ejemplo con JavaScript

```js
const response = await fetch('https://tudominio.com/API/contact_form_landing_page/index.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'coloca_aca_la_api_key_si_la_configuraste'
  },
  body: JSON.stringify({
    page: 'landing-desarrollo-web',
    contact_nombre: 'Juan Perez',
    contact_whatsapp: '+5491123456789',
    contact_email: 'juan@email.com',
    contact_description: 'Quiere consultar por una pagina web',
    contact_consultation: 'Necesito una landing para mi negocio'
  })
});

const data = await response.json();
console.log(data);
```

## 7. Respuestas posibles

Contacto guardado:

```json
{
  "status": "success",
  "message": "Contacto guardado correctamente."
}
```

Datos invalidos:

```json
{
  "status": "invalid",
  "message": "El campo page es obligatorio."
}
```

API key incorrecta:

```json
{
  "status": "error",
  "message": "API key invalida."
}
```

Metodo incorrecto:

```json
{
  "status": "error",
  "message": "Metodo no permitido. Usa POST."
}
```

## 8. Prueba con curl

```bash
curl -X POST "https://tudominio.com/API/contact_form_landing_page/index.php" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: coloca_aca_la_api_key_si_la_configuraste" \
  -d '{
    "page": "landing-desarrollo-web",
    "contact_nombre": "Juan Perez",
    "contact_whatsapp": "+5491123456789",
    "contact_email": "juan@email.com",
    "contact_description": "Quiere consultar por una pagina web",
    "contact_consultation": "Necesito una landing para mi negocio"
  }'
```

## 9. Seguridad

- No subas el archivo `.env` al repositorio.
- Usa una `API_KEY` larga y dificil de adivinar.
- Configura `allowed-domains.txt` con los dominios reales de tus landings.
- No coloques credenciales de base de datos en ninguna landing.
