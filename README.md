# 🎓 TUMO Chacarita — Flash Labs Diciembre 2026

Sitio web estático para la inscripción a los **Flash Labs de diciembre de 2026** en la sede **TUMO Chacarita** (Buenos Aires, Argentina). Permite a estudiantes activos navegar por la cartelera de talleres creativos y tecnológicos, consultar disponibilidad de cupos en tiempo real y enviar su solicitud de inscripción mediante un formulario validado, con opción de envío a Google Sheets vía Google Apps Script.

---

## 📑 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Flujo de Trabajo del Usuario](#flujo-de-trabajo-del-usuario)
6. [Configuración e Instalación](#configuración-e-instalación)
7. [Backend Opcional: Google Apps Script](#backend-opcional-google-apps-script)
8. [Validaciones y Reglas de Negocio](#validaciones-y-reglas-de-negocio)
9. [Responsabilidades de los Scripts Principales](#responsabilidades-de-los-script-principales)
10. [Accesibilidad y UX](#accesibilidad-y-ux)
11. [Diseño Responsivo y Temas](#diseño-responsivo-y-temas)
12. [Cómo Contribuir](#cómo-contribuir)
13. [Licencia](#licencia)

---

## 📖 Descripción del Proyecto

TUMO Chacarita ofrece talleres cortos e intensivos (Flash Labs) de tecnología y creatividad para adolescentes durante diciembre de 2026. Este sitio web permite:

- Explorar la **cartelera de talleres** con filtros por disciplina.
- Ver detalles de cada taller en un modal nativo (`<dialog>`).
- Consultar **disponibilidad de cupos** en tiempo real (almacenamiento local o Google Sheets).
- Inscribirse en hasta **dos (2) talleres distintos** por estudiante.
- Consultar el estado de una inscripción por DNI desde la sección de Preguntas Frecuentes.
- Alternar entre **tema claro y tema verde Chacarita** con animación de transición.

El proyecto está construido con HTML, CSS y JavaScript vanilla (sin frameworks ni build tools), diseñado para funcionar tanto en protocolo `file://` (apertura local) como en servidores HTTP/HTTPS (despliegue estático en Vercel, Netlify, GitHub Pages, etc.).

---

## 🏗️ Arquitectura Técnica

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  index.html │  │ inscripcion│  │   site_index.html   │  │
│  │   (Home)    │  │   .html    │  │  (Redirect → index) │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
│         │                │                                    │
│  ┌──────▼──────┐  ┌──────▼──────┐                            │
│  │  script.js  │  │  form.js    │                            │
│  │ (Cartelera) │  │  (Inscripción)│                          │
│  └──────┬──────┘  └──────┬──────┘                            │
│         │                │                                    │
│  ┌──────▼──────┐  ┌──────▼──────┐                            │
│  │  config.js  │◄────┼──────────┼───── Compartido entre      │
│  │  (Config,   │     │          │     ambos scripts          │
│  │   helpers,  │     │          │                            │
│  │   storage)  │     │          │                            │
│  └──────┬──────┘     │          │                            │
│         │            │          │                            │
│  ┌──────▼──────┐  ┌──▼──────────▼──┐                       │
│  │  theme.js   │  │  data_de_labs.js│                      │
│  │ (Tema claro/│  │  (Datos embebidos│                      │
│  │   verde)    │  │   en memoria)   │                      │
│  └─────────────┘  └────────────────┘                       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │           style.css (estilos globales y temas)        │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (opcional, vía HTTP POST)
┌─────────────────────────────────────────────────────────────┐
│              BACKEND: Google Apps Script                      │
│  appScript.js → doPost(e) → Google Sheets                     │
│              doGet(e)  → Conteos de cupos                     │
└─────────────────────────────────────────────────────────────┘
```

### Principios de Diseño

- **Vanilla JavaScript**: No se utilizan frameworks, librerías ni herramientas de construcción (no hay `node_modules`, `package.json`, `webpack`, `vite`, etc.).
- **Progressive Enhancement**: Funciona sin JavaScript para lectura básica; el JS mejora la interactividad (filtros, modales, validaciones).
- **Almacenamiento híbrido**: Por defecto usa `localStorage` para persistencia local. Si se configura `GOOGLE_SCRIPT_URL`, sincroniza con Google Sheets en tiempo real.
- **Carga de datos embebida**: `data_de_labs.js` inyecta `window.RAW_DATA_DE_LABS` para evitar bloqueos CORS al abrir con protocolo `file://`.

---

## 📁 Estructura de Archivos

```
webLabs_2026/
├── index.html              # Página principal (canónica): Hero, cartelera, FAQ, modal de detalle
├── inscripcion.html        # Página de inscripción: formulario, pop card de confirmación, vista de éxito
├── site_index.html         # Redirect automático a index.html (duplicado histórico, mantener como redirect)
├── README.md               # Este archivo
├── development_document.md # Documento de desarrollo original con pasos de despliegue
├── REPORTE_ESTRUCTURA_Y_ESPECIFICACIONES_FRONTEND.md # Especificaciones frontend detalladas
├── config.js               # Configuración, disciplinas, helpers, almacenamiento local, lógica de cupos
├── script.js               # Lógica de la cartelera: renderizado, filtros, modal de detalle
├── form.js                 # Lógica del formulario de inscripción: validaciones, envío, pop card
├── theme.js                # Conmutador de tema claro/verde con View Transitions API
├── appScript.js            # Google Apps Script (backend opcional para Google Sheets)
├── style.css               # Estilos globales, identidad visual, temas, animaciones CSS
├── data_de_labs.js         # Datos de los 23 talleres embebidos en window.RAW_DATA_DE_LABS
├── data_de_labs.json       # Mismo contenido en formato JSON (para consumo externo o migración)
├── assets/
│   ├── Chacarita_Logo_Light.png
│   ├── TUMO_BuenosAires_Chacarita_Logo_Dark.png
│   ├── che_verano.png
│   └── icons/              # Íconos por disciplina (drawing, photo, filmaking, music, etc.)
└── img/
    ├── carrusel/
    ├── logo-tumo.png
    ├── Logomotion-quieto.png
    └── Logomotion.gif
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | HTML5 semántico | Estructura accesible y semántica |
| **Estilos** | CSS3 (variables CSS, Flexbox, Grid) | Diseño responsive, identidad visual TUMO Chacarita |
| **Lógica** | JavaScript ES6+ (Vanilla) | Interactividad, validaciones, renderizado dinámico |
| **Backend (opcional)** | Google Apps Script | API de inscripción y conteo de cupos vinculada a Google Sheets |
| **Almacenamiento local** | `localStorage` | Persistencia de inscripciones sin backend configurado |
| **Tipografía** | Google Fonts: Archivo, Caveat | Tipografía oficial del proyecto |
| **Despliegue** | Estático (Vercel, Netlify, GitHub Pages, etc.) | Sitio estático sin servidor propio |

---

## 🔄 Flujo de Trabajo del Usuario

### 1. Navegación en la Cartelera (`index.html`)

1. El usuario accede a `index.html`.
2. Se carga `data_de_labs.js` → `window.RAW_DATA_DE_LABS` con los 23 talleres.
3. `script.js` procesa los datos (`processRawLabs`) y renderiza:
   - Filtros por disciplina.
   - Tarjetas de taller con animación flat-design, estado de disponibilidad y botón de inscripción.
4. El usuario puede:
   - Filtrar por disciplina.
   - Hacer clic en una tarjeta → abre `<dialog class="lab-panel">` con detalles del taller.
   - Hacer clic en "Inscribite" → redirige a `inscripcion.html?id=<lab-id>`.

### 2. Inscripción (`inscripcion.html`)

1. `form.js` lee el parámetro `?id=` o `?actividad=` de la URL.
2. Busca el taller en `window.TUMO_LABS` (llenado por `script.js`) o procesa `RAW_DATA_DE_LABS`.
3. Se abre automáticamente un `<dialog class="confirm">` (pop card):
   - Muestra los horarios disponibles con vacantes.
   - El usuario selecciona/confirma un horario.
   - Al hacer clic en "Sí, continuar", se cierra el pop card y se enfoca el campo Nombre.
4. El usuario completa el formulario nativo:
   - Nombre y apellido (mínimo 3 caracteres).
   - DNI (7 u 8 dígitos numéricos).
   - Correo electrónico (dominio `@tumo.world` o `@tumo.ar`).
   - Casilla de reconfirmación de horario (obligatoria).
5. Al enviar:
   - Se valida disponibilidad de cupos en tiempo real.
   - Se valida límite de 2 inscripciones por DNI.
   - Se valida que no exista duplicado del mismo taller+horario+DNI.
   - Si hay `GOOGLE_SCRIPT_URL`, se envía `POST` a Google Apps Script.
   - Se guarda en `localStorage` como respaldo/local.
6. Se muestra vista de éxito (`data-view="done"`) con resumen de la inscripción.

### 3. Consulta de Estado (FAQ, `index.html`)

1. En la sección Preguntas Frecuentes, acordeón "Buscar mis inscripciones por DNI".
2. El usuario ingresa su DNI y hace clic en "Consultar".
3. `initStatusChecker()` busca en `localStorage` por DNI y muestra el resultado (taller, horario, correo, estado).

---

## ⚙️ Configuración e Instalación

### Paso 1: Clonar o descargar el repositorio

```bash
git clone https://github.com/TU_USUARIO/webLabs_2026.git
cd webLabs_2026
```

### Paso 2: Abrir localmente

Opción A — Abrir directamente el archivo:
```bash
# Doble clic en index.html o:
start index.html   # Windows
open index.html    # macOS
xdg-open index.html # Linux
```

Opción B — Con Live Server (recomendado para evitar problemas CORS con `fetch`):
```bash
# Si tienes VS Code con la extensión "Live Server", haz clic derecho en index.html → "Open with Live Server"
```

### Paso 3: Configurar Google Apps Script (opcional)

Los datos de los talleres viven en `data_de_labs.json` (un elemento por lab, con sus comisiones). Después de editarlo:

```bash
python scripts/build_labs.py   # valida y genera data_de_labs.js y appScriptCatalogo.js
node --test tests/appscript.test.mjs
```

Para el backend en Google Sheets:

1. Abrir la hoja de inscripciones y **Extensiones > Apps Script**.
2. Pegar `appScript.js` en `Code.gs` y crear un segundo archivo `Catalogo.gs` con el contenido de `appScriptCatalogo.js`.
3. La cuenta que implementa necesita acceso de lectura a la planilla del padrón (`PADRON_SPREADSHEET_ID` en `appScript.js`). Si no puede leerla, el script rechaza todas las inscripciones.
4. Implementar como **Aplicación web** (o crear una nueva versión del deployment existente para mantener la URL):
   - Ejecutar como: `Yo`
   - Quién tiene acceso: `Cualquier usuario`
5. Copiar la URL generada (`https://script.google.com/macros/s/.../exec`).
6. Pegarla en `config.js`:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/TU_CODIGO/exec";
   ```

### Paso 4: Despliegue en producción (sitio estático)

El sitio es 100% estático. Se puede desplegar en:
- **Vercel**: Conectar repositorio GitHub, preset "Other".
- **Netlify**: Arrastrar carpeta o conectar GitHub.
- **GitHub Pages**: Habilitar desde Settings > Pages.

No se requiere build step ni variables de entorno excepto `GOOGLE_SCRIPT_URL` (opcional).

---

## 🔌 Backend Opcional: Google Apps Script (`appScript.js`)

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/exec` | `{nombre, dni, correo, comisionId}`: valida padrón, requisito, cupo y límite de 2 labs; guarda la fila |
| `POST` | `/exec` | `{accion: "consulta", dni, correo}`: lista las inscripciones si DNI y correo coinciden |
| `GET` | `/exec` | Retorna conteos de inscriptos por `comisionId` |

### Flujo de `doPost`

1. Adquiere `LockService` (15s) para evitar sobreventa por envíos concurrentes.
2. Lee cuerpo JSON (`e.postData.contents`) con fallback a `e.parameter`.
3. Valida campos obligatorios: nombre, DNI, correo, taller, horario.
4. Verifica si el DNI ya está inscripto en ese taller+horario.
5. Cuenta inscriptos en ese taller+horario y compara con `maxParticipantes`.
6. Si hay cupo, inserta fila en Google Sheets y retorna `{ status: "ok", ... }`.
7. Libera el lock en `finally`.

### Formato de respuesta JSON

```json
{
  "status": "ok",
  "message": "Inscripción exitosa",
  "taller": "Tu celular, tu cámara profesional",
  "dias": "Mar 15",
  "horario": "13 a 16 h",
  "inscriptos": 5,
  "maxParticipantes": 14
}
```

Estados posibles: `ok`, `error`, `busy`, `padron_no_disponible`, `dni_no_encontrado`, `requisito_no_cumplido`, `ya_inscripto`, `limite_alcanzado`, `no_disponible`.

---

## ✅ Validaciones y Reglas de Negocio

| Validación | Implementación | Mensaje de error |
|------------|---------------|------------------|
| Nombre y apellido | Mínimo 3 caracteres | "Ingresá tu nombre y apellido completo." |
| DNI | Regex `/^\d{7,8}$/` (7 u 8 dígitos) | "Ingresá un DNI válido de 7 u 8 dígitos (sin puntos ni espacios)." |
| Correo TUMO | Formato válido + dominio `@tumo.world` o `@tumo.ar` | "El correo debe ser de TUMO (@tumo.world o @tumo.ar)." |
| Reconfirmación de horario | Checkbox obligatorio | "Debés marcar la casilla de confirmación para continuar." |
| Disponibilidad de cupos | Conteo en tiempo real vs `maxParticipantes` | "Lo sentimos, este taller acaba de completar sus cupos máximos..." |
| Límite por estudiante | Máximo 2 inscripciones por DNI | "Ya estás inscripto/a en X Flash Lab(s). El máximo permitido es 2." |
| Duplicado taller+horario+DNI | Búsqueda en localStorage / Sheets | "Ya tenés una inscripción registrada para este mismo Flash Lab y horario." |

---

## 📜 Responsabilidades de los Scripts Principales

### `config.js`
- Constantes de evento (`EVENT`): nombre, fechas, contacto, dominios de email permitidos, límites.
- Metadatos de disciplinas (`DISCIPLINAS`): colores, slugs, íconos, etiquetas.
- Helpers: `escapeHtml`, `cleanDoc`, `slugify`, `formatHoras`.
- Almacenamiento local: `getLocalInscripciones`, `saveLocalInscripcion`.
- Lógica de cupos por comisión: `getInscriptosCount`, `getComisionVacantes`, `isComisionAvailable`, `isLabAvailable`, `getLabVacantes`, `isAlreadyInscripto`, `getInscripcionesCountByDNI`.
- Procesamiento de datos crudos: `processRawLabs`.

### `script.js`
- Carga de datos: `getRawLabs` (compatibilidad `file://` y HTTP).
- Renderizado de filtros y tarjetas: `renderFilters`, `renderCards`.
- Animaciones por taller: `getWorkshopAnimation` (33 animaciones flat-design únicas).
- Modal de detalle: `openPanel`, `initPanel`.
- Consulta de estado por DNI: `initStatusChecker`.
- Inicialización: `initCartelera`.

### `form.js`
- Carga y selección de taller por URL (`?id=` o `?actividad=`).
- Pop card de confirmación de horario: `openConfirmPopCard`.
- Validaciones en tiempo real y al enviar.
- Envío a Google Apps Script (`fetch` POST) y respaldo en `localStorage`.
- Gestión de vistas: loading, mensaje, formulario, éxito.

### `theme.js`
- Alternancia tema claro / verde Chacarita.
- Persistencia en `localStorage`.
- Animación circular con View Transitions API (con fallback para navegadores sin soporte o `prefers-reduced-motion`).

### `appScript.js`
- Backend opcional en Google Apps Script.
- `doPost`: registro de inscripciones con lock de concurrencia.
- `doGet`: conteos de cupos por taller+horario.

---

## ♿ Accesibilidad y UX

- Uso de `<dialog>` nativo para modales (con `aria-labelledby`, `aria-label`, cierre con `Esc` y clic fuera).
- `aria-live="polite"` en resultados de consulta de estado.
- `aria-pressed` en el botón de cambio de tema.
- `aria-hidden="true"` en íconos decorativos.
- Etiquetas `<label>` asociadas a inputs (`for` implícito mediante contenedor).
- Clase `.sr-only` para texto solo lectores de pantalla.
- Navegación por teclado funcional en todos los controles interactivos.
- Preferencia `prefers-reduced-motion` respetada en animaciones de tema.

---

## 📱 Diseño Responsivo y Temas

### Puntos de ruptura CSS
- `<= 960px`: Hero en una columna, split en una columna.
- `<= 640px`: Enlaces de navegación ocultos, tarjetas en una columna, acciones del pop card en columna.

### Temas
- **Tema claro** (por defecto): Fondo `#F2F2F2`, texto oscuro, logos oscuros visibles.
- **Tema verde Chacarita**: Fondo `#1f391c`, texto blanco, logos claros visibles, botones adaptados.
- Persistencia del tema seleccionado en `localStorage`.
- Animación circular de transición entre temas usando View Transitions API.

---

## 🤝 Cómo Contribuir

1. Hacer fork del repositorio.
2. Crear una rama: `git checkout -b feature/nombre-de-la-funcionalidad`.
3. Realizar cambios y probar localmente (index.html e inscripcion.html).
4. Verificar sintaxis de JS: `node --check archivo.js`.
5. Commit con mensaje descriptivo.
6. Abrir un Pull Request describiendo los cambios y motivo.

### Checklist antes de commit
- [ ] `node --check` pasa en todos los archivos `.js` modificados.
- [ ] Se probó en `file://` y (idealmente) en servidor HTTP.
- [ ] Se probó el flujo completo: cartelera → filtro → modal → inscripción → éxito.
- [ ] Se probó el tema claro y verde.
- [ ] Se actualizó este README si se cambiaron estructuras o flujos.

---

## 📄 Licencia

Este proyecto es interno de TUMO Chacarita. Todos los derechos reservados.

---

## 📬 Contacto

- **Email**: familias.chacarita@tumo.ar
- **Coach**: cada estudiante puede consultar a su coach
- **Sede**: TUMO Chacarita, Buenos Aires, Argentina

---

*Última actualización: Diciembre 2026*