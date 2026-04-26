// ==========================================
// CONTROLS UI — DEVICE PALETTE (UI ONLY)
// ==========================================

import { createDevice } from "../engine/deviceModel.js";
import { EventBus } from "../core/eventBus.js";

export function initControlsUI() {
    document.getElementById("addRouter").onclick = () => add("router");
    document.getElementById("addSwitch").onclick = () => add("switch");
    document.getElementById("addPC").onclick = () => add("pc");
    document.getElementById("addCloud").onclick = () => add("cloud");
}

function add(type) {
    const device = createDevice(type, type.toUpperCase());

    device.x = 150 + Math.random() * 200;
    device.y = 150 + Math.random() * 200;

    // ❗ send to controller instead of mutating state
    EventBus.emit("requestAddDevice", device);
}
