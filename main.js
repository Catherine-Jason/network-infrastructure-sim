// ui/canvasRenderer.js

import { State } from "../engine/state.js";
import { drawPacket } from "../engine/ping.js";

// ✅ ICONS (your version)
const icons = {
    router: "🛜",
    switch: "🖧",
    pc: "🖥️"
};

// ✅ STATE COLORS
const stateColors = {
    unconfigured: "#444a5a",
    "in-progress": "#e6c300",
    configured: "#00ff88",
    error: "#ff4444"
};

export function draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawConnections(ctx);
    drawDevices(ctx);
    drawPacket(ctx); // keep using engine version
}

// =========================
// CONNECTIONS
// =========================
function drawConnections(ctx) {
    ctx.strokeStyle = "#00ccff";
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

// =========================
// DEVICES (UPDATED WITH ICONS)
// =========================
function drawDevices(ctx) {
    State.devices.forEach(d => {

        // Device body
        ctx.beginPath();
        ctx.fillStyle = stateColors[d.state] || "#444";
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow border
        ctx.strokeStyle = "#00eaff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon
        ctx.fillStyle = "#00eaff";
        ctx.font = "22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icons[d.type] || "❓", d.x, d.y);
    });
}
// =========================
// CANVAS SETUP
// =========================
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas properly
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// =========================
// RENDER LOOP
// =========================
function gameLoop() {
    draw(ctx);
    requestAnimationFrame(gameLoop);
}

gameLoop();

// =========================
// INPUT HANDLING
// =========================

// Canvas click → Controller
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    Controller.handleCanvasClick(x, y);
});

// =========================
// TOOLBAR BUTTONS
// =========================

// Add device buttons
window.addDevice = (type) => {
    Controller.addDevice(type);
};

// Start ping mode
window.startPingMode = () => {
    Controller.startPingMode();
};

// =========================
// OPTIONAL: KEYBOARD SHORTCUTS (nice UX)
// =========================

window.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
        case "p":
            Controller.startPingMode();
            break;
        case "r":
            Controller.addDevice("router");
            break;
        case "s":
            Controller.addDevice("switch");
            break;
        case "c":
            Controller.addDevice("pc");
            break;
    }
});
