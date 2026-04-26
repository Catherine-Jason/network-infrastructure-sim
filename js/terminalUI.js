window.App = window.App || {};
App.TerminalUI = (function() {
    const div = document.getElementById('terminal');
    const output = document.getElementById('terminalOutput');
    const input = document.getElementById('terminalInput');
    let activeDeviceId = null;
    function show(deviceId) {
        activeDeviceId = deviceId;
        div.style.display = 'flex';
        output.innerHTML = `Connected to ${App.Engine.getDevices().find(d=>d.id===deviceId)?.name}\n> `;
        input.value = '';
        input.focus();
    }
    function hide() { div.style.display = 'none'; activeDeviceId = null; }
    function execute(cmd) {
        if (!activeDeviceId) return;
        const dev = App.Engine.getDevices().find(d => d.id === activeDeviceId);
        let response = '';
        if (cmd === 'ipconfig') {
            response = dev.interfaces.map(i => `${i.name}: ${i.ip || 'unset'}`).join('\n');
            App.EventBus.emit('commandExecuted', { deviceId: activeDeviceId, command: cmd });
        } else if (cmd.startsWith('ping ')) {
            const targetId = cmd.split(' ')[1];
            const targetDev = App.Engine.getDevices().find(d => d.name === targetId || d.id === targetId);
            if (targetDev) App.PingEngine.simulatePing(activeDeviceId, targetDev.id);
            else response = 'Device not found';
        } else { response = 'Command not recognized'; }
        if (response) output.innerHTML += `<br>> ${cmd}<br>${response}<br>> `;
        else output.innerHTML += `<br>> ${cmd}<br>> `;
        input.value = '';
        output.scrollTop = output.scrollHeight;
    }
    input.addEventListener('keypress', e => { if(e.key === 'Enter') execute(input.value.trim()); });
    return { show, hide };
})();
