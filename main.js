import { Controller } from "./controller/controller.js";
import { draw } from "./ui/canvasRenderer.js";
import { State } from "./engine/state.js";
import { LearningEngine } from "./engine/learningEngine.js";
import { ScenarioEngine } from "./engine/scenarioEngine.js";
import { closeHint, closeStruggle, restartScenario } from "./ui/popupUI.js";

let ctx;

function loop() {
    draw(ctx);
    LearningEngine.update();
    requestAnimationFrame(loop);
}

window.onload = () => {
    const canvas = document.getElementById("networkCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Load scenario list
    loadScenarioList();

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
};

// Load scenarios into dropdown
async function loadScenarioList() {
    try {
        const response = await fetch("./scenarios/scenarioList.json");
        const list = await response.json();
        const select = document.getElementById("scenarioSelect");

        for (const scenario of list) {
            const option = document.createElement("option");
            option.value = scenario.file;
            option.textContent = scenario.name;
            select.appendChild(option);
        }

        select.addEventListener("change", (e) => {
            if (e.target.value) {
                loadScenarioFile(e.target.value);
            }
        });
    } catch (err) {
        console.error("Failed to load scenario list:", err);
    }
}

// Load individual scenario file
async function loadScenarioFile(filename) {
    try {
        const response = await fetch(`./scenarios/${filename}`);
        const scenario = await response.json();
        Controller.loadScenario(scenario);
    } catch (err) {
        console.error(`Failed to load scenario ${filename}:`, err);
    }
}

// UI hooks
window.addDevice = Controller.addDevice.bind(Controller);
window.startPingMode = Controller.startPingMode.bind(Controller);
window.closeHint = closeHint;
window.closeStruggle = closeStruggle;
window.restartScenario = restartScenario;

// Inspector functions (lazy import to avoid circular deps)
window.updateInspectorState = async (state) => {
    const { updateInspectorState } = await import("./ui/inspectorUI.js");
    updateInspectorState(state);
};

window.closeInspector = async () => {
    const { closeInspector } = await import("./ui/inspectorUI.js");
    closeInspector();
};
