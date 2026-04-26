window.App = window.App || {};
App.ClickController = (function() {
    const canvas = document.getElementById('networkCanvas');
    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width/rect.width, scaleY = canvas.height/rect.height;
        return { x: (e.clientX-rect.left)*scaleX, y: (e.clientY-rect.top)*scaleY };
    }
    function onClick(e) {
        const {x,y} = getCoords(e);
        let selected = null;
        for (let dev of App.Engine.getDevices()) {
            const dx = dev.x-25, dy = dev.y-20;
            if (x >= dx && x <= dx+50 && y >= dy && y <= dy+40) { selected = dev.id; break; }
        }
        App.Controller.selectDevice(selected);
    }
    canvas.addEventListener('click', onClick);
    return {};
})();
