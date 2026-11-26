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
let countsPending = Boolean(GOOGLE_SCRIPT_URL);
let openPanelId = null;

// Animation number (1-33, matches .anim-lab--N in style.css) for each lab id
const ANIM_BY_LAB = {
    "tu-celular-tu-camara-profesional": 1,
    "macrofotografia": 2,
    "lightpainting": 3,
    "sintesis-y-diseno-sonoro": 4,
    "samples": 5,
    "del-meme-al-hit": 6,
    "edicion-de-trailers": 7,
    "desarrollo-de-proyectos": 8,
    "creacion-de-mundos-im-posibles": 9,
    "laboratorio-de-inventos": 10,
    "hackea-al-chatbot": 11,
    "hackathon-ia": 13,
    "texturizado-de-objetos": 15,
    "pelea-de-verano": 16,
    "crea-tu-propio-juego-de-mesa": 17,
    "arma-tu-cv-web": 18,
    "adivinanza-de-palabras": 19,
    "ilustradores-de-portadas": 27,
    "taller-de-lettering": 26,
    "laboratorio-de-historieta": 28,
    "movimiento-infinito": 29,
    "museo-interactivo": 32
};

function getLabAnimation(lab) {
    return getWorkshopAnimation((ANIM_BY_LAB[lab.id] || 1) - 1);
}

// ==========================================================
// 33 Animaciones Flat-Design (índice 0-32)
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
            return `<div class="anim-lab anim-lab--11">
                <div class="bot-hack"><span class="hack-bot-face">🤖</span><span class="hack-lock">🔓</span><div class="matrix-lines">10110</div></div>
            </div>`;
        // 12. GenAI: Duelo musical
        case 11:
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
        // 28. Dibujo: Taller de historieta
        case 27:
            return `<div class="anim-lab anim-lab--28">
                <div class="comic-strip"><div class="panel p1"></div><div class="panel p2"><span class="pow-tag">POW!</span></div></div>
            </div>`;
        // 29. Dibujo: Acercamiento a la animación: taller de loop animado
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

// selectable=false: links straight to the form. selectable=true: radio buttons for the detail panel.
function comisionButtonsHtml(lab, { showVacantes = false, selectable = false, selectedId = null } = {}) {
    return lab.comisiones.map((c, i) => {
        const vacantes = getComisionVacantes(c, remoteCounts);
        const full = !countsPending && vacantes === 0;
        let note = "";
        if (full) note = "Cupo lleno";
        else if (showVacantes && !countsPending) note = `${vacantes} ${vacantes === 1 ? "vacante" : "vacantes"}`;
        const inner = `
            <span class="card__com-num">${i + 1}</span>
            <span class="card__com-text">
                ${comisionDaysHtml(c)}
                ${comisionTimeHtml(c, note)}
            </span>`;
        if (selectable) {
            const checked = !full && c.id === selectedId;
            return `<button type="button" role="radio" class="card__com card__com--${i % 4}${full ? " is-full" : ""}"
                data-comision="${escapeHtml(c.id)}" aria-checked="${checked}" ${full ? "disabled" : ""}
                aria-label="Comisión ${i + 1}: ${escapeHtml(c.label)}${full ? ", cupo lleno" : ""}">${inner}</button>`;
        }
        return full
            ? `<span class="card__com card__com--${i % 4} is-full" aria-disabled="true">${inner}</span>`
            : `<a class="card__com card__com--${i % 4}" href="inscripcion.html?id=${encodeURIComponent(lab.id)}&comision=${encodeURIComponent(c.id)}" aria-label="Inscribirme en la comisión ${i + 1}: ${escapeHtml(c.label)}">${inner}</a>`;
    }).join("");
}

function statusPillHtml(lab) {
    if (countsPending) return `<span class="card__status-pill state--pending">● Consultando cupos</span>`;
    return isLabAvailable(lab, remoteCounts)
        ? `<span class="card__status-pill">● Disponible</span>`
        : `<span class="card__status-pill state--no-disponible">● No disponible</span>`;
}

