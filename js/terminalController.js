window.App = window.App || {};
App.TerminalController = (function() {
    function onDeviceSelected(id) {
        if (id) {
            const dev = App.Engine.getDevices().find(d => d.id === id);
            if (dev && (dev.type === 'router' || dev.type === 'switch' || dev.type === 'pc')) {
                App.TerminalUI.show(id);
            } else App.TerminalUI.hide();
        } else App.TerminalUI.hide();
    }
    App.EventBus.on('deviceSelected', onDeviceSelected);
    return {};
})();
