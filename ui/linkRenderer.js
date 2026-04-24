// ==========================================
// LINK RENDERER — CABLE LINES
// ==========================================

import { State } from "../core/state.js";
import { getDeviceById } from "../core/state.js";

export function renderLink(ctx, link) {
    const devA = getDeviceById(link.a);
    const devB = getDeviceById(link.b);

    if (!devA || !devB) return;

    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(devA.x, devA.y);
    ctx.lineTo(devB.x, devB.y);
    ctx.stroke();
}
