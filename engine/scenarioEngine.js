import { State } from "./state.js";

export const ScenarioEngine = {
    current: null,
    progress: {},

    load(scenario) {
        this.current = scenario;
        this.progress = {};
    },

    // =========================
    // MAIN VALIDATION ENTRY
    // =========================
    validate() {
        if (!this.current) return false;

        const connOK = this.validateConnections();
        const stateOK = this.validateDeviceStates();

        return connOK && stateOK;
    },

    // =========================
    // CONNECTION RULES
    // =========================
    validateConnections() {
        const required = this.current.requiredConnections || [];

        return required.every(req => {
            return State.connections.some(c =>
                (c.from === req.from && c.to === req.to) ||
                (c.from === req.to && c.to === req.from)
            );
        });
    },

    // =========================
    // DEVICE STATE RULES
    // =========================
    validateDeviceStates() {
        const rules = this.current.requiredStates || [];

        return rules.every(rule => {
            const device = State.devices.find(d => d.id === rule.id);
            return device && device.state === rule.state;
        });
    },

    // =========================
    // PROGRESS TRACKING
    // =========================
    getProgress() {
        if (!this.current) return 0;

        const total =
            (this.current.requiredConnections?.length || 0) +
            (this.current.requiredStates?.length || 0);

        let correct = 0;

        // connections
        (this.current.requiredConnections || []).forEach(req => {
            const ok = State.connections.some(c =>
                (c.from === req.from && c.to === req.to) ||
                (c.from === req.to && c.to === req.from)
            );
            if (ok) correct++;
        });

        // states
        (this.current.requiredStates || []).forEach(rule => {
            const d = State.devices.find(x => x.id === rule.id);
            if (d && d.state === rule.state) correct++;
        });

        return total === 0 ? 0 : Math.floor((correct / total) * 100);
    }
};
