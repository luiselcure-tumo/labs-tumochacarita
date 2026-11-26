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

        selectedComision = resolveComision(selectedLab, params.get("comision"));
        if (!selectedComision) {
            // The comision is chosen in the lab detail on the cartelera.
            location.replace(changeComisionUrl(selectedLab));
            return;
        }

        fillChosenDetails();
        showView("form");

        remoteCounts = await countsRequest;
        countsPending = false;
        updateFormAvailability();
    } catch (err) {
        console.error(err);
        showErrorMessage("Ocurrió un error al cargar el taller. Por favor, volvé a la cartelera e intentalo nuevamente.");
    }
}

function resolveComision(lab, requestedId) {
    const requested = lab.comisiones.find(c => c.id === requestedId);
    if (requested) return requested;
    return lab.comisiones.length === 1 ? lab.comisiones[0] : null;
}

function changeComisionUrl(lab) {
    return `index.html#lab=${encodeURIComponent(lab.id)}`;
}

function fillChosenDetails() {
    const lab = selectedLab;
    document.title = `${lab.titulo} · Solicitar vacante · TUMO Chacarita`;
    form.classList.add(`card--${lab.disciplinaMeta.slug}`);
    $("[data-chosen-name]").textContent = lab.titulo;
    const meta = lab.disciplinaMeta;
    const icon = meta.icon ? `<img src="${escapeHtml(meta.icon)}" alt="" aria-hidden="true">` : "";
    $("[data-chosen-badge]").innerHTML = `${icon}<span>${escapeHtml(meta.label || lab.disciplina)}</span>`;
    $("[data-chosen-duracion]").textContent = lab.horas;
    $("[data-chosen-req]").classList.toggle("is-required", lab.tieneRequisito);
    $("[data-chosen-req-icon]").textContent = lab.tieneRequisito ? "!" : "✓";
    $("[data-chosen-requisito]").textContent = lab.tieneRequisito
        ? lab.requisitos
        : "No requiere conocimientos previos";

    $$("[data-change-comision]").forEach(a => { a.href = changeComisionUrl(lab); });
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
    const i = selectedLab.comisiones.indexOf(selectedComision);
    $("[data-chosen-horario]").innerHTML = `
        <div class="card__com card__com--${i % 4}">
            <span class="card__com-num">${i + 1}</span>
            <span class="card__com-text">
                ${comisionDaysHtml(selectedComision)}
                <small>${escapeHtml(selectedComision.horario.replace(/ h$/, "\u00a0h"))}</small>
            </span>
        </div>`;
    $("[data-confirm-text]").textContent =
        `Confirmo que quiero solicitar una vacante en ${selectedLab.titulo} y que puedo asistir ${selectedComision.dias.length > 1 ? "a todos los encuentros" : "al encuentro"}: ${selectedComision.label}.`;
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
