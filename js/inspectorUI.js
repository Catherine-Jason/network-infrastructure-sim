window.App = window.App || {};
App.InspectorUI = (function() {
    const container = document.getElementById('inspectorContent');
    function update() {
        const id = App.Engine.getSelectedDeviceId();
        if (!id) { container.innerHTML = 'Select a device'; return; }
        const dev = App.Engine.getDevices().find(d => d.id === id);
        if (!dev) return;
        let html = `<strong>${dev.name}</strong> (${dev.type})<br>ID: ${dev.id}<hr><strong>Interfaces:</strong><ul>`;
        dev.interfaces.forEach(iface => { html += `<li>${iface.name} – IP: ${iface.ip || 'unset'}</li>`; });
        html += `</ul>`;
        container.innerHTML = html;
    }
    App.EventBus.on('deviceSelected', update);
    return { update };
})();
