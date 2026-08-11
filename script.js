// Improved script for network-infrastructure-sim
// - Pointer events (mouse & touch)
// - SVG lines for cables (auto-updating while dragging)
// - Device / Connection classes with data model
// - Visual connect-mode toggle, prevent self-connect
// - Persistence: save/load to localStorage, export/import JSON
// - NEW: Device configuration panels, cheat bubble, VLAN/routing, ping simulation,
//        port labels, status coloring, troubleshooting hints, switch port UI

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

    scheduleAutosave();
});

// Save / Load
const STORAGE_KEY = "nis-layout-v2";

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

// Cheat bubble (learning assistant)
const STEPS = [
    'Place devices',
    'Name devices',
    'Assign IPs',
    'Configure VLANs',
    'Label cable ports',
    'Verify connectivity',
    'Ping test',
    'Troubleshooting'
];
let cheatIndex = parseInt(localStorage.getItem('nis-cheat-step') || '0', 10);

function createCheatBubble() {
    const bubble = document.createElement('div');
    bubble.id = 'cheatBubble';
    bubble.className = 'cheat-bubble';
    bubble.innerHTML = `
        <div class="cheat-header">Learning Assistant</div>
        <div class="cheat-step" id="cheatStepText"></div>
        <div class="cheat-controls">
            <button id="cheatNext">Next Step</button>
            <button id="cheatClose">Close</button>
        </div>
    `;
    document.body.appendChild(bubble);

    const stepText = bubble.querySelector('#cheatStepText');
    const nextBtn = bubble.querySelector('#cheatNext');
    const closeBtn = bubble.querySelector('#cheatClose');

    function render() {
        stepText.textContent = `Step ${cheatIndex + 1}: ${STEPS[cheatIndex] || 'Done'}`;
    }
    render();

    nextBtn.addEventListener('click', () => {
        cheatIndex = Math.min(STEPS.length - 1, cheatIndex + 1);
        localStorage.setItem('nis-cheat-step', String(cheatIndex));
        render();
    });
    closeBtn.addEventListener('click', () => {
        bubble.style.display = 'none';
        localStorage.setItem('nis-cheat-closed', '1');
    });

    if (localStorage.getItem('nis-cheat-closed')) bubble.style.display = 'none';
}
createCheatBubble();

