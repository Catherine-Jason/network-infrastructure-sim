window.App = window.App || {};
(function() {
    App.Progression.init(App.Levels);
    App.CanvasRenderer.startLoop();
    App.ControlsUI.bind();
    document.getElementById('levelSelectButton').onclick = () => App.LevelSelectUI.openModal();
    console.log('Simulator fully functional');
})();
