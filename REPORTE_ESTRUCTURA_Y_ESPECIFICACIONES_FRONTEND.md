# Reporte Completo de Estructura y Especificaciones Frontend
## Proyecto: Clon / Réplica de FlashLabs TUMO Barracas (`tumobarracas.vercel.app`)

**Fecha de análisis:** Noviembre 2026  
**URL inspeccionada:** `https://tumobarracas.vercel.app/`  
**Objetivo:** Especificación técnica exhaustiva de la estructura, diseño, arquitectura, componentes, lógica de negocio y endpoints del frontend para replicar el sitio con idéntica funcionalidad y experiencia de usuario.

---

## 1. Resumen Ejecutivo y Propósito del Sitio

El sitio web de **FlashLabs TUMO Barracas** es una plataforma de pre-inscripción y cartelera interactiva para talleres tecnológicos y artísticos intensivos de 4 encuentros dirigidos a adolescentes estudiantes del centro TUMO Barracas (Ciudad de Buenos Aires).

### Principales Objetivos de Negocio y Funcionalidades
1. **Cartelera dinámica de talleres:** Muestra las actividades disponibles organizadas por grupos/turnos (ej. Grupo A por la mañana, Grupo B por la tarde), estados de vacantes (Abierta, Lista de espera, Cerrada) y cupos libres en tiempo real.
2. **Pre-inscripción guiada y validada:** Flujo de solicitud donde el estudiante elige horario, valida su DNI en tiempo real contra la base de datos de TUMO, comprueba el cumplimiento de prerrequisitos académicos (niveles previos aprobados) y envía la solicitud.
3. **Resiliencia ante alta concurrencia:** El frontend implementa reintentos exponenciales automáticos con jitter ante saturación o timeouts del servidor.
4. **Consulta pública de estado de solicitud:** Permite a cualquier estudiante verificar en qué etapa está su postulación introduciendo su DNI en la sección de preguntas frecuentes o en el chatbot.
5. **Asistente virtual "Flashy":** Chatbot flotante potenciado por IA (Groq LLM) con detección local de intenciones para WhatsApp, consulta de estado y enlaces directos a inscripciones.
6. **Diseño de marca inmersivo:** Interfaz moderna con cambio de tema animado (Blanco ↔ Rojo TUMO con View Transitions API), animaciones CSS personalizadas para cada taller y tipografía cuidada.

---

## 2. Stack Tecnológico y Arquitectura General

A diferencia de las aplicaciones modernas basadas en SPAs pesadas (React/Next/Vue), este sitio utiliza **Vanilla Web Technologies (HTML5 + CSS3 moderno + JavaScript ES6+)** sin bundler en el frontend. Esto garantiza un rendimiento excepcional, carga instantánea y cero dependencias de compilación para la interfaz pública.

| Capa | Tecnología / Herramienta | Descripción y Propósito |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semántico | `<header>`, `<main>`, `<section>`, `<article>`, `<dialog>`, `<details>`, `<fieldset>`, `<picture>` |
| **Estilos** | CSS3 Moderno (Custom Properties, Flexbox, Grid) | 2000+ líneas en `style.css`, sin frameworks CSS (Tailwind/Bootstrap). Variables nativas, fluid typography (`clamp()`), subgrid, transiciones y animaciones por hardware. |
| **Scripts** | JavaScript Vanilla ES6+ | Módulos desacoplados: `theme.js`, `config.js`, `script.js`, `form.js`, `chatbot.js`. |
| **APIs Nativas del Navegador** | `View Transitions API`, `IntersectionObserver`, `AbortController`, `<dialog>`, `visualViewport` | Animación de cambio de tema en círculo, reproducción de medios al hacer scroll, cierre de modales y ajuste del teclado móvil en el chat. |
| **Fuentes Web** | Google Fonts | `Archivo` (400, 500, 700, 800, 900) y `Caveat` (700 manuscrita para acentos). Alternativa a la fuente corporativa `Maax`. |
| **Hosting & Serverless** | Vercel | Alojamiento estático + Serverless Functions en Node.js (`/api/inscripcion`, `/api/chat`). |
| **Motor de Inteligencia Artificial** | Groq API | Backend para el chatbot Flashy a través de la función `/api/chat`. |
| **Base de Datos / Planilla** | Google Sheets / TUMO 360 | Integración backend que provee la lista de cursos, vacantes y validación de alumnos. |

