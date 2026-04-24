import { draw } from "./ui/canvasRenderer.js";

import { startPing, drawPacket } from "./engine/ping.js";

import { findPath } from "./engine/pathfinding.js";

import { State } from "./engine/state.js";

const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const devices = State.devices;
const connections = State.connections;


// DEVICE ICONS
const icons = {
  router: "📡",
  switch: "🔀",
  pc: "💻"
};

// DEVICE STATE COLORS
const stateColors = {
  unconfigured: "#444a5a",
  "in-progress": "#e6c300",
  configured: "#00ff88"
};

// Create device
function addDevice(type) {
  devices.push({
    id: Date.now() + Math.random(),
    type,
    x: Math.random() * (canvas.width - 200) + 100,
    y: Math.random() * (canvas.height - 200) + 100,
    radius: 30,
    state: "configured" // For Phase 3, assume all devices are configured
  });
  draw();
}

// Mouse helpers
function getMouse(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getDeviceAtPoint(point) {
  return devices.find(d => distance(point, d) < d.radius);
}

// Mouse events
canvas.addEventListener("mousedown", (e) => {
  const mouse = getMouse(e);
  const hit = getDeviceAtPoint(mouse);

  if (hit) {
    // If selecting ping source
    if (pingSource && pingSource.id !== hit.id) {
      pingTarget = hit;
      startPing();
      return;
    }

    // If selecting for linking
    if (selectedForLink && selectedForLink.id !== hit.id) {
      createConnection(selectedForLink, hit);
      selectedForLink = null;
      draw();
      return;
    }

    // Select device
    dragging = hit;
    selectedForLink = hit;
    draw();
  } else {
    selectedForLink = null;
    dragging = null;
    draw();
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (dragging) {
    const mouse = getMouse(e);
    dragging.x = mouse.x;
    dragging.y = mouse.y;
    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  dragging = null;
});

// Connection logic
function createConnection(a, b) {
  const exists = connections.some(c =>
    (c.from === a.id && c.to === b.id) ||
    (c.from === b.id && c.to === a.id)
  );
  if (exists) return;

  connections.push({ from: a.id, to: b.id });
}

    // Reached destination
    ctx.fillStyle = "#00ff88";
    ctx.font = "20px Arial";
    ctx.fillText("✔", b.x + 20, b.y - 20);

    pingSource = null;
    pingTarget = null;
    packet = null;
    return;
  }

  // Interpolate
  let x = a.x + (b.x - a.x) * p.progress;
  let y = a.y + (b.y - a.y) * p.progress;

  ctx.beginPath();
  ctx.fillStyle = "#00ffcc";
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  p.progress += 0.02;

  if (p.progress >= 1) {
    p.index++;
    p.progress = 0;
  }
}

    // Device body
    ctx.beginPath();
    ctx.fillStyle = stateColors[d.state] || "#444";
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.fillStyle = "#00ffcc";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icons[d.type] || "❓", d.x, d.y);
  });
}

// =========================
// PHASE 5 — INSPECTOR PANEL
// =========================

let inspectorDevice = null;

canvas.addEventListener("click", (e) => {
    const mouse = getMouse(e);
    const hit = getDeviceAtPoint(mouse);

    if (hit) {
        openInspector(hit);
    }
});

function openInspector(device) {
    inspectorDevice = device;

    document.getElementById("inspType").textContent = device.type;
    document.getElementById("inspId").textContent = device.id;
    document.getElementById("inspState").textContent = device.state;

    const list = document.getElementById("inspConnections");
    list.innerHTML = "";

    const connected = connections.filter(c => c.from === device.id || c.to === device.id);

    connected.forEach(c => {
        const otherId = c.from === device.id ? c.to : c.from;
        const other = devices.find(d => d.id === otherId);

        const li = document.createElement("li");
        li.textContent = `${other.type} (${other.id})`;
        list.appendChild(li);
    });

    document.getElementById("inspectorPanel").classList.remove("hidden");
    document.getElementById("inspectorPanel").classList.add("visible");
}

function closeInspector() {
    document.getElementById("inspectorPanel").classList.remove("visible");
    document.getElementById("inspectorPanel").classList.add("hidden");
    inspectorDevice = null;
}

