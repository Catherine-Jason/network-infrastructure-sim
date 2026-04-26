// ==========================================
// ENGINE — SINGLE SOURCE OF STATE MUTATION
// ==========================================

import { resetState, addDevice, addLink } from "../core/state.js";

export const Engine = {

    reset() {
        resetState();
    },

    addDevice(device) {
        addDevice(device);
    },

    addConnection(connection) {
        addLink(connection);
    }

};
