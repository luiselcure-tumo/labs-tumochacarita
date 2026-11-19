# web learning labs diciembre 2026

## Funcionalidad de la página:

- Descripción: Página de registro para estudiantes de TUMO Chacarita, que les permitira hacer su inscripción a los diferentes talleres cortos que se dictarán en diciembre del 2026.
- Navegación y UX: Los estudiantes entrarán a una página con estética minimalista de TUMO, donde encontrarán en la sección "Hero" de la página, una descripción de la propuesta de "che Diciembre", al hacer scroll, se encontrarán con una descripción corta de qué es un flash lab, y por último una sección "cartelera" donde encontrarán diferentes "tarjetas con un resumen de cada una de las propuestas disponibles, que mostrará una pequeña animación estilo "flat-design" relacionada con el tag "disciplinas", el nombre del flash lab, Horarios, días (fechas), un botón para solicitar la vacante y un último indicador, que mostrará si aún hay cupos disponibles de inscripción o no.

Una vez vayan a la inscripción tendrán que confirmar el horario o volver a la cartelera dinámica mediante un pop card. Una vez que confirman el horario, verán una página con un formulario nativo, respetántto la estética de TUMO, donde tendrán que enviar, nombre y apellido, DNI del estudiante, correo electrónico (de tumo). Luego marcarán un casillero necesario donde reconfirman el horario seleccionado y envían el formulario.

- Método de registro: Cada uno de los talleres tiene la siguiente estructura como del ejemplo: " {
  "Disciplinas":"Fotografía",
  "Horario sugerido":"13 a 16hs",
  "Título \/ Tema":"\"Tu celular, tu camara profesional\"",
  "Descripción":"Cómo aplicar los aprendizajes sobre manejo manual y tecnicas de la camara vistas en el taller, al celular. ",
  "Horas":"3hs",
  "Participantes Minimos":"8",
  "Participantes Máximos":14,
  "Requisitos":"Nivel 1 de Foto"
  }" al mismo tiempo los datos de cada alumno se enviarán directamente a una hoja de cálculo de google mediantet el método Apps Script.

  Cada vez que un usuario confirme su elección y el formulario se envíe, se debe validar la cantidad de alumnos instriptos y marcar como "No disponible" aquellos que ya tengan la cantidad de "Participantes Máximos" y al mismo tiempo no puede permitirles enviar el formulario si el taller tiene el tag de "No disponible"

## Estilos y datos del sitio web

## Nombre del centro / empresa

Original: TUMO Barracas
Reemplazar por: TUMO Chacarita

## Assets

Todos los assets de imágen se encontrarán en el repositorio "C:\Users\luise\Documents\dev\tumo\webLabs_2026\assets"

Los más importantes serán:

- Logo Che Verano: C:\Users\luise\Documents\dev\tumo\webLabs_2026\assets\che_verano.png
- logo TUMO light: C:\Users\luise\Documents\dev\tumo\webLabs_2026\assets\Chacarita_Logo_Light.png
- logo TUMO dark: C:\Users\luise\Documents\dev\tumo\webLabs_2026\assets\TUMO_BuenosAires_Chacarita_Logo_Dark.png
- Íconos: C:\Users\luise\Documents\dev\tumo\webLabs_2026\assets\icons/

**NOTA:** Los assets de las animaciones de video de cada una de las cards de la cartelera tendran que ser generados seguiendo las instrucciones del título de taller y la disciplina

## Colores

### Generales:

- Principal: #5EB656 (Verde Chacarita)
- Secundario: #8EEB85 (verde claro)
- Oscuro: #294A26 (verde oscuro)
- Fondo: #F2F2F2

### Colores de disciplinas para las tarjetas

- Dibujo: #9D316D
- Fotografía: #0BABBA
- Cine: #E84E1D
- Música: #71236B
- Videojuegos: #96C121
- Modelado 3D: #787625
- IA Generativa: #BAA3F0
- Programación: #ACA678

## Tipografía

- principal: Maax
- secundaria: Fredra


---

## Pasos a seguir manualmente para configurar, testear y finalizar la realización del sitio web

A continuación se detalla la guía paso a paso para poner en marcha el sitio web, vincularlo con Google Sheets para el registro real de estudiantes, testear todas las validaciones y publicarlo.

