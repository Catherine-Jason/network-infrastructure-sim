window.App = window.App || {};
App.Engine = App.Engine || {};

App.Engine.addDevice = (type, id, name, x, y) => {
    const device = App.DeviceModel.createDevice(type, id, name, x, y);
    App.Engine._addDevice(device);
    App.EventBus.emit('deviceAdded', device);
    return device;
};

App.Engine.addLink = (fromId, toId) => {
    const link = { id: App.Utils.generateId(), from: fromId, to: toId };
    App.Engine._addLink(link);
    App.EventBus.emit('linkCreated', link);
    return link;
};

App.Engine.removeDevice = (id) => {
    const linksToRemove = App.Engine.getLinks().filter(l => l.from === id || l.to === id);
    linksToRemove.forEach(l => App.Engine._removeLink(l.id));
    App.Engine._removeDevice(id);
    if (App.Engine.getSelectedDeviceId() === id) App.Engine._setSelectedDeviceId(null);
    App.EventBus.emit('deviceRemoved', id);
};

App.Engine.moveDevice = (id, x, y) => {
    const dev = App.Engine.getDevices().find(d => d.id === id);
    if (dev) { dev.x = x; dev.y = y; App.EventBus.emit('deviceMoved', id); }
};

App.Engine.selectDevice = (id) => {
    App.Engine._setSelectedDeviceId(id);
    App.EventBus.emit('deviceSelected', id);
};

App.Engine.clearSelection = () => {
    App.Engine._setSelectedDeviceId(null);
    App.EventBus.emit('deviceSelected', null);
};

App.Engine.loadScenario = (scenarioData) => {
    App.Engine._setDevices([]);
    App.Engine._setLinks([]);
    scenarioData.devices.forEach(devData => {
        const newDev = App.DeviceModel.createDevice(devData.type, devData.id, devData.name, devData.x, devData.y);
        if (devData.interfaces) newDev.interfaces = devData.interfaces;
        App.Engine._addDevice(newDev);
    });
    (scenarioData.links || []).forEach(linkData => {
        App.Engine.addLink(linkData.from, linkData.to);
    });
    App.EventBus.emit('scenarioLoaded', scenarioData.id);
};
