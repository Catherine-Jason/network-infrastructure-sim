// ==========================================
// PING ENGINE — END-TO-END CONNECTIVITY
// ==========================================

import { State } from "../core/state.js";
import { sameSubnet } from "../core/utils.js";
import { getDeviceById } from "../core/state.js";

export function handlePing(deviceId, tokens) {
    const device = getDeviceById(deviceId);
    if (!device || device.type !== "pc") return;

    const targetIp = tokens[1];
    const sourceIp = device.interface.ip;
    const mask = device.interface.mask;

    // Same subnet?
    if (sameSubnet(sourceIp, targetIp, mask)) {
        return `Reply from ${targetIp}: bytes=32 time=1ms`;
    }

    // Otherwise assume routing works
    return `Reply from ${targetIp}: bytes=32 time=5ms`;
}

