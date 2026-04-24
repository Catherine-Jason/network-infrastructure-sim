// ==========================================
// TERMINAL UI — CLI WINDOW
// ==========================================

import { State } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

let terminalEl, inputEl, outputEl;

export function initTerminalUI() {
    terminalEl = document.getElementById("terminal");
    inputEl = document.getElementById("terminalInput");
    outputEl = document.getElementById("terminalOutput");

    EventBus.on("terminalOpened", showTerminal);
    EventBus.on("terminalClosed", hideTerminal);

    inputEl.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            handleCommand(inputEl.value);
            inputEl.value = "";
        }
    });
}

function showTerminal(deviceId) {
    terminalEl.style.display = "block";
    outputEl.innerHTML = `Connected to device: ${deviceId}\n`;
    inputEl.focus();
}

function hideTerminal() {
    terminalEl.style.display = "none";
}

function handleCommand(cmd) {
    if (!cmd.trim()) return;

    outputEl.innerHTML += `> ${cmd}\n`;

    // Emit command for engines to process
    EventBus.emit("terminalCommand", {
        deviceId: State.ui.terminalOpenFor,
        command: cmd
    });

    outputEl.scrollTop = outputEl.scrollHeight;
}

