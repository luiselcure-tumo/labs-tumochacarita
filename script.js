// ==========================================================
// TUMO Chacarita Flash Labs — Cartelera (index.html)
// Carga data_de_labs.json, gestiona filtros, animaciones individuales por taller,
// cálculo de cupos ("Disponible" / "No disponible") y modal de detalle.
// ==========================================================

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

let allLabs = [];
let activeFilter = "todas";
let remoteCounts = null;

// ==========================================================
// 33 Animaciones Flat-Design Únicas (una para cada taller)
// ==========================================================
function getWorkshopAnimation(idx) {
    switch (idx) {
        // 1. Fotografía: "Tu celular, tu camara profesional"
        case 0:
            return `<div class="anim-lab anim-lab--1">
                <div class="phone-cam"><div class="phone-lens"><i></i><i></i><i></i></div><div class="phone-screen"><div class="phone-crosshair"></div><span class="cam-flash-beam"></span></div></div>
            </div>`;
        // 2. Fotografía: Macrofotografía
        case 1:
            return `<div class="anim-lab anim-lab--2">
                <div class="macro-stage"><div class="macro-leaf"></div><div class="macro-glass"><div class="glass-lens"></div><div class="glass-handle"></div></div></div>
            </div>`;
        // 3. Fotografía: Lightpaiting: pintar con luz
        case 2:
            return `<div class="anim-lab anim-lab--3">
                <div class="light-wave"><span class="spark spark-1">✦</span><span class="spark spark-2">✦</span><div class="light-ribbon"></div></div>
            </div>`;
        // 4. Música: Síntesis y diseño sonoro
        case 3:
            return `<div class="anim-lab anim-lab--4">
                <div class="synth-box"><div class="synth-scope"><svg viewBox="0 0 100 40"><path class="synth-wave" d="M0 20 Q 25 0, 50 20 T 100 20" /></svg></div><div class="synth-knobs"><i></i><i></i><i></i></div></div>
            </div>`;
        // 5. Música: Samples
        case 4:
            return `<div class="anim-lab anim-lab--5">
                <div class="mpc-pads"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>`;
        // 6. Música: Del Meme al Hit
        case 5:
            return `<div class="anim-lab anim-lab--6">
                <div class="vinyl-record"><div class="vinyl-sticker">😎</div></div><div class="turntable-arm"></div>
            </div>`;
        // 7. Cine: Edición de trailers
        case 6:
            return `<div class="anim-lab anim-lab--7">
                <div class="film-timeline"><div class="film-strip"><i></i><i></i><i></i><i></i></div><div class="scissor-tool">✂️</div></div>
            </div>`;
        // 8. Cine: Desarrollo de proyectos
        case 7:
            return `<div class="anim-lab anim-lab--8">
                <div class="cine-clapper"><div class="clapper-top"></div><div class="clapper-body">🎬</div><div class="spot-cone"></div></div>
            </div>`;
        // 9. GenAI: Creación de mundos (im)posibles :D
        case 8:
            return `<div class="anim-lab anim-lab--9">
                <div class="floating-realm"><div class="world-orb"></div><div class="portal-ring"></div><span class="star-float">✦</span></div>
            </div>`;
        // 10. GenAI: ¡Laboratorio de inventos!
        case 9:
            return `<div class="anim-lab anim-lab--10">
                <div class="invent-bulb"><span class="bulb-icon">💡</span><span class="gear-cog gear-1">⚙️</span><span class="gear-cog gear-2">⚙️</span></div>
            </div>`;
        // 11. GenAI: Hackeá al chatbot
        case 10:
        case 11:
            return `<div class="anim-lab anim-lab--11">
                <div class="bot-hack"><span class="hack-bot-face">🤖</span><span class="hack-lock">🔓</span><div class="matrix-lines">10110</div></div>
            </div>`;
        // 12. GenAI: Duelo musical
        case 12:
            return `<div class="anim-lab anim-lab--12">
                <div class="music-duel"><span class="duel-dj">🎧</span><span class="duel-vs">VS</span><span class="duel-amp">🎸</span></div>
            </div>`;
        // 13. GenAI: Hackathon IA: El Prompt Oculto
        case 12:
            return `<div class="anim-lab anim-lab--13">
                <div class="prompt-terminal"><div class="terminal-header"><i></i><i></i></div><div class="terminal-text">> prompt: secret<span class="caret"></span></div><span class="trophy-badge">🏆</span></div>
            </div>`;
        // 14. GenAI: La IA como narradora de un juego de rol
        case 13:
            return `<div class="anim-lab anim-lab--14">
                <div class="rpg-dice"><div class="d20">20</div><span class="magic-spark">✨</span><span class="wizard-icon">🧙</span></div>
            </div>`;
        // 15. Modelado 3D: Texturizado de objetos
        case 14:
            return `<div class="anim-lab anim-lab--15">
                <div class="poly-cube"><div class="cube-face front"></div><div class="cube-face top"></div><div class="cube-face right"></div></div>
            </div>`;
        // 16. Videojuegos: Pelea de Verano
        case 15:
            return `<div class="anim-lab anim-lab--16">
                <div class="water-fight"><span class="water-soaker">🔫</span><div class="water-splash">💦</div><span class="water-balloon">🎈</span></div>
            </div>`;
        // 17. Videojuegos: Crea tu propio juego de mesa
        case 16:
            return `<div class="anim-lab anim-lab--17">
                <div class="board-game"><div class="board-grid"><i></i><i></i><i></i></div><span class="pawn">♟️</span><span class="dice">🎲</span></div>
            </div>`;
        // 18. Programación: Armá tu CV web
        case 17:
            return `<div class="anim-lab anim-lab--18">
                <div class="cv-card"><div class="cv-photo"></div><div class="cv-line line-1"></div><div class="cv-line line-2"></div><span class="cv-badge">&lt;/&gt;</span></div>
            </div>`;
        // 19. Programación: Adivinanza de palabras
        case 18:
            return `<div class="anim-lab anim-lab--19">
                <div class="wordle-row"><span class="letter-box l-1">T</span><span class="letter-box l-2">U</span><span class="letter-box l-3">M</span><span class="letter-box l-4">O</span></div>
            </div>`;
        // 20. Dibujo: Diseño de tatto
        case 19:
            return `<div class="anim-lab anim-lab--20">
                <div class="tattoo-scene"><span class="tattoo-heart">❤️</span><span class="tattoo-needle">💉</span><span class="tattoo-banner">TUMO</span></div>
            </div>`;
        // 21. Dibujo: Manual de Bolsillo: Tu propio tutorial ilustrado
        case 20:
            return `<div class="anim-lab anim-lab--21">
                <div class="pocket-zine"><div class="zine-cover">📖</div><div class="zine-page">✏️</div></div>
            </div>`;
        // 22. Dibujo: Diseña tu propia plancha de stickers ilustrados
        case 21:
            return `<div class="anim-lab anim-lab--22">
                <div class="stickers-sheet"><span class="sticker s1">⭐</span><span class="sticker s2">🍕</span><span class="sticker s3">🐱</span><span class="sticker s4">⚡</span></div>
            </div>`;
        // 23. Dibujo: Rediseño de Cover: Tu Disco, libro o Videojuego
        case 22:
            return `<div class="anim-lab anim-lab--23">
                <div class="cover-case"><div class="disc-slide">💿</div><div class="cover-art-box">🎮</div></div>
            </div>`;
        // 24. Dibujo: Diseño de packaching: Tu propio snack Box Asiático
        case 23:
            return `<div class="anim-lab anim-lab--24">
                <div class="snack-box"><div class="snack-box-body"><span class="snack-face">🍱</span></div><span class="snack-chopstick">🥢</span></div>
            </div>`;
        // 25. Dibujo: La Camiseta de Tu Vida
        case 24:
            return `<div class="anim-lab anim-lab--25">
                <div class="soccer-jersey"><div class="jersey-neck"></div><span class="jersey-stars">★★★</span><span class="jersey-number">10</span></div>
            </div>`;
        // 26. Dibujo: Taller de lettering
        case 25:
            return `<div class="anim-lab anim-lab--26">
                <div class="lettering-draw"><svg viewBox="0 0 100 50"><path class="letter-stroke" d="M15 40 Q 30 10, 50 25 T 85 20" /></svg><span class="pen-marker">🖌️</span></div>
            </div>`;
        // 27. Dibujo: diseño de portada de libro
        case 26:
            return `<div class="anim-lab anim-lab--27">
                <div class="book-cover-3d"><div class="book-front-cover">📘</div><div class="book-magic">✨</div></div>
            </div>`;
        // 28. Dibujo: Laboratorio de historieta
        case 27:
            return `<div class="anim-lab anim-lab--28">
                <div class="comic-strip"><div class="panel p1"></div><div class="panel p2"><span class="pow-tag">POW!</span></div></div>
            </div>`;
        // 29. Dibujo: Movimiento infinito: laboratorio de GIF animado
        case 28:
            return `<div class="anim-lab anim-lab--29">
                <div class="gif-rotator"><span class="runner-char">🏃</span><div class="spin-arrows">🔄</div></div>
            </div>`;
        // 30. Dibujo: Dibujo de figura humana
        case 29:
            return `<div class="anim-lab anim-lab--30">
                <div class="mannequin-art"><div class="m-head"></div><div class="m-torso"></div><div class="m-limbs"></div><div class="m-guide"></div></div>
            </div>`;
        // 31. GenAI + Programación: Entrenar un modelo de IA para jugar juegos
        case 30:
            return `<div class="anim-lab anim-lab--31">
                <div class="teachable-box"><div class="track-hand">🖐️</div><div class="pong-net"></div><div class="pong-ball"></div></div>
            </div>`;
        // 32. Modelado 3D + Videojuegos: Museo interactivo
        case 31:
            return `<div class="anim-lab anim-lab--32">
                <div class="museum-gallery"><div class="museum-light"></div><div class="museum-pedestal"></div><span class="museum-statue">🗿</span></div>
            </div>`;
        // 33. Música + Cine: Sonorización de un cortometraje animado
        case 32:
            return `<div class="anim-lab anim-lab--33">
                <div class="foley-studio"><div class="foley-screen">🎬</div><div class="foley-mic">🎙️</div><div class="sound-ripples"></div></div>
            </div>`;
        default:
            return `<div class="anim-lab anim-lab--1"><div class="phone-cam"><span class="cam-flash-beam"></span></div></div>`;
    }
}

