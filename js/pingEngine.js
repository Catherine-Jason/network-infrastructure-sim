window.App = window.App || {};
App.PingEngine = (function() {
    let pingSuccesses = [];
    function recordPing(fromId, toId) {
        pingSuccesses.push({ from: fromId, to: toId });
        App.EventBus.emit('pingExecuted', { from: fromId, to: toId });
    }
    function getPingSuccesses() { return pingSuccesses; }
    function clearPings() { pingSuccesses = []; }

    function simulatePing(fromId, toId) {
        const fromDev = App.Engine.getDevices().find(d => d.id === fromId);
        const toDev = App.Engine.getDevices().find(d => d.id === toId);
        if (fromDev && toDev) {
            recordPing(fromId, toId);
            App.Utils.showPopup(`Ping from ${fromDev.name} to ${toDev.name} successful`, 'success');
            return true;
        }
        App.Utils.showPopup(`Ping failed: device not found`, 'error');
        return false;
    }
    return { simulatePing, getPingSuccesses, clearPings };
})();
