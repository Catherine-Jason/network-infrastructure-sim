// ==========================================
// CANVAS RENDERER — AUTHORITATIVE
// ==========================================

import { State } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";
import { renderDevice } from "./deviceRenderer.js";
import { renderLink } from "./linkRenderer.js";

let canvas;
let ctx;

export function initCanvasRenderer() {
    canvas = document.getElementById("networkCanvas");
    ctx = canvas.getContext("2d");

    resize();
    window.addEventListener("resize", resize);

    // ✅ ALWAYS re-render when requested
    EventBus.on("canvasRender", render);

    // ✅ Initial render
    render();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function render() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links first (safe even if empty)
    for (const link of State.links) {
        renderLink(ctx, link);
    }

    // Draw devices
    for (const device of State.devices) {
        renderDevice(ctx, device);
    }
}
