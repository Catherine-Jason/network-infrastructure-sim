window.App = window.App || {};
App.LinkController = (function() {
    const canvas = document.getElementById('networkCanvas');
    let dragState = { active: false, startDevice: null, startConnector: null, currentMouse: {x:0,y:0} };
    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width/rect.width, scaleY = canvas.height/rect.height;
        let x = (e.clientX-rect.left)*scaleX, y = (e.clientY-rect.top)*scaleY;
        x = Math.min(Math.max(0,x), canvas.width); y = Math.min(Math.max(0,y), canvas.height);
        return {x,y};
    }
    function onMouseDown(e) {
        const {x,y} = getCoords(e);
        for (let dev of App.Engine.getDevices()) {
            const conn = { x: dev.x + 25, y: dev.y };
            if (Math.hypot(x-conn.x, y-conn.y) <= 8) {
                dragState.active = true; dragState.startDevice = dev; dragState.startConnector = conn;
                dragState.currentMouse = {x,y}; e.preventDefault(); break;
            }
        }
    }
    function onMouseMove(e) {
        if (!dragState.active) return;
        dragState.currentMouse = getCoords(e);
        App.EventBus.emit('tempLinkUpdate', dragState);
    }
    function onMouseUp(e) {
        if (!dragState.active) return;
        const {x,y} = getCoords(e);
        let target = null;
        for (let dev of App.Engine.getDevices()) {
            if (dev.id === dragState.startDevice.id) continue;
            const dx = dev.x-25, dy = dev.y-20;
            if (x >= dx && x <= dx+50 && y >= dy && y <= dy+40) { target = dev; break; }
        }
        if (target) App.Controller.createLink(dragState.startDevice.id, target.id);
        else App.Utils.showPopup('Link cancelled', 'info');
        dragState.active = false;
        App.EventBus.emit('tempLinkUpdate', dragState);
    }
    function getDragState() { return dragState; }
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return { getDragState };
})();
