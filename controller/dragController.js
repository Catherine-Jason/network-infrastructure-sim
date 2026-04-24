// ==========================================
// DRAG CONTROLLER — MOVE DEVICES ON CANVAS
// ==========================================

import { State, getDeviceById } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

let dragging = null;
let offsetX = 0;
let offsetY = 0;

export function initDragController() {
    const canvas = document.getElementById("networkCanvas");

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
}

function onMouseDown(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    // Find clicked device
    for (const dev of State.devices) {
        if (Math.abs(dev.x - x) < 40 && Math.abs(dev.y - y) < 40) {
            dragging = dev;
            offsetX = x - dev.x;
            offsetY = y - dev.y;
            return;
        }
    }
}

function onMouseMove(e) {
    if (!dragging) return;

    dragging.x = e.offsetX - offsetX;
    dragging.y = e.offsetY - offsetY;

    EventBus.emit("canvasRender");
}

function onMouseUp() {
    dragging = null;
}

