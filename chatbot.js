// ==========================================================
// TUMO Chacarita Learning Labs — Chatbot "Flashy"
// Asistente virtual flotante con detección de intenciones
// ==========================================================

(() => {
    const GREETING = "¡Hola! Soy Flashy 🤖, el asistente de los Learning Labs de TUMO Chacarita. Preguntame lo que quieras sobre los talleres de diciembre, horarios, requisitos o cómo inscribirte.";
    const SUGGESTIONS = [
        "¿Cuándo y dónde es?",
        "¿Qué talleres hay?",
        "¿Cómo me inscribo?",
        "¿Cuáles son los requisitos?",
        "Necesito más información"
    ];

    const botFace = () => `
        <span class="bot" aria-hidden="true">
            <span class="bot__antenna"></span>
            <span class="bot__head">
                <span class="bot__eyes"><i></i><i></i></span>
            </span>
        </span>`;

    // Inyección de elementos del chat en el DOM
    const root = document.createElement("div");
    root.className = "chat";
    root.innerHTML = `
        <section class="chat__panel" data-chat-panel role="dialog" aria-label="Chat con Flashy" hidden>
            <header class="chat__head">
                ${botFace()}
                <div>
                    <strong>Flashy</strong>
                    <span>Asistente · TUMO Chacarita</span>
                </div>
                <button class="chat__close" data-chat-close aria-label="Cerrar chat">✕</button>
            </header>
            <div class="chat__log" data-chat-log aria-live="polite"></div>
            <div class="chat__chips" data-chat-chips>
                ${SUGGESTIONS.map(q => `<button type="button" class="chat__chip">${escapeHtml(q)}</button>`).join("")}
            </div>
            <form class="chat__form" data-chat-form>
                <label class="sr-only" for="chat-input">Tu pregunta</label>
                <input id="chat-input" maxlength="400" autocomplete="off" placeholder="Escribí tu consulta…">
                <button type="submit" aria-label="Enviar">➤</button>
            </form>
            <p class="chat__disclaimer">Asistente oficial para estudiantes de TUMO Chacarita.</p>
        </section>

        <button class="chat__fab" data-chat-toggle aria-label="Abrir chat de ayuda" aria-expanded="false">
            ${botFace()}
        </button>
    `;
    document.body.appendChild(root);

    const panel = root.querySelector("[data-chat-panel]");
    const log = root.querySelector("[data-chat-log]");
    const form = root.querySelector("[data-chat-form]");
    const input = root.querySelector("#chat-input");
    const toggle = root.querySelector("[data-chat-toggle]");

    function addMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `chat__msg chat__msg--${role}`;
        msg.innerHTML = `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
        log.appendChild(msg);
        log.scrollTop = log.scrollHeight;
    }

    function addBotResponse(html) {
        const msg = document.createElement("div");
        msg.className = "chat__msg chat__msg--bot";
        msg.innerHTML = html;
        log.appendChild(msg);
        log.scrollTop = log.scrollHeight;
    }

    // Respuestas basadas en reglas locales e intenciones
    function getReply(question) {
        const q = (question || "").toLowerCase().trim();

        if (/cu[aá]ndo|d[oó]nde|fechas|lugar|horarios|direcci[oó]n/.test(q)) {
            return `Los <strong>Learning Labs</strong> se desarrollarán durante <strong>diciembre de 2026</strong> en la sede de <strong>TUMO Chacarita</strong> (Buenos Aires). Los horarios habituales se dividen en Turno Mañana y Turno Tarde según cada taller.`;
        }

        if (/qu[eé] (talleres|labs|propuestas)|cartelera|disciplinas/.test(q)) {
            return `Tenemos <strong>33 talleres disponibles</strong> en 8 disciplinas:<br>
            • Fotografía<br>
            • Música<br>
            • Cine<br>
            • IA Generativa (GenAI)<br>
            • Modelado 3D<br>
            • Videojuegos<br>
            • Programación<br>
            • Dibujo<br><br>
            Podés revisarlos todos en la <a href="index.html#actividades" style="color: var(--green-primary); font-weight:700;">cartelera de talleres</a>.`;
        }

        if (/inscrib|anotar|vacante|formulario|como me anoto/.test(q)) {
            return `Para inscribirte:<br>
            1. Elegí tu taller favorito en la <a href="index.html#actividades" style="color: var(--green-primary); font-weight:700;">cartelera</a>.<br>
            2. Tocá en <strong>"Solicitar vacante"</strong>.<br>
            3. Confirmá el horario y completá tu Nombre, DNI y correo de TUMO.<br>
            4. ¡Listo! Recibirás la confirmación antes de comenzar.`;
        }

        if (/requisito|hace falta saber|conocimientos previos/.test(q)) {
            return `La mayoría de las propuestas <strong>no requieren conocimientos previos</strong>. Aquellas que sí lo requieren (como niveles 1 de Música, Dibujo o Programación) lo tienen especificado en la tarjeta de la cartelera.`;
        }

        if (/costo|gratis|precio|cuanto sale/.test(q)) {
            return `¡Todos los Learning Labs son <strong>100% gratuitos</strong> y exclusivos para estudiantes de TUMO Chacarita!`;
        }

        if (/m[aá]s info|humano|persona|contacto|whatsapp|telefono|mail|ayuda/.test(q)) {
            return `Podés contactarte directamente con el equipo de TUMO Chacarita:<br>
            📧 Correo: <a href="mailto:chacarita@tumo.ar" style="color: var(--green-primary); font-weight:700;">chacarita@tumo.ar</a><br>
            📱 WhatsApp: <a href="${whatsappUrl()}" target="_blank" rel="noopener" style="color: var(--green-primary); font-weight:700;">Escribinos por WhatsApp</a>`;
        }

        return `Puedo ayudarte con información sobre los Learning Labs de TUMO Chacarita, fechas, disciplinas y el proceso de solicitud de vacante. También podés explorar la <a href="index.html#actividades" style="color: var(--green-primary); font-weight:700;">cartelera completa acá</a>.`;
    }

    function setOpen(isOpen) {
        panel.hidden = !isOpen;
        toggle.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
            if (!log.children.length) addMessage("bot", GREETING);
            input.focus();
        }
    }

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    root.querySelector("[data-chat-close]").addEventListener("click", () => setOpen(false));

    root.querySelector("[data-chat-chips]").addEventListener("click", (e) => {
        if (e.target.matches(".chat__chip")) {
            const text = e.target.textContent;
            addMessage("user", text);
            setTimeout(() => addBotResponse(getReply(text)), 250);
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        addMessage("user", text);
        input.value = "";
        setTimeout(() => addBotResponse(getReply(text)), 300);
    });
})();
