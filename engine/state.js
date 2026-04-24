export const State = {
    // Core data
    devices: [],
    connections: [],
    packet: null,

    // Cached lookups (performance critical)
    deviceMap: new Map(),

    // Selection / interaction
    selectedDeviceId: null,
    selectedForLinkId: null,
    hoverDeviceId: null,

    // Ping simulation
    pingSourceId: null,
    pingTargetId: null,

    // UI mode
    mode: "select"
};
