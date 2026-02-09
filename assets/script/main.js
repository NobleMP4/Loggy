/**
 * Loggy — Main application logic
 */

(function () {
    "use strict";

    // ── DOM references ──────────────────────────────────────────
    const personSelect = document.getElementById("person-select");
    const workCheckboxes = document.getElementById("work-checkboxes");
    const workDetails = document.getElementById("work-details");
    const reviewerSection = document.getElementById("reviewer-section");
    const reviewerSelect = document.getElementById("reviewer-select");
    const form = document.getElementById("loggy-form");
    const sendBtn = document.getElementById("send-btn");
    const statusMessage = document.getElementById("status-message");

    // ── Application state ───────────────────────────────────────
    // { wireframe: ["detail1", "detail2"], code_front: ["detail1"], ... }
    const state = {
        person: "",
        works: {},
        reviewer: ""
    };

    // Work types that require a reviewer
    const CODE_WORK_IDS = ["code_front", "code_back"];

    // ── Initialization ──────────────────────────────────────────

    function init() {
        populatePersons();
        populateWorkCheckboxes();
        populateReviewers();
        bindEvents();
    }

    function populatePersons() {
        CONFIG.persons.forEach(function (name) {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            personSelect.appendChild(option);
        });
    }

    function populateWorkCheckboxes() {
        CONFIG.workTypes.forEach(function (work) {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = work.id;
            checkbox.name = "works";

            const span = document.createElement("span");
            span.textContent = work.label;

            label.appendChild(checkbox);
            label.appendChild(span);
            workCheckboxes.appendChild(label);
        });
    }

    function populateReviewers() {
        CONFIG.reviewers.forEach(function (reviewer) {
            const option = document.createElement("option");
            option.value = reviewer.discordId;
            option.textContent = reviewer.name;
            reviewerSelect.appendChild(option);
        });
    }

    // ── Event binding ───────────────────────────────────────────

    function bindEvents() {
        personSelect.addEventListener("change", function () {
            state.person = this.value;
        });

        workCheckboxes.addEventListener("change", function (e) {
            if (e.target.type !== "checkbox") return;
            handleWorkToggle(e.target.value, e.target.checked);
        });

        reviewerSelect.addEventListener("change", function () {
            state.reviewer = this.value;
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
        updateReviewerVisibility();
    }

    function renderDetailSection(workId) {
        const workType = CONFIG.workTypes.find(function (w) { return w.id === workId; });
        if (!workType) return;

        const section = document.createElement("section");
        section.className = "work-detail-section";
        section.dataset.workId = workId;

        const title = document.createElement("h3");
        title.textContent = workType.label;
        section.appendChild(title);

        const entriesContainer = document.createElement("div");
        entriesContainer.className = "entries-container";
        section.appendChild(entriesContainer);

        renderDetailEntries(workId, entriesContainer);

        const addBtn = document.createElement("button");
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
            const entry = document.createElement("div");
            entry.className = "detail-entry";

            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Détail du travail...";
            input.value = value;
            input.addEventListener("input", function () {
                state.works[workId][index] = this.value;
            });

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "btn-remove";
            removeBtn.textContent = "X";
            removeBtn.addEventListener("click", function () {
                state.works[workId].splice(index, 1);
                if (state.works[workId].length === 0) {
                    state.works[workId].push("");
                }
                renderDetailEntries(workId, container);
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

    function updateReviewerVisibility() {
        var needsReviewer = CODE_WORK_IDS.some(function (id) {
            return state.works.hasOwnProperty(id);
        });
        if (needsReviewer) {
            reviewerSection.classList.remove("hidden");
        } else {
            reviewerSection.classList.add("hidden");
            reviewerSelect.value = "";
            state.reviewer = "";
        }
    }

    // ── Message building ────────────────────────────────────────

    function buildDiscordMessage() {
        var lines = [];

        lines.push("**\uD83E\uDDFE Loggy \u2014 Rapport d'activit\u00E9**");
        lines.push("");
        lines.push("\uD83D\uDC64 **Personne :** " + state.person);
        lines.push("");
        lines.push("\uD83D\uDD27 **Travaux :**");

        var selectedWorkIds = Object.keys(state.works);
        selectedWorkIds.forEach(function (workId) {
            var workType = CONFIG.workTypes.find(function (w) { return w.id === workId; });
            if (!workType) return;

            lines.push("");
            lines.push("\u25B6 **" + workType.label + "**");

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

        if (hasCodeWork && state.reviewer) {
            lines.push("");
            lines.push("\uD83D\uDD14 **Review :**");
            lines.push("Hop Hop Hop <@" + state.reviewer + "> il faut que tu v\u00E9rifies la pull request");
        }

        // Channel ping
        if (CONFIG.channelMembers.length > 0) {
            lines.push("");
            lines.push("\uD83D\uDC65 **Channel :**");
            var mentions = CONFIG.channelMembers.map(function (id) {
                return "<@" + id + ">";
            }).join(" ");
            lines.push(mentions);
        }

        return lines.join("\n");
    }

    // ── Submission ──────────────────────────────────────────────

    function validate() {
        if (!state.person) return "Veuillez s\u00E9lectionner une personne.";

        var selectedWorks = Object.keys(state.works);
        if (selectedWorks.length === 0) return "Veuillez s\u00E9lectionner au moins un travail.";

        var hasCodeWork = CODE_WORK_IDS.some(function (id) {
            return state.works.hasOwnProperty(id);
        });
        if (hasCodeWork && !state.reviewer) return "Veuillez s\u00E9lectionner un reviewer.";

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
        state.reviewer = "";

        personSelect.value = "";
        reviewerSelect.value = "";

        var checkboxes = workCheckboxes.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function (cb) { cb.checked = false; });

        workDetails.innerHTML = "";
        reviewerSection.classList.add("hidden");
    }

    // ── Start ───────────────────────────────────────────────────
    init();
})();