### Paso 1: Configurar la Hoja de Cálculo y Google Apps Script

1. **Crear la Hoja de Google Sheets:**
   - Ingresá a [Google Drive](https://drive.google.com/) con la cuenta de Google institucional o la designada para la sede.
   - Creá una nueva Hoja de cálculo de Google con el nombre: `Inscripciones Learning Labs TUMO Chacarita 2026`.
   - (Opcional) En la fila 1 podés dejar los encabezados vacíos; el script los generará automáticamente en el primer registro: `Marca temporal`, `Nombre y Apellido`, `DNI`, `Correo TUMO`, `Taller / Lab`, `Horario`, `Disciplina`.

2. **Copiar el código de Google Apps Script:**
   - En la hoja de cálculo, hacé clic en el menú superior: **Extensiones** > **Apps Script**.
   - Borrá cualquier código predeterminado que aparezca en el editor (`Code.gs`).
   - Abrí el archivo local `appScript.js` de este proyecto, copiá todo su contenido y pegalo en el editor de Apps Script.
   - Guardá los cambios presionando `Ctrl + S` (o el ícono del disquete).

3. **Implementar como Aplicación Web (Web App):**
   - En la esquina superior derecha de Apps Script, hacé clic en el botón azul **Implementar** (Deploy) > **Nueva implementación** (New deployment).
   - En la ventana emergente, hacé clic en el ícono de engranaje ⚙️ a la izquierda de "Seleccionar tipo" y elegí **Aplicación web**.
   - Completá los siguientes campos:
     - **Descripción:** `API Registro Learning Labs Chacarita 2026`.
     - **Ejecutar como:** `Yo (tu correo de Google)`.
     - **Quién tiene acceso:** **`Cualquier usuario`** *(Imprescindible para que los estudiantes puedan enviar sus solicitudes desde la web sin necesidad de iniciar sesión de Google)*.
   - Hacé clic en **Implementar**.
   - Google te solicitará autorizar permisos: hacé clic en *Revisar permisos* > seleccioná tu cuenta > hacé clic en *Configuración avanzada* > *Ir a Proyecto (no seguro)* > hacé clic en *Permitir*.
   - Al finalizar, se mostrará una ventana con la **URL de la aplicación web** (con formato `https://script.google.com/macros/s/AKfycb.../exec`). **Copiá esa URL completa.**

---

### Paso 2: Vincular la URL de Apps Script en el Frontend

1. Abrí el archivo local `config.js` en tu editor de código.
2. En la línea 8, localizá la constante `GOOGLE_SCRIPT_URL`:
   ```javascript
   const GOOGLE_SCRIPT_URL = "";
   ```
3. Pegá la URL obtenida en el Paso 1 entre las comillas:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/TU_CODIGO_AQUI/exec";
   ```
4. Guardá el archivo `config.js`.

---

### Paso 3: Testeo Local y Verificación de Requerimientos

Podés probar el sitio abriendo directamente `index.html` con doble clic en Google Chrome (`file:///...`) o mediante una extensión como **Live Server** de VS Code (`http://...`).
*(Nota técnica: El proyecto incluye `data_de_labs.js`, que inyecta los datos de los 33 talleres en memoria evitando los bloqueos de política CORS que los navegadores aplican por defecto a llamadas `fetch()` locales cuando se abre el archivo con protocolo `file://`).*

1. **Verificación de Navegación y Estética:**
   - Verificá que el logo visible sea el de **TUMO Chacarita** (`assets/TUMO_BuenosAires_Chacarita_Logo_Dark.png` en fondo claro y `assets/Chacarita_Logo_Light.png` en fondo verde).
   - En el Hero debe visualizarse el logo oficial de **Che Verano** (`assets/che_verano.png`) con el título *Learning Labs*.
   - Probá el botón circular de conmutación de tema en la barra de navegación: debe alternar fluidamente entre fondo claro (`#F2F2F2`) y fondo verde Chacarita (`#5EB656` / `#294A26`) con la animación circular de View Transitions.

2. **Verificación de la Cartelera (33 propuestas):**
   - Comprobá que se carguen los 33 talleres extraídos de `data_de_labs.json`.
   - Utilizá los botones de filtro por disciplina (*Todas, Fotografía, Música, Cine, GenAI, Modelado 3D, Videojuegos, Programación, Dibujo*) y confirmá que la grilla filtre correctamente los talleres.
   - Verificá que cada tarjeta presente su ícono oficial en `assets/icons/`, su color de borde temático y su animación flat-design en CSS activa.
   - Hacé clic en el cuerpo de una tarjeta para comprobar la apertura del diálogo modal de detalle (`dialog.lab-panel`) con requisitos, cupo y descripción.

3. **Verificación del Flujo de Inscripción:**
   - En una tarjeta disponible, hacé clic en **"Solicitar vacante"**.
   - Al abrirse `inscripcion.html`, debe emerger automáticamente el **Pop Card (`dialog.confirm`)**:
     - Permite seleccionar / reconfirmar el horario del taller.
     - Permite hacer clic en "Volver a la cartelera" para regresar.
     - Al presionar "Sí, continuar", el pop card se cierra y se hace foco en el campo Nombre del formulario nativo.
   - En el formulario nativo, completá los campos:
     - **Nombre y apellido:** Ingresá un nombre de prueba.
     - **DNI:** Ingresá un documento numérico sin puntos.
     - **Correo electrónico (de TUMO):** Ingresá un correo con formato válido (ej. `alumno.prueba@tumo.ar`).
     - **Casilla de reconfirmación de horario:** Marcá el checkbox obligatorio.
   - Hacé clic en **"Enviar solicitud"**.
   - Comprobá que:
     - Se muestre la pantalla de éxito con el resumen de la inscripción (`data-view="done"`).
     - Si vinculaste Apps Script, aparezca inmediatamente la nueva fila en tu hoja de Google Sheets con fecha, nombre, DNI, correo, taller, horario y disciplina.

4. **Verificación de la Validación de Cupos Máximos ("No disponible"):**
   - En `data_de_labs.json`, cada taller cuenta con un cupo de `Participantes Máximos` (por ejemplo, 12 o 14 alumnos).
   - Si un taller alcanza su cupo máximo (ya sea simulado con envíos locales o con las filas de Google Sheets):
     - La tarjeta en la cartelera debe cambiar inmediatamente al estado **`No disponible`** con fondo atenuado y el botón debe deshabilitarse mostrando *"No disponible (Cupo lleno)"*.
     - Si un usuario accede directamente mediante la URL a `inscripcion.html?id=ID_DEL_TALLER`, el Pop Card y el formulario deben mostrar la alerta de cupo lleno en color amarillo/ámbar y el botón de envío debe quedar bloqueado, impidiendo el envío.

5. **Verificación de la Consulta de Estado en Preguntas Frecuentes:**
   - En `index.html#faq`, abrí el primer acordeón *"¿Cuál es el estado de mi solicitud de vacante?"*.
   - Ingresá el DNI que usaste en la prueba y hacé clic en "Consultar". Debe arrojar el mensaje confirmando el taller y horario solicitados.

6. **Verificación del Asistente Virtual Flashy:**
   - Hacé clic en el botón flotante del robot Flashy en la esquina inferior derecha.
   - Probá los botones de sugerencia rápida (fechas, qué talleres hay, cómo inscribirme, WhatsApp).

---

### Paso 4: Finalización y Despliegue en Producción

1. **Subir el código a GitHub:**
   - En la raíz del proyecto `c:\Users\luise\Documents\dev\tumo\webLabs_2026`:
     ```bash
     git init
     git add .
     git commit -m "Implementación final Learning Labs TUMO Chacarita Diciembre 2026"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/webLabs_2026.git
     git push -u origin main
     ```

2. **Publicar en Vercel (Recomendado):**
   - Ingresá a [Vercel](https://vercel.com/) e iniciá sesión con tu cuenta de GitHub.
   - Hacé clic en **Add New...** > **Project**.
   - Seleccioná el repositorio `webLabs_2026`.
   - En "Framework Preset", seleccioná **Other** (sitio web estático).
   - Hacé clic en **Deploy**.
   - En unos segundos el sitio estará disponible en una URL pública (ejemplo: `https://weblabs-chacarita-2026.vercel.app`).
   - Probá el enlace final desde un celular y desde una computadora de escritorio para validar la experiencia de usuario completa.
