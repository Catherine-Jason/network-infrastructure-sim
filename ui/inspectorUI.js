// Inspector panel UI logic

import { State } from "../engine/state.js";

export function openInspector(device) {
    const panel = document.getElementById("inspector");
    panel.classList.remove("hidden");

    document.getElementById("inspector-title").textContent = device.type;
    document.getElementById("inspector-id").textContent = device.id;
    document.getElementById("inspector-state").textContent = device.state;
}

export function closeInspector() {
    const panel = document.getElementById("inspector");
    panel.classList.add("hidden");
}

export function updateInspectorState(device) {
    const el = document.getElementById("inspector-state");
    if (el) el.textContent = device.state;
}

