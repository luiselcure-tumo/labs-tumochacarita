// ==========================================================
// TUMO Chacarita Flash Labs — Diciembre 2026
// Configuración general, disciplinas, constantes y helpers
// ==========================================================

// URL de la Aplicación Web de Google Apps Script (implementada según appScript.js)
// Si está vacía o se prueba localmente, el sistema opera con data_de_labs.json y almacenamiento local
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJHVhtCxtRyGetd5PMbkUJPfas3xw9ShH8WWKrNo1JN9eM0Chw0tHjRfs7qjVqijtmww/exec"; 

const EVENT = {
    name: "Flash Labs Diciembre 2026",
    center: "TUMO Chacarita",
    city: "Buenos Aires",
    dates: "Diciembre de 2026",
    period: "Del 14 al 17 de diciembre de 2026",
    place: "TUMO Chacarita",
    price: "Gratuito",
    contact: "familias.chacarita@tumo.ar",
    emailDomain: "@tumo.world",
    maxInscripcionesPorEstudiante: 2,
    rules: [
        "Exclusivo para estudiantes de TUMO Chacarita.",
        "Cada estudiante puede inscribirse en hasta dos (2) Flash Labs distintos de diciembre.",
        "Algunos Flash Labs piden tener completado el nivel I de un workshop.",
        "Se requiere completar Nombre y apellido, DNI y correo electrónico de TUMO (@tumo.world o @tumo.ar).",
        "Cada taller tiene un cupo limitado (Participantes Máximos). Una vez alcanzado, se marca como 'No disponible'.",
        "La confirmación de la vacante se notifica por correo electrónico oficial de TUMO.",
        "Todas las actividades y talleres son 100% gratuitos."
    ],
    faq: [
        ["¿Cuándo y dónde se dictan los Flash Labs?", 
         "Los Flash Labs se desarrollarán del lunes 14 al jueves 17 de diciembre de 2026 en la sede de TUMO Chacarita, Buenos Aires."],
        ["¿Quiénes pueden participar?", 
         "Cualquier estudiante activo de TUMO Chacarita. Algunos Flash Labs tienen requisitos: los explicamos más abajo."],
        ["¿Me puedo anotar en más de un Flash Lab?", 
         "Sí, podés inscribirte en hasta dos (2) Flash Labs distintos, siempre que no repitas el mismo taller."],
        ["¿Qué datos me piden para inscribirme?", 
         "Tu nombre y apellido, DNI y tu correo electrónico de TUMO (@tumo.world o @tumo.ar)."],
        ["¿Qué pasa si un taller dice 'No disponible'?", 
         "Significa que el taller alcanzó el número máximo de participantes. Te recomendamos elegir otra de las opciones disponibles en la cartelera."],
        ["¿Tienen costo los talleres?", 
         "Ninguno. Todos los Flash Labs de TUMO Chacarita son totalmente gratuitos."],
        ["¿Cómo sé si mi vacante está confirmada?", 
         "El equipo de TUMO Chacarita enviará la confirmación por correo electrónico antes del inicio del taller."],
        ["¿Cómo contacto a la sede?", 
         "Podés escribirnos a familias.chacarita@tumo.ar o preguntarle a tu coach."]
    ]
};

// Paleta oficial y metadatos de disciplinas según manual de identidad TUMO Chacarita
const DISCIPLINAS = {
    "Dibujo": {
        slug: "dibujo",
        color: "#9D316D",
        icon: "assets/icons/drawing.png",
        art: "drawing",
        label: "Dibujo"
    },
    "Fotografía": {
        slug: "fotografia",
        color: "#0BABBA",
        icon: "assets/icons/photo.png",
        art: "photo",
        label: "Fotografía"
    },
    "Cine": {
        slug: "cine",
        color: "#E84E1D",
        icon: "assets/icons/filmaking.png",
        art: "filmaking",
        label: "Cine"
    },
    "Música": {
        slug: "musica",
        color: "#71236B",
        icon: "assets/icons/music.png",
        art: "music",
        label: "Música"
    },
    "Videojuegos": {
        slug: "videojuegos",
        color: "#96C121",
        icon: "assets/icons/videoGames.png",
        art: "videoGames",
        label: "Videojuegos"
    },
    "Modelado 3D": {
        slug: "modelado-3d",
        color: "#787625",
        icon: "assets/icons/3D.png",
        art: "3D",
        label: "Modelado 3D"
    },
    "GenAI": {
        slug: "genai",
        color: "#BAA3F0",
        icon: "assets/icons/gen_AI.png",
        art: "gen_AI",
        label: "IA Generativa"
    },
    "Programación": {
        slug: "programacion",
        color: "#ACA678",
        icon: "assets/icons/programming.png",
        art: "programming",
        label: "Programación"
    },
    // Disciplinas combinadas
    "GenAI + Programación": {
        slug: "genai-programacion",
        color: "#BAA3F0",
        icon: "assets/icons/gen_AI.png",
        art: "gen_AI",
        label: "GenAI + Programación"
    },
    "Modelado 3D + Videojuegos": {
        slug: "3d-videojuegos",
        color: "#787625",
        icon: "assets/icons/3D.png",
        art: "3D",
        label: "Modelado 3D + Videojuegos"
    },
    "Música + Cine": {
        slug: "musica-cine",
        color: "#71236B",
        icon: "assets/icons/music.png",
        art: "music",
        label: "Música + Cine"
    }
};

