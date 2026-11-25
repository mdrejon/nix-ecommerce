"use strict";

(function () {
    const selector = ".admin-save-action";

    const resetActions = () => {
        document.querySelectorAll(selector).forEach((button) => {
            button.disabled = false;
            button.removeAttribute("aria-busy");
            button.removeAttribute("data-admin-submitting");
            button.querySelector(".admin-save-action__spinner")?.remove();
        });
    };

    document.addEventListener("submit", (event) => {
        const submitter = event.submitter;

        if (!(submitter instanceof HTMLButtonElement) || !submitter.matches(selector)) {
            return;
        }

        window.setTimeout(() => {
            if (event.defaultPrevented) {
                return;
            }

            if (
                submitter.dataset.adminSubmitting === "true" ||
                submitter.querySelector(".admin-save-action__spinner")
            ) {
                return;
            }

            const spinner = document.createElement("span");
            spinner.className = "spinner-border spinner-border-sm admin-save-action__spinner";
            spinner.setAttribute("role", "status");
            spinner.setAttribute("aria-hidden", "true");
            submitter.appendChild(spinner);
            submitter.setAttribute("aria-busy", "true");
            submitter.dataset.adminSubmitting = "true";

            event.target.querySelectorAll(selector).forEach((button) => {
                button.disabled = true;
            });
        }, 0);
    });

    window.addEventListener("pageshow", resetActions);
})();
