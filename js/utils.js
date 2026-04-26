window.App = window.App || {};
App.Utils = (function() {
    function generateId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 8); }
    function getRandomPosition(padding=100, maxX=1050, maxY=500) {
        return { x: padding + Math.random()*(maxX-padding*2), y: padding + Math.random()*(maxY-padding*2) };
    }
    function showPopup(msg, type='info', duration=2500) { App.EventBus.emit('showPopup', { message: msg, type, duration }); }
    return { generateId, getRandomPosition, showPopup };
})();
