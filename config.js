// ==========================================================
// TUMO Chacarita Flash Labs — Diciembre 2026
// Configuración general, disciplinas, constantes y helpers
// ==========================================================

// URL de la Aplicación Web de Google Apps Script (implementada según appScript.js)
// Si está vacía o se prueba localmente, el sistema opera con data_de_labs.json y almacenamiento local
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwOYv4Yk4k4W7B0DNf1uAFWRW-KgRyNSzjQxD_griUpduSaP3hJ441jjPCVWt2gKiLndg/exec"; 

const EVENT = {
    name: "Flash Labs Diciembre 2026",
    center: "TUMO Chacarita",
    city: "Buenos Aires",
    dates: "Diciembre de 2026",
    period: "Del 10 al 18 de diciembre de 2026",
    place: "TUMO Chacarita",
    price: "Gratuito",
    contact: "familias.chacarita@tumo.ar",
    whatsapp: "5491151342592",
    whatsappText: "Hola, necesito más información sobre los Flash Labs de TUMO Chacarita",
    emailDomain: "@tumo.world",
    maxInscripcionesPorEstudiante: 2,
    rules: [
        "Exclusivo para estudiantes de TUMO Chacarita.",
        "Cada estudiante puede inscribirse en hasta dos (2) Flash Labs distintos de diciembre.",
        "Se requiere completar Nombre y apellido, DNI y correo electrónico de TUMO (@tumo.world).",
        "Cada taller tiene un cupo limitado (Participantes Máximos). Una vez alcanzado, se marca como 'No disponible'.",
        "La confirmación de la vacante se notifica por correo electrónico oficial de TUMO.",
        "Todas las actividades y talleres son 100% gratuitos."
    ],
    faq: [
        ["¿Cuándo y dónde se dictan los Flash Labs?", 
         "Los Flash Labs se desarrollarán del 10 al 18 de diciembre de 2026 en la sede de TUMO Chacarita, Buenos Aires."],
        ["¿Quiénes pueden participar?", 
         "Son actividades exclusivas para estudiantes activos de TUMO Chacarita que tengan al menos una disciplina en estado \"complete\" u \"on going\"."],
        ["¿Me puedo anotar en más de un Flash Lab?", 
         "Sí, podés inscribirte en hasta dos (2) Flash Labs distintos, siempre que no repitas el mismo taller."],
        ["¿Qué datos me piden para inscribirme?", 
         "Tu nombre y apellido, DNI y tu correo electrónico de TUMO (@tumo.world)."],
        ["¿Qué pasa si un taller dice 'No disponible'?", 
         "Significa que el taller alcanzó el número máximo de participantes. Te recomendamos elegir otra de las opciones disponibles en la cartelera."],
        ["¿Tienen costo los talleres?", 
         "Ninguno. Todos los Flash Labs de TUMO Chacarita son totalmente gratuitos."],
        ["¿Cómo sé si mi vacante está confirmada?", 
         "El equipo de TUMO Chacarita enviará la confirmación por correo electrónico antes del inicio del taller."],
        ["¿Cómo contacto a la sede?", 
         "Podés escribirnos a familias.chacarita@tumo.ar o por WhatsApp al +54 9 11 5134-2592."]
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

// Abre WhatsApp con mensaje preconfigurado
const whatsappUrl = () => `https://wa.me/${EVENT.whatsapp}?text=${encodeURIComponent(EVENT.whatsappText)}`;

// Escape HTML básico
const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Normalización de documento DNI: sólo letras y números, sin espacios ni puntos
const cleanDoc = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

// Normalización de Horarios (TM, TT, etc.)
function formatHorario(raw) {
    if (!raw) return "Horario a coordinar";
    if (raw === "TM") return "Turno Mañana (09:00 a 12:00)";
    if (raw === "TT") return "Turno Tarde (14:00 a 17:00)";
    return String(raw).replace(/\s+a\s+/gi, " a ").trim();
}

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
// Gestión de Almacenamiento Local y Conteos de Inscripciones
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
        items.push({
            ...data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch {
        return false;
    }
}

// Obtener cantidad de inscriptos para un taller en un horario y días específicos
function getInscriptosCount(tallerTitulo, dias, horario, remoteCounts = null) {
    const key = tallerTitulo.toLowerCase().trim() + "|||" + (dias || "").toLowerCase().trim() + "|||" + (horario || "").toLowerCase().trim();
    if (remoteCounts && typeof remoteCounts[key] === "number") {
        return remoteCounts[key];
    }
    const locals = getLocalInscripciones();
    return locals.filter(item => {
        const t = (item.taller || "").toLowerCase().trim();
        const d = (item.dias || "").toLowerCase().trim();
        const h = (item.horario || "").toLowerCase().trim();
        return t === tallerTitulo.toLowerCase().trim() && d === (dias || "").toLowerCase().trim() && h === (horario || "").toLowerCase().trim();
    }).length;
}

// Obtener cantidad total de inscriptos en un taller (sumando todos los horarios/días)
function getInscriptosTotalCount(tallerTitulo, remoteCounts = null) {
    if (remoteCounts) {
        const prefix = tallerTitulo.toLowerCase().trim() + "|||";
        let total = 0;
        for (const key in remoteCounts) {
            if (key.toLowerCase().startsWith(prefix)) {
                total += remoteCounts[key];
            }
        }
        if (total > 0) return total;
    }
    const locals = getLocalInscripciones();
    return locals.filter(item => (item.taller || "").toLowerCase().trim() === tallerTitulo.toLowerCase().trim()).length;
}

// Evalúa si un taller tiene al menos un horario disponible
function isLabAvailable(lab, remoteCounts = null) {
    const max = Number(lab.maxParticipantes) || 18;
    return lab.horarios.some(h => {
        const current = getInscriptosCount(lab.titulo, lab.dias || "", h, remoteCounts);
        return current < max;
    });
}

// Evalúa si un horario específico de un taller está disponible
function isHorarioAvailable(lab, horario, remoteCounts = null) {
    const current = getInscriptosCount(lab.titulo, lab.dias || "", horario, remoteCounts);
    const max = Number(lab.maxParticipantes) || 18;
    return current < max;
}

// Obtener cantidad de inscripciones de un estudiante por DNI
function getInscripcionesCountByDNI(dni, remoteCounts = null) {
    const cleanedDNI = cleanDoc(dni);
    const locals = getLocalInscripciones();
    return locals.filter(item => cleanDoc(item.dni) === cleanedDNI).length;
}

// Verificar si un estudiante ya está inscripto en un taller+días+horario específico
function isAlreadyInscripto(dni, tallerTitulo, dias, horario) {
    const cleanedDNI = cleanDoc(dni);
    const locals = getLocalInscripciones();
    return locals.some(item => {
        return cleanDoc(item.dni) === cleanedDNI &&
               (item.taller || "").toLowerCase().trim() === tallerTitulo.toLowerCase().trim() &&
               (item.dias || "").toLowerCase().trim() === (dias || "").toLowerCase().trim() &&
               (item.horario || "").toLowerCase().trim() === (horario || "").toLowerCase().trim();
    });
}

// Normaliza el conjunto completo de talleres desde data_de_labs.json
function processRawLabs(rawList) {
    let currentDisciplina = "General";
    return rawList.map((item, idx) => {
        if (item["Disciplinas"] && item["Disciplinas"].trim()) {
            currentDisciplina = item["Disciplinas"].trim();
        }
        const titulo = (item["Título / Tema"] || "").trim().replace(/^"|"$/g, "");
        const id = `lab-${idx + 1}-${slugify(titulo)}`;
        const max = parseInt(item["Participantes  Máximos"] || item["Participantes Máximos"] || 18, 10);
        const min = parseInt(item["Participantes Minimos"] || 1, 10);
        const horarioRaw = item["Horario sugerido"] || "A coordinar";
        
        let horarios = [];
        if (horarioRaw.includes("\n")) {
            horarios = horarioRaw.split("\n").map(h => formatHorario(h.trim())).filter(Boolean);
        } else if (horarioRaw.toLowerCase().includes(" y de ")) {
            horarios = horarioRaw.split(/\s+y\s+de\s+/i).map(h => formatHorario(h.trim()));
        } else {
            horarios = [formatHorario(horarioRaw)];
        }

        const discMeta = DISCIPLINAS[currentDisciplina] || {
            slug: slugify(currentDisciplina),
            color: "#5EB656",
            icon: "assets/icons/gen_AI.png",
            art: "gen_AI",
            label: currentDisciplina
        };

        const requisitosText = item["Requisitos"] || "No";
        const tieneRequisito = requisitosText && !/^\s*no\b/i.test(requisitosText.trim());

        return {
            id,
            index: idx,
            titulo,
            disciplina: currentDisciplina,
            disciplinaMeta: discMeta,
            descripcion: item["Descripción"] || "Propuesta práctica intensiva junto al equipo de TUMO Chacarita.",
            horas: item["Horas"] || "3hs",
            horarioRaw,
            horarios,
            minParticipantes: min,
            maxParticipantes: max,
            requisitos: requisitosText,
            tieneRequisito
        };
    });
}