function disciplineBadgeHtml(lab) {
    const meta = lab.disciplinaMeta;
    const iconHtml = meta.icon ? `<img src="${escapeHtml(meta.icon)}" alt="" aria-hidden="true">` : "";
    return `${iconHtml}<span>${escapeHtml(meta.label || lab.disciplina)}</span>`;
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
        const meta = lab.disciplinaMeta;

        // The form re-checks availability, so the link stays enabled while counts load
        const signupBtn = (countsPending || disponible)
            ? `<button type="button" class="btn card__btn" aria-haspopup="dialog">Inscribite</button>`
            : `<button type="button" class="btn card__btn is-disabled" disabled aria-disabled="true">No disponible (Cupo lleno)</button>`;

        const classes = ["card", `card--${meta.slug}`];
        if (!countsPending && !disponible) classes.push("is-closed");
        if (lab.id === openPanelId) classes.push("is-origin");

        return `
            <article class="${escapeHtml(classes.join(" "))}" data-lab-id="${escapeHtml(lab.id)}">
                <div class="card__media">
                    <div class="card__status-wrap">${statusPillHtml(lab)}</div>
                    ${getLabAnimation(lab)}
                </div>

                <div class="card__discipline-badge">${disciplineBadgeHtml(lab)}</div>

                <h3 class="card__title">
                    <button class="card__open" data-open-lab="${escapeHtml(lab.id)}" aria-haspopup="dialog">${escapeHtml(lab.titulo)}</button>
                </h3>

                <div class="card__coms">
                    ${comisionButtonsHtml(lab)}
                </div>

                ${signupBtn}
            </article>
        `;
    }).join("");

    $$(".card", wrap).forEach(card => {
        const id = card.dataset.labId;
        card.addEventListener("click", (e) => {
            if (e.target.closest(".card__com, .card__btn:disabled")) return;
            openPanel(id);
        });
    });
}

// ---------- Lab detail: the clicked card expands into a dialog ----------
let panelScrollY = 0;
let panelComisionId = null;
let panelClosing = false;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function findCard(id) {
    return id ? $(`.card[data-lab-id="${CSS.escape(id)}"]`) : null;
}

// Transform that maps the panel's box onto the card's box.
function cardTransform(panel, card) {
    const from = card.getBoundingClientRect();
    const to = panel.getBoundingClientRect();
    if (!from.width || !to.width) return null;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    return `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`;
}