---

## 3. Sistema de Diseño (Design System Tokens)

El diseño se basa en el **Manual de Identidad TUMO 2025**. A continuación se detallan todas las constantes y tokens extraídos de `style.css`:

### 3.1. Paleta de Colores

```css
:root {
    /* Paleta Oficial TUMO */
    --yellow: #f6ab1e;  /* Acentos, píldoras informativas, badges secundarios */
    --red:    #e75227;  /* Color institucional TUMO, botones de acción principal, errores */
    --blue:   #2730e7;  /* Botones primarios, enlaces activos, badges de estado */
    --light:  #f2f2f2;  /* Fondos secundarios, cajas de información */

    /* Colores temáticos por actividad en la cartelera */
    --purple: #7a3fe0;  /* TumoGotchi */
    --green:  #12805a;  /* Carrier IoT */
    --teal:   #0b7f93;  /* Del sonido al código */
    --pink:   #d12f6e;  /* Personajes IA 3D */

    /* Neutros */
    --ink:    #111111;  /* Texto principal */
    --muted:  #55575f;  /* Textos secundarios y metadatos */
    --white:  #ffffff;  /* Fondo base claro */

    /* Tipografía */
    --font: "Maax", "Archivo", system-ui, sans-serif;
    --font-hand: "Caveat", cursive;

    /* Dimensiones y Bordes */
    --radius: 999px;               /* Píldoras y botones redondeados */
    --gutter: clamp(16px, 4vw, 48px); /* Padding lateral responsivo */
    --max: 1200px;                 /* Ancho máximo del contenedor */
}

/* Tema Rojo Alternativo (Activado vía data-theme="red") */
html[data-theme="red"] {
    --page: var(--red);             /* Fondo general rojo */
    --page-alt: #b8360f;            /* Rojo oscuro para barras y secciones alternadas */
    --soft: rgba(255, 255, 255, 0.86); /* Texto suave sobre rojo */
}
```

### 3.2. Tipografía y Jerarquía
- **Titulares principales (`h1`, `h2`):** `font-weight: 900`, `letter-spacing: -0.02em` a `-0.05em`.
- **Efecto manuscrito (`.hand`):** Clase que aplica `font-family: var(--font-hand); font-weight: 700; transform: rotate(-6deg) translateY(0.04em);`. Se utiliza en vocales individuales para dar un toque lúdico artesanal (ej. `Flash L<span class="hand">a</span>bs`, `Aprender haciendo, en cuatro <span class="hand hand--red">e</span>ncuentros`).
- **Píldoras y botones (`.btn`, `.tag`, `.meta-pill`):** `border-radius: var(--radius); font-weight: 800; text-transform: none;`.

---

## 4. Estructura de Páginas y Maquetación

El sitio consta de dos documentos HTML principales: `index.html` (la landing page con cartelera) e `inscripcion.html` (el formulario interactivo de solicitud de vacante).