function updateInspectorState(newState) {
    if (!inspectorDevice) return;

    inspectorDevice.state = newState;
    document.getElementById("inspState").textContent = newState;
}

// =========================
// PHASE 6 — SCENARIO SYSTEM (CLEAN + UPGRADED)
// =========================

// NEW ICONS (cleaner + cyber)
const icons = {
    router: "🛜",
    switch: "🖧",
    pc: "🖥️"
};

// NEW STATE COLORS (green = good, red = error)
const stateColors = {
    unconfigured: "#444a5a",
    "in-progress": "#e6c300",
    configured: "#00ff88",
    error: "#ff4444"
};

let currentScenario = null;

// Load scenario list
fetch("scenarios/scenarioList.json")
    .then(res => res.json())
    .then(list => {
        const select = document.getElementById("scenarioSelect");
        list.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.file;
            opt.textContent = s.name;
            select.appendChild(opt);
        });
    });

document.getElementById("scenarioSelect").addEventListener("change", function () {
    if (!this.value) return;
    loadScenario(this.value);
});

function loadScenario(file) {
    fetch("scenarios/" + file)
        .then(res => res.json())
        .then(data => {
            currentScenario = data;
            resetCanvas();
            applyScenario(data);
        });
}

function resetCanvas() {
    devices = [];
    connections = [];
    packet = null;
    selectedForLink = null;
    pingSource = null;
    pingTarget = null;
}

// Apply scenario devices + connections
function applyScenario(s) {
    s.devices.forEach(d => {
        devices.push({
            id: d.id,
            type: d.type,
            x: d.x,
            y: d.y,
            radius: 30,
            state: d.state
        });
    });

    s.connections.forEach(c => {
        connections.push({ from: c.from, to: c.to });
    });

    draw();
}

// VALIDATION
function validateScenario() {
    if (!currentScenario) return;

    let correct = true;

    currentScenario.requiredConnections.forEach(req => {
        const exists = connections.some(c =>
            (c.from === req.from && c.to === req.to) ||
            (c.from === req.to && c.to === req.from)
        );
        if (!exists) correct = false;
    });

    currentScenario.requiredStates.forEach(req => {
        const d = devices.find(x => x.id === req.id);
        if (!d || d.state !== req.state) correct = false;
    });

    if (correct) showSuccess();
    else showStruggle();
}

// POPUPS
function showHint() {
    document.getElementById("hintText").textContent = currentScenario.hint;
    document.getElementById("hintPopup").classList.remove("hidden");
}

function closeHint() {
    document.getElementById("hintPopup").classList.add("hidden");
}

function showStruggle() {
    document.getElementById("struggleText").textContent = currentScenario.struggle;
    document.getElementById("strugglePopup").classList.remove("hidden");
}

function closeStruggle() {
    document.getElementById("strugglePopup").classList.add("hidden");
}

function showSuccess() {
    document.getElementById("summaryText").textContent = currentScenario.success;
    document.getElementById("successPopup").classList.remove("hidden");
}

function restartScenario() {
    closeStruggle();
    document.getElementById("successPopup").classList.add("hidden");
    loadScenario(currentScenario.file);
}

// =========================
// PACKET UPGRADE (MAIL ICON)
// =========================

function drawPacket() {
    if (!packet) return;

    let p = packet;
    let a = p.points[p.index];
    let b = p.points[p.index + 1];

    if (!b) {
        // SUCCESS — turn router green
        pingSource.state = "configured";
        draw();
        packet = null;
        return;
    }

    let x = a.x + (b.x - a.x) * p.progress;
    let y = a.y + (b.y - a.y) * p.progress;

    ctx.font = "22px Arial";
    ctx.fillStyle = "#00ffcc";
    ctx.fillText("✉️", x, y);

    p.progress += 0.02;

    if (p.progress >= 1) {
        p.index++;
        p.progress = 0;
    }
}

// Override ping failure to turn router red
const originalStartPing = startPing;
startPing = function () {
    const path = findPath(pingSource.id, pingTarget.id);

    if (!path) {
        pingSource.state = "error";
        draw();
        alert("❌ Ping failed: No path found");
        pingSource = null;
        pingTarget = null;
        return;
    }

    originalStartPing();
};
