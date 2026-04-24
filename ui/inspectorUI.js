// ==========================================
// INSPECTOR UI — SHOW DEVICE DETAILS
// ==========================================

import { EventBus } from "../core/eventBus.js";
import { getDeviceById } from "../core/state.js";

let panel;

export function initInspectorUI() {
    panel = document.getElementById("inspectorPanel");

    EventBus.on("deviceSelected", device => {
        renderInspector(device);
    });
}

function renderInspector(device) {
    panel.innerHTML = `
        <h3>${device.name}</h3>
        <p>Type: ${device.type}</p>
        <p>ID: ${device.id}</p>
        <hr>
        ${renderInterfaces(device)}
    `;
}

function renderInterfaces(device) {
    if (!device.interfaces) return "<p>No interfaces</p>";

    let html = "<h4>Interfaces</h4>";

    for (const name in device.interfaces) {
        const intf = device.interfaces[name];
        html += `
            <div class="intf">
                <strong>${name}</strong><br>
                IP: ${intf.ip || "none"}<br>
                Mask: ${intf.mask || "none"}<br>
                VLAN: ${intf.vlan || "none"}<br>
                Trunk: ${intf.trunk ? "yes" : "no"}<br>
            </div>
        `;
    }

    return html;
}