```
tumobarracas.vercel.app/
│
├── index.html              # Landing page principal, cartelera, FAQ y consulta de estado
├── inscripcion.html        # Formulario de solicitud de vacante y validación
├── style.css               # Estilos globales y específicos de ambas páginas
├── theme.js                # Lógica del conmutador de tema claro/rojo y View Transitions
├── config.js               # Parámetros globales del evento, endpoints y helpers
├── script.js               # Render de cartelera, carrusel, modal y consulta de estado
├── form.js                 # Lógica del formulario de inscripción y verificación DNI
├── chatbot.js              # Widget del chatbot flotante "Flashy"
│
├── img/                    # Activos visuales e ilustraciones
│   ├── logo-tumo.png
│   ├── che-verano-barracas.png / .webp
│   ├── Logomotion.gif
│   ├── Logomotion-quieto.png
│   └── carrusel/
│       ├── estudiantes-musica.jpg
│       ├── robot-tumo.jpg
│       └── espacio-tumo.jpg
│
└── api/                    # Serverless Functions (Vercel)
    ├── inscripcion.js      # Endpoint CRUD de actividades, verificación y registro
    └── chat.js             # Endpoint de consulta a Groq LLM
```

---

### 4.1. Detalle de Secciones en `index.html`

1. **Header / Navegación fija (`.nav`):**
   - Logo TUMO Barracas enlazado a `#top`.
   - Enlaces de salto suave: `Qué es` (`#que-es`), `Cartelera` (`#actividades`), `FAQ` (`#faq`).
   - Botón selector de tema (`data-theme-toggle`): interruptor circular que alterna el tema.
   - Botón CTA directo (`.btn--blue`): "Inscribite" hacia `#actividades`.
2. **Hero Section (`.hero`):**
   - Tag superior: `Diciembre 2026 · Exclusivo para estudiantes de TUMO`.
   - Título visual con el logo gráfico `Che Verano Barracas` + texto `Flash Labs`.
   - Bajada descriptiva: cuatro encuentros prácticos para construir proyectos reales.
   - Carrusel de fotos (`.hero__art[data-carousel]`): animación automática infinita de imágenes de alumnos. Si no hay imágenes cargadas, despliega un gráfico SVG interactivo con el recorrido y un botón "GO!".
3. **Sección "¿Qué es un FlashLab?" (`#que-es`):**
   - Distribución en dos columnas (`.split`).
   - Lista de puntos clave (`.checklist`): exclusivo para alumnos, vacantes limitadas, **una sola actividad por estudiante**.
4. **Cartelera de Actividades (`#actividades`):**
   - Título con acento manuscrito y leyenda de estados:
     - Verde / Azul: *Inscripción abierta*
     - Naranja: *Lista de espera*
     - Gris: *Inscripción cerrada*
   - Contenedor dinámico (`[data-lab-cards]`):
     - Muestra un skeleton loader (`.card--skeleton`) mientras consulta la API.
     - Genera una tarjeta por actividad agrupando los turnos A y B.
     - Cada tarjeta muestra la miniatura (o animación de código interactiva), badge de estado, título, horario en píldoras con icono de reloj, calendario de días y botón de acción.
     - Al hacer clic en cualquier parte de la tarjeta se abre el diálogo modal de detalle.
5. **Banner CTA (`#inscripcion`):**
   - Gráfico de onda SVG de fondo.
   - Botón amarillo destacado: "Ver la cartelera".
6. **Preguntas Frecuentes (`#faq`):**
   - Implementado mediante etiquetas nativas `<details>` y `<summary>` con estilo acordeón.
   - **Módulo de consulta de estado integrado (`#estado`):** El primer ítem contiene un formulario con campo de texto para DNI y botón "Consultar". Realiza una petición asíncrona a la API e imprime el estado exacto de la vacante del alumno.
7. **Modal de Detalle (`dialog.lab-panel`):**
   - Elemento `<dialog>` nativo.
   - Muestra medio ampliado (imagen/video o animación CSS), categoría, título, badge de cupos ("¡Quedan pocas vacantes!"), descripción extendida, widget de calendario con los días del curso, capacidad por horario, requisitos académicos necesarios, herramientas de software a utilizar y botón "Solicitar vacante" que redirige a `inscripcion.html?actividad=<id>`.
8. **Footer (`.footer`):**
   - Logo, leyenda institucional y derechos de autor.

---

### 4.2. Detalle de Secciones y Vistas en `inscripcion.html`

El formulario está diseñado para evitar errores de postulación y cuenta con 4 estados de pantalla (`data-view`):

