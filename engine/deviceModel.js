
// ==========================================
// DEVICE MODEL — CORE DATA STRUCTURES
// ==========================================

import { uid } from "../core/utils.js";

// Device Types:
// "router", "switch", "pc", "cloud"

// Interface Types:
// "ethernet", "serial", "subinterface", "tunnel"

// Encapsulation Types:
// "dot1q", "ppp", "hdlc", "none"

// ==========================================
// INTERFACE MODEL
// ==========================================

export function createInterface(name, type = "ethernet") {
    return {
        name,
        type,                   // ethernet, serial, subinterface, tunnel
        enabled: true,
        ip: null,               // "192.168.1.1"
        mask: null,             // "255.255.255.0"
        vlan: null,             // access VLAN
        trunk: false,           // trunk mode
        allowedVlans: [],       // trunk allowed list
        encapsulation: "none",  // dot1q, ppp, hdlc
        parent: null,           // for subinterfaces
        subinterfaces: []       // for router-on-a-stick
    };
}

// ==========================================
// ROUTER MODEL
// ==========================================

export function createRouter(name) {
    return {
        id: uid("router"),
        type: "router",
        name,
        x: 200,
        y: 200,

        interfaces: {
            "g0/0": createInterface("g0/0"),
            "g0/1": createInterface("g0/1")
        },

        routingTable: [], // { network, mask, nextHop }

        arpTable: [],     // { ip, mac }

        configLog: []     // CLI history
    };
}

// ==========================================
// SWITCH MODEL
// ==========================================

export function createSwitch(name) {
    const interfaces = {};

    // Create 24 FastEthernet ports
    for (let i = 1; i <= 24; i++) {
        interfaces[`f0/${i}`] = createInterface(`f0/${i}`);
    }

    return {
        id: uid("switch"),
        type: "switch",
        name,
        x: 200,
        y: 200,

        interfaces,

        vlanTable: {
            // Example:
            // 10: { name: "Sales" }
        },

        macTable: [], // { mac, port }

        configLog: []
    };
}

// ==========================================
// PC MODEL
// ==========================================

export function createPC(name) {
    return {
        id: uid("pc"),
        type: "pc",
        name,
        x: 200,
        y: 200,

        interface: {
            ip: null,
            mask: null,
            gateway: null,
            vlan: null
        },

        arpTable: [],

        configLog: []
    };
}

// ==========================================
// CLOUD MODEL
// ==========================================

export function createCloud(name) {
    return {
        id: uid("cloud"),
        type: "cloud",
        name,
        x: 200,
        y: 200,

        interfaces: {
            "eth0": createInterface("eth0"),
            "eth1": createInterface("eth1"),
            "eth2": createInterface("eth2")
        },

        mode: "transparent", 
        // transparent = pass-through
        // routing = cloud routes between networks
        // vlan-translate = remap VLANs
        // vpn = tunnel endpoints

        vlanTranslation: {}, 
        // Example: { "10": "100", "20": "200" }

        routingTable: [],

        configLog: []
    };
}

// ==========================================
// DEVICE FACTORY
// ==========================================

export function createDevice(type, name) {
    switch (type) {
        case "router": return createRouter(name);
        case "switch": return createSwitch(name);
        case "pc":     return createPC(name);
        case "cloud":  return createCloud(name);
        default:
            throw new Error("Unknown device type: " + type);
    }
}
