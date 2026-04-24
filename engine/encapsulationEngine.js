// ==========================================
// ENCAPSULATION ENGINE — PPP, HDLC, DOT1Q
// ==========================================

import { getDeviceById } from "../core/state.js";

export function handleEncapsulation(deviceId, tokens) {
    const device = getDeviceById(deviceId);

    // interface g0/0
    if (tokens[0] === "interface") {
        return `ENTER_INTERFACE_MODE:${tokens[1]}`;
    }

    // encapsulation ppp
    if (tokens[0] === "encapsulation") {
        return `Encapsulation set to ${tokens[1]}.`;
    }

    return null;
}