function animatePanel(panel, card, direction) {
    const start = card && !reducedMotion() ? cardTransform(panel, card) : null;
    if (!start) return Promise.resolve();

    const opening = direction === "open";
    const timing = { duration: opening ? 420 : 320, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" };
    const box = [
        { transform: start, transformOrigin: "top left" },
        { transform: "none", transformOrigin: "top left" }
    ];
    const content = [{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }];
    const backdrop = [{ opacity: 0 }, { opacity: 1 }];

    const animations = [panel.animate(opening ? box : [...box].reverse(), timing)];
    $$(":scope > *", panel).forEach(el => {
        animations.push(el.animate(opening ? content : [...content].reverse(), timing));
    });
    try {
        animations.push(panel.animate(opening ? backdrop : [...backdrop].reverse(), { ...timing, pseudoElement: "::backdrop" }));
    } catch {
        // ::backdrop animation is not supported everywhere; the box animation still runs.
    }
    // Background tabs may never advance animation frames, so cap the wait.
    const done = Promise.all(animations.map(a => a.finished.catch(() => {})));
    const cap = new Promise(resolve => setTimeout(resolve, timing.duration + 150));
    return Promise.race([done, cap]).then(() => animations);
}

function fillPanel(lab) {
    const panel = $("[data-lab-panel]");
    const disponible = isLabAvailable(lab, remoteCounts);

    panel.className = `lab-panel card--${lab.disciplinaMeta.slug}${!countsPending && !disponible ? " is-closed" : ""}`;
    $("[data-lab-status]").innerHTML = statusPillHtml(lab);
    $("[data-lab-media]").innerHTML = getLabAnimation(lab);
    $("[data-lab-badge]").innerHTML = disciplineBadgeHtml(lab);
    $("[data-lab-title]").textContent = lab.titulo;
    $("[data-lab-kicker]").textContent = lab.horas;
    $("[data-lab-intro]").textContent = lab.descripcion;
    const available = lab.comisiones.filter(c => countsPending || isComisionAvailable(c, remoteCounts));
    if (!available.some(c => c.id === panelComisionId)) panelComisionId = null;
    if (!panelComisionId && lab.comisiones.length === 1 && available.length === 1) panelComisionId = available[0].id;
    $("[data-lab-sched]").innerHTML = comisionButtonsHtml(lab, { showVacantes: true, selectable: true, selectedId: panelComisionId });
    $("[data-lab-req]").classList.toggle("is-required", lab.tieneRequisito);
    $("[data-lab-req-icon]").textContent = lab.tieneRequisito ? "!" : "✓";
    $("[data-lab-requisito]").textContent = lab.tieneRequisito
        ? lab.requisitos
        : "No requiere conocimientos previos";

    updatePanelSignup(lab);
}

function updatePanelSignup(lab) {
    const cta = $("[data-lab-signup]");
    const disponible = countsPending || isLabAvailable(lab, remoteCounts);
    let text = "Inscribite";
    if (!disponible) text = "No disponible (Cupo lleno)";
    else if (!panelComisionId) text = "Elegí una comisión para inscribirte";

    if (disponible && panelComisionId) {
        cta.href = `inscripcion.html?id=${encodeURIComponent(lab.id)}&comision=${encodeURIComponent(panelComisionId)}`;
        cta.classList.remove("is-disabled");
        cta.removeAttribute("aria-disabled");
    } else {
        cta.removeAttribute("href");
        cta.classList.add("is-disabled");
        cta.setAttribute("aria-disabled", "true");
    }
    cta.textContent = text;
}

const FIT_LEVELS = ["fit-1", "fit-2", "fit-3", "fit-4", "fit-5", "fit-6"];

// Adds compact levels one by one until the open panel fits the viewport without scrolling.
function fitPanel(panel) {
    panel.classList.remove(...FIT_LEVELS, "is-overflowing");
    const fits = () => panel.scrollHeight <= panel.clientHeight + 1;
    for (const level of FIT_LEVELS) {
        if (fits()) return;
        panel.classList.add(level);
    }
    if (!fits()) panel.classList.add("is-overflowing");
}

// Modal de detalle del taller
function openPanel(id) {
    const lab = allLabs.find(l => l.id === id);
    const panel = $("[data-lab-panel]");
    if (!lab || !panel) return;

    if (!panel.open && openPanelId !== id) panelComisionId = null;
    fillPanel(lab);
    if (panel.open) {
        fitPanel(panel);
        return;
    }

    openPanelId = id;
    panelScrollY = window.scrollY;
    const card = findCard(id);
    panel.showModal();
    fitPanel(panel);
    animatePanel(panel, card, "open").then(anims => (anims || []).forEach(a => a.cancel()));
    if (card) card.classList.add("is-origin");
}

async function closePanel() {
    const panel = $("[data-lab-panel]");
    if (!panel || !panel.open || panelClosing) return;
    panelClosing = true;
    const card = findCard(openPanelId);
    await animatePanel(panel, card, "close");
    panel.close();
}

function initPanel() {
    const panel = $("[data-lab-panel]");
    if (!panel) return;
    const closeBtn = $("[data-lab-close]", panel);
    if (closeBtn) closeBtn.addEventListener("click", closePanel);
    window.addEventListener("resize", () => {
        if (panel.open) fitPanel(panel);
    });
    $("[data-lab-sched]", panel).addEventListener("click", (e) => {
        const btn = e.target.closest(".card__com[role=radio]");
        if (!btn || btn.disabled) return;
        panelComisionId = btn.dataset.comision;
        $$(".card__com[role=radio]", panel).forEach(b => b.setAttribute("aria-checked", String(b === btn)));
        const lab = allLabs.find(l => l.id === openPanelId);
        if (lab) updatePanelSignup(lab);
    });
    panel.addEventListener("cancel", (e) => {
        e.preventDefault();
        closePanel();
    });
    panel.addEventListener("click", (e) => {
        if (e.target !== panel) return;
        const r = panel.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) closePanel();
    });
    panel.addEventListener("close", () => {
        $$(".card.is-origin").forEach(c => c.classList.remove("is-origin"));
        panel.getAnimations({ subtree: true }).forEach(a => a.cancel());
        openPanelId = null;
        panelClosing = false;
        if (window.scrollY !== panelScrollY) window.scrollTo({ top: panelScrollY, behavior: "instant" });
    });
}

