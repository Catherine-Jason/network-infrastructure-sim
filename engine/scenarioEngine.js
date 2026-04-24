import { State } from "./state.js";

export const ScenarioEngine = {
    current: null,
    progress: {},

    load(scenario) {
        this.current = scenario;
        this.progress = {};
    },

    // =========================
    // MAIN VALIDATION ENTRY
    // =========================
    validate() {
        if (!this.current) return false;

        const connOK = this.validateConnections();
        const stateOK = this.validateDeviceStates();

        return connOK && stateOK;
    },

    // =========================
    // CONNECTION RULES
    // =========================
    validateConnections() {
        const required = this.current.requiredConnections || [];

        return required.every(req => {
            return State.connections.some(c =>
                (c.from === req.from && c.to === req.to) ||
                (c.from === req.to && c.to === req.from)
            );
        });
    },

    // =========================
    // DEVICE STATE RULES
    // =========================
    validateDeviceStates() {
        const rules = this.current.requiredStates || [];

        return rules.every(rule => {
            const device = State.devices.find(d => d.id === rule.id);
            return device && device.state === rule.state;
        });
    },

    // =========================
    // PROGRESS TRACKING
    // =========================
    getProgress() {
        if (!this.current) return 0;

        const total =
            (this.current.requiredConnections?.length || 0) +
            (this.current.requiredStates?.length || 0);

        let correct = 0;

        // connections
        (this.current.requiredConnections || []).forEach(req => {
            const ok = State.connections.some(c =>
                (c.from === req.from && c.to === req.to) ||
                (c.from === req.to && c.to === req.from)
            );
            if (ok) correct++;
        });

        // states
        (this.current.requiredStates || []).forEach(rule => {
            const d = State.devices.find(x => x.id === rule.id);
            if (d && d.state === rule.state) correct++;
        });

        return total === 0 ? 0 : Math.floor((correct / total) * 100);
    }
};

import { State } from "./state.js";
import { ScenarioEngine } from "./scenarioEngine.js";

export const LearningEngine = {
    hintIndex: 0,
    lastProgress: 0,

    reset() {
        this.hintIndex = 0;
        this.lastProgress = 0;
    },

    // =========================
    // MAIN UPDATE LOOP
    // =========================
    update() {
        if (!ScenarioEngine.current) return;

        const progress = ScenarioEngine.getProgress();

        // detect stagnation
        if (progress === this.lastProgress) {
            this.triggerHint();
        }

        this.lastProgress = progress;

        if (progress === 100) {
            this.showSuccess();
        }
    },

    // =========================
    // HINT SYSTEM
    // =========================
    triggerHint() {
        const scenario = ScenarioEngine.current;
        if (!scenario?.hints) return;

        const hint = scenario.hints[this.hintIndex % scenario.hints.length];

        this.showPopup("Hint", hint);

        this.hintIndex++;
    },

    // =========================
    // FAILURE EXPLANATION
    // =========================
    explainFailure() {
        const s = ScenarioEngine.current;
        if (!s) return;

        let msg = "Check your configuration and connections.";

        if (!ScenarioEngine.validateConnections()) {
            msg = "Missing or incorrect network connections.";
        } else if (!ScenarioEngine.validateDeviceStates()) {
            msg = "One or more devices are not correctly configured.";
        }

        this.showPopup("Issue Detected", msg);
    },

    // =========================
    // SUCCESS
    // =========================
    showSuccess() {
        const s = ScenarioEngine.current;
        if (!s) return;

        this.showPopup("Success", s.successMessage || "Scenario complete!");
    },

    // =========================
    // UI POPUP
    // =========================
    showPopup(title, message) {
        const popup = document.getElementById("hintPopup");

        document.getElementById("hintText").innerHTML =
            `<b>${title}</b><br><br>${message}`;

        popup.classList.remove("hidden");
    }
};
