// ==========================================
// VLAN ENGINE — VLAN CREATION + TRUNKING
// ==========================================

import { EventBus } from "../core/eventBus.js";
import { getDeviceById } from "../core/state.js";

export function handleVlanCommand(deviceId, tokens) {
    const device = getDeviceById(deviceId);
    if (!device || device.type !== "switch") return;

    // vlan 10
    if (tokens[0] === "vlan" && tokens[1]) {
        const vlanId = tokens[1];
        device.vlanTable[vlanId] = { name: `VLAN${vlanId}` };
        device.configLog.push(`vlan ${vlanId}`);
        return "VLAN created.";
    }

    // interface f0/1
    if (tokens[0] === "interface") {
        return `ENTER_INTERFACE_MODE:${tokens[1]}`;
    }

    return null;
}

export function handleInterfaceVlan(deviceId, intfName, tokens) {
    const device = getDeviceById(deviceId);
    const intf = device.interfaces[intfName];
    if (!intf) return;

    // switchport mode access
    if (tokens.join(" ") === "switchport mode access") {
        intf.trunk = false;
        return "Access mode set.";
    }

    // switchport access vlan 10
    if (tokens[0] === "switchport" && tokens[1] === "access" && tokens[2] === "vlan") {
        intf.vlan = tokens[3];
        return `Assigned

