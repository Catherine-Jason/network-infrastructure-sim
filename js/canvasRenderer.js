window.App = window.App || {};
App.CanvasRenderer = (function() {
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');
    const CONNECTOR_RADIUS = 6;

    function getConnector(device) {
        const x = device.x - 25;
        const y = device.y - 20;
        return { x: x + 50, y: y + 20 };
    }

    function drawRouter(x, y, w, h, selected) {
        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath();
        ctx.ellipse(x+w/2, y+6, w/2, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.fillRect(x, y+6, w, h-12);
        ctx.beginPath();
        ctx.ellipse(x+w/2, y+h-6, w/2, 6, 0, Math.PI*2);
        ctx.fillStyle = '#163050';
        ctx.fill();
        ctx.strokeStyle = '#1e90ff';
        ctx.strokeRect(x, y, w, h);
        const cx = x+w/2, cy = y+h/2;
        for (let i=0;i<6;i++) {
            const angle = i*Math.PI*2/6;
            ctx.beginPath();
            ctx.moveTo(cx,cy);
            ctx.lineTo(cx+Math.cos(angle)*w*0.4, cy+Math.sin(angle)*h*0.4);
            ctx.stroke();
        }
        if (selected) ctx.strokeStyle = '#ffff00', ctx.strokeRect(x-2,y-2,w+4,h+4);
    }
    function drawSwitch(x,y,w,h,selected) {
        ctx.fillStyle = '#1a3320';
        ctx.fillRect(x,y,w,h);
        ctx.strokeStyle = '#00cc66';
        ctx.strokeRect(x,y,w,h);
        for(let i=0;i<4;i++) {
            ctx.fillStyle='#00cc66';
            ctx.fillRect(x+8+i*12, y+6, 6,4);
            ctx.fillRect(x+8+i*12, y+h-12,6,4);
        }
        if (selected) ctx.strokeStyle='#ffff00', ctx.strokeRect(x-2,y-2,w+4,h+4);
    }
    function drawPC(x,y,w,h,selected) {
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(x+5,y+5,w-15,h-10);
        ctx.strokeStyle='#aaaaff';
        ctx.strokeRect(x+5,y+5,w-15,h-10);
        ctx.fillStyle='#3a3a4a';
        ctx.fillRect(x+w-18,y+h/2,14,h/2);
        if (selected) ctx.strokeStyle='#ffff00', ctx.strokeRect(x-2,y-2,w+4,h+4);
    }
    function drawCloud(x,y,w,h,selected) {
        ctx.fillStyle='#0a2a3a';
        ctx.beginPath();
        ctx.ellipse(x+w/2-15,y+h/2-5,18,14,0,0,Math.PI*2);
        ctx.ellipse(x+w/2,y+h/2-10,22,16,0,0,Math.PI*2);
        ctx.ellipse(x+w/2+15,y+h/2-5,18,14,0,0,Math.PI*2);
        ctx.ellipse(x+w/2,y+h/2+8,24,16,0,0,Math.PI*2);
        ctx.fill();
        ctx.strokeStyle='#00ccff';
        ctx.stroke();
        if (selected) ctx.strokeStyle='#ffff00', ctx.strokeRect(x-2,y-2,w+4,h+4);
    }

    function drawDevices() {
        const devices = App.Engine.getDevices();
        devices.forEach(dev => {
            const x = dev.x-25, y = dev.y-20, w=50, h=40;
            const selected = (App.Engine.getSelectedDeviceId() === dev.id);
            if (dev.type === 'router') drawRouter(x,y,w,h,selected);
            else if (dev.type === 'switch') drawSwitch(x,y,w,h,selected);
            else if (dev.type === 'pc') drawPC(x,y,w,h,selected);
            else if (dev.type === 'cloud') drawCloud(x,y,w,h,selected);
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#ccccff';
            ctx.fillText(dev.name, x+5, y-3);
            const conn = getConnector(dev);
            ctx.beginPath();
            ctx.arc(conn.x, conn.y, CONNECTOR_RADIUS, 0, Math.PI*2);
            ctx.fillStyle = '#5ab4ff';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            dev.__connector = conn;
        });
    }

    function drawLinks() {
        const links = App.Engine.getLinks();
        const devices = App.Engine.getDevices();
        links.forEach(link => {
            const fromDev = devices.find(d => d.id === link.from);
            const toDev = devices.find(d => d.id === link.to);
            if (fromDev && toDev && fromDev.__connector && toDev.__connector) {
                ctx.beginPath();
                ctx.moveTo(fromDev.__connector.x, fromDev.__connector.y);
                ctx.lineTo(toDev.__connector.x, toDev.__connector.y);
                ctx.strokeStyle = '#88aaff';
                ctx.setLineDash([8,6]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }

    function drawTempLink(start, end) {
        if (!start) return;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = '#ffaa33';
        ctx.setLineDash([6,8]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function render() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawLinks();
        drawDevices();
        const dragState = App.LinkController ? App.LinkController.getDragState() : null;
        if (dragState && dragState.active && dragState.startConnector) {
            drawTempLink(dragState.startConnector, dragState.currentMouse);
        }
    }

    function startLoop() { render(); setInterval(render, 50); }
    App.EventBus.on('deviceAdded', render);
    App.EventBus.on('deviceMoved', render);
    App.EventBus.on('linkCreated', render);
    App.EventBus.on('deviceSelected', render);
    App.EventBus.on('scenarioLoaded', render);
    App.EventBus.on('tempLinkUpdate', render);
    return { render, startLoop };
})();
