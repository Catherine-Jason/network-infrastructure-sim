window.App = window.App || {};
App.Engine = App.Engine || {};
// Private state
let devices = [];
let links = [];
let selectedDeviceId = null;

// Read-only getters
App.Engine.getDevices = () => devices;
App.Engine.getLinks = () => links;
App.Engine.getSelectedDeviceId = () => selectedDeviceId;

// Mutators (only for engine internal use)
App.Engine._setDevices = (d) => { devices = d; };
App.Engine._addDevice = (d) => { devices.push(d); };
App.Engine._removeDevice = (id) => { devices = devices.filter(d => d.id !== id); };
App.Engine._updateDevice = (d) => { const idx = devices.findIndex(x => x.id === d.id); if(idx!==-1) devices[idx]=d; };
App.Engine._setLinks = (l) => { links = l; };
App.Engine._addLink = (l) => { links.push(l); };
App.Engine._removeLink = (id) => { links = links.filter(l => l.id !== id); };
App.Engine._setSelectedDeviceId = (id) => { selectedDeviceId = id; };
