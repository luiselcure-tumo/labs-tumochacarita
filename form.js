// ==========================================================
// TUMO Chacarita Learning Labs — Formulario de Inscripción
// Valida DNI, Correo de TUMO, confirmación de horario y cupos máximos
// Envío a Google Apps Script y persistencia local
// ==========================================================

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

const form = $("[data-signup]");
let selectedLab = null;
let selectedHorario = null;
let remoteCounts = null;

function showView(viewName) {
    $$("[data-view]").forEach(el => {
        el.hidden = el.dataset.view !== viewName;
    });
}

function showErrorMessage(msg) {
    $("[data-message]").textContent = msg;
    showView("message");
}

// Cargar conteos remotos si Google Apps Script está activo
async function fetchRemoteCounts() {
    if (!GOOGLE_SCRIPT_URL) return null;
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, { method: "GET" });
        const data = await res.json();
        if (data.status === "ok" && data.counts) return data.counts;
    } catch {}
    return null;
}

// Obtener datos de talleres compatible con file:// y http/https
async function getRawLabs() {
    if (window.RAW_DATA_DE_LABS && Array.isArray(window.RAW_DATA_DE_LABS) && window.RAW_DATA_DE_LABS.length > 0) {
        return window.RAW_DATA_DE_LABS;
    }
    try {
        const res = await fetch("data_de_labs.json");
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn("fetch falló o protocolo file:// activo:", e);
    }
    return [];
}

// Inicialización de la página
async function initForm() {
    showView("loading");

    const params = new URLSearchParams(location.search);
    const labId = params.get("id") || params.get("actividad");

    if (!labId) {
        return showErrorMessage("Para solicitar una vacante, primero debés elegir un taller en la cartelera.");
    }

    try {
        const [rawData, counts] = await Promise.all([
            getRawLabs(),
            fetchRemoteCounts()
        ]);

        if (!rawData || !rawData.length) {
            throw new Error("No se pudo cargar la información de los talleres.");
        }

        const labs = processRawLabs(rawData);
        remoteCounts = counts;

        selectedLab = labs.find(l => l.id === labId || slugify(l.titulo) === slugify(labId));

        if (!selectedLab) {
            return showErrorMessage("El taller seleccionado no existe o no está disponible en la cartelera.");
        }

        fillChosenDetails();
        openConfirmPopCard();

    } catch (err) {
        console.error(err);
        showErrorMessage("Ocurrió un error al cargar el taller. Por favor, volvé a la cartelera e intentalo nuevamente.");
    }
}

// Rellenar datos del taller en el formulario
function fillChosenDetails() {
    const lab = selectedLab;
    const maxCupos = Number(lab.maxParticipantes) || 18;

    document.title = `${lab.titulo} · Solicitar vacante · TUMO Chacarita`;
    $("[data-chosen-name]").textContent = lab.titulo;
    $("[data-chosen-disciplina]").textContent = lab.disciplina;
    $("[data-chosen-duracion]").textContent = `Duración: ${lab.horas}`;

    $("[data-chosen-requisito]").textContent = lab.tieneRequisito
        ? `⚠️ ${lab.requisitos}`
        : "✓ Sin requisitos previos";

    // Horario por defecto
    selectedHorario = lab.horarios[0];
    updateFormAvailability();
    updateHorarioDisplay();
}

