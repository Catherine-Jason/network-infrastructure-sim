window.App = window.App || {};
App.DragController = (function() {
    const canvas = document.getElementById('networkCanvas');
    let dragging = null, offsetX, offsetY;
    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width/rect.width, scaleY = canvas.height/rect.height;
        let x = (e.clientX-rect.left)*scaleX, y = (e.clientY-rect.top)*scaleY;
        x = Math.min(Math.max(0,x), canvas.width); y = Math.min(Math.max(0,y), canvas.height);
        return {x,y};
    }
    function onMouseDown(e) {
        const {x,y} = getCoords(e);
        const devices = App.Engine.getDevices();
        for (let dev of devices) {
            const dx = dev.x - 25, dy = dev.y - 20;
            if (x >= dx && x <= dx+50 && y >= dy && y <= dy+40) {
                dragging = dev;
                offsetX = x - dev.x;
                offsetY = y - dev.y;
                break;
            }
        }
    }
    function onMouseMove(e) {
        if (!dragging) return;
        const {x,y} = getCoords(e);
        dragging.x = x - offsetX;
        dragging.y = y - offsetY;
        App.Controller.moveDevice(dragging.id, dragging.x, dragging.y);
    }
    function onMouseUp() { dragging = null; }
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return {};
})();