// Cargar conteos remotos si Google Apps Script está configurado
async function fetchRemoteCounts() {
    if (!GOOGLE_SCRIPT_URL) return null;
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, { method: "GET" });
        const data = await res.json();
        if (data.status === "ok" && data.counts) {
            return data.counts;
        }
    } catch {
        // En caso de error o sin conexión, se opera con conteos locales
    }
    return null;
}

// Renderizar filtros de disciplinas
function renderFilters() {
    const wrap = $("[data-filters]");
    if (!wrap) return;

    const discs = [...new Set(allLabs.map(l => l.disciplina))];
    const totalCount = allLabs.length;

    let html = `
        <button type="button" class="filter-btn ${activeFilter === 'todas' ? 'is-active' : ''}" data-filter="todas">
            Todas (${totalCount})
        </button>
    `;

    discs.forEach(disc => {
        const meta = DISCIPLINAS[disc] || {};
        const count = allLabs.filter(l => l.disciplina === disc).length;
        const iconImg = meta.icon ? `<img class="filter-btn__icon" src="${escapeHtml(meta.icon)}" alt="" aria-hidden="true">` : "";
        html += `
            <button type="button" class="filter-btn ${activeFilter === disc ? 'is-active' : ''}" data-filter="${escapeHtml(disc)}">
                ${iconImg}
                ${escapeHtml(meta.label || disc)} (${count})
            </button>
        `;
    });

    wrap.innerHTML = html;

    $$(".filter-btn", wrap).forEach(btn => {
        btn.addEventListener("click", () => {
            activeFilter = btn.dataset.filter;
            $$(".filter-btn", wrap).forEach(b => b.classList.toggle("is-active", b === btn));
            renderCards();
        });
    });
}

