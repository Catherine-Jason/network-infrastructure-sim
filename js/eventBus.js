window.App = window.App || {};
App.EventBus = (function() {
    const listeners = {};
    function on(event, cb) { if (!listeners[event]) listeners[event] = []; listeners[event].push(cb); }
    function off(event, cb) { if (!listeners[event]) return; listeners[event] = listeners[event].filter(f => f !== cb); }
    function emit(event, data) { if (!listeners[event]) return; listeners[event].forEach(cb => { try { cb(data); } catch(e) { console.error(e); } }); }
    return { on, off, emit };
})();
