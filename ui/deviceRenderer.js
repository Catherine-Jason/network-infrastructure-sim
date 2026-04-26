// ==========================================
// DEVICE RENDERER — ICONS + LABELS
// ==========================================

import { State } from "../core/state.js";

const ICON_RADIUS = 24;

export function renderDevice(ctx, device) {
    const { x, y, type, name, id } = device;

    if (x == null || y == null) return;

    // Base color by type
    ctx.fillStyle = getDeviceColor(type);

    ctx.beginPath();
    ctx.arc(x, y, ICON_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Highlight if selected
    if (State.ui.selectedDeviceId === id) {
        ctx.strokeStyle = "#00eaff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, ICON_RADIUS + 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Device label
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y + ICON_RADIUS + 16);
}

function getDeviceColor(type) {
    switch (type) {
        case "router":
            return "#ff6b6b";
        case "switch":
            return "#4dabf7";
        case "pc":
            return "#51cf66";
        case "cloud":
            return "#ffd43b";
        default:
            return "#adb5bd";
    }
}