// Device class to handle drag/positioning/connection bookkeeping and config
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

        // Configuration model
        this.name = `${type}-${this.id.slice(-4)}`;
        this.ip = ""; // string
        this.vlan = (type === 'switch') ? 1 : null; // switches default VLAN 1
        this.gateway = ""; // for PCs
        this.portCounter = 0; // for auto-increment port numbering (fa0/1...)

        // router-specific
        this.interfaces = []; // [{name: 'G0/0', ip: '192.168.1.1', up: true}]
        if (this.type === 'router') {
            // provide two default interfaces for convenience
            this.interfaces.push({ name: 'G0/0', ip: '', up: true });
            this.interfaces.push({ name: 'G0/1', ip: '', up: true });
        }

        // switch port defaults
        this.switchPorts = {}; // portLabel -> {type: 'access'|'trunk', vlan: 1}

        this._applyTransform();

        // Visual label
        this._renderLabel();

        // pointer handlers
        this.el.addEventListener("pointerdown", this._onPointerDown.bind(this));
        // clicking for connect mode or to open config
        this.el.addEventListener("click", (e) => this._onClick(e));
        // double click to remove device (and its connections)
        this.el.addEventListener("dblclick", (e) => this.destroy());
    }

    _renderLabel() {
        // Add a small name label inside the device element
        let nameEl = this.el.querySelector('.dev-name');
        if (!nameEl) {
            nameEl = document.createElement('div');
            nameEl.className = 'dev-name';
            this.el.appendChild(nameEl);
        }
        nameEl.textContent = this.name;
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
            // status update when moved
            evaluateNetworkStatus();
        };

        this.el.addEventListener("pointermove", onMove);
        this.el.addEventListener("pointerup", onUp);
        this.el.addEventListener("pointercancel", onUp);
    }

    _onClick(e) {
        // If the user just dragged, don't treat it as a click for connecting
        if (this._movedSinceDown) return;

        if (connectMode) {
            // Connection behavior
            if (!firstDevice) {
                firstDevice = this;
                this.el.classList.add("selected");
                return;
            }

            if (firstDevice === this) {
                firstDevice.el.classList.remove("selected");
                firstDevice = null;
                return;
            }

            const label = prompt("Label for connection (optional):", "");
            const conn = createConnection(firstDevice, this, label || "");
            if (conn) {
                connections.set(conn.id, conn);
                scheduleAutosave();
            } else {
                alert('Connection failed (duplicate or self-connect)');
            }
            firstDevice.el.classList.remove("selected");
            firstDevice = null;
            evaluateNetworkStatus();
            return;
        }

        // open info panel
        showDevicePanel(this);
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
        evaluateNetworkStatus();
    }

    center() {
        // compute center relative to svg/canvas
        const canvasRect = canvas.getBoundingClientRect();
        const elRect = this.el.getBoundingClientRect();
        const cx = (elRect.left - canvasRect.left) + elRect.width / 2;
        const cy = (elRect.top - canvasRect.top) + elRect.height / 2;
        return { x: cx, y: cy };
    }

    nextPortLabel() {
        this.portCounter += 1;
        const lbl = `fa0/${this.portCounter}`;
        // set default switch port info if this is a switch
        if (this.type === 'switch') {
            this.switchPorts[lbl] = { type: 'access', vlan: this.vlan || 1 };
        }
        return lbl;
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

        // port labels near each device endpoint
        this.portLabelA = document.createElementNS(svgNS, "text");
        this.portLabelB = document.createElementNS(svgNS, "text");
        this.portLabelA.setAttribute('class', 'port-label');
        this.portLabelB.setAttribute('class', 'port-label');
        this.group.appendChild(this.portLabelA);
        this.group.appendChild(this.portLabelB);

        if (this.label) {
            this.text = document.createElementNS(svgNS, "text");
            this.text.textContent = this.label;
            this.text.setAttribute('class','conn-label');
            this.group.appendChild(this.text);
        }

        svg.appendChild(this.group);

        // assign port labels (fa0/x) per device
        this.portA = { label: devA.nextPortLabel(), vlan: devA.vlan, trunk: false };
        this.portB = { label: devB.nextPortLabel(), vlan: devB.vlan, trunk: false };

        // maintain backrefs
        this.devA.connections.add(this.id);
        this.devB.connections.add(this.id);

        // double-click to remove connection
        this.line.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this.destroy();
        });

        // click to show info about port labeling
        this.line.addEventListener('click', (e) => {
            e.stopPropagation();
            const msg = `${this.devA.name} ${this.portA.label} <--> ${this.devB.name} ${this.portB.label}`;
            alert(msg);
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

        // port label positions (near endpoints)
        this.portLabelA.textContent = this.portA.label || '';
        this.portLabelB.textContent = this.portB.label || '';
        this.portLabelA.setAttribute('x', a.x + 6);
        this.portLabelA.setAttribute('y', a.y - 6);
        this.portLabelB.setAttribute('x', b.x + 6);
        this.portLabelB.setAttribute('y', b.y - 6);

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
        evaluateNetworkStatus();
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
        data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y, name: dev.name, ip: dev.ip, vlan: dev.vlan, gateway: dev.gateway, interfaces: dev.interfaces || [], portCounter: dev.portCounter, switchPorts: dev.switchPorts || {} });
    });

    connections.forEach(conn => {
        data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label, portA: conn.portA, portB: conn.portB });
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
        data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y, name: dev.name, ip: dev.ip, vlan: dev.vlan, gateway: dev.gateway, interfaces: dev.interfaces || [], portCounter: dev.portCounter, switchPorts: dev.switchPorts || {} });
    });

    connections.forEach(conn => {
        data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label, portA: conn.portA, portB: conn.portB });
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
        device.name = d.name || device.name;
        device.ip = d.ip || '';
        device.vlan = (typeof d.vlan !== 'undefined') ? d.vlan : device.vlan;
        device.gateway = d.gateway || '';
        device.interfaces = d.interfaces || device.interfaces;
        device.portCounter = d.portCounter || device.portCounter || 0;
        device.switchPorts = d.switchPorts || device.switchPorts || {};
        device._renderLabel();
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
            // restore port info if present
            if (c.portA) conn.portA = c.portA;
            if (c.portB) conn.portB = c.portB;
            connections.set(conn.id, conn);
        }
    }

    // autosave
    scheduleAutosave();
    evaluateNetworkStatus();
}

