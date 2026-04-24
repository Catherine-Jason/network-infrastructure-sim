// controller/controller.js
// Controller Layer — the brain of the simulator
// Handles UI events, engine calls, and scenario loading

import { State } from "../engine/state.js";
import { ScenarioEngine } from "../engine/scenarioEngine.js";
import { openInspector } from "../ui/inspectorUI.js";
import { LearningEngine } from "../engine/learningEngine.js";
import { startPing } from "../engine/ping.js";

export const Controller = {

    currentDevice: null,

    addDevice(type) {
        State.devices.push({
            id: Date.now(),
            type,
            x: 200,
            y: 200,
            radius: 30,
            state: "unconfigured"
        });
    },

    handleClick(x, y) {
        const hit = State.devices.find(d =>
            Math.hypot(d.x - x, d.y - y) < d.radius
        );

        if (!hit) return;

        // ✅ Ping mode
        if (State.mode === "ping") {
            if (!State.pingSourceId) {
                State.pingSourceId = hit.id;
            } else {
                State.pingTargetId = hit.id;

                // Run ping animation
                startPing(State.pingSourceId, State.pingTargetId);

                // Reset after ping (optional but cleaner UX)
                State.mode = null;
            }
            return;
        }

        // ✅ Normal selection
        this.currentDevice = hit;
        State.selectedDeviceId = hit.id;

        openInspector(hit);
    },

    handleMouseMove(x, y) {
        const hit = State.devices.find(d =>
            Math.hypot(d.x - x, d.y - y) < d.radius
        );

        State.hoverDeviceId = hit ? hit.id : null;
    },

    startPingMode() {
        State.mode = "ping";
        State.pingSourceId = null;
        State.pingTargetId = null;
    },

    loadScenario(scenario) {
        ScenarioEngine.load(scenario);
        LearningEngine.reset();
    },

    checkScenario() {
        return ScenarioEngine.validate();
    }
};
