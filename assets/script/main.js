/**
 * Loggy — Main application logic
 */

(function () {
    "use strict";

    // ── DOM references ──────────────────────────────────────────
    const personSelect = document.getElementById("person-select");
    const workCategories = document.getElementById("work-categories");
    const workDetails = document.getElementById("work-details");
    const messagePreview = document.getElementById("message-preview");
    const form = document.getElementById("loggy-form");
    const sendBtn = document.getElementById("send-btn");
    const statusMessage = document.getElementById("status-message");

    // ── Application state ───────────────────────────────────────
    const state = {
        person: "",
        works: {}
    };

    // Work types that require a reviewer
    const CODE_WORK_IDS = ["code_front", "code_back"];

    // Flat lookup: id -> label
    var workLabelMap = {};
    CONFIG.workCategories.forEach(function (cat) {
        cat.items.forEach(function (item) {
            workLabelMap[item.id] = item.label;
        });
    });

    // ── Initialization ──────────────────────────────────────────

    function init() {
        populatePersons();
        populateWorkCategories();
        bindEvents();
        updatePreview();
    }

    function populatePersons() {
        CONFIG.persons.forEach(function (name) {
            var option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            personSelect.appendChild(option);
        });
    }

    function populateWorkCategories() {
        CONFIG.workCategories.forEach(function (category) {
            var group = document.createElement("div");
            group.className = "category-group";

            var title = document.createElement("h3");
            title.textContent = category.name;
            group.appendChild(title);

            var checkboxGroup = document.createElement("div");
            checkboxGroup.className = "checkbox-group";

            category.items.forEach(function (work) {
                var label = document.createElement("label");
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = work.id;
                checkbox.name = "works";

                var span = document.createElement("span");
                span.textContent = work.label;

                label.appendChild(checkbox);
                label.appendChild(span);
                checkboxGroup.appendChild(label);
            });

            group.appendChild(checkboxGroup);
            workCategories.appendChild(group);
        });
    }

    // ── Event binding ───────────────────────────────────────────

    function bindEvents() {
        personSelect.addEventListener("change", function () {
            state.person = this.value;
            updatePreview();
        });

        workCategories.addEventListener("change", function (e) {
            if (e.target.type !== "checkbox") return;
            handleWorkToggle(e.target.value, e.target.checked);
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            handleSubmit();
        });
    }

    // ── Work toggle / detail sections ───────────────────────────

    function handleWorkToggle(workId, checked) {
        if (checked) {
            state.works[workId] = [""];
            renderDetailSection(workId);
        } else {
            delete state.works[workId];
            removeDetailSection(workId);
        }
        updatePreview();
    }

    function renderDetailSection(workId) {
        var label = workLabelMap[workId];
        if (!label) return;

        var section = document.createElement("section");
        section.className = "work-detail-section";
        section.dataset.workId = workId;

        var title = document.createElement("h3");
        title.textContent = label;
        section.appendChild(title);

        var entriesContainer = document.createElement("div");
        entriesContainer.className = "entries-container";
        section.appendChild(entriesContainer);

        renderDetailEntries(workId, entriesContainer);

        var addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "btn-add";
        addBtn.textContent = "+ Ajouter un détail";
        addBtn.addEventListener("click", function () {
            state.works[workId].push("");
            renderDetailEntries(workId, entriesContainer);
        });
        section.appendChild(addBtn);

        workDetails.appendChild(section);
    }

    function renderDetailEntries(workId, container) {
        container.innerHTML = "";

        state.works[workId].forEach(function (value, index) {
            var entry = document.createElement("div");
            entry.className = "detail-entry";

            var input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Détail du travail...";
            input.value = value;
            input.addEventListener("input", function () {
                state.works[workId][index] = this.value;
                updatePreview();
            });

            var removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "btn-remove";
            removeBtn.textContent = "X";
            removeBtn.addEventListener("click", function () {
                state.works[workId].splice(index, 1);
                if (state.works[workId].length === 0) {
                    state.works[workId].push("");
                }
                renderDetailEntries(workId, container);
                updatePreview();
            });

            entry.appendChild(input);
            entry.appendChild(removeBtn);
            container.appendChild(entry);
        });
    }

    function removeDetailSection(workId) {
        var section = workDetails.querySelector('[data-work-id="' + workId + '"]');
        if (section) section.remove();
    }

    // ── Message building ────────────────────────────────────────

    function buildDiscordMessage() {
        var lines = [];

        var now = new Date();
        var date = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
        var time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

        lines.push("**\uD83E\uDDFE Loggy \u2014 Rapport d'activit\u00E9**");
        lines.push("\uD83D\uDCC5 " + date + " \u00E0 " + time);
        lines.push("");
        lines.push("\uD83D\uDC64 **Personne :** " + state.person);
        lines.push("");
        lines.push("\uD83D\uDD27 **Travaux :**");

        var selectedWorkIds = Object.keys(state.works);
        selectedWorkIds.forEach(function (workId) {
            var label = workLabelMap[workId];
            if (!label) return;

            lines.push("");
            lines.push("\u25B6 **" + label + "**");

            var details = state.works[workId].filter(function (d) { return d.trim() !== ""; });
            if (details.length > 0) {
                details.forEach(function (detail) {
                    lines.push("- " + detail);
                });
            }
        });

        // Reviewer ping (only once even if front + back)
        var hasCodeWork = CODE_WORK_IDS.some(function (id) {
            return state.works.hasOwnProperty(id);
        });

        if (hasCodeWork) {
            lines.push("");
            lines.push("\uD83D\uDD14 **Review :**");
            lines.push("Hop Hop Hop <@" + CONFIG.reviewer.discordId + "> il faut que tu check la pull request");
        }

        // Channel ping
        if (CONFIG.channelMembers.length > 0) {
            lines.push("");
            var mentions = CONFIG.channelMembers.map(function (id) {
                return "<@" + id + ">";
            }).join(" ");
            lines.push(mentions);
        }

        return lines.join("\n");
    }

    // ── Live preview ────────────────────────────────────────────

    function buildPreviewText() {
        var selectedWorkIds = Object.keys(state.works);

        if (!state.person && selectedWorkIds.length === 0) {
            return "";
        }

        var lines = [];

        lines.push("\uD83E\uDDFE Rapport d'activit\u00E9");
        lines.push("\uD83D\uDCC5 (date et heure de l'envoi)");
        lines.push("");

        if (state.person) {
            lines.push("\uD83D\uDC64 Personne : " + state.person);
        } else {
            lines.push("\uD83D\uDC64 Personne : ...");
        }

        if (selectedWorkIds.length > 0) {
            lines.push("");
            lines.push("\uD83D\uDD27 Travaux :");

            selectedWorkIds.forEach(function (workId) {
                var label = workLabelMap[workId];
                if (!label) return;

                lines.push("");
                lines.push("\u25B6 " + label);

                var details = state.works[workId].filter(function (d) { return d.trim() !== ""; });
                details.forEach(function (detail) {
                    lines.push("  - " + detail);
                });
            });
        }

        var hasCodeWork = CODE_WORK_IDS.some(function (id) {
            return state.works.hasOwnProperty(id);
        });

        if (hasCodeWork) {
            lines.push("");
            lines.push("\uD83D\uDD14 Review :");
            lines.push("Hop Hop Hop @" + CONFIG.reviewer.name + " il faut que tu check la pull request");
        }

        if (CONFIG.channelMembers.length > 0) {
            lines.push("");
            lines.push(CONFIG.channelMembers.map(function () { return "@membre"; }).join(" "));
        }

        return lines.join("\n");
    }

    function updatePreview() {
        var text = buildPreviewText();
        if (!text) {
            messagePreview.innerHTML = '<p class="preview-empty">S\u00E9lectionnez une personne et des travaux pour voir l\u2019aper\u00E7u du message.</p>';
        } else {
            messagePreview.textContent = text;
        }
    }

    // ── Submission ──────────────────────────────────────────────

    function validate() {
        if (!state.person) return "Veuillez s\u00E9lectionner une personne.";

        var selectedWorks = Object.keys(state.works);
        if (selectedWorks.length === 0) return "Veuillez s\u00E9lectionner au moins un travail.";

        return null;
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = type;
        setTimeout(function () {
            statusMessage.className = "hidden";
        }, 5000);
    }

    function handleSubmit() {
        var error = validate();
        if (error) {
            showStatus(error, "error");
            return;
        }

        var content = buildDiscordMessage();

        sendBtn.disabled = true;
        sendBtn.textContent = "Envoi en cours...";

        fetch(CONFIG.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content })
        })
        .then(function (response) {
            if (!response.ok) throw new Error("Erreur HTTP " + response.status);
            showStatus("Rapport envoy\u00E9 avec succ\u00E8s !", "success");
            resetForm();
        })
        .catch(function (err) {
            showStatus("Erreur lors de l'envoi : " + err.message, "error");
        })
        .finally(function () {
            sendBtn.disabled = false;
            sendBtn.textContent = "Envoyer le rapport";
        });
    }

    function resetForm() {
        state.person = "";
        state.works = {};

        personSelect.value = "";

        var checkboxes = workCategories.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function (cb) { cb.checked = false; });

        workDetails.innerHTML = "";
        updatePreview();
    }

    // ── Start ───────────────────────────────────────────────────
    init();
})();
