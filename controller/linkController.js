// ==========================================
// LINK CONTROLLER — CONNECT DEVICES
// ==========================================

import { State, addLink } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

let canvas;
let firstDevice = null;

export function initLinkController() {
    canvas = document.getElementById("networkCanvas");
    canvas.addEventListener("dblclick", onDoubleClick);
}

function onDoubleClick(e) {
    const device = findDeviceAt(e.clientX, e.clientY);
    if (!device) return;

    if (!firstDevice) {
        firstDevice = device;
        return;
    }

    if (firstDevice.id !== device.id) {
        addLink({
            id: "link_" + Math.random().toString(36).substring(2, 8),
            a: firstDevice.id,
            b: device.id
        });

        EventBus.emit("linkAdded");
        EventBus.emit("canvasRender");
    }

    firstDevice = null;
}

function findDeviceAt(x, y) {
    for (const d of State.devices) {
        const dx = x - d.x;
        const dy = y - d.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) return d;
    }
    return null;
}

