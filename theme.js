// ==========================================================
// TUMO Chacarita Learning Labs — Conmutador de Temas
// Fondo Claro ↔ Fondo Verde Chacarita
// ==========================================================

(() => {
    const KEY = "tumo-chacarita-theme";
    const root = document.documentElement;
    const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
    const save = (v) => { try { localStorage.setItem(KEY, v); } catch { /* sin storage */ } };

    const apply = (theme) => {
        if (theme === "green") root.dataset.theme = "green";
        else delete root.dataset.theme;
    };
    apply(read());

    const DURATION = 800;
    const EASE = "cubic-bezier(.65, 0, .25, 1)";

    function switchWithCircle(btn, change) {
        const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!document.startViewTransition || reduce) return change();

        const r = btn.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

        btn.classList.remove("is-spinning");
        void btn.offsetWidth;
        btn.classList.add("is-spinning");

        const t = document.startViewTransition(change);
        t.ready.then(() => {
            root.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
                { duration: DURATION, easing: EASE, pseudoElement: "::view-transition-new(root)" }
            );
        }).catch(() => {});
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
            const sync = () => {
                const isGreen = root.dataset.theme === "green";
                btn.setAttribute("aria-pressed", String(isGreen));
                btn.setAttribute("aria-label", isGreen ? "Cambiar a fondo claro" : "Cambiar a fondo verde Chacarita");
                btn.title = btn.getAttribute("aria-label");
            };
            sync();
            btn.addEventListener("click", () => {
                const next = root.dataset.theme === "green" ? "light" : "green";
                switchWithCircle(btn, () => {
                    apply(next);
                    save(next);
                    sync();
                });
            });
        });
    });
})();
