// ==========================================
// ARP ENGINE — RESOLVE MAC ADDRESSES
// ==========================================

import { getDeviceById } from "../core/state.js";

export function resolveArp(deviceId, targetIp) {
    const device = getDeviceById(deviceId);

    // Check ARP table
    const entry = device.arpTable.find(a => a.ip === targetIp);
    if (entry) return entry.mac;

    // If not found, generate a fake MAC
    const mac = randomMac();
    device.arpTable.push({ ip: targetIp, mac });
    return mac;
}

function randomMac() {
    return "AA:BB:" + Math.random().toString(16).substring(2, 6).toUpperCase();
}

