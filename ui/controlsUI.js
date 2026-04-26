// ==========================================
// CONTROLS UI — DIRECT RENDER TEST
// ==========================================

import { createDevice } from "../engine/deviceModel.js";
import { addDevice } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

export function initControlsUI() {
    document.getElementById("addRouter").onclick = () => add("router");
}

function add(type) {
    const device = createDevice(type, type.toUpperCase());
    device.x = 300;
    device.y = 300;

    console.log("✅ TEST: adding device directly", device);

    addDevice(device);
    EventBus.emit("canvasRender");
}
