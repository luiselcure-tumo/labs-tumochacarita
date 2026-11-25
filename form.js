// ==========================================================
// TUMO Chacarita Flash Labs — Formulario de Inscripción
// Requires config.js and data_de_labs.js loaded before this script.
// The Apps Script (appScript.js) is the authority for padron, requirements and cupos.
// ==========================================================

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

const form = $("[data-signup]");
let selectedLab = null;
let selectedComision = null;
let remoteCounts = null;
let countsPending = Boolean(GOOGLE_SCRIPT_URL);

function showView(viewName) {
    $$("[data-view]").forEach(el => {
        el.hidden = el.dataset.view !== viewName;
    });
}

function showErrorMessage(msg) {
    $("[data-message]").textContent = msg;
    showView("message");
}

async function fetchRemoteCounts() {
    if (!GOOGLE_SCRIPT_URL) return null;
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, { method: "GET" });
        const data = await res.json();
        if (data.status === "ok" && data.counts) return data.counts;
    } catch {}
    return null;
}

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

async function initForm() {
    showView("loading");

    const params = new URLSearchParams(location.search);
    const labId = params.get("id") || params.get("actividad");

    if (!labId) {
        return showErrorMessage("Para solicitar una vacante, primero debés elegir un taller en la cartelera.");
    }

    const countsRequest = fetchRemoteCounts();

    try {
        const rawData = await getRawLabs();

        if (!rawData || !rawData.length) {
            throw new Error("No se pudo cargar la información de los talleres.");
        }

        const labs = processRawLabs(rawData);
        selectedLab = labs.find(l => l.id === labId || slugify(l.titulo) === slugify(labId));

        if (!selectedLab) {
            return showErrorMessage("El taller seleccionado no existe o no está disponible en la cartelera.");
        }

        fillChosenDetails();
        openConfirmPopCard();

        remoteCounts = await countsRequest;
        countsPending = false;
        if (!isComisionAvailable(selectedComision, remoteCounts)) {
            selectedComision = selectedLab.comisiones.find(c => isComisionAvailable(c, remoteCounts)) || selectedComision;
        }
        renderComisionOptions();
        updatePopCardAvailability();
        updateComisionDisplay();
        updateFormAvailability();
    } catch (err) {
        console.error(err);
        showErrorMessage("Ocurrió un error al cargar el taller. Por favor, volvé a la cartelera e intentalo nuevamente.");
    }
}

function fillChosenDetails() {
    const lab = selectedLab;
    document.title = `${lab.titulo} · Solicitar vacante · TUMO Chacarita`;
    $("[data-chosen-name]").textContent = lab.titulo;
    $("[data-chosen-disciplina]").textContent = lab.disciplinaMeta.label || lab.disciplina;
    $("[data-chosen-duracion]").textContent = lab.horas;
    $("[data-chosen-requisito]").textContent = lab.tieneRequisito
        ? `⚠️ ${lab.requisitos}`
        : "✓ Sin requisitos previos";

    selectedComision = lab.comisiones.find(c => isComisionAvailable(c, remoteCounts)) || lab.comisiones[0];
    updateFormAvailability();
    updateComisionDisplay();
}

function setFullAlert(el, isFull) {
    if (!el) return;
    el.hidden = !isFull;
    el.style.setProperty("display", isFull ? "flex" : "none", "important");
}

function updateFormAvailability() {
    const submit = $("[data-submit]");
    if (countsPending) {
        $("[data-chosen-cupos]").textContent = "Consultando cupos…";
        setFullAlert($("[data-chosen-full]"), false);
        submit.disabled = false;
        submit.textContent = "Enviar solicitud";
        return;
    }
    const vacantes = getComisionVacantes(selectedComision, remoteCounts);
    const disponible = vacantes > 0;

    $("[data-chosen-cupos]").textContent = disponible
        ? `Vacantes: ${vacantes} de ${selectedComision.cupo}`
        : "Cupo completo";
    setFullAlert($("[data-chosen-full]"), !disponible);

    submit.disabled = !disponible;
    submit.textContent = disponible ? "Enviar solicitud" : "No disponible (Cupo lleno)";
}

function updateComisionDisplay() {
    $("[data-chosen-horario]").textContent = selectedComision.label;
    $("[data-confirm-text]").textContent =
        `Confirmo que quiero solicitar una vacante en ${selectedLab.titulo} y que puedo asistir ${selectedComision.dias.length > 1 ? "a todos los encuentros" : "al encuentro"}: ${selectedComision.label}.`;
}

function renderComisionOptions() {
    const timesWrap = $("[data-confirm-times]");
    if (!timesWrap) return;
    timesWrap.innerHTML = selectedLab.comisiones.map(c => {
        const vacantes = getComisionVacantes(c, remoteCounts);
        const disponible = countsPending || vacantes > 0;
        const spots = countsPending ? "Consultando…" : (disponible ? vacantes + " vacantes" : "Cupo lleno");
        return `
        <button type="button" class="time-opt ${disponible ? "" : "is-full"}" role="radio"
            data-comision="${escapeHtml(c.id)}" aria-checked="${c.id === selectedComision.id ? "true" : "false"}"
            ${disponible ? "" : "disabled"}>
            ${CLOCK_ICON}
            <span>${escapeHtml(c.label)}</span>
            <span class="time-opt__spots">${spots}</span>
        </button>`;
    }).join("");
}

