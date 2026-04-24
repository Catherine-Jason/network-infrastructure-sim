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