1. **Vista `loading`:** Muestra un spinner giratorio con el mensaje *"Cargando la actividad…"*.
2. **Vista `message`:** Se activa si falta el parámetro `?actividad=` en la URL, si la actividad no existe, o si la inscripción ya está cerrada. Ofrece botones de redirección.
3. **Diálogo previo de Confirmación (`dialog.confirm`):**
   - Al cargar la página con una actividad válida, se despliega automáticamente un `<dialog>` bloqueante.
   - Pide al estudiante reconfirmar que desea cursar esa actividad y seleccionar su turno de preferencia mediante botones tipo radio (`.time-opt`).
   - Solo al presionar *"Sí, continuar"* se desbloquea el formulario principal y se hace foco en el campo del nombre.
4. **Vista `form` (Formulario principal):**
   - **Bloque de resumen (`.chosen`):** Nombre del taller, días, selector desplegable de horario (si tiene más de un turno), aviso si entra a lista de espera y requisitos necesarios.
   - **Fieldset 1 (Datos del estudiante):**
     - Campo `nombre`: Nombre y apellido del estudiante.
     - Campo `dni`: DNI o documento. Incluye botón conmutador *"Tengo pasaporte u otro documento"* que cambia el `inputmode` entre numérico y texto alfanumérico.
     - Indicador en tiempo real (`.verify`): Informa si el documento está verificado, si no existe en los registros de TUMO o si ya tiene otra inscripción activa.
     - Desglose de requisitos (`.req-check`): Si la actividad exige requisitos previos, se despliega una lista detallando cada curso (ej. *Nivel 1 de Programación* con estado *Aprobado* o *No aprobado*).
   - **Fieldset 2 (Confirmación):** Checkbox obligatorio donde el estudiante confirma expresamente su postulación al taller y horario elegido.
   - **Botón de Envío:** Con estado de carga (*"Enviando…"*) y mensaje dinámico.
5. **Vista `done` (Confirmación de recepción):**
   - Icono de check verde, título *"¡Recibimos tu inscripción!"*.
   - Detalle dinámico: indica si quedó en vacante regular, en lista de espera o si pasa a validación manual del equipo.
   - **Aviso crítico de 5 días:** Recuerda que debe responder al mail de confirmación en un plazo máximo de 5 días para no perder el lugar.

---

## 5. Especificación de Componentes y Lógica Frontend

A continuación se detalla la lógica implementada en cada uno de los archivos JavaScript:

### 5.1. Conmutador de Temas y View Transitions (`theme.js`)
- **Persistencia:** Almacena la preferencia en `localStorage` con la clave `"flashlab-theme"` (`light` o `red`).
- **Evitar parpadeo (FOUC):** Se incluye en el `<head>` antes del render del DOM.
- **Efecto de transición circular:**
  - Detecta si el navegador soporta `document.startViewTransition` y si el usuario no tiene activada la preferencia de reducción de movimiento (`prefers-reduced-motion: reduce`).
  - Calcula las coordenadas del botón (`btn.getBoundingClientRect()`) y el radio máximo hasta la esquina más lejana (`Math.hypot`).
  - Aplica un `clip-path` animado en pseudo-elemento `::view-transition-new(root)` que expande el nuevo tema en un círculo perfecto de 0px a N px durante 900ms con curva de aceleración `cubic-bezier(.65, 0, .25, 1)`.
  - Simula un anillo de colores giratorio (`.theme-ring`) en el borde de la onda expansiva.
  - Bloquea temporalmente eventos de scroll (`wheel`, `touchmove`, `keydown`) durante la animación para evitar desfases visuales.

