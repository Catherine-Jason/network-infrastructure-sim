import { draw } from "./ui/canvasRenderer.js";
import { Controller } from "./controller/controller.js";

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
