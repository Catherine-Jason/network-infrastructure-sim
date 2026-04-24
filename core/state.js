// ===============================
// GLOBAL APPLICATION STATE
// ===============================

export const State = {
    // All devices in the simulation
    devices: [],

    // All links between devices
    links: [],

    // Currently loaded scenario
    currentScenario: null,

    // Scenario definitions loaded from JSON
    scenarioList: [],

    // UI state
    ui: {
        selectedDeviceId: null,
        terminalOpenFor: null,
        practiceModeActive: false,
        canvasNeedsRender: true
    },

    // Practice mode data
    practice: {
        items: [],
        currentIndex: 0,
        completed: false
    }
};

// ===============================
// STATE MUTATION HELPERS
// ===============================

export function resetState() {
    State.devices = [];
    State.links = [];
    State.currentScenario = null;

    State.ui.selectedDeviceId = null;
    State.ui.terminalOpenFor = null;
    State.ui.practiceModeActive = false;
    State.ui.canvasNeedsRender = true;

    State.practice.items = [];
    State.practice.currentIndex = 0;
    State.practice.completed = false;
}

export function addDevice(device) {
    State.devices.push(device);
    State.ui.canvasNeedsRender = true;
}

export function addLink(link) {
    State.links.push(link);
    State.ui.canvasNeedsRender = true;
}

export function getDeviceById(id) {
    return State.devices.find(d => d.id === id) || null;
}

export function getLinksForDevice(id) {
    return State.links.filter(l => l.a === id || l.b === id);
}