### 5.2. Configuración Global y Helpers (`config.js`)
- **Detección de entorno (`API_BASE`):** Si corre en `file://` o en un servidor local distinto al puerto 5173, apunta las llamadas a `https://tumobarracas.vercel.app`.
- **Objeto `EVENT`:** Centraliza nombre, fechas, turnos, contacto, número de WhatsApp (`5491151342592`), texto predeterminado y respuestas de preguntas frecuentes.
- **Función `apiCall(params, body, timeoutMs)`:**
  - Envuelve llamadas `fetch` con `AbortController` (por defecto 20 segundos de timeout).
  - Normaliza errores en objetos estructurados con propiedad `status` (`ok`, `timeout`, `sin_conexion`, `error`).
- **Parser de Fechas (`parseDias(text)`):**
  - Convierte cadenas como `"Jue 10, Vie 11, Mar 15 y Jue 17 de diciembre (Vie 18: cierre y recuperatorio)"` en un array de objetos con día de la semana (`dow`), número de día (`num`), indicador de día especial (`extra`) y notas de cierre.
- **Renderizador de Horarios (`scheduleHtml(act, size, extra)`):**
  - Genera visualmente las fichas cuadradas de calendario (`.day`) y píldoras con icono SVG de reloj.
- **Sanitizador de Documentos (`cleanDoc(v)`):**
  - Limpia espacios, puntos y caracteres especiales, convirtiendo todo a mayúsculas alfanuméricas con un límite de 12 caracteres: `v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)`.

### 5.3. Cartelera y Agrupación de Grupos (`script.js`)
- **Agrupación Inteligente (`joinGroups`):**
  - En la base de datos cada fila representa un grupo específico (ej. `musica-cine-a` y `musica-cine-b`).
  - La función extrae el `baseId` (eliminando `-a` o `-b`), agrupa todas las comisiones de un mismo taller y genera una única tarjeta que lista todos los horarios disponibles.
  - El estado global de la tarjeta se calcula: si al menos un grupo tiene cupo, es `"abierta"`; si ninguno tiene cupo pero hay lista de espera, es `"espera"`; si todos están completos, es `"cerrada"`.
- **Generador de Arte y Animaciones CSS (`ART` & `LOOKS`):**
  - Si un taller no cuenta con imagen fotográfica o GIF, se inyecta una ilustración animada puramente con HTML y CSS.
  - Tipos de arte:
    - `notes`: Pentagrama con notas flotantes y cinta de película.
    - `cards`: Cartas de póker en 3D que se dan vuelta y dado que rueda.
    - `pet`: Tamagotchi virtual con pantalla pixel art, corazón pulsante y botones.
    - `character`: Busto en 3D estilizado que gira sobre una plataforma.
    - `code`: Ventana de editor de código con cursor titilante y líneas de texto.
    - `game`: Monedas saltarinas y bloques estilo plataformas.
  - En tarjetas con GIFs o videos, se cargan estáticos inicialmente y se activan solo con `pointerenter` del mouse o cuando entran al centro de la pantalla en dispositivos táctiles vía `IntersectionObserver`.

### 5.4. Lógica de Verificación y Envío de Formulario (`form.js`)
- **Verificación en tiempo real de DNI:**
  - Escucha el evento `input` del campo DNI.
  - Aplica un debounce de 700 ms (o 1500 ms si tiene menos de 7 dígitos numéricos).
  - Invoca `GET /api/inscripcion?action=verificar&dni=<dni>&actividad=<id>`.
  - Evalúa la respuesta:
    - `ok`: Documento habilitado para inscribirse o ingresar en lista de espera.
    - `sin_verificar`: Documento válido pero no se pudo validar el historial; se permite enviar para revisión humana.
    - `no_cumple`: Se bloquea el botón y se le informa qué cursos le faltan aprobar.
    - `activa`: Se notifica que ya está inscrito en otro taller.
    - `no_encontrado`: Se avisa que no figura en el padrón de alumnos de TUMO.
- **Desglose gráfico de Prerrequisitos (`renderRequirements`):**
  - Despliega una lista con checks verdes (`✓`) o cruces rojas (`✕`) indicando el estado de cada curso requerido y el veredicto final.
