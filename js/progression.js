window.App = window.App || {};
App.Progression = (function() {
    let allLevels = [];
    let currentLevelId = null;
    let completedLevels = new Set();

    function loadCompletedFromStorage() {
        const saved = localStorage.getItem('netSim_completed');
        if (saved) completedLevels = new Set(JSON.parse(saved));
    }
    function saveCompleted() {
        localStorage.setItem('netSim_completed', JSON.stringify([...completedLevels]));
    }

    function init(levelsArray) {
        allLevels = levelsArray;
        loadCompletedFromStorage();
        const firstIncomplete = allLevels.find(l => !completedLevels.has(l.id)) || allLevels[0];
        currentLevelId = firstIncomplete.id;
        loadLevel(currentLevelId);
    }

    function loadLevel(levelId) {
        const level = allLevels.find(l => l.id === levelId);
        if (!level) return false;
        currentLevelId = levelId;
        App.PingEngine.clearPings();
        window._commandHistory = [];
        App.Engine.loadScenario(level.initialScenario);
        App.LevelValidator.setLevel(level);
        App.EventBus.emit('levelLoaded', level);
        return true;
    }

    function completeCurrentLevel() {
        if (!currentLevelId) return;
        completedLevels.add(currentLevelId);
        saveCompleted();
        App.EventBus.emit('levelCompleted', currentLevelId);
        const nextLevel = allLevels.find(l => !completedLevels.has(l.id));
        if (nextLevel) {
            loadLevel(nextLevel.id);
            App.Utils.showPopup(`New level unlocked: ${nextLevel.name}`, 'success');
        } else {
            App.Utils.showPopup(`Congratulations! You've completed all levels!`, 'success');
        }
    }

    function getCurrentLevel() {
        return allLevels.find(l => l.id === currentLevelId);
    }

    function getUnlockedLevels() {
        // Unlock first level always, then any level whose previous level is completed
        return allLevels.filter((l, idx) => idx === 0 || completedLevels.has(allLevels[idx-1].id));
    }

    App.EventBus.on('levelComplete', (levelId) => {
        if (levelId === currentLevelId) completeCurrentLevel();
    });

    return { init, loadLevel, getCurrentLevel, getUnlockedLevels, completedLevels: () => [...completedLevels] };
})();
