// ==========================================================
// TUMO Chacarita Flash Labs — Formulario de Inscripción
// Valida DNI, Correo de TUMO, confirmación de horario y cupos máximos
// Envío a Google Apps Script y persistencia local
// ==========================================================
//
// ⚠️ DEPENDENCIAS EXPLÍCITAS (cargar ANTES que este script):
//   config.js provee: processRawLabs, slugify, cleanDoc, CLOCK_ICON, EVENT,
//   getLocalInscripciones, saveLocalInscripcion, getInscriptosCount,
//   isHorarioAvailable, isAlreadyInscripto, getInscripcionesCountByDNI, escapeHtml
//   data_de_labs.js provee: window.RAW_DATA_DE_LABS
// ==========================================================

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

const form = $("[data-signup]");
let selectedLab = null;
let selectedHorario = null;
let remoteCounts = null;
let padrónEstudiantes = null;

// Cargar padrón de estudiantes desde students_workshops.json para validación académica
async function cargarPadrónEstudiantes() {
    try {
        const res = await fetch("students_workshops.json");
        if (res.ok) {
            padrónEstudiantes = await res.json();
        }
    } catch (e) {
        console.warn("No se pudo cargar students_workshops.json (validación académica deshabilitada):", e);
    }
}

// Validar que el estudiante exista en el padrón de TUMO y tenga la disciplina en "complete" u "on going"
function validarEstudianteTUMO(dni, disciplina) {
    if (!padrónEstudiantes) {
        return { valido: true }; // Si no se cargó el padrón, permitir (fallo abierto)
    }

    const estudiante = padrónEstudiantes[dni];
    if (!estudiante) {
        return {
            valido: false,
            mensaje: "El DNI no se encuentra en el padrón de estudiantes de TUMO Chacarita."
        };
    }

    const workshopKey = DISCIPLINA_TO_WORKSHOP_KEY[disciplina];
    if (!workshopKey) {
        return { valido: true }; // No hay mapeo de disciplina, permitir
    }

    const estado = estudiante.disciplinas?.[workshopKey];
    if (!estado || (estado !== "complete" && estado !== "on going")) {
        return {
            valido: false,
            mensaje: "No tenés la disciplina '" + disciplina + "' en estado 'complete' u 'on going' en el padrón de TUMO."
        };
    }

    return { valido: true };
}

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
            fetchRemoteCounts(),
            cargarPadrónEstudiantes()
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
    const currentInscriptos = getInscriptosCount(lab.titulo, lab.dias || "", selectedHorario, remoteCounts);
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
        const inscriptos = getInscriptosCount(lab.titulo, lab.dias || "", h, remoteCounts);
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

    // Cerrar pop card al hacer clic en la X
    const closeBtn = $("[data-lab-close]", dialog);
    if (closeBtn) {
        closeBtn.addEventListener("click", () => dialog.close());
    }

    dialog.showModal();
}

// Actualiza el estado del pop card según el horario actualmente seleccionado
function updatePopCardAvailability(lab, maxCupos) {
    const currentInscriptos = getInscriptosCount(lab.titulo, lab.dias || "", selectedHorario, remoteCounts);
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

    // 2. Validar DNI (7 u 8 dígitos, sin puntos ni espacios)
    if (!dni || !/^\d{7,8}$/.test(dni)) {
        setHint("dni", "Ingresá un DNI válido de 7 u 8 dígitos (sin puntos ni espacios).", true);
        form.dni.focus();
        return;
    }

    // 3. Validar Correo de TUMO (dominio institucional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailDomain = correo.split("@").pop().toLowerCase();
    const allowedDomains = ["tumo.world", "tumo.ar"];
    if (!correo || !emailRegex.test(correo)) {
        setHint("correo", "Ingresá una dirección de correo válida.", true);
        form.correo.focus();
        return;
    }
    if (!allowedDomains.includes(emailDomain)) {
        setHint("correo", "El correo debe ser de TUMO (@tumo.world o @tumo.ar).", true);
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
    const currentInscriptos = getInscriptosCount(selectedLab.titulo, selectedLab.dias || "", selectedHorario, remoteCounts);
    if (currentInscriptos >= selectedLab.maxParticipantes) {
        msgEl.textContent = "Lo sentimos, este taller acaba de completar sus cupos máximos y ya no está disponible.";
        $("[data-submit]").disabled = true;
        return;
    }

    // 6. VALIDACIÓN DE LÍMITE DE 2 INSCRIPCIONES POR ESTUDIANTE:
    const maxPerStudent = (typeof EVENT !== "undefined" && EVENT.maxInscripcionesPorEstudiante) || 2;
    const currentStudentCount = getInscripcionesCountByDNI(dni);
    if (currentStudentCount >= maxPerStudent) {
        setHint("dni", `Ya estás inscripto/a en ${currentStudentCount} Flash Lab(s). El máximo permitido es ${maxPerStudent}.`, true);
        form.dni.focus();
        return;
    }

    // 7. VALIDACIÓN: NO REPETIR EL MISMO TALLER+COMISIÓN
    if (isAlreadyInscripto(dni, selectedLab.titulo, selectedLab.dias || "", selectedHorario)) {
        setHint("dni", "Ya tenés una inscripción registrada para este mismo Flash Lab y horario.", true);
        form.dni.focus();
        return;
    }

    // 8. VALIDACIÓN ACADÉMICA CONTRA PADRÓN DE TUMO:
    // Verificar que el DNI exista y tenga la disciplina en "complete" u "on going"
    const validacionAcademica = validarEstudianteTUMO(dni, selectedLab.disciplina);
    if (!validacionAcademica.valido) {
        setHint("dni", validacionAcademica.mensaje, true);
        form.dni.focus();
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
        dias: selectedLab.dias || "",
        horario: selectedHorario,
        disciplina: selectedLab.disciplina,
        maxCupos: selectedLab.maxParticipantes
    };

    try {
        // Si hay URL de Google Apps Script configurada, enviar vía POST como JSON con reintentos
        let enviadoExitosamente = false;
        if (GOOGLE_SCRIPT_URL) {
            const maxIntentos = 3;
            for (let intento = 1; intento <= maxIntentos; intento++) {
                try {
                    const res = await fetch(GOOGLE_SCRIPT_URL, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(payload)
                    });

                    const result = await res.json();

                    if (result.status === "ok") {
                        enviadoExitosamente = true;
                        break;
                    }

                    // Errores de negocio del backend: no reintentar, mostrar mensaje
                    if (result.status === "error" || result.status === "no_disponible" || result.status === "ya_inscripto" || result.status === "limite_alcanzado" || result.status === "no_autorizado" || result.status === "busy") {
                        msgEl.textContent = result.message || "Ocurrió un error al procesar la inscripción.";
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Enviar inscripción";
                        return;
                    }

                    // Si es otro error, reintentar si no es el último intento
                    if (intento < maxIntentos) {
                        await new Promise(r => setTimeout(r, 1000 * intento));
                    }
                } catch (fetchErr) {
                    // Error de red: reintentar si no es el último intento
                    if (intento < maxIntentos) {
                        await new Promise(r => setTimeout(r, 1000 * intento));
                    } else {
                        throw fetchErr;
                    }
                }
            }
        }

        // Registrar en almacenamiento local para consistencia y pruebas
        // Si el backend falló tras reintentos, al menos queda guardado localmente
        if (!enviadoExitosamente && GOOGLE_SCRIPT_URL) {
            console.warn("Backend no disponible tras reintentos. Guardando en localStorage.");
        }
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
        submitBtn.textContent = "Enviar inscripción";
    }
});

document.addEventListener("DOMContentLoaded", initForm);
