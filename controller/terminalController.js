// ==========================================
// TERMINAL CONTROLLER — OPEN/CLOSE CLI
// ==========================================

import { State } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

export function initTerminalController() {
    EventBus.on("deviceSelected", device => {
        if (device.type === "router" || device.type === "switch" || device.type === "pc") {
            openTerminal(device.id);
        }
    });
}

export function openTerminal(deviceId) {
    State.ui.terminalOpenFor = deviceId;
    EventBus.emit("terminalOpened", deviceId);
}

export function closeTerminal() {
    State.ui.terminalOpenFor = null;
    EventBus.emit("terminalClosed");
}

