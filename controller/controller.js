// ==========================================
// MAIN CONTROLLER — THE BRAIN
// ==========================================

import { State, addDevice } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

export function initController() {

    // Add device
    EventBus.on("requestAddDevice", device => {
        addDevice(device);
        EventBus.emit("canvasRender");
    });

    // Select device
    EventBus.on("requestSelectDevice", deviceId => {
        State.ui.selectedDeviceId = deviceId;

        const device = State.devices.find(d => d.id === deviceId);

        EventBus.emit("deviceSelected", device);
        EventBus.emit("canvasRender");
    });

}