// Escape HTML básico
const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Normalización de documento DNI: sólo letras y números, sin espacios ni puntos
const cleanDoc = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

// Genera un slug identificador estable para cada taller
function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// Icono SVG de reloj
const CLOCK_ICON = '<svg class="icon-clock" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

// Icono SVG de personas / cupo
const USERS_ICON = '<svg class="icon-users" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>';

// ==========================================================
// Gestión de Almacenamiento Local y Conteos por Comisión
// ==========================================================
const STORAGE_KEY = "tumo_chacarita_flash_labs_inscripciones";

function getLocalInscripciones() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalInscripcion(data) {
    try {
        const items = getLocalInscripciones();
        items.push({ ...data, timestamp: new Date().toISOString() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch {
        return false;
    }
}

function getInscriptosCount(comisionId, remoteCounts = null) {
    if (remoteCounts) {
        return typeof remoteCounts[comisionId] === "number" ? remoteCounts[comisionId] : 0;
    }
    return getLocalInscripciones().filter(item => item.comisionId === comisionId).length;
}

function getComisionVacantes(comision, remoteCounts = null) {
    return Math.max(0, comision.cupo - getInscriptosCount(comision.id, remoteCounts));
}

function isComisionAvailable(comision, remoteCounts = null) {
    return getComisionVacantes(comision, remoteCounts) > 0;
}

function isLabAvailable(lab, remoteCounts = null) {
    return lab.comisiones.some(c => isComisionAvailable(c, remoteCounts));
}

function getLabVacantes(lab, remoteCounts = null) {
    return lab.comisiones.reduce((sum, c) => sum + getComisionVacantes(c, remoteCounts), 0);
}

// Local pre-checks only; the Apps Script enforces these rules.
function getInscripcionesCountByDNI(dni) {
    const cleanedDNI = cleanDoc(dni);
    return getLocalInscripciones().filter(item => cleanDoc(item.dni) === cleanedDNI).length;
}

function isAlreadyInscripto(dni, labId) {
    const cleanedDNI = cleanDoc(dni);
    return getLocalInscripciones().some(item => cleanDoc(item.dni) === cleanedDNI && item.labId === labId);
}

function formatHoras(horas) {
    return String(horas).replace(".", ",") + " h";
}

// Normaliza los talleres de data_de_labs.json (un elemento por lab, con sus comisiones)
function processRawLabs(rawList) {
    return rawList.map((item, idx) => {
        const discMeta = DISCIPLINAS[item.disciplina] || {
            slug: slugify(item.disciplina),
            color: "#5EB656",
            icon: "assets/icons/gen_AI.png",
            art: "gen_AI",
            label: item.disciplina
        };
        const comisiones = item.comisiones.map(c => ({
            id: c.id,
            dias: c.dias,
            diasTexto: c.dias.join(" y "),
            horario: c.horario,
            cupo: Number(c.cupo || item.maxParticipantes),
            label: `${c.dias.join(" y ")} · ${c.horario.replace(/ h$/, " h")}`
        }));
        const encuentrosTexto = item.encuentros === 1 ? "1 encuentro" : `${item.encuentros} encuentros`;

        return {
            id: item.id,
            index: idx,
            titulo: item.titulo,
            disciplina: item.disciplina,
            disciplinaMeta: discMeta,
            descripcion: item.descripcion || "Propuesta práctica intensiva junto al equipo de TUMO Chacarita.",
            encuentros: item.encuentros,
            horas: `${encuentrosTexto} · ${formatHoras(item.horasTotales)}`,
            minParticipantes: item.minParticipantes,
            maxParticipantes: item.maxParticipantes,
            requisitos: item.requisito.texto,
            tieneRequisito: item.requisito.workshops.length > 0,
            comisiones
        };
    });
}
