// ==========================================
// CONTROLS UI — DEVICE PALETTE
// ==========================================

import { createDevice } from "../engine/deviceModel.js";
import { addDevice } from "../core/state.js";
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

    addDevice(device);
    EventBus.emit("deviceAdded", device);
    EventBus.emit("canvasRender");
}

