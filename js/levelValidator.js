window.App = window.App || {};
App.LevelValidator = (function() {
    let currentLevel = null;
    let completedTasks = new Set();

    function setLevel(levelData) {
        currentLevel = levelData;
        completedTasks.clear();
        App.EventBus.emit('tasksUpdated', getTaskStatus());
    }
    function getTaskStatus() {
        if (!currentLevel) return [];
        return currentLevel.tasks.map(task => ({ ...task, completed: completedTasks.has(task.id) }));
    }
    function checkAllTasks() {
        if (!currentLevel) return;
        const allCompleted = currentLevel.tasks.every(task => completedTasks.has(task.id));
        if (allCompleted) {
            App.EventBus.emit('levelComplete', currentLevel.id);
            App.Utils.showPopup(`Level ${currentLevel.name} complete!`, 'success');
        }
        App.EventBus.emit('tasksUpdated', getTaskStatus());
    }
    function validateDeviceExists(deviceType, minCount = 1) {
        return App.Engine.getDevices().filter(d => d.type === deviceType).length >= minCount;
    }
    function validateLinkExists(deviceId1, deviceId2) {
        const links = App.Engine.getLinks();
        return links.some(l => (l.from === deviceId1 && l.to === deviceId2) || (l.from === deviceId2 && l.to === deviceId1));
    }
    function validatePingSuccess(fromId, toId) {
        return App.PingEngine.getPingSuccesses().some(p => p.from === fromId && p.to === toId);
    }
    function validateCommandExecuted(deviceId, command) {
        if (!window._commandHistory) window._commandHistory = [];
        return window._commandHistory.some(c => c.deviceId === deviceId && c.command === command);
    }
    function registerTaskCompletion(taskId) {
        if (completedTasks.has(taskId)) return;
        completedTasks.add(taskId);
        checkAllTasks();
    }
    function reevaluate() {
        if (!currentLevel) return;
        for (let task of currentLevel.tasks) {
            if (completedTasks.has(task.id)) continue;
            let isComplete = false;
            if (task.type === 'deviceExists') isComplete = validateDeviceExists(task.deviceType, task.minCount || 1);
            else if (task.type === 'linkExists') isComplete = validateLinkExists(task.between[0], task.between[1]);
            else if (task.type === 'pingSuccess') isComplete = validatePingSuccess(task.from, task.to);
            else if (task.type === 'commandExecuted') isComplete = validateCommandExecuted(task.deviceId, task.command);
            if (isComplete) registerTaskCompletion(task.id);
        }
    }
    App.EventBus.on('deviceAdded', reevaluate);
    App.EventBus.on('linkCreated', reevaluate);
    App.EventBus.on('deviceRemoved', reevaluate);
    App.EventBus.on('pingExecuted', reevaluate);
    App.EventBus.on('commandExecuted', (data) => {
        if (!window._commandHistory) window._commandHistory = [];
        window._commandHistory.push(data);
        reevaluate();
    });
    return { setLevel, getTaskStatus, reevaluate };
})();
