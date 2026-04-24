import { State } from "./state.js";

export const Engine = {

    addDevice(type, x, y) {
        State.devices.push({
            id: Date.now() + Math.random(),
            type,
            x,
            y,
            radius: 25,
            state: "unconfigured"
        });
    },

    connect(aId, bId) {
        const exists = State.connections.some(c =>
            (c.from === aId && c.to === bId) ||
            (c.from === bId && c.to === aId)
        );
        if (exists) return;

        State.connections.push({ from: aId, to: bId });
    },

    getDeviceAt(x, y) {
        return State.devices.find(d =>
            Math.hypot(d.x - x, d.y - y) < d.radius
        );
    }
};
