window.App = window.App || {};
App.PopupUI = (function() {
    const popup = document.getElementById('popup');
    let timeout;
    function show(msg, type, duration) {
        if (timeout) clearTimeout(timeout);
        popup.textContent = msg;
        popup.className = `popup ${type}`;
        popup.classList.remove('hidden');
        timeout = setTimeout(() => popup.classList.add('hidden'), duration);
    }
    App.EventBus.on('showPopup', data => show(data.message, data.type, data.duration));
    return { show };
})();
