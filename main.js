let scenarios = {};
let currentScenario = null;
let selectedDevice = null;
let attempts = 0;

window.onload = async () => {
    try {
        const res = await fetch("scenarios.json");
        scenarios = await res.json();
        populateScenarioDropdown();
    } catch (err) {
        alert("Run with Live Server!");
        console.error(err);
    }
};

function populateScenarioDropdown() {
    const select = document.getElementById("scenarioSelect");

    Object.keys(scenarios).forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = scenarios[key].name;
        select.appendChild(option);
    });
}

document.getElementById("startBtn").onclick = () => {
    const key = document.getElementById("scenarioSelect").value;

    if (!key) return alert("Select a scenario!");

    currentScenario = JSON.parse(JSON.stringify(scenarios[key]));
    loadTopology();
};

function loadTopology() {
    const area = document.getElementById("topologyArea");
    area.innerHTML = "";

    currentScenario.devices.forEach(device => {
        const div = document.createElement("div");

        div.classList.add("device"); // FIXED BUG
        div.textContent = device.name;

        if (device.completed) {
            div.classList.add("completed");
        }

        div.onclick = () => openDeviceModal(device);

        area.appendChild(div);
    });
}

function openDeviceModal(device) {
    selectedDevice = device;
    attempts = 0;

    document.getElementById("deviceTitle").textContent = device.name;
    document.getElementById("configInput").value = "";
    document.getElementById("feedback").textContent = "";

    document.getElementById("deviceModal").classList.remove("hidden");
}

document.getElementById("closeModalBtn").onclick = () => {
    document.getElementById("deviceModal").classList.add("hidden");
};

document.getElementById("validateBtn").onclick = () => {
    const input = document.getElementById("configInput").value.trim().toLowerCase();
    const correct = selectedDevice.config.trim().toLowerCase();

    if (input === correct) {
        document.getElementById("feedback").textContent = "✅ Correct!";
        selectedDevice.completed = true;

        loadTopology(); // refresh UI
        checkCompletion();
    } else {
        attempts++;
        document.getElementById("feedback").textContent = "❌ Incorrect";

        if (attempts >= 3) showStrugglePopup();
    }
};

document.getElementById("hintBtn").onclick = () => {
    document.getElementById("hintText").textContent = selectedDevice.hint;
    document.getElementById("hintPopup").classList.remove("hidden");
};

document.getElementById("closeHintBtn").onclick = () => {
    document.getElementById("hintPopup").classList.add("hidden");
};

function showStrugglePopup() {
    document.getElementById("struggleText").textContent = selectedDevice.struggle;
    document.getElementById("strugglePopup").classList.remove("hidden");
}

document.getElementById("closeStruggleBtn").onclick = () => {
    document.getElementById("strugglePopup").classList.add("hidden");
};

function checkCompletion() {
    const done = currentScenario.devices.every(d => d.completed);

    if (done) {
        document.getElementById("summaryText").textContent =
            `You completed: ${currentScenario.name}`;

        document.getElementById("successPopup").classList.remove("hidden");
    }
}

document.getElementById("restartBtn").onclick = () => {
    location.reload();
};