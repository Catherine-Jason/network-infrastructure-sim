// Inspector panel UI logic
import { State } from "../engine/state.js";

export function openInspector(device) {
    State.selectedDeviceId = device.id;

    const panel = document.getElementById("inspectorPanel");

    document.getElementById("inspType").textContent = device.type;
    document.getElementById("inspId").textContent = device.id;
    document.getElementById("inspState").textContent = device.state;

    panel.classList.add("visible");
    panel.classList.remove("hidden");
}

export function closeInspector() {
    const panel = document.getElementById("inspectorPanel");

    panel.classList.remove("visible");
    panel.classList.add("hidden");

    State.selectedDeviceId = null;
}

export function updateInspectorState(newState) {
    const device = State.devices.find(d => d.id === State.selectedDeviceId);
    if (!device) return;

    device.state = newState;

    // instantly refresh UI text
    document.getElementById("inspState").textContent = newState;
}
