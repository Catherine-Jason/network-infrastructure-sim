const canvas = document.getElementById("canvas");
let connectMode = false;
let firstDevice = null;

// Create devices
document.querySelectorAll(".device-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        spawnDevice(type);
    });
});

// Toggle cable mode
document.getElementById("connectModeBtn").addEventListener("click", () => {
    connectMode = !connectMode;
    firstDevice = null;
    alert(connectMode ? "Cable Mode ON: Click two devices to connect." : "Cable Mode OFF");
});

// Clear canvas
document.getElementById("clearBtn").addEventListener("click", () => {
    canvas.innerHTML = "";
});

// Spawn device
function spawnDevice(type) {
    const div = document.createElement("div");
    div.classList.add("device");

    if (type === "router") div.innerHTML = `<i class="fa-solid fa-route"></i>`;
    if (type === "switch") div.innerHTML = `<i class="fa-solid fa-network-wired"></i>`;
    if (type === "pc") div.innerHTML = `<i class="fa-solid fa-desktop"></i>`;

    div.style.left = "100px";
    div.style.top = "100px";

    canvas.appendChild(div);

    makeDraggable(div);

    div.addEventListener("click", () => handleDeviceClick(div));
}

// Dragging logic
function makeDraggable(el) {
    let offsetX, offsetY;

    el.addEventListener("mousedown", e => {
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;

        function move(e) {
            el.style.left = `${e.clientX - offsetX}px`;
            el.style.top = `${e.clientY - offsetY}px`;
        }

        function stop() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
    });
}

// Cable connection logic
function handleDeviceClick(device) {
    if (!connectMode) return;

    if (!firstDevice) {
        firstDevice = device;
        return;
    }

    connectDevices(firstDevice, device);
    firstDevice = null;
}

// Draw cable
function connectDevices(dev1, dev2) {
    const cable = document.createElement("div");
    cable.classList.add("cable");

    const x1 = dev1.offsetLeft + 40;
    const y1 = dev1.offsetTop + 40;
    const x2 = dev2.offsetLeft + 40;
    const y2 = dev2.offsetTop + 40;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    cable.style.left = `${x1}px`;
    cable.style.top = `${y1}px`;
    cable.style.width = `${length}px`;
    cable.style.transform = `rotate(${angle}deg)`;

    canvas.appendChild(cable);
}

let deviceCounter = { router: 1, switch: 1, pc: 1 };
let selectedDevice = null;
let connections = new Map();

// Show device info
function handleDeviceClick(device) {
    if (connectMode) {
        if (!firstDevice) {
            firstDevice = device;
            return;
        }
        connectDevices(firstDevice, device);
        firstDevice = null;
        return;
    }

    selectedDevice = device;
    showDeviceInfo(device);
}

function showDeviceInfo(device) {
    const name = device.dataset.name;
    const ip = device.dataset.ip || "Not set";

    document.getElementById("deviceName").innerText = name;
    document.getElementById("deviceIP").value = ip;

    const list = document.getElementById("connectionList");
    list.innerHTML = "";

    const deviceConnections = connections.get(device) || [];
    deviceConnections.forEach(conn => {
        const li = document.createElement("li");
        li.innerText = conn.dataset.name;
        list.appendChild(li);
    });
}

// Save IP
document.getElementById("saveIP").addEventListener("click", () => {
    if (!selectedDevice) return;
    selectedDevice.dataset.ip = document.getElementById("deviceIP").value;
});

// Connect devices + track connections
function connectDevices(dev1, dev2) {
    drawCable(dev1, dev2);

    if (!connections.has(dev1)) connections.set(dev1, []);
    if (!connections.has(dev2)) connections.set(dev2, []);

    connections.get(dev1).push(dev2);
    connections.get(dev2).push(dev1);
}

function drawCable(dev1, dev2) {
    const cable = document.createElement("div");
    cable.classList.add("cable");

    const x1 = dev1.offsetLeft + 40;
    const y1 = dev1.offsetTop + 40;
    const x2 = dev2.offsetLeft + 40;
    const y2 = dev2.offsetTop + 40;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    cable.style.left = `${x1}px`;
    cable.style.top = `${y1}px`;
    cable.style.width = `${length}px`;
    cable.style.transform = `rotate(${angle}deg)`;

    canvas.appendChild(cable);
}

// Ping logic
document.getElementById("pingBtn").addEventListener("click", () => {
    const targetIP = document.getElementById("pingTarget").value;
    const result = document.getElementById("pingResult");

    if (!selectedDevice) {
        result.innerText = "Select a device first.";
        return;
    }

    const visited = new Set();
    const queue = [selectedDevice];

    while (queue.length > 0) {
        const dev = queue.shift();
        if (dev.dataset.ip === targetIP) {
            result.innerText = "Ping successful!";
            return;
        }

        visited.add(dev);

        const neighbors = connections.get(dev) || [];
        neighbors.forEach(n => {
            if (!visited.has(n)) queue.push(n);
        });
    }

    result.innerText = "Ping failed. No path.";
});
