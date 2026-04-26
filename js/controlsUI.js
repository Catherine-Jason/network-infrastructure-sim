window.App = window.App || {};
App.ControlsUI = (function() {
    function addDevice(type) {
        const pos = App.Utils.getRandomPosition();
        App.Controller.addDevice(type, pos.x, pos.y);
    }
    function bind() {
        document.getElementById('btnAddRouter').onclick = () => addDevice('router');
        document.getElementById('btnAddSwitch').onclick = () => addDevice('switch');
        document.getElementById('btnAddPC').onclick = () => addDevice('pc');
        document.getElementById('btnAddCloud').onclick = () => addDevice('cloud');
    }
    return { bind };
})();
