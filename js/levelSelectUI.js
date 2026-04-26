window.App = window.App || {};
App.LevelSelectUI = (function() {
    const modal = document.getElementById('levelSelectModal');
    const container = document.getElementById('levelButtons');
    const levelNameSpan = document.getElementById('levelName');
    const taskListDiv = document.getElementById('taskList');

    function updateTaskDisplay() {
        const level = App.Progression.getCurrentLevel();
        if (!level) return;
        levelNameSpan.innerText = level.name;
        const tasks = App.LevelValidator.getTaskStatus();
        taskListDiv.innerHTML = tasks.map(t => `<div class="task-item ${t.completed ? 'completed' : ''}">${t.description}</div>`).join('');
    }

    function renderLevelButtons() {
        const allLevels = window.App.Levels;
        const unlockedIds = App.Progression.getUnlockedLevels().map(l => l.id);
        container.innerHTML = allLevels.map(level => `
            <button ${!unlockedIds.includes(level.id) ? 'disabled' : ''} onclick="App.Progression.loadLevel('${level.id}')">
                ${level.name} ${App.Progression.completedLevels().includes(level.id) ? '✓' : ''}
            </button>
        `).join('');
    }

    function openModal() { modal.classList.remove('hidden'); renderLevelButtons(); }
    function closeModal() { modal.classList.add('hidden'); }

    document.getElementById('closeModal').onclick = closeModal;
    document.getElementById('nextLevelBtn').onclick = () => {
        const next = window.App.Levels.find(l => !App.Progression.completedLevels().includes(l.id));
        if (next) App.Progression.loadLevel(next.id);
    };

    App.EventBus.on('levelLoaded', () => {
        updateTaskDisplay();
        document.getElementById('nextLevelBtn').style.display = 'none';
    });
    App.EventBus.on('levelComplete', () => {
        document.getElementById('nextLevelBtn').style.display = 'block';
    });
    App.EventBus.on('tasksUpdated', updateTaskDisplay);

    return { openModal, closeModal };
})();
