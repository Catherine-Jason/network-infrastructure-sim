// ==========================================
// SUBINTERFACE ENGINE — ROUTER-ON-A-STICK
// ==========================================

import { getDeviceById } from "../core/state.js";

export function handleSubinterface(deviceId, tokens) {
    const device = getDeviceById(deviceId);
    if (!device || device.type !== "router") return;

    // interface g0/0.10
    if (tokens[0] === "interface" && tokens[1].includes(".")) {
        const [parent, vlan] = tokens[1].split(".");
        const intf = device.interfaces[parent];

        if (!intf) return "Invalid parent interface.";

        const sub = {
            name: tokens[1],
            type: "subinterface",
            vlan,
            ip: null,
            mask: null,
            encapsulation: "none",
            parent
        };

        intf.subinterfaces.push(sub);
        return `ENTER_SUBINTERFACE_MODE:${tokens[1]}`;
    }

    return null;
}

export function handleSubinterfaceConfig(deviceId, subName, tokens) {
    const device = getDeviceById(deviceId);

    const parentName = subName.split(".")[0];
    const parent = device.interfaces[parentName];
    const sub = parent.subinterfaces.find(s => s.name === subName);

    if (!sub) return;

    // encapsulation dot1q 10
    if (tokens[0] === "encapsulation" && tokens[1] === "dot1q") {
        sub.encapsulation = "dot1q";
        sub.vlan = tokens[2];
        return "Encapsulation set.";
    }

    // ip address X X
    if (tokens[0] === "ip" && tokens[1] === "address") {
        sub.ip = tokens[2];
        sub.mask = tokens[3];
        return "IP assigned.";
    }

    return null;
}

