window.App = window.App || {};
App.Controller = (function() {
    function addDevice(type, x, y) { App.Engine.addDevice(type, null, `${type}_${Date.now()}`, x, y); }
    function selectDevice(id) { if (id) App.Engine.selectDevice(id); else App.Engine.clearSelection(); }
    function createLink(fromId, toId) {
        const exists = App.Engine.getLinks().some(l => (l.from===fromId && l.to===toId) || (l.from===toId && l.to===fromId));
        if (!exists) App.Engine.addLink(fromId, toId);
        else App.Utils.showPopup('Link already exists', 'info');
    }
    function moveDevice(id, x, y) { App.Engine.moveDevice(id, x, y); }
    return { addDevice, selectDevice, createLink, moveDevice };
})();
