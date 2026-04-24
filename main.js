import { Controller } from "./controller/controller.js";
import { draw } from "./ui/canvasRenderer.js";
import { State } from "./engine/state.js";
import { LearningEngine } from "./engine/learningEngine.js";

function loop() {
    draw(ctx);

    LearningEngine.update(); // 👈 THIS IS THE KEY ADDITION

    requestAnimationFrame(loop);
}

window.onload = () => {
    const canvas = document.getElementById("networkCanvas");
};
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

loop();

// EVENTS → CONTROLLER ONLY
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();

    Controller.handleClick(
        e.clientX - rect.left,
        e.clientY - rect.top
    );
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

    Controller.handleMouseMove(
        e.clientX - rect.left,
        e.clientY - rect.top
    );
});

// UI hooks
window.addDevice = Controller.addDevice;
window.startPingMode = Controller.startPingMode;
