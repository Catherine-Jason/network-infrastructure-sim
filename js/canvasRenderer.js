window.App = window.App || {};
App.CanvasRenderer = (function() {
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');
    const CONNECTOR_RADIUS = 6;

    function setGlow(color, blur=3) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
    function clearGlow() { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; }
    function getConnector(device) { return { x: device.x + 25, y: device.y }; }

    function drawRouter(x, y, w, h, selected) {
        const cx = x + w/2;
        ctx.beginPath();
        ctx.ellipse(cx, y, w/2, 6, 0, Math.PI*2);
        ctx.fillStyle = '#1e3a5f';
        ctx.fill();
        ctx.fillRect(x, y, w, h);
        ctx.beginPath();
        ctx.ellipse(cx, y+h, w/2, 6, 0, Math.PI*2);
        ctx.fillStyle = '#163050';
        ctx.fill();
        ctx.strokeStyle = '#1e90ff';
        ctx.strokeRect(x, y, w, h);
        const centerX = cx, centerY = y + h/2;
        for (let i=0; i<6; i++) {
            const angle = i*Math.PI*2/6;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX+Math.cos(angle)*w*0.4, centerY+Math.sin(angle)*h*0.4);
            ctx.stroke();
        }
        setGlow('#5ab4ff', 4);
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI*2);
        ctx.fillStyle = '#5ab4ff';
        ctx.fill();
        clearGlow();
        if (selected) { ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2.5; ctx.strokeRect(x-2,y-2,w+4,h+4); }
    }
    function drawSwitch(x,y,w,h,selected) {
        ctx.fillStyle = '#1a3320';
        ctx.fillRect(x,y,w,h);
        ctx.strokeStyle = '#00cc66';
        ctx.strokeRect(x,y,w,h);
        for (let i=0;i<5;i++) {
            ctx.fillStyle = '#00cc66';
            ctx.fillRect(x+6+i*9, y+6, 5, 4);
            ctx.fillRect(x+6+i*9, y+h-12, 5, 4);
        }
        for (let i=0;i<5;i++) {
            ctx.beginPath();
            ctx.arc(x+8+i*9, y+h-5, 2, 0, Math.PI*2);
            ctx.fillStyle = i===2?'#ffcc00':(i===4?'#ff4444':'#00ff88');
            setGlow('#00ff88',2);
            ctx.fill();
            clearGlow();
        }
        if (selected) { ctx.strokeStyle = '#ffff00'; ctx.strokeRect(x-2,y-2,w+4,h+4); }
    }
    function drawPC(x,y,w,h,selected) {
        ctx.fillStyle='#2a2a3a';
        ctx.fillRect(x+5,y+5,w-15,h-10);
        ctx.strokeStyle='#aaaaff';
        ctx.strokeRect(x+5,y+5,w-15,h-10);
        ctx.fillStyle='#3a3a4a';
        ctx.fillRect(x+w-18,y+h/2,14,h/2);
        if (selected) { ctx.strokeStyle='#ffff00'; ctx.strokeRect(x-2,y-2,w+4,h+4); }
    }
    function drawFirewall(x,y,w,h,selected) {
        ctx.fillStyle='#3a1a00';
        ctx.fillRect(x,y,w,h);
        ctx.strokeStyle='#ff6600';
        ctx.strokeRect(x,y,w,h);
        for (let row=0;row<3;row++) {
            let offset = (row%2===0)?0:12;
            for (let col=0;col<2;col++) {
                ctx.fillStyle='#ff660033';
                ctx.fillRect(x+6+col*30+offset, y+8+row*14, 20, 8);
                ctx.strokeStyle='#ff6600';
                ctx.strokeRect(x+6+col*30+offset, y+8+row*14, 20, 8);
            }
        }
        setGlow('#ff8833',4);
        ctx.font="18px 'Segoe UI'";
        ctx.fillStyle='#ff8833';
        ctx.fillText("🔒", x+w/2-10, y+h/2+6);
        clearGlow();
        if (selected) ctx.strokeRect(x-2,y-2,w+4,h+4);
    }
    function drawServer(x,y,w,h,selected) {
        ctx.fillStyle='#1a1a2e';
        ctx.fillRect(x,y,w,h);
        ctx.strokeStyle='#9966ff';
        ctx.strokeRect(x,y,w,h);
        for (let i=0;i<3;i++) {
            ctx.fillStyle='#2a1a4e';
            ctx.fillRect(x+4, y+6+i*14, w-8, 10);
            ctx.strokeStyle='#9966ff';
            ctx.strokeRect(x+4, y+6+i*14, w-8, 10);
            ctx.beginPath();
            ctx.arc(x+w-12, y+11+i*14, 3, 0, Math.PI*2);
            ctx.fillStyle = (i===1)?'#00ff88':'#9966ff';
            setGlow('#9966ff',2);
            ctx.fill();
            clearGlow();
        }
        if (selected) ctx.strokeRect(x-2,y-2,w+4,h+4);
    }
    function drawCloud(x,y,w,h,selected) {
        const cx=x+w/2, cy=y+h/2;
        ctx.beginPath();
        ctx.ellipse(cx-15,cy-5,18,14,0,0,Math.PI*2);
        ctx.ellipse(cx,cy-10,22,16,0,0,Math.PI*2);
        ctx.ellipse(cx+15,cy-5,18,14,0,0,Math.PI*2);
        ctx.ellipse(cx,cy+8,24,16,0,0,Math.PI*2);
        ctx.fillStyle='#0a2a3a';
        ctx.fill();
        ctx.strokeStyle='#00ccff';
        ctx.stroke();
        setGlow('#00ccff',2);
        for (let i=-1;i<=1;i++) {
            ctx.beginPath();
            ctx.arc(cx+i*12,cy,3,0,Math.PI*2);
            ctx.fillStyle='#00ccff';
            ctx.fill();
        }
        clearGlow();
        if (selected) ctx.strokeRect(x-2,y-2,w+4,h+4);
    }
    function drawAccessPoint(x,y,w,h,selected) {
        const cx=x+w/2, cy=y+h/2;
        for (let r=12;r<=30;r+=9) {
            ctx.beginPath();
            ctx.arc(cx,cy-6,r,-0.8,0.8);
            ctx.strokeStyle='#ffcc00';
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx,cy-6,6,0,Math.PI*2);
        ctx.fillStyle='#ffcc00';
        ctx.fill();
        ctx.fillStyle='#2a2200';
        ctx.fillRect(x+10,y+h-12,w-20,10);
        ctx.strokeStyle='#ffcc00';
        ctx.strokeRect(x+10,y+h-12,w-20,10);
        if (selected) ctx.strokeRect(x-2,y-2,w+4,h+4);
    }

    function drawDevices() {
        const devices = App.Engine.getDevices();
        devices.forEach(dev => {
            const x = dev.x - 25, y = dev.y - 20, w = 50, h = 40;
            const selected = (App.Engine.getSelectedDeviceId() === dev.id);
            if (dev.type === 'router') drawRouter(x,y,w,h,selected);
            else if (dev.type === 'switch') drawSwitch(x,y,w,h,selected);
            else if (dev.type === 'pc') drawPC(x,y,w,h,selected);
            else if (dev.type === 'firewall') drawFirewall(x,y,w,h,selected);
            else if (dev.type === 'server') drawServer(x,y,w,h,selected);
            else if (dev.type === 'cloud') drawCloud(x,y,w,h,selected);
            else if (dev.type === 'accessPoint') drawAccessPoint(x,y,w,h,selected);
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
        if (dragState && dragState.active && dragState.startConnector)
            drawTempLink(dragState.startConnector, dragState.currentMouse);
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
