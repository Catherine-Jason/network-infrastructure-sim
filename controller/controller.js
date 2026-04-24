// controller/controller.js
// Controller Layer — the brain of the simulator
// Handles UI events, engine calls, and scenario loading

import { State } from "../engine/state.js";
import { ScenarioEngine } from "../engine/scenarioEngine.js";
import { openInspector } from "../ui/inspectorUI.js";

export const Controller = {

    currentDevice: null,
    mode: null,

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

        if (this.mode === "ping") {
            if (!State.pingSourceId) {
                State.pingSourceId = hit.id;
            } else {
                State.pingTargetId = hit.id;
            }
            return;
        }

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
        this.mode = "ping";
        State.pingSourceId = null;
        State.pingTargetId = null;
    },

    loadScenario(scenario) {
        ScenarioEngine.load(scenario);
    },

    checkScenario() {
        return ScenarioEngine.validate();
    }
};

        if (State.mode === "ping") {
            if (!State.pingSourceId) {
                State.pingSourceId = hit.id;
            } else {
                State.pingTargetId = hit.id;
                startPing();
            }
            return;
        }

        if (State.selectedForLinkId && State.selectedForLinkId !== hit.id) {
            Engine.connect(State.selectedForLinkId, hit.id);
            State.selectedForLinkId = null;
        } else {
            State.selectedForLinkId = hit.id;
        }
    },

    startPingMode() {
        State.mode = "ping";
        State.pingSourceId = null;
        State.pingTargetId = null;
    }
};