// Actualiza la disponibilidad en la vista del formulario según el horario seleccionado
function updateFormAvailability() {
    const lab = selectedLab;
    const maxCupos = Number(lab.maxParticipantes) || 18;
    const currentInscriptos = getInscriptosCount(lab.titulo, selectedHorario, remoteCounts);
    const libres = Math.max(0, maxCupos - currentInscriptos);
    const disponible = currentInscriptos < maxCupos;

    // Console.log con la info del horario seleccionado
    console.log(`%c[TUMO Chacarita] Taller: "${lab.titulo}" | Horario: "${selectedHorario}"`, "color: #5EB656; font-weight: bold; font-size: 13px;");
    console.log(`%c→ Inscriptos en este horario: ${currentInscriptos} | Cupo máximo: ${maxCupos} | Vacantes disponibles: ${libres}`, "color: #111; font-weight: bold;");

    $("[data-chosen-cupos]").textContent = disponible ? `Vacantes: ${libres} de ${maxCupos}` : "Cupo completo";

    // Si el horario está lleno, mostrar advertencia y deshabilitar envío
    const fullAlert = $("[data-chosen-full]");
    if (fullAlert) {
        if (disponible) {
            fullAlert.hidden = true;
            fullAlert.style.setProperty("display", "none", "important");
        } else {
            fullAlert.hidden = false;
            fullAlert.style.setProperty("display", "flex", "important");
        }
    }

    if (!disponible) {
        $("[data-submit]").disabled = true;
        $("[data-submit]").textContent = "No disponible (Cupo lleno)";
    } else {
        $("[data-submit]").disabled = false;
        $("[data-submit]").textContent = "Enviar solicitud";
    }
}

function updateHorarioDisplay() {
    $("[data-chosen-horario]").textContent = selectedHorario || "A coordinar";
    $("[data-confirm-text]").textContent = `Confirmo que quiero solicitar una vacante en ${selectedLab.titulo} en el horario de ${selectedHorario}.`;
}

// Pop Card de Confirmación previa de horario
function openConfirmPopCard() {
    const dialog = $("[data-confirm]");
    if (!dialog) {
        showView("form");
        return;
    }

    const lab = selectedLab;
    const maxCupos = Number(lab.maxParticipantes) || 18;

    $("[data-confirm-name]").textContent = lab.titulo;

    const timesWrap = $("[data-confirm-times]");
    timesWrap.innerHTML = lab.horarios.map((h, i) => {
        const inscriptos = getInscriptosCount(lab.titulo, h, remoteCounts);
        const libres = Math.max(0, maxCupos - inscriptos);
        const horarioDisponible = inscriptos < maxCupos;
        return `
        <button type="button" class="time-opt ${horarioDisponible ? '' : 'is-full'}" role="radio"
            data-horario="${escapeHtml(h)}" aria-checked="${i === 0 ? 'true' : 'false'}"
            ${horarioDisponible ? '' : 'disabled'}>
            ${CLOCK_ICON}
            <span>${escapeHtml(h)}</span>
            <span class="time-opt__spots">${horarioDisponible ? libres + ' vacantes' : 'Cupo lleno'}</span>
        </button>
    `;
    }).join("");

    // Seleccionar el primer horario disponible por defecto
    const firstAvailable = lab.horarios.find(h => isHorarioAvailable(lab, h, remoteCounts));
    selectedHorario = firstAvailable || lab.horarios[0];
    const anyAvailable = !!firstAvailable;

    // Marcar el horario inicial como seleccionado
    $$(".time-opt", timesWrap).forEach(btn => {
        btn.setAttribute("aria-checked", btn.dataset.horario === selectedHorario ? "true" : "false");
    });

    // Actualizar la alerta y el botón según disponibilidad del horario seleccionado
    updatePopCardAvailability(lab, maxCupos);

    const yesBtn = $("[data-confirm-yes]");

    // Selección de horarios en el pop card
    $$(".time-opt", timesWrap).forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.disabled) return;
            $$(".time-opt", timesWrap).forEach(b => b.setAttribute("aria-checked", "false"));
            btn.setAttribute("aria-checked", "true");
            selectedHorario = btn.dataset.horario;
            updatePopCardAvailability(lab, maxCupos);
        });
    });

    yesBtn.addEventListener("click", () => {
        updateHorarioDisplay();
        updateFormAvailability();
        dialog.close();
        showView("form");
        form.nombre.focus();
    });

    dialog.showModal();
}

