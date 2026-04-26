window.App = window.App || {};
(function() {
    // Initialize progression with levels from App.Levels
    App.Progression.init(App.Levels);
    // Start canvas loop
    App.CanvasRenderer.startLoop();
    // Bind UI buttons
    App.ControlsUI.bind();
    // Add level select button to HTML
    const btn = document.createElement('button');
    btn.textContent = '📚 Level Select';
    btn.onclick = () => App.LevelSelectUI.openModal();
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.left = '20px';
    btn.style.zIndex = '100';
    document.body.appendChild(btn);
    console.log('Simulator ready – self-paced learning');
})();
