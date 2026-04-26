import { State } from '../core/state.js';
import { render } from '../ui/canvasRenderer.js';

export const Controller = {

    init() {
        render(State);
    },

    setDevices(devices) {
        State.devices = devices;
        render(State);
    }

};
