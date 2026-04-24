// ==========================================
// CANVAS RENDERER — MAIN DRAW LOOP
// ==========================================

import { State } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";
import { renderDevice } from "./deviceRenderer.js";
import { renderLink } from "./linkRenderer.js";

let canvas, ctx;

export function initCanvasRenderer() {
    canvas = document.getElementById("networkCanvas");
    ctx = canvas.getContext("2d");

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    EventBus.on("canvasRender", render);
    render();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

export function render() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links first (under devices)
    for (const link of State.links) {
        renderLink(ctx, link);
    }

    // Draw devices
    for (const device of State.devices) {
        renderDevice(ctx, device);
    }
}
