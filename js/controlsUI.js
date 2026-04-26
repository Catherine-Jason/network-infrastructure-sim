window.App = window.App || {};
App.ControlsUI = (function() {
    function addDevice(type) {
        const pos = App.Utils.getRandomPosition();
        App.Engine.addDevice(type, null, `${type}_${Date.now()}`, pos.x, pos.y);
    }
    function bind() {
        document.getElementById('btnAddRouter').onclick = () => addDevice('router');
        document.getElementById('btnAddSwitch').onclick = () => addDevice('switch');
        document.getElementById('btnAddPC').onclick = () => addDevice('pc');
        document.getElementById('btnAddFirewall').onclick = () => addDevice('firewall');
        document.getElementById('btnAddServer').onclick = () => addDevice('server');
        document.getElementById('btnAddCloud').onclick = () => addDevice('cloud');
        document.getElementById('btnAddAP').onclick = () => addDevice('accessPoint');
    }
    return { bind };
})();