// Actualiza el estado del pop card según el horario actualmente seleccionado
function updatePopCardAvailability(lab, maxCupos) {
    const currentInscriptos = getInscriptosCount(lab.titulo, selectedHorario, remoteCounts);
    const libres = Math.max(0, maxCupos - currentInscriptos);
    const disponible = currentInscriptos < maxCupos;

    console.log(`%c[Pop Card] "${lab.titulo}" → Horario: "${selectedHorario}" → ${libres} vacantes de ${maxCupos}`, "color: #0BABBA; font-weight: bold;");

    const fullNotice = $("[data-confirm-full]");
    if (fullNotice) {
        if (disponible) {
            fullNotice.hidden = true;
            fullNotice.style.setProperty("display", "none", "important");
        } else {
            fullNotice.hidden = false;
            fullNotice.style.setProperty("display", "flex", "important");
        }
    }

    const yesBtn = $("[data-confirm-yes]");
    if (disponible) {
        yesBtn.disabled = false;
        yesBtn.textContent = "Sí, continuar";
    } else {
        yesBtn.disabled = true;
        yesBtn.textContent = "No disponible";
    }
}

// Validaciones en tiempo real
function setHint(fieldName, text, isError = false) {
    const hint = $(`[data-hint="${fieldName}"]`);
    if (hint) {
        hint.textContent = text;
        hint.style.color = isError ? "#c62828" : "var(--muted)";
    }
}

form.nombre.addEventListener("input", () => setHint("nombre", ""));
form.dni.addEventListener("input", () => {
    form.dni.value = cleanDoc(form.dni.value);
    setHint("dni", "");
});
form.correo.addEventListener("input", () => setHint("correo", ""));
form.confirmo.addEventListener("change", () => setHint("confirmo", ""));

// Manejador del envío del formulario
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgEl = $("[data-form-msg]");
    msgEl.textContent = "";

    const nombre = form.nombre.value.trim();
    const dni = cleanDoc(form.dni.value);
    const correo = form.correo.value.trim();
    const confirmo = form.confirmo.checked;

    // 1. Validar nombre
    if (!nombre || nombre.length < 3) {
        setHint("nombre", "Ingresá tu nombre y apellido completo.", true);
        form.nombre.focus();
        return;
    }

    // 2. Validar DNI
    if (!dni || dni.length < 6) {
        setHint("dni", "Ingresá un número de documento válido (mínimo 6 dígitos).", true);
        form.dni.focus();
        return;
    }

    // 3. Validar Correo de TUMO
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !emailRegex.test(correo)) {
        setHint("correo", "Ingresá una dirección de correo válida.", true);
        form.correo.focus();
        return;
    }

    // 4. Validar Checkbox de Reconfirmación
    if (!confirmo) {
        setHint("confirmo", "Debés marcar la casilla de confirmación para continuar.", true);
        return;
    }

    // 5. VALIDACIÓN DE CAPACIDAD MÁXIMA EN EL ENVÍO:
    // Comprobar que el horario seleccionado aún tenga vacantes disponibles
    const currentInscriptos = getInscriptosCount(selectedLab.titulo, selectedHorario, remoteCounts);
    if (currentInscriptos >= selectedLab.maxParticipantes) {
        msgEl.textContent = "Lo sentimos, este taller acaba de completar sus cupos máximos y ya no está disponible.";
        $("[data-submit]").disabled = true;
        return;
    }

    // Estado visual de carga
    const submitBtn = $("[data-submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando solicitud…";

    const payload = {
        nombre,
        dni,
        correo,
        taller: selectedLab.titulo,
        horario: selectedHorario,
        disciplina: selectedLab.disciplina,
        maxCupos: selectedLab.maxParticipantes
    };

    try {
        // Si hay URL de Google Apps Script configurada, enviar vía POST
        if (GOOGLE_SCRIPT_URL) {
            const formData = new URLSearchParams();
            Object.entries(payload).forEach(([k, v]) => formData.append(k, v));

            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString()
            });
        }

        // Registrar en almacenamiento local para consistencia y pruebas
        saveLocalInscripcion(payload);

        // Mostrar pantalla de éxito
        $("[data-done-taller]").textContent = selectedLab.titulo;
        $("[data-done-nombre]").textContent = nombre;
        $("[data-done-dni]").textContent = dni;
        $("[data-done-correo]").textContent = correo;
        $("[data-done-horario]").textContent = selectedHorario;

        showView("done");
        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
        console.error(err);
        msgEl.textContent = "Hubo un inconveniente al enviar la solicitud. Por favor, reintentá.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar solicitud";
    }
});

document.addEventListener("DOMContentLoaded", initForm);