// Renderizar tarjetas de la cartelera
function renderCards() {
    const wrap = $("[data-lab-cards]");
    if (!wrap) return;

    wrap.removeAttribute("aria-busy");

    const filtered = activeFilter === "todas"
        ? allLabs
        : allLabs.filter(l => l.disciplina === activeFilter);

    if (!filtered.length) {
        wrap.innerHTML = '<p class="cartelera-msg">No hay talleres disponibles en esta disciplina por el momento.</p>';
        return;
    }

    wrap.innerHTML = filtered.map(lab => {
        const disponible = isLabAvailable(lab, remoteCounts);
        const maxCupos = lab.maxParticipantes;
        const meta = lab.disciplinaMeta;

        // Badge de estado en la esquina superior derecha del área de medios
        const statusBadge = disponible
            ? `<span class="card__status-pill">● Disponible</span>`
            : `<span class="card__status-pill state--no-disponible">● No disponible</span>`;

        // Botón blanco full-width inferior
        const signupBtn = disponible
            ? `<a href="inscripcion.html?id=${encodeURIComponent(lab.id)}" class="btn card__btn">Inscribite</a>`
            : `<button type="button" class="btn card__btn is-disabled" disabled aria-disabled="true">No disponible (Cupo lleno)</button>`;

        // Animación individual única (1 de 33)
        const artHtml = getWorkshopAnimation(lab.index);
        const iconHtml = meta.icon ? `<img src="${escapeHtml(meta.icon)}" alt="" aria-hidden="true">` : "";

        // Píldoras de horarios
        const timesHtml = lab.horarios.map(h => `
            <span class="card__time-pill">${CLOCK_ICON} ${escapeHtml(h)}</span>
        `).join("");

        return `
            <article class="card card--${escapeHtml(meta.slug)} ${disponible ? '' : 'is-closed'}" data-lab-id="${escapeHtml(lab.id)}">
                <!-- Área de ilustración visual con estado en esquina superior derecha -->
                <div class="card__media">
                    <div class="card__status-wrap">${statusBadge}</div>
                    ${artHtml}
                </div>

                <!-- Tag de disciplina ubicado debajo del área visual (sin superposición) -->
                <div class="card__discipline-badge">
                    ${iconHtml}
                    <span>${escapeHtml(meta.label || lab.disciplina)}</span>
                </div>
                
                <h3 class="card__title">
                    <button class="card__open" data-open-lab="${escapeHtml(lab.id)}" aria-haspopup="dialog">${escapeHtml(lab.titulo)}</button>
                </h3>
                
                <!-- Horarios en píldoras blancas -->
                <div class="card__times">
                    ${timesHtml}
                </div>

                <!-- Días de cursada en fichas cuadradas de calendario -->
                <div class="card__days">
                    <span class="card__day"><small>JUE</small><b>10</b></span>
                    <span class="card__day"><small>VIE</small><b>11</b></span>
                    <span class="card__day"><small>MAR</small><b>15</b></span>
                    <span class="card__day"><small>JUE</small><b>17</b></span>
                </div>

                ${signupBtn}
            </article>
        `;
    }).join("");

    // Eventos de clic en tarjeta para abrir modal de detalle
    $$(".card", wrap).forEach(card => {
        const id = card.dataset.labId;
        card.addEventListener("click", (e) => {
            if (!e.target.closest(".card__btn")) {
                openPanel(id);
            }
        });
    });
}