- **Motor de Envío Resiliente (`submitWithRetries`):**
  - Diseñado para situaciones de saturación donde muchas personas se inscriben al mismo tiempo.
  - Si la llamada falla por error transitorio (`timeout`, `sin_conexion`, `ocupado`, `demasiados_intentos`):
    1. Antes de reintentar el POST, consulta con un GET si la solicitud ya quedó registrada (`savedAlready`) para no generar duplicados.
    2. Si no se guardó, espera un tiempo exponencial progresivo (2s, 4s, 6s... hasta 15s) sumado a un jitter aleatorio de 0 a 2s.
    3. Mantiene el intento activo hasta por 5 minutos (`SUBMIT_PATIENCE_MS`) antes de arrojar un error visible al usuario.

### 5.5. Chatbot Inteligente "Flashy" (`chatbot.js`)
- **Interfaz y Accesibilidad:**
  - Botón flotante circular en la esquina inferior derecha con rostro animado de robot (`.bot`).
  - Panel deslizante con historial de mensajes, botones de sugerencias rápidas (chips) e input de texto.
  - Ajuste dinámico de altura para teclados móviles utilizando la API `window.visualViewport`.
- **Detección Local de Intenciones (Pre-procesamiento sin gastar tokens de IA):**
  1. **Intención de WhatsApp:** Detecta expresiones como *"hablar con alguien"*, *"más info"*, *"whatsapp"*, *"wpp"*. Responde inmediatamente con el botón directo a WhatsApp.
  2. **Intención de Consulta de Estado:** Detecta expresiones como *"estado de mi solicitud"*, *"estoy anotado"*, *"tengo la vacante"*. Si el mensaje ya incluye el DNI o el usuario lo escribe a continuación, consulta directamente `/api/inscripcion?action=estado&dni=...` y muestra el estado sin enviar el DNI del menor a la IA externa.
  3. **Intención de Inscripción:** Si el usuario pregunta cómo inscribirse en una actividad específica, el bot busca el taller en la memoria local y adjunta automáticamente el enlace directo al formulario.
- **Conexión con Groq LLM:**
  - Todas las demás preguntas abiertas se envían a `POST /api/chat` con el historial de la conversación.

---

## 6. Especificación de Endpoints y Contratos de la API

Ambos endpoints son funciones serverless desplegadas en Vercel.

### 6.1. Endpoint `/api/inscripcion`

#### A. Obtener Cartelera de Actividades
- **Método:** `GET`
- **Parámetros Query:** `action=actividades`
- **Respuesta Exitosa (200 OK):**
```json
{
  "status": "ok",
  "actividades": [
    {
      "id": "musica-cine-a",
      "nombre": "Composición de Música para Cine",
      "tipo": "FlashLab",
      "grupo": "A",
      "dias": "Jue 10, Vie 11, Mar 15 y Jue 17 de diciembre (Vie 18: cierre y recuperatorio)",
      "horario": "9:00 a 11:00",
      "capacidad": 18,
      "requisito": "Tener Nivel 1 de Música aprobado",
      "cursosRequisito": ["Nivel 1 de Música"],
      "descripcion": "Vas a ver un poco de teoría e historia de las bandas sonoras...",
      "herramientas": "Logic Pro",
      "imagen": "",
      "estado": "abierta",
      "libres": 18
    }
  ]
}
```

#### B. Verificar DNI y Prerrequisitos
- **Método:** `GET`
- **Parámetros Query:** `action=verificar&dni={DNI}&actividad={ID_ACTIVIDAD}`
- **Respuestas Posibles:**
  - Documento apto:
    ```json
    {
      "status": "ok",
      "lugar": "vacante", // o "espera"
      "requisitos": {
        "modo": "any", // o "all"
        "sinHistorial": false,
        "cursos": [
          { "curso": "Nivel 1 de Música", "estado": "ok" }
        ]
      }
    }
    ```
  - Documento no cumple requisitos:
    ```json
    {
      "status": "no_cumple",
      "requisitos": {
        "modo": "any",
        "cursos": [
          { "curso": "Nivel 1 de Música", "estado": "no" }
        ]
      }
    }
    ```
  - Otros códigos de estado devueltos en `status`: `"no_encontrado"`, `"activa"`, `"cerrada"`, `"sin_verificar"`, `"dni_invalido"`, `"timeout"`, `"demasiados_intentos"`.

