// ==========================================
// ROUTING ENGINE — STATIC + DYNAMIC ROUTES
// ==========================================

import { getDeviceById } from "../core/state.js";

export function handleRoutingCommand(deviceId, tokens) {
    const device = getDeviceById(deviceId);
    if (!device || device.type !== "router") return;

    // ip route 192.168.2.0 255.255.255.0 10.0.0.2
    if (tokens[0] === "ip" && tokens[1] === "route") {
        const [_, __, network, mask, nextHop] = tokens;

        device.routingTable.push({
            network,
            mask,
            nextHop
        });

        return "Static route added.";
    }

    // router rip
    if (tokens[0] === "router" && tokens[1] === "rip") {
        device.routingProtocol = "rip";
        return "RIP enabled.";
    }

    // network 192.168.1.0
    if (device.routingProtocol === "rip" && tokens[0] === "network") {
        if (!device.ripNetworks) device.ripNetworks = [];
        device.ripNetworks.push(tokens[1]);
        return "RIP network added.";
    }

    return null;
}

