import { State } from "../core/state.js";

export const Engine = {

    reset() {
        State.devices.length = 0;
        State.links.length = 0;
        State.packet = null;
        State.selectedDeviceId = null;
        State.selectedForLinkId = null;
    },

    addDevice(device) {
        State.devices.push(device);
    },

    addConnection(connection) {
        State.links.push(connection);
    }

};
