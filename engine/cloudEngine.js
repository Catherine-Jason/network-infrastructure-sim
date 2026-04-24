// ==========================================
// CLOUD ENGINE — TRANSPARENT / ROUTING / VLAN TRANSLATION
// ==========================================

import { getDeviceById } from "../core/state.js";
import { sameSubnet, networkAddress } from "../core/utils.js";

// Modes:
//  - "transparent"   → just passes frames through
//  - "routing"       → routes between networks
//  - "vlan-translate"→ rewrites VLAN IDs between sides

export function handleCloudCommand(deviceId, tokens) {
    const cloud = getDeviceById(deviceId);
    if (!cloud || cloud.type !== "cloud") return;

    // mode transparent | routing | vlan-translate
    if (tokens[0] === "mode") {
        const mode = tokens[1];
        if (["transparent", "routing", "vlan-translate"].includes(mode)) {
            cloud.mode = mode;
            return `Cloud mode set to ${mode}.`;
        }
        return "Invalid mode.";
    }

    // vlan-translate 10 100
    if (tokens[0] === "vlan-translate" && tokens[1] && tokens[2]) {
        const from = tokens[1];
        const to = tokens[2];
        cloud.vlanTranslation[from] = to;
        return `VLAN ${from} translated to ${to}.`;
    }

    // ip route X X X (for routing mode)
    if (cloud.mode === "routing" && tokens[0] === "ip" && tokens[1] === "route") {
        const [_, __, network, mask, nextHop] = tokens;
        cloud.routingTable.push({ network, mask, nextHop });
        return "Cloud static route added.";
    }

    return null;
}

// ==========================================
// CLOUD PATH LOGIC (USED BY PING/TRAFFIC)
// ==========================================

export function cloudForward(cloudId, srcIp, dstIp, vlan = null) {
    const cloud = getDeviceById(cloudId);
    if (!cloud) return { allowed: false, vlan };

    if (cloud.mode === "transparent") {
        // Just pass it through unchanged
        return { allowed: true, vlan };
    }

    if (cloud.mode === "vlan-translate" && vlan !== null) {
        const mapped = cloud.vlanTranslation[vlan] || vlan;
        return { allowed: true, vlan: mapped };
    }

    if (cloud.mode === "routing") {
        // Very simple: if any route matches dstIp network, allow
        for (const route of cloud.routingTable) {
            const dstNet = networkAddress(dstIp, route.mask);
            const routeNet = networkAddress(route.network, route.mask);
            if (dstNet === routeNet) {
                return { allowed: true, vlan };
            }
        }
        // No route → drop
        return { allowed: false, vlan };
    }

    return { allowed: true, vlan };
}

