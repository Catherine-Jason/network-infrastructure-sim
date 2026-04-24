// ==========================================
// SCENARIO ENGINE — LOAD + APPLY SCENARIOS
// ==========================================

import { State, resetState, addDevice, addLink } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";
import { createDevice } from "./deviceModel.js";

export async function loadScenarioList() {
    const res = await fetch("./scenarios/scenarioList.json");
    State.scenarioList = await res.json();
}

export async function loadScenario(id) {
    resetState();

    const res = await fetch(`./scenarios/${id}.json`);
    const scenario = await res.json();
    State.currentScenario = scenario;

    // Load devices
    for (const d of scenario.devices) {
        const dev = createDevice(d.type, d.name);
        dev.x = d.x;
        dev.y = d.y;

        // Apply interface configs
        if (d.interfaces) {
            for (const intf in d.interfaces) {
                Object.assign(dev.interfaces[intf], d.interfaces[intf]);
            }
        }

        // Apply PC config
        if (d.interface) {
            Object.assign(dev.interface, d.interface);
        }

        addDevice(dev);
    }

    // Load links
    for (const l of scenario.links) {
        addLink({
            id: l.id,
            a: l.a,
            b: l.b
        });
    }

    EventBus.emit("scenarioLoaded", scenario);
    EventBus.emit("canvasRender");
}

