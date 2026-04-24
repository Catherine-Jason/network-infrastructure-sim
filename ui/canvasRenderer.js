// Canvas rendering system — draws devices, links, grid, and packet

import { State } from "../engine/state.js";
import { drawPacket } from "../engine/ping.js";

const icons = {
    router: "🛜",
    switch: "🖧",
    pc: "🖥️"
};

const stateColors = {
    unconfigured: "#444a5a",
    "in-progress": "#e6c300",
    configured: "#00ff88",
    error: "#ff4444"
};

export function draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawGrid(ctx);
    drawConnections(ctx);
    drawDevices(ctx);
    drawPacket(ctx);
}

// =========================
// DEVICES (HOVER / SELECT / PING)
// =========================
function drawDevices(ctx) {
    for (const d of State.devices) {
        const isSelected   = State.selectedDeviceId === d.id;
        const isHover      = State.hoverDeviceId === d.id;
        const isPingSource = State.pingSourceId === d.id;
        const isPingTarget = State.pingTargetId === d.id;

        // Base device
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = stateColors[d.state] ?? "#444";
        ctx.fill();

        // Stroke priority
        if (isPingSource || isPingTarget) {
            ctx.strokeStyle = "#00ffff";
        } else if (isSelected) {
            ctx.strokeStyle = "#00ff88";
        } else if (isHover) {
            ctx.strokeStyle = "#00aaff";
        } else {
            ctx.strokeStyle = "#1e90ff";
        }

        ctx.lineWidth = (isSelected || isHover) ? 4 : 2;
        ctx.stroke();

        // Icon
        ctx.fillStyle = "#00eaff";
        ctx.font = "22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icons[d.type] ?? "❓", d.x, d.y);
    }
}

// =========================
// CONNECTIONS
// =========================
function drawConnections(ctx) {
    ctx.strokeStyle = "#00aaff";
    ctx.lineWidth = 3;

    for (const c of State.connections) {
        const a = State.deviceMap?.get(c.from) 
               ?? State.devices.find(d => d.id === c.from);
        const b = State.deviceMap?.get(c.to)
               ?? State.devices.find(d => d.id === c.to);

        if (!a || !b) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
}

// =========================
// GRID
// =========================
function drawGrid(ctx) {
    ctx.strokeStyle = "#2a2f3a";
    ctx.lineWidth = 1;

    for (let x = 0; x < ctx.canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < ctx.canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ctx.canvas.width, y);
        ctx.stroke();
    }
}
