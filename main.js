// ==========================================
// MAIN APP — INITIALIZE EVERYTHING
// ==========================================

console.log("✅ main.js is running");

import { initController } from "./controller/controller.js";
import { initCanvasRenderer } from "./ui/canvasRenderer.js";
import { initDragController } from "./controller/dragController.js";
import { initClickController } from "./controller/clickController.js";
import { initLinkController } from "./controller/linkController.js";
import { initTerminalController } from "./controller/terminalController.js";

import { initTerminalUI } from "./ui/terminalUI.js";
import { initInspectorUI } from "./ui/inspectorUI.js";
import { initControlsUI } from "./ui/controlsUI.js";
import { initPopupUI } from "./ui/popupUI.js";
import { initPracticeUI } from "./ui/practiceUI.js";

import { initHintEngine } from "./engine/hintEngine.js";
import { loadScenarioList, loadScenario } from "./engine/scenarioEngine.js";
import { EventBus } from "./core/eventBus.js";

async function init() {
    // UI
    initCanvasRenderer();
    initTerminalUI();
    initInspectorUI();
    initControlsUI();
    initPopupUI();
    initPracticeUI();
    
    // Controller (THE BRAIN)
    initController();
    
    // Controllers
    initDragController();
    initClickController();
    initLinkController();
    initTerminalController();

    // Engines
    initHintEngine();

    // Load scenario list
    await loadScenarioList();

    // Auto-load practice mode (scenario 0)
    await loadScenario("scenario0_practice");

    // Popup listener
    EventBus.on("popup", msg => {
        const popup = document.getElementById("popup");
        popup.innerHTML = msg;
        popup.style.display = "block";
        setTimeout(() => popup.style.display = "none", 2500);
    });
}

init();
