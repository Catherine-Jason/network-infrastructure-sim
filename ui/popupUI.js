import { State } from "../engine/state.js";
import { ScenarioEngine } from "../engine/scenarioEngine.js";

// ==================
// HINT POPUP
// ==================
export function closeHint() {
    const popup = document.getElementById("hintPopup");
    popup.classList.add("hidden");
    popup.classList.remove("visible");
}

// ==================
// STRUGGLE POPUP
// ==================
export function closeStruggle() {
    const popup = document.getElementById("strugglePopup");
    popup.classList.add("hidden");
    popup.classList.remove("visible");
}

// ==================
// SUCCESS POPUP / RESTART
// ==================
export function restartScenario() {
    const popup = document.getElementById("successPopup");
    popup.classList.add("hidden");
    popup.classList.remove("visible");

    // Reset state
    State.devices = [];
    State.connections = [];
    State.deviceMap.clear();
    State.packet = null;
    State.selectedDeviceId = null;
    State.pingSourceId = null;
    State.pingTargetId = null;

    // Reload scenario
    if (ScenarioEngine.current) {
        ScenarioEngine.load(ScenarioEngine.current);
    }
}
