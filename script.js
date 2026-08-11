// Improved script for network-infrastructure-sim
// - Pointer events (mouse & touch)
// - SVG lines for cables (auto-updating while dragging)
// - Device / Connection classes with data model
// - Visual connect-mode toggle, prevent self-connect
// - Persistence: save/load to localStorage, export/import JSON

const canvas = document.getElementById("canvas");
const connectModeBtn = document.getElementById("connectModeBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

// Create an SVG overlay for cables
const svgNS = "http://www.w3.org/2000/svg";
const svg = document.createElementNS(svgNS, "svg");
svg.setAttribute("aria-hidden", "true");
canvas.insertBefore(svg, canvas.firstChild); // ensure SVG sits behind devices

let connectMode = false;
let firstDevice = null;

const devices = new Map();       // id -> Device
const connections = new Map();   // id -> Connection

// Utility: generate ID
function uid(prefix = "") {
    return prefix + Math.random().toString(36).slice(2, 9);
}

// Button wiring for spawning
document.querySelectorAll(".device-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        spawnDevice(type);
    });
});

// Toggle cable mode — update button text/style instead of alert()
connectModeBtn.addEventListener("click", () => {
    connectMode = !connectMode;
    firstDevice = null;
    connectModeBtn.classList.toggle("active", connectMode);
    connectModeBtn.textContent = connectMode ? "Cable Mode: ON" : "Cable Mode: OFF";
});

// Clear canvas (devices + connections)
clearBtn.addEventListener("click", () => {
    if (!confirm("Clear all devices and connections?")) return;
    // Remove DOM devices
    devices.forEach(device => device.destroy());
    devices.clear();

    // Remove SVG connections
    connections.forEach(conn => conn.destroy());
    connections.clear();
});

// Save / Load
const STORAGE_KEY = "nis-layout-v1";

saveBtn.addEventListener("click", () => saveLayout());
loadBtn.addEventListener("click", () => loadLayout());
exportBtn.addEventListener("click", () => exportLayout());
importBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            loadLayoutFromData(data);
        } catch (err) {
            alert("Invalid file: " + err.message);
        }
    };
    reader.readAsText(f);
    fileInput.value = "";
});

// Spawn device element and wrap in Device class
function spawnDevice(type) {
    const el = createDeviceElement(type);
    const rect = canvas.getBoundingClientRect();
    const startX = Math.max(10, Math.floor(rect.width / 2 - 40 + (Math.random() - 0.5) * 80));
    const startY = Math.max(10, Math.floor(rect.height / 2 - 40 + (Math.random() - 0.5) * 80));
    const device = new Device(el, startX, startY, type);
    devices.set(device.id, device);
    // auto-save
    scheduleAutosave();
    return device;
}

function createDeviceElement(type) {
    const div = document.createElement("div");
    div.classList.add("device");
    div.setAttribute("data-type", type);

    if (type === "router") div.innerHTML = `<i class="fa-solid fa-route"></i>`;
    else if (type === "switch") div.innerHTML = `<i class="fa-solid fa-network-wired"></i>`;
    else div.innerHTML = `<i class="fa-solid fa-desktop"></i>`;

    div.style.position = "absolute";
    div.style.left = "0px";
    div.style.top = "0px";

    canvas.appendChild(div);
    return div;
}

// Device class to handle drag/positioning/connection bookkeeping
class Device {
    constructor(el, x = 100, y = 100, type = "pc", id = null) {
        this.el = el;
        this.type = type;
        this.id = id || uid("dev_");
        this.el.dataset.id = this.id;
        this.x = x;
        this.y = y;
        this.connections = new Set(); // Connection ids
        this._isDragging = false;
        this._movedSinceDown = false;

        // initialize transform
        this._applyTransform();

        // pointer handlers
        this.el.addEventListener("pointerdown", this._onPointerDown.bind(this));
        // clicking for connect mode
        this.el.addEventListener("click", (e) => this._onClick(e));
        // double click to remove device (and its connections)
        this.el.addEventListener("dblclick", (e) => this.destroy());
    }

    _applyTransform() {
        this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }

    _onPointerDown(e) {
        e.preventDefault();
        // start dragging
        this.el.setPointerCapture(e.pointerId);
        this._isDragging = true;
        this._movedSinceDown = false;
        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = this.x;
        const initialY = this.y;

        const onMove = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._movedSinceDown = true;
            this.x = initialX + dx;
            this.y = initialY + dy;
            this._applyTransform();
            // update connected lines as we move
            this.connections.forEach(connId => {
                const conn = connections.get(connId);
                if (conn) conn.update();
            });
        };

        const onUp = (ev) => {
            this._isDragging = false;
            try { this.el.releasePointerCapture(ev.pointerId); } catch {}
            this.el.removeEventListener("pointermove", onMove);
            this.el.removeEventListener("pointerup", onUp);
            this.el.removeEventListener("pointercancel", onUp);
            // autosave
            scheduleAutosave();
        };