#### C. Enviar Solicitud de Vacante
- **Método:** `POST`
- **Headers:** `Content-Type: application/json`
- **Cuerpo de la Petición:**
```json
{
  "action": "solicitud",
  "dni": "45123456",
  "nombre": "Martina Gómez",
  "actividad": "musica-cine-a",
  "confirmado": true
}
```
- **Respuesta Exitosa:**
```json
{
  "status": "ok",
  "estado": "Confirmado" // o "Lista de espera", "En validación"
}
```

#### D. Consultar Estado de una Solicitud
- **Método:** `GET`
- **Parámetros Query:** `action=estado&dni={DNI}` (opcionalmente `&actividad={ID_ACTIVIDAD}`)
- **Respuesta Exitosa:**
```json
{
  "status": "ok",
  "estado": "Confirmado por el equipo",
  "mensaje": "Tu solicitud está confirmada.",
  "detalle": {
    "nombre": "Martina Gómez",
    "actividad": "Composición de Música para Cine",
    "dias": "Jue 10, Vie 11, Mar 15 y Jue 17 de diciembre",
    "horario": "9:00 a 11:00"
  },
  "mismaActividad": true
}
```

---

### 6.2. Endpoint `/api/chat` (Flashy)

- **Método:** `POST`
- **Headers:** `Content-Type: application/json`
- **Cuerpo de la Petición:**
```json
{
  "messages": [
    { "role": "user", "content": "¿Cuándo y dónde son los talleres?" }
  ]
}
```
- **Respuesta:**
```json
{
  "reply": "Los FlashLabs se realizan en TUMO Barracas del jueves 10 al jueves 17 de diciembre."
}
```

---

## 7. Catálogo Completo de Actividades (Datos Reales Obtenidos)

La consulta en vivo a la API arrojó las siguientes actividades oficiales del ciclo:

| ID Actividad | Nombre del FlashLab | Grupo | Horario | Cupo | Requisitos Académicos Previos | Herramientas |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `musica-cine-a` | Composición de Música para Cine | A | 9:00 a 11:00 | 18 | Nivel 1 de Música | Logic Pro |
| `musica-cine-b` | Composición de Música para Cine | B | 14:00 a 16:00 | 18 | Nivel 1 de Música | Logic Pro |
| `tumogotchi-a` | TumoGotchi | A | 9:00 a 11:00 | 18 | Sin requisitos previos | Visual Studio Code |
| `tumogotchi-b` | TumoGotchi | B | 14:00 a 16:00 | 18 | Sin requisitos previos | Visual Studio Code |
| `animacion-gifs-a` | Animación de gifs | A | 9:00 a 11:00 | 18 | Sin requisitos previos | Harmony Toon Boom, Wacom |
| `animacion-gifs-b` | Animación de gifs | B | 14:00 a 16:00 | 18 | Sin requisitos previos | Harmony Toon Boom, Wacom |
| `juego-cartas-a` | Creación de juegos de mesa | A | 9:00 a 11:00 | 18 | Diseño Gráfico 1 o Modelado 3D 1 | Illustrator, Maya |
| `juego-cartas-b` | Creación de juegos de mesa | B | 14:00 a 16:00 | 18 | Diseño Gráfico 1 o Modelado 3D 1 | Illustrator, Maya |
| `carreras-iot-a` | Creación de juegos en el Carrier IoT | A | 9:00 a 11:00 | 12 | Sin requisitos previos | Arduino Cloud, Kit Carrier IoT |
| `carreras-iot-b` | Creación de juegos en el Carrier IoT | B | 14:00 a 16:00 | 12 | Sin requisitos previos | Arduino Cloud, Kit Carrier IoT |
| `sonido-codigo-a` | Del sonido al código | A | 12:00 a 14:00 | 18 | Nivel 2 Programación o Nivel 2 Música | Logic Pro, VS Code |
| `sonido-codigo-b` | Del sonido al código | B | 17:00 a 19:00 | 18 | Nivel 2 Programación o Nivel 2 Música | Logic Pro, VS Code |
| `personajes-ia-3d-a`| Generación de Personajes 3D | A | 14:00 a 16:00 | 18 | Sin requisitos previos | Blender, Poly Haven, Meshy |
| `personajes-ia-3d-b`| Generación de Personajes 3D | B | 17:00 a 19:00 | 18 | Sin requisitos previos | Blender, Poly Haven, Meshy |
| `tumo-tank-a` | TUMO Tank | A | 17:00 a 19:00 | 32 | Videojuegos 1, Robótica 1 o Diseño 1 | Illustrator, Arduino, Unity |

