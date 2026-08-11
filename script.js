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