        this.el.addEventListener("pointermove", onMove);
        this.el.addEventListener("pointerup", onUp);
        this.el.addEventListener("pointercancel", onUp);
    }

    _onClick(e) {
        // If the user just dragged, don't treat it as a click for connecting
        if (this._movedSinceDown) return;

        if (!connectMode) return;

        // If this is the first click, set as firstDevice with highlight
        if (!firstDevice) {
            firstDevice = this;
            this.el.classList.add("selected");
            return;
        }

        // If clicked same device again, deselect
        if (firstDevice === this) {
            this.el.classList.remove("selected");
            firstDevice = null;
            return;
        }

        // connect
        const label = prompt("Label for connection (optional):", "");
        const conn = createConnection(firstDevice, this, label || "");
        if (conn) {
            connections.set(conn.id, conn);
            // autosave
            scheduleAutosave();
        }
        firstDevice.el.classList.remove("selected");
        firstDevice = null;
    }

    destroy() {
        // remove connections
        Array.from(this.connections).forEach(connId => {
            const conn = connections.get(connId);
            if (conn) conn.destroy();
        });
        this.connections.clear();

        // remove element
        if (this.el && this.el.parentElement) this.el.remove();
        devices.delete(this.id);
        // autosave
        scheduleAutosave();
    }

    center() {
        // compute center relative to svg/canvas
        const canvasRect = canvas.getBoundingClientRect();
        const elRect = this.el.getBoundingClientRect();
        const cx = (elRect.left - canvasRect.left) + elRect.width / 2;
        const cy = (elRect.top - canvasRect.top) + elRect.height / 2;
        return { x: cx, y: cy };
    }
}

// Connection class: creates an SVG line (and optional text) between two devices and keeps it updated
class Connection {
    constructor(devA, devB, label = "") {
        this.id = uid("conn_");
        this.devA = devA;
        this.devB = devB;
        this.label = label || "";

        this.group = document.createElementNS(svgNS, "g");

        this.line = document.createElementNS(svgNS, "line");
        this.line.setAttribute("stroke", "#2b6cff");
        this.line.setAttribute("stroke-width", "4");
        this.line.setAttribute("stroke-linecap", "round");
        this.line.dataset.id = this.id;
        this.line.style.pointerEvents = "auto"; // enable double-click on the line

        this.group.appendChild(this.line);

        if (this.label) {
            this.text = document.createElementNS(svgNS, "text");
            this.text.textContent = this.label;
            this.group.appendChild(this.text);
        }

        svg.appendChild(this.group);

        // maintain backrefs
        this.devA.connections.add(this.id);
        this.devB.connections.add(this.id);

        // double-click to remove connection
        this.line.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this.destroy();
        });

        this.update();
    }

    update() {
        const a = this.devA.center();
        const b = this.devB.center();
        this.line.setAttribute("x1", a.x);
        this.line.setAttribute("y1", a.y);
        this.line.setAttribute("x2", b.x);
        this.line.setAttribute("y2", b.y);

        if (this.text) {
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            this.text.setAttribute("x", midX + 6);
            this.text.setAttribute("y", midY - 6);
        }
    }

    destroy() {
        // remove DOM
        if (this.group && this.group.parentElement) this.group.remove();
        // remove backrefs
        if (this.devA) this.devA.connections.delete(this.id);
        if (this.devB) this.devB.connections.delete(this.id);
        connections.delete(this.id);
        // autosave
        scheduleAutosave();
    }
}

// Utility: check for existing connection between two devices
function connectionExists(a, b) {
    for (const conn of connections.values()) {
        if ((conn.devA === a && conn.devB === b) || (conn.devA === b && conn.devB === a)) return true;
    }
    return false;
}

// createConnection factory with duplicate/self checks
function createConnection(a, b, label = "") {
    if (a === b) return null; // don't connect to self
    if (connectionExists(a, b)) return null; // avoid duplicate
    const conn = new Connection(a, b, label);
    connections.set(conn.id, conn);
    return conn;
}

// Persistence: save current layout to localStorage
function saveLayout() {
    const data = {
        devices: [],
        connections: []
    };

    devices.forEach(dev => {
        data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y });
    });

    connections.forEach(conn => {
        data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label });
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        alert("Layout saved.");
    } catch (err) {
        alert("Save failed: " + err.message);
    }
}

function loadLayout() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        alert("No saved layout found.");
        return;
    }
    try {
        const data = JSON.parse(raw);
        loadLayoutFromData(data);
    } catch (err) {
        alert("Load failed: " + err.message);
    }
}

function exportLayout() {
    const data = {
        devices: [],
        connections: []
    };

    devices.forEach(dev => {
        data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y });
    });

    connections.forEach(conn => {
        data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label });
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nis-layout.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function loadLayoutFromData(data) {
    // Basic validation
    if (!data || !Array.isArray(data.devices)) {
        alert('Invalid layout data');
        return;
    }

    // Clear current
    devices.forEach(d => d.destroy());
    devices.clear();
    connections.forEach(c => c.destroy());
    connections.clear();

    // Recreate devices in the same order
    const idToDevice = new Map();
    for (const d of data.devices) {
        const el = createDeviceElement(d.type || 'pc');
        const device = new Device(el, d.x || 100, d.y || 100, d.type || 'pc', d.id);
        devices.set(device.id, device);
        idToDevice.set(device.id, device);
    }

    // Recreate connections
    if (Array.isArray(data.connections)) {
        for (const c of data.connections) {
            const a = idToDevice.get(c.a);
            const b = idToDevice.get(c.b);
            if (!a || !b) continue;
            // avoid duplicates
            if (connectionExists(a, b)) continue;
            const conn = new Connection(a, b, c.label || '');
            connections.set(conn.id, conn);
        }
    }

    // autosave
    scheduleAutosave();
}

// Autosave scheduler (throttle frequent writes)
let autosaveTimer = null;
function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
        try {
            const data = { devices: [], connections: [] };
            devices.forEach(dev => data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y }));
            connections.forEach(conn => data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.warn('Autosave failed', err);
        }
    }, 700);
}

// Load layout on startup if available
window.addEventListener('DOMContentLoaded', () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (data && Array.isArray(data.devices)) {
                loadLayoutFromData(data);
            }
        }
    } catch (err) {
        console.warn('Failed to load layout on startup', err);
    }
});
