
// ===============================
// SIMPLE EVENT BUS (PUB/SUB)
// ===============================

const listeners = {};

export const EventBus = {
    on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
    },

    off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data = null) {
        if (!listeners[event]) return;
        for (const cb of listeners[event]) cb(data);
    }
};

// Common events used across the simulator:
// "deviceAdded"
// "deviceUpdated"
// "linkAdded"
// "scenarioLoaded"
// "terminalOpened"
// "terminalClosed"
// "canvasRender"