// Consulta de estado de inscripción en la sección FAQ
async function fetchInscripciones(dni, correo) {
    if (!GOOGLE_SCRIPT_URL) {
        return getLocalInscripciones().filter(item =>
            cleanDoc(item.dni) === dni && String(item.correo || "").toLowerCase() === correo);
    }
    const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ accion: "consulta", dni, correo })
    });
    const data = await res.json();
    if (data.status !== "ok") throw new Error(data.message || "consulta failed");
    return data.inscripciones;
}

function initStatusChecker() {
    const form = $("[data-status-form]");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const out = $("[data-status-result]");
        const dni = cleanDoc($("#status-dni").value);
        const correo = $("#status-correo").value.trim().toLowerCase();

        if (!dni || !correo) {
            out.textContent = "Ingresá tu DNI y tu correo de TUMO.";
            out.className = "status__result is-warn";
            return;
        }

        out.textContent = "Buscando tus inscripciones…";
        out.className = "status__result";

        try {
            const found = await fetchInscripciones(dni, correo);
            if (found.length) {
                const lines = found.map(i => `• ${i.taller}: ${i.dias} · ${i.horario}`);
                out.textContent = ["Encontramos estas inscripciones:", ...lines,
                    "Te enviaremos la confirmación por correo antes del inicio."].join("\n");
                out.className = "status__result is-ok";
            } else {
                out.textContent = "No encontramos inscripciones con ese DNI y correo. Revisá que sean los mismos que usaste al inscribirte.";
                out.className = "status__result is-warn";
            }
        } catch (err) {
            console.error(err);
            out.textContent = "No pudimos consultar tus inscripciones. Intentá de nuevo en unos minutos.";
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
// index.html#lab=<id> opens that lab's detail (the form links here to change comision).
function openPanelFromHash() {
    const match = location.hash.match(/^#lab=(.+)$/);
    if (!match) return;
    const id = decodeURIComponent(match[1]);
    history.replaceState(null, "", location.pathname + location.search + "#actividades");
    const card = findCard(id);
    if (card) card.scrollIntoView({ block: "center", behavior: "instant" });
    openPanel(id);
}

async function initCartelera() {
    initPanel();
    initStatusChecker();

    const countsRequest = fetchRemoteCounts();

    try {
        const rawData = await getRawLabs();

        if (!rawData || !rawData.length) {
            throw new Error("No se encontraron talleres en RAW_DATA_DE_LABS ni mediante fetch");
        }

        allLabs = processRawLabs(rawData);
        window.TUMO_LABS = allLabs;

        const previewTitle = $(".hero__preview-title");
        if (previewTitle) {
            previewTitle.textContent = `${allLabs.length} Propuestas Creativas`;
        }

        renderFilters();
        renderCards();
        openPanelFromHash();

        remoteCounts = await countsRequest;
        countsPending = false;
        renderCards();
        if (openPanelId) openPanel(openPanelId);

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
