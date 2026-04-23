const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let devices = [];
let connections = [];
let dragging = null;
let selectedForLink = null;
let pingSource = null;
let pingTarget = null;
let packet = null; // For animation

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

// BFS pathfinding
function findPath(startId, endId) {
  let queue = [[startId]];
  let visited = new Set([startId]);

  while (queue.length > 0) {
    let path = queue.shift();
    let node = path[path.length - 1];

    if (node === endId) return path;

    let neighbors = connections
      .filter(c => c.from === node || c.to === node)
      .map(c => (c.from === node ? c.to : c.from));

    for (let n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([...path, n]);
      }
    }
  }

  return null;
}

// Start ping animation
function startPing() {
  const path = findPath(pingSource.id, pingTarget.id);

  if (!path) {
    alert("❌ Ping failed: No path found");
    pingSource = null;
    pingTarget = null;
    return;
  }

  // Convert device IDs to coordinates
  let points = path.map(id => {
    let d = devices.find(x => x.id === id);
    return { x: d.x, y: d.y };
  });

  packet = {
    points,
    index: 0,
    progress: 0
  };
}

// Draw packet animation
function drawPacket() {
  if (!packet) return;

  let p = packet;
  let a = p.points[p.index];
  let b = p.points[p.index + 1];

  if (!b) {
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

// Draw grid
function drawGrid() {
  ctx.strokeStyle = "#111a2e";
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Draw connections
function drawConnections() {
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 2;

  connections.forEach(c => {
    const a = devices.find(d => d.id === c.from);
    const b = devices.find(d => d.id === c.to);
    if (!a || !b) return;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });
}

// Draw devices
function drawDevices() {
  devices.forEach(d => {
    // Glow if selected
    if (selectedForLink && selectedForLink.id === d.id) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 3;
      ctx.stroke();
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

// Main render
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawConnections();
  drawDevices();
  drawPacket();
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

animate();

// EXPOSE PING FUNCTION
window.startPingMode = function () {
  if (!selectedForLink) return alert("Click a device to start ping");
  pingSource = selectedForLink;
  alert("Now click a target device to ping");
};
