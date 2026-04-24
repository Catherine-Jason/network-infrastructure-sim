// controller/controller.js
// Controller Layer — the brain of the simulator
// Handles UI events, engine calls, and scenario loading

import { State } from "../engine/state.js";
import { Engine } from "../engine/engine.js";
import { startPing } from "../engine/ping.js";

export const Controller = {

    addDevice(type) {
        Engine.addDevice(type, 200 + Math.random()*300, 200);
    },

    handleCanvasClick(x, y) {
        const hit = Engine.getDeviceAt(x, y);

        if (!hit) {
            State.selectedForLinkId = null;
            return;
        }

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

