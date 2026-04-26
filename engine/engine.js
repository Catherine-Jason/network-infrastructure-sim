import { State } from "../core/state.js";

export const Engine = {

    reset() {
        State.devices = [];
        State.connections = [];
        State.packet = null;
        State.selectedDeviceId = null;
        State.selectedForLinkId = null;
    },

    addDevice(device) {
        State.devices.push(device);
    },

    addConnection(connection) {
        State.connections.push(connection);
    }

};