---

## 8. Guía de Implementación para Construir un Sitio Web Similar

Para desarrollar un nuevo sitio web idéntico o adaptado a otro centro educativo:

### Paso 1: Configurar la estructura de archivos base
Clonar o reproducir los archivos estáticos en la raíz del proyecto:
- `index.html`: Estructura semántica de la landing.
- `inscripcion.html`: Estructura del formulario en 4 vistas.
- `style.css`: Hojas de estilo completas con las variables CSS y animaciones.
- `theme.js`: Script de tema y transiciones de vista.
- `config.js`: Datos del evento (nombre, fechas, horarios, teléfono de WhatsApp) y configuración de `API_BASE`.
- `script.js`: Renderizado de tarjetas y carrusel.
- `form.js`: Verificación y envío de formularios.
- `chatbot.js`: Lógica del asistente interactivo.

### Paso 2: Implementar el Backend Serverless (Vercel / Node.js)
Crear los endpoints en la carpeta `/api`:
1. `/api/inscripcion.js`:
   - Conectar a la base de datos (Google Sheets mediante Google Sheets API / Service Account, o PostgreSQL / Supabase).
   - Manejar las 4 acciones: `actividades`, `verificar`, `solicitud` y `estado`.
   - Implementar control de concurrencia: si se superan los cupos, asignar automáticamente `"Lista de espera"`.
2. `/api/chat.js`:
   - Configurar cliente para Groq API (`groq-sdk`) o Google Gemini.
   - Pasar como System Prompt los datos de `EVENT` de `config.js` y las reglas de inscripción para que las respuestas sean consistentes.

### Paso 3: Recursos Visuales y Branding
- Incorporar en `img/` el logotipo propio y las fotos reales para el carrusel en formato WebP o JPG optimizado (1400x1050 px).
- Si se desea personalizar colores, editar los tokens en `:root` de `style.css` (`--red`, `--blue`, `--yellow`).

---

## 9. Archivos Extraídos Disponibles en este Repositorio

Todos los archivos originales han sido analizados y almacenados en este mismo directorio de trabajo para su consulta y desarrollo:
- [index.html](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/site_index.html) *(Copia del index principal)*
- [inscripcion.html](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/inscripcion.html) *(Página de solicitud y validación)*
- [style.css](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/style.css) *(Hoja de estilos completa)*
- [theme.js](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/theme.js) *(Conmutador de tema)*
- [config.js](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/config.js) *(Configuración y helpers)*
- [script.js](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/script.js) *(Lógica de cartelera)*
- [form.js](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/form.js) *(Lógica de formulario)*
- [chatbot.js](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/chatbot.js) *(Widget del chatbot)*
- [api_actividades.json](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/api_actividades.json) *(Respuesta real de la API de actividades)*
- [img/](file:///c:/Users/luise/Documents/dev/tumo/webLabs_2026/img/) *(Activos gráficos, logotipos y fotos del carrusel)*
