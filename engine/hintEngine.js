// ==========================================
// HINT ENGINE — PROGRESSIVE HELP SYSTEM
// ==========================================

import { State } from "../core/state.js";
import { validateScenario } from "./scenarioValidator.js";
import { EventBus } from "../core/eventBus.js";

let wrongAttempts = 0;

export function initHintEngine() {
    EventBus.on("terminalCommand", () => {
        wrongAttempts++;

        if (wrongAttempts === 3) {
            showHint(1);
        }
        if (wrongAttempts === 6) {
            showHint(2);
        }
        if (wrongAttempts === 10) {
            showHint(3);
        }
    });

    EventBus.on("scenarioLoaded", () => {
        wrongAttempts = 0;
    });
}

function showHint(level) {
    const scenario = State.currentScenario;
    if (!scenario || !scenario.hints) return;

    const hint = scenario.hints[level - 1];
    if (!hint) return;

    EventBus.emit("popup", hint);
}

export function checkScenarioCompletion() {
    if (validateScenario()) {
        EventBus.emit("popup", "Scenario Completed!");
    }
}