// Autosave scheduler (throttle frequent writes)
let autosaveTimer = null;
function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
        try {
            const data = { devices: [], connections: [] };
            devices.forEach(dev => data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y, name: dev.name, ip: dev.ip, vlan: dev.vlan, gateway: dev.gateway, interfaces: dev.interfaces || [], portCounter: dev.portCounter, switchPorts: dev.switchPorts || {} }));
            connections.forEach(conn => data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label, portA: conn.portA, portB: conn.portB }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.warn('Autosave failed', err);
        }
    }, 700);
}

// Device UI panel (created on demand)
let currentPanel = null;
function showDevicePanel(device) {
    if (currentPanel) currentPanel.remove();

    const panel = document.createElement('div');
    panel.className = 'device-panel';

    panel.innerHTML = `
        <h3>Device: <span id="panelDevName">${device.name}</span></h3>
        <label>Name: <input id="devName" type="text" value="${device.name}"></label>
        <label>IP: <input id="devIP" type="text" value="${device.ip}"></label>
        <label>VLAN: <input id="devVLAN" type="number" min="1" value="${device.vlan || ''}"></label>
        <label>Gateway: <input id="devGW" type="text" value="${device.gateway}"></label>
        <div id="routerInterfaces"></div>
        <div id="switchPorts"></div>
        <div class="panel-actions">
            <button id="applyDev">Apply</button>
            <button id="pingFrom">Ping...</button>
            <button id="closePanel">Close</button>
        </div>
        <div id="statusHints" class="status-hints"></div>
    `;

    document.body.appendChild(panel);
    currentPanel = panel;

    const nameInput = panel.querySelector('#devName');
    const ipInput = panel.querySelector('#devIP');
    const vlanInput = panel.querySelector('#devVLAN');
    const gwInput = panel.querySelector('#devGW');
    const ifaceDiv = panel.querySelector('#routerInterfaces');
    const switchDiv = panel.querySelector('#switchPorts');
    const applyBtn = panel.querySelector('#applyDev');
    const pingBtn = panel.querySelector('#pingFrom');
    const closeBtn = panel.querySelector('#closePanel');
    const hintsDiv = panel.querySelector('#statusHints');

    // router interfaces editor
    if (device.type === 'router') {
        ifaceDiv.innerHTML = '<h4>Interfaces</h4>';
        device.interfaces.forEach((iface, idx) => {
            const row = document.createElement('div');
            row.className = 'iface-row';
            row.innerHTML = `
                <label>${iface.name}: IP <input data-iface="${idx}" class="iface-ip" type="text" value="${iface.ip}"></label>
                <label>Up <input data-iface="${idx}" class="iface-up" type="checkbox" ${iface.up ? 'checked' : ''}></label>
            `;
            ifaceDiv.appendChild(row);
        });
    }

    // switch ports editor
    if (device.type === 'switch') {
        switchDiv.innerHTML = '<h4>Switch Ports</h4>';
        const portsList = document.createElement('div');
        portsList.id = 'portsList';
        switchDiv.appendChild(portsList);

        function renderPorts() {
            portsList.innerHTML = '';
            const entries = Object.entries(device.switchPorts || {});
            if (entries.length === 0) {
                portsList.innerHTML = '<div style="font-size:13px;color:#666">No ports yet. Create connections to auto-add ports, or use Add Port.</div>';
            }
            entries.forEach(([label, info]) => {
                const row = document.createElement('div');
                row.className = 'iface-row';
                row.innerHTML = `
                    <div style="flex:1">${label}</div>
                    <select data-port="${label}" class="port-type">
                        <option value="access">Access</option>
                        <option value="trunk">Trunk</option>
                    </select>
                    <input data-port-vlan="${label}" class="port-vlan" type="number" min="1" value="${info.vlan || ''}" style="width:70px">
                `;
                portsList.appendChild(row);
                const sel = row.querySelector('.port-type');
                const vlanInp = row.querySelector('.port-vlan');
                sel.value = info.type || 'access';
                vlanInp.value = info.vlan || '';
            });
        }

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Port';
        addBtn.addEventListener('click', () => {
            const lbl = device.nextPortLabel();
            renderPorts();
        });
        switchDiv.appendChild(addBtn);
        renderPorts();

        // when applying, we'll read values back
    }

    function renderHints() {
        const hints = [];
        if (!device.ip && device.type === 'pc') hints.push('Missing IP');
        if (device.type === 'pc' && device.gateway && !ipInSameSubnet(device.ip, device.gateway)) hints.push('Gateway not in same subnet');
        if (device.type === 'router') {
            const anyUp = device.interfaces.some(i => i.up && i.ip);
            if (!anyUp) hints.push('Router interfaces down or missing IPs');
        }
        hintsDiv.innerHTML = hints.length ? `<strong>Hints:</strong><ul>${hints.map(h=>`<li>${h}</li>`).join('')}</ul>` : '';
    }
    renderHints();

    applyBtn.addEventListener('click', () => {
        device.name = nameInput.value.trim() || device.name;
        device.ip = ipInput.value.trim();
        device.vlan = vlanInput.value ? parseInt(vlanInput.value, 10) : device.vlan;
        device.gateway = gwInput.value.trim();
        if (device.type === 'router') {
            const ipInputs = panel.querySelectorAll('.iface-ip');
            const upInputs = panel.querySelectorAll('.iface-up');
            ipInputs.forEach(inp => {
                const idx = parseInt(inp.dataset.iface, 10);
                device.interfaces[idx].ip = inp.value.trim();
            });
            upInputs.forEach(inp => {
                const idx = parseInt(inp.dataset.iface, 10);
                device.interfaces[idx].up = inp.checked;
            });
        }

        if (device.type === 'switch') {
            // read back port settings
            const portTypeEls = panel.querySelectorAll('.port-type');
            portTypeEls.forEach(sel => {
                const lbl = sel.dataset.port;
                const tp = sel.value;
                const vlanEl = panel.querySelector(`[data-port-vlan="${lbl}"]`);
                const vlanVal = vlanEl && vlanEl.value ? parseInt(vlanEl.value,10) : undefined;
                if (!device.switchPorts[lbl]) device.switchPorts[lbl] = { type: tp, vlan: vlanVal };
                else { device.switchPorts[lbl].type = tp; if (typeof vlanVal !== 'undefined') device.switchPorts[lbl].vlan = vlanVal; }

                // update any connected connection port metadata
                for (const connId of device.connections) {
                    const conn = connections.get(connId);
                    if (!conn) continue;
                    if (conn.devA === device && conn.portA && conn.portA.label === lbl) {
                        conn.portA.trunk = (tp === 'trunk');
                        if (typeof vlanVal !== 'undefined') conn.portA.vlan = vlanVal;
                    }
                    if (conn.devB === device && conn.portB && conn.portB.label === lbl) {
                        conn.portB.trunk = (tp === 'trunk');
                        if (typeof vlanVal !== 'undefined') conn.portB.vlan = vlanVal;
                    }
                }
            });
        }

        device._renderLabel();
        scheduleAutosave();
        evaluateNetworkStatus();
        renderHints();
        panel.querySelector('#panelDevName').textContent = device.name;
    });

    pingBtn.addEventListener('click', () => {
        const target = prompt('Ping target IP:');
        if (!target) return;
        const res = simulatePing(device, target.trim());
        alert(res.message);
    });

    closeBtn.addEventListener('click', () => {
        panel.remove();
        currentPanel = null;
    });
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

// Helper: derive /24 network from IP string
function ipToNetwork(ip) {
    if (!ip) return null;
    const m = ip.match(/^(\d+\.\d+\.\d+)\./);
    if (!m) return null;
    return m[1] + '.0/24';
}
function ipInSameSubnet(a, b) {
    const na = ipToNetwork(a);
    const nb = ipToNetwork(b);
    return na && nb && na === nb;
}

// Ping simulation
function simulatePing(srcDevice, targetIP) {
    // find device with targetIP
    let dest = null;
    let destIfaceIP = false;
    for (const d of devices.values()) {
        if (d.ip === targetIP) { dest = d; break; }
        // router interface check
        if (d.type === 'router') {
            for (const iface of d.interfaces) if (iface.ip === targetIP) { dest = d; destIfaceIP = true; break; }
            if (dest) break;
        }
    }
    if (!dest) return { ok: false, message: 'Destination not found on network (no device has that IP).' };

    // basic checks
    if (!srcDevice.ip) return { ok: false, message: 'Source missing IP. Hint: assign IP to source.' };

    // BFS path where edges traversable respecting VLANs/trunks/routers
    const visited = new Set();
    const q = [srcDevice];
    visited.add(srcDevice.id);
    const parent = {};

    while (q.length) {
        const cur = q.shift();
        if (cur === dest) break;
        for (const connId of cur.connections) {
            const conn = connections.get(connId);
            if (!conn) continue;
            const other = (conn.devA === cur) ? conn.devB : conn.devA;

            // determine port info from perspective cur->other
            const portCur = (conn.devA === cur) ? conn.portA : conn.portB;
            const portOther = (conn.devA === cur) ? conn.portB : conn.portA;

            let pass = false;
            // if either endpoint is router, allow (router can route)
            if (cur.type === 'router' || other.type === 'router') pass = true;
            // if trunk on either side
            if (portCur && portCur.trunk) pass = true;
            if (portOther && portOther.trunk) pass = true;
            // VLAN match
            if (portCur && portOther && typeof portCur.vlan !== 'undefined' && typeof portOther.vlan !== 'undefined' && portCur.vlan === portOther.vlan) pass = true;

            if (!pass) continue;

            if (!visited.has(other.id)) {
                visited.add(other.id);
                parent[other.id] = cur.id;
                q.push(other);
            }
        }
    }

    if (!visited.has(dest.id)) {
        // try route via routers if networks differ
        const srcNet = ipToNetwork(srcDevice.ip);
        const dstNet = ipToNetwork(targetIP);
        if (srcNet && dstNet && srcNet !== dstNet) {
            // see if there is a router that has up interfaces in both nets and is reachable from src and dest
            for (const r of devices.values()) {
                if (r.type !== 'router') continue;
                const hasIfSrcNet = r.interfaces.some(i => i.up && ipToNetwork(i.ip) === srcNet);
                const hasIfDstNet = r.interfaces.some(i => i.up && ipToNetwork(i.ip) === dstNet);
                if (!hasIfSrcNet || !hasIfDstNet) continue;
                // check reachability from src to router and dest to router (ignoring VLAN differences for this basic check)
                if (isReachableIgnoringSubnet(srcDevice, r) && isReachableIgnoringSubnet(dest, r)) {
                    return { ok: true, message: `Ping successful (routed via ${r.name}).` };
                }
            }
        }

        // generate troubleshooting hints
        const hints = generatePingHints(srcDevice, dest, targetIP);
        return { ok: false, message: `Ping failed. Hints:\n${hints.join('\n')}` };
    }

    return { ok: true, message: 'Ping successful (direct path).' };
}

function isReachableIgnoringSubnet(a, b) {
    // BFS ignoring VLAN restrictions and router interface checks — used for quick router path check
    const visited = new Set();
    const q = [a]; visited.add(a.id);
    while (q.length) {
        const cur = q.shift();
        if (cur === b) return true;
        for (const connId of cur.connections) {
            const conn = connections.get(connId); if (!conn) continue;
            const other = (conn.devA === cur) ? conn.devB : conn.devA;
            if (!visited.has(other.id)) { visited.add(other.id); q.push(other); }
        }
    }
    return false;
}

function generatePingHints(src, dest, targetIP) {
    const hints = [];
    if (!src.ip) hints.push('Source device has no IP address.');
    if (!dest.ip && !(dest.type === 'router' && dest.interfaces.some(i=>i.ip === targetIP))) hints.push('Destination device has no IP address.');

    // check if any cable connects them
    if (!isReachableIgnoringSubnet(src, dest)) hints.push('Devices are not physically connected (no path).');

    // VLAN mismatch check on any path edge
    // We'll inspect each connection between src and dest to find mismatches (simple heuristic)
    for (const conn of connections.values()) {
        const a = conn.devA, b = conn.devB;
        const va = conn.portA && conn.portA.vlan;
        const vb = conn.portB && conn.portB.vlan;
        if (typeof va !== 'undefined' && typeof vb !== 'undefined' && va !== vb) {
            hints.push(`VLAN mismatch on link ${a.name} ${conn.portA.label} <-> ${b.name} ${conn.portB.label} (VLAN ${va} vs ${vb}).`);
        }
    }

    // gateway route
    if (src.type === 'pc' && src.gateway) {
        if (!ipInSameSubnet(src.ip, src.gateway)) hints.push('Gateway not in the same subnet as source IP.');
    }

    // router interface down
    for (const r of devices.values()) if (r.type === 'router') {
        r.interfaces.forEach(iface => { if (!iface.up) hints.push(`${r.name} ${iface.name} is down.`); });
    }

    if (!hints.length) hints.push('Check IP addresses, VLANs, and cable connections.');
    return hints;
}

// Network status evaluation: color devices
function evaluateNetworkStatus() {
    // Basic approach: devices with no connections -> RED. Else if all endpoints reachable (simple cluster), GREEN. Else YELLOW.
    // We compute connected components (ignoring VLAN) and then mark VLAN mismatches if any.

    // mark all red by default
    devices.forEach(d => {
        d.el.classList.remove('status-green','status-yellow','status-red');
        d.el.classList.add('status-red');
    });

    // find connected clusters ignoring VLAN
    const visited = new Set();
    for (const start of devices.values()) {
        if (visited.has(start.id)) continue;
        const comp = [];
        const q = [start]; visited.add(start.id);
        while (q.length) {
            const cur = q.shift(); comp.push(cur);
            for (const connId of cur.connections) {
                const conn = connections.get(connId); if (!conn) continue;
                const other = (conn.devA === cur) ? conn.devB : conn.devA;
                if (!visited.has(other.id)) { visited.add(other.id); q.push(other); }
            }
        }
        // if component size 1 -> red unless router with interfaces
        if (comp.length === 1) {
            const d = comp[0];
            if (d.type === 'router' && d.interfaces.some(i=>i.ip)) {
                d.el.classList.remove('status-red'); d.el.classList.add('status-yellow');
            } else {
                d.el.classList.remove('status-green','status-yellow'); d.el.classList.add('status-red');
            }
            continue;
        }
        // check VLAN consistency across component: if any link has mismatched VLANs -> yellow for endpoints, else green
        let mismatch = false;
        for (const c of connections.values()) {
            if (!comp.includes(c.devA) || !comp.includes(c.devB)) continue;
            const va = c.portA && c.portA.vlan;
            const vb = c.portB && c.portB.vlan;
            if (typeof va !== 'undefined' && typeof vb !== 'undefined' && va !== vb) mismatch = true;
        }
        for (const d of comp) {
            d.el.classList.remove('status-red');
            if (mismatch) d.el.classList.add('status-yellow');
            else d.el.classList.add('status-green');
        }
    }
}

// Helpers for UI and startup
function spawnDevice(type) {
    const el = createDeviceElement(type);
    const rect = canvas.getBoundingClientRect();
    const startX = Math.max(10, Math.floor(rect.width / 2 - 40 + (Math.random() - 0.5) * 80));
    const startY = Math.max(10, Math.floor(rect.height / 2 - 40 + (Math.random() - 0.5) * 80));
    const device = new Device(el, startX, startY, type);
    devices.set(device.id, device);
    // auto-save
    scheduleAutosave();
    evaluateNetworkStatus();
    return device;
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
    // initial status
    evaluateNetworkStatus();
});

// Expose a simple debug ping command from console:
window.simulatePing = simulatePing;
window.evaluateNetworkStatus = evaluateNetworkStatus;

// End of script
