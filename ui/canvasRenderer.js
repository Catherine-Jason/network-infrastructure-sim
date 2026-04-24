// Canvas rendering system — draws devices, links, grid, and packet

import { State } from "../engine/state.js";
import { drawPacket } from "../engine/ping.js";

export function draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawGrid(ctx);
    drawConnections(ctx);
    drawDevices(ctx);
    drawPacket(ctx); // packet animation
}

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

function drawConnections(ctx) {
    ctx.strokeStyle = "#00aaff";
    ctx.lineWidth = 3;

    State.connections.forEach(c => {
        const a = State.devices.find(d => d.id === c.from);
        const b = State.devices.find(d => d.id === c.to);
        if (!a || !b) return;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    });
}

function drawDevices(ctx) {
    State.devices.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#1e2430";
        ctx.fill();

        ctx.strokeStyle = "#00ccff";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(d.type, d.x, d.y + 6);
    });
}