// Modal de detalle del taller
function openPanel(id) {
    const lab = allLabs.find(l => l.id === id);
    if (!lab) return;

    const panel = $("[data-lab-panel]");
    if (!panel) return;

    const currentInscriptos = getInscriptosTotalCount(lab.titulo, remoteCounts);
    const maxCupos = lab.maxParticipantes;
    const disponible = isLabAvailable(lab, remoteCounts);
    const libres = Math.max(0, maxCupos - currentInscriptos);
    const meta = lab.disciplinaMeta;

    $("[data-lab-media]").innerHTML = getWorkshopAnimation(lab.index);
    $("[data-lab-kicker]").textContent = `${lab.disciplina} · ${lab.horas}`;
    $("[data-lab-title]").textContent = lab.titulo;
    
    $("[data-lab-state]").innerHTML = disponible
        ? `<span class="state state--disponible">Disponible · ${libres} vacantes libres</span>`
        : `<span class="state state--no-disponible">No disponible · Cupo máximo alcanzado</span>`;

    $("[data-lab-intro]").textContent = lab.descripcion;
    $("[data-lab-sched]").innerHTML = lab.horarios.map(h => `<p><strong>${escapeHtml(h)}</strong></p>`).join("");
    $("[data-lab-capacidad]").textContent = `Mínimo: ${lab.minParticipantes} | Máximo: ${lab.maxParticipantes} participantes`;
    
    $("[data-lab-requisito]").innerHTML = lab.tieneRequisito
        ? `<p style="color: #b26a00; font-weight: 700;">⚠️ ${escapeHtml(lab.requisitos)}</p>`
        : `<p style="color: var(--green-dark); font-weight: 700;">✓ No requiere conocimientos previos</p>`;

    // Show dias if available
    if (lab.dias) {
        const diasEl = $("[data-lab-dias]");
        if (diasEl) diasEl.textContent = lab.dias;
    }

    const cta = $("[data-lab-signup]");
    if (cta) {
        if (disponible) {
            cta.href = `inscripcion.html?id=${encodeURIComponent(lab.id)}`;
            cta.textContent = "Inscribite";
            cta.classList.remove("is-disabled");
            cta.removeAttribute("disabled");
        } else {
            cta.removeAttribute("href");
            cta.textContent = "No disponible (Cupo lleno)";
            cta.classList.add("is-disabled");
        }
    }

    panel.showModal();
}

