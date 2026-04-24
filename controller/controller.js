// controller/controller.js
// Controller Layer — the “brain” of the simulator
// This file connects user input (mouse, buttons)
// to the simulation engines and the global State.

// ─────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────

import { State } from "../engine/state.js";
import { ScenarioEngine } from "../engine/scenarioEngine.js";
import { LearningEngine } from "../engine/learningEngine.js";
import { startPing } from "../engine/ping.js";
import { openInspector } from "../ui/inspectorUI.js";

// ─────────────────────────────────────────────
// Controller Object (single exported API)
// ─────────────────────────────────────────────

export const Controller = {

    // The currently selected device object
    currentDevice: null,

    // Current interaction mode: "select" | "ping"
    mode: "select",

    // ─────────────────────────────────────────
    // Device Creation
    // ─────────────────────────────────────────
    addDevice(type) {
        State.devices.push({
            id: Date.now(),          // Simple unique ID
            type,                   // router | switch | pc
            x: 200,
            y: 200,
            radius: 30,
            state: "unconfigured"
        });
    },

    // ─────────────────────────────────────────
    // Mouse Click Handling
    // ─────────────────────────────────────────
    handleClick(x, y) {

        // Find the device under the cursor (if any)
        const hit = State.devices.find(d =>
            Math.hypot(d.x - x, d.y - y) < d.radius
        );

        if (!hit) return;

        // ───── Ping Mode ─────
        // First click = source, second click = target
        if (this.mode === "ping") {

            if (!State.pingSourceId) {
                State.pingSourceId = hit.id;
            } else {
                State.pingTargetId = hit.id;

                // Start the actual ping simulation
                startPing(State.pingSourceId, State.pingTargetId);

                // Exit ping mode automatically
                this.mode = "select";
            }
            return;
        }

        // ───── Normal Selection Mode ─────
        this.currentDevice = hit;
        State.selectedDeviceId = hit.id;

        // Open the inspector UI for the selected device
        openInspector(hit);
    },

    // ─────────────────────────────────────────
    // Mouse Hover Handling
    // ─────────────────────────────────────────
    handleMouseMove(x, y) {

        const hit = State.devices.find(d =>
            Math.hypot(d.x - x, d.y - y) < d.radius
        );

        // Used by the canvas renderer for hover glow
        State.hoverDeviceId = hit ? hit.id : null;
    },

    // ─────────────────────────────────────────
    // Ping Mode Entry Point
    // ─────────────────────────────────────────
    startPingMode() {
        this.mode = "ping";
        State.pingSourceId = null;
        State.pingTargetId = null;
    },

    // ─────────────────────────────────────────
    // Scenario Handling
    // ─────────────────────────────────────────
    loadScenario(scenario) {
        ScenarioEngine.load(scenario);

        // Reset hint / progress tracking
        LearningEngine.reset();
    },

    // ─────────────────────────────────────────
    // Scenario Validation
    // ─────────────────────────────────────────
    checkScenario() {
        return ScenarioEngine.validate();
    }
};
