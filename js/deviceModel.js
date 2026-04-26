window.App = window.App || {};
App.DeviceModel = (function() {
    function createDevice(type, id, name, x, y) {
        const device = {
            id: id || App.Utils.generateId(),
            type: type,
            name: name || `${type}_${Math.floor(Math.random()*1000)}`,
            x: x || 200, y: y || 200,
            interfaces: []
        };
        if (type === 'router') {
            device.interfaces = [{ name: 'Gig0/0', ip: '', mask: '' }, { name: 'Gig0/1', ip: '', mask: '' }];
        } else if (type === 'switch') {
            device.interfaces = [{ name: 'Fa0/1', ip: '' }, { name: 'Fa0/2', ip: '' }, { name: 'Fa0/3', ip: '' }, { name: 'Fa0/4', ip: '' }];
        } else if (type === 'pc') {
            device.interfaces = [{ name: 'eth0', ip: '', mask: '' }];
        } else if (type === 'firewall') {
            device.interfaces = [{ name: 'eth0', ip: '' }, { name: 'eth1', ip: '' }];
        } else if (type === 'server') {
            device.interfaces = [{ name: 'eth0', ip: '' }];
        } else if (type === 'cloud') {
            device.interfaces = [{ name: 'Internet', ip: '' }];
        } else if (type === 'accessPoint') {
            device.interfaces = [{ name: 'wlan0', ip: '' }];
        }
        return device;
    }
    return { createDevice };
})();