function initPanel() {
    const panel = $("[data-lab-panel]");
    if (!panel) return;
    const closeBtn = $("[data-lab-close]");
    if (closeBtn) closeBtn.addEventListener("click", () => panel.close());
    panel.addEventListener("click", (e) => {
        if (e.target === panel) panel.close();
    });
}

// Consulta de estado de inscripción en la sección FAQ
function initStatusChecker() {
    const form = $("[data-status-form]");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = $("#status-dni");
        const out = $("[data-status-result]");
        const dni = cleanDoc(input.value);

        if (!dni) {
            out.textContent = "Por favor, ingresá un DNI válido.";
            out.className = "status__result is-warn";
            return;
        }

        out.textContent = "Buscando solicitud en TUMO Chacarita…";
        out.className = "status__result";

        // Búsqueda en almacenamiento local
        const localList = getLocalInscripciones();
        const found = localList.filter(item => cleanDoc(item.dni) === dni);

        if (found.length) {
            const lines = [
                `¡Hola ${found[0].nombre}!`,
                `Encontramos tu solicitud registrada para el taller: ${found[0].taller}.`,
                `Horario elegido: ${found[0].horario}.`,
                `Correo TUMO registrado: ${found[0].correo}.`,
                "Tu vacante está en proceso de asignación. Te contactaremos por mail antes del inicio."
            ];
            out.textContent = lines.join("\n");
            out.className = "status__result is-ok";
        } else {
            out.textContent = "No encontramos solicitudes registradas con ese DNI en este dispositivo. Si recién enviaste tu formulario a través de Google Sheets, la confirmación oficial te llegará directamente a tu correo de TUMO.";
            out.className = "status__result is-warn";
        }
    });
}

// Obtener datos de talleres de forma compatible con file:// y http/https
async function getRawLabs() {
    if (window.RAW_DATA_DE_LABS && Array.isArray(window.RAW_DATA_DE_LABS) && window.RAW_DATA_DE_LABS.length > 0) {
        return window.RAW_DATA_DE_LABS;
    }
    try {
        const res = await fetch("data_de_labs.json");
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn("fetch('data_de_labs.json') falló (habitual en protocolo file://):", e);
    }
    return [];
}

// Carga principal de datos
async function initCartelera() {
    initPanel();
    initStatusChecker();

    try {
        const [rawData, counts] = await Promise.all([
            getRawLabs(),
            fetchRemoteCounts()
        ]);

        if (!rawData || !rawData.length) {
            throw new Error("No se encontraron talleres en RAW_DATA_DE_LABS ni mediante fetch");
        }

        remoteCounts = counts;
        allLabs = processRawLabs(rawData);

        // Guardar en variable global para que otros scripts puedan referenciar talleres
        window.TUMO_LABS = allLabs;

        // Actualizar dinámicamente la cantidad en el hero preview
        const previewTitle = $(".hero__preview-title");
        if (previewTitle) {
            previewTitle.textContent = `${allLabs.length} Propuestas Creativas`;
        }

        renderFilters();
        renderCards();

    } catch (err) {
        console.error(err);
        const wrap = $("[data-lab-cards]");
        if (wrap) {
            wrap.innerHTML = `
                <div class="cartelera-msg">
                    <p>No pudimos cargar la lista de talleres. Por favor, actualizá la página.</p>
                </div>
            `;
        }
    }
}

document.addEventListener("DOMContentLoaded", initCartelera);
