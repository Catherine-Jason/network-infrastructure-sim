
// ===============================
// UTILITY FUNCTIONS
// ===============================

// Generate unique IDs for devices, links, etc.
export function uid(prefix = "id") {
    return prefix + "_" + Math.random().toString(36).substring(2, 10);
}

// Validate IPv4 format
export function isValidIP(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(p => {
        const n = Number(p);
        return n >= 0 && n <= 255 && String(n) === p;
    });
}

// Convert IP + mask to network address
export function networkAddress(ip, mask) {
    const ipParts = ip.split(".").map(Number);
    const maskParts = mask.split(".").map(Number);
    const net = ipParts.map((p, i) => p & maskParts[i]);
    return net.join(".");
}

// Check if two IPs are in the same subnet
export function sameSubnet(ip1, ip2, mask) {
    return networkAddress(ip1, mask) === networkAddress(ip2, mask);
}

// Deep clone objects safely
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Clamp a value between min/max
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Distance between two points (for link rendering)
export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}