function openConfirmPopCard() {
    const dialog = $("[data-confirm]");
    if (!dialog) {
        showView("form");
        return;
    }

    $("[data-confirm-name]").textContent = selectedLab.titulo;
    renderComisionOptions();
    updatePopCardAvailability();

    $("[data-confirm-times]").addEventListener("click", (e) => {
        const btn = e.target.closest(".time-opt");
        if (!btn || btn.disabled) return;
        $$(".time-opt", e.currentTarget).forEach(b => b.setAttribute("aria-checked", "false"));
        btn.setAttribute("aria-checked", "true");
        selectedComision = selectedLab.comisiones.find(c => c.id === btn.dataset.comision);
        updatePopCardAvailability();
    });

    $("[data-confirm-yes]").addEventListener("click", () => {
        updateComisionDisplay();
        updateFormAvailability();
        dialog.close();
        showView("form");
        form.nombre.focus();
    });

    const closeBtn = $("[data-lab-close]", dialog);
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            location.href = "index.html#actividades";
        });
    }

    dialog.showModal();
}

function updatePopCardAvailability() {
    const disponible = countsPending || isComisionAvailable(selectedComision, remoteCounts);
    setFullAlert($("[data-confirm-full]"), !disponible);
    const yesBtn = $("[data-confirm-yes]");
    yesBtn.disabled = !disponible;
    yesBtn.textContent = disponible ? "Sí, continuar" : "No disponible";
}

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

// Returns the backend result, or null when it could not be reached after retries.
async function enviarInscripcion(payload) {
    const maxIntentos = 3;
    for (let intento = 1; intento <= maxIntentos; intento++) {
        try {
            const res = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.status !== "busy") return result;
        } catch (err) {
            console.warn(`Intento ${intento} falló:`, err);
        }
        if (intento < maxIntentos) {
            await new Promise(r => setTimeout(r, 1000 * intento));
        }
    }
    return null;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgEl = $("[data-form-msg]");
    msgEl.textContent = "";

    const nombre = form.nombre.value.trim();
    const dni = cleanDoc(form.dni.value);
    const correo = form.correo.value.trim().toLowerCase();

    if (nombre.length < 3) {
        setHint("nombre", "Ingresá tu nombre y apellido completo.", true);
        form.nombre.focus();
        return;
    }

    if (!/^[A-Z0-9]{6,12}$/.test(dni)) {
        setHint("dni", "Ingresá un DNI válido, sin puntos ni espacios.", true);
        form.dni.focus();
        return;
    }

    const emailDomain = correo.split("@").pop();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        setHint("correo", "Ingresá una dirección de correo válida.", true);
        form.correo.focus();
        return;
    }
    if (!["tumo.world", "tumo.ar"].includes(emailDomain)) {
        setHint("correo", "El correo debe ser de TUMO (@tumo.world o @tumo.ar).", true);
        form.correo.focus();
        return;
    }

    if (!form.confirmo.checked) {
        setHint("confirmo", "Debés marcar la casilla de confirmación para continuar.", true);
        return;
    }

    if (!countsPending && !isComisionAvailable(selectedComision, remoteCounts)) {
        msgEl.textContent = "Lo sentimos, esta comisión completó su cupo. Elegí otra comisión u otro taller.";
        $("[data-submit]").disabled = true;
        return;
    }

    const maxPerStudent = EVENT.maxInscripcionesPorEstudiante;
    if (getInscripcionesCountByDNI(dni) >= maxPerStudent) {
        setHint("dni", `Desde este dispositivo ya registraste ${maxPerStudent} Flash Labs con este DNI. El máximo es ${maxPerStudent}.`, true);
        form.dni.focus();
        return;
    }
    if (isAlreadyInscripto(dni, selectedLab.id)) {
        setHint("dni", "Ya tenés una inscripción registrada en este Flash Lab.", true);
        form.dni.focus();
        return;
    }

    const submitBtn = $("[data-submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando solicitud…";

    const payload = { nombre, dni, correo, comisionId: selectedComision.id };

    if (GOOGLE_SCRIPT_URL) {
        const result = await enviarInscripcion(payload);
        if (!result || result.status !== "ok") {
            msgEl.textContent = result?.message || "No pudimos enviar la solicitud. Revisá tu conexión y reintentá.";
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar solicitud";
            return;
        }
    }

    saveLocalInscripcion({ ...payload, labId: selectedLab.id, taller: selectedLab.titulo,
        dias: selectedComision.diasTexto, horario: selectedComision.horario });

    $("[data-done-taller]").textContent = selectedLab.titulo;
    $("[data-done-nombre]").textContent = nombre;
    $("[data-done-dni]").textContent = dni;
    $("[data-done-correo]").textContent = correo;
    $("[data-done-horario]").textContent = selectedComision.label;

    showView("done");
    window.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener("DOMContentLoaded", initForm);
