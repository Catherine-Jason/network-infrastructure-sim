// ==========================================
// CLICK CONTROLLER — SELECT DEVICES
// ==========================================

import { State } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

let canvas;

export function initClickController() {
    canvas = document.getElementById("networkCanvas");
    canvas.addEventListener("click", onClick);
}

function onClick(e) {
    const device = findDeviceAt(e.offsetX, e.offsetY);

    if (device) {
        // ❗ go through controller system
        EventBus.emit("requestSelectDevice", device.id);
    }
}

function findDeviceAt(x, y) {
    for (const d of State.devices) {
        const dx = x - d.x;
        const dy = y - d.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) return d;
    }
    return null;
}
