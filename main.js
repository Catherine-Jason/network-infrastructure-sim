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

    let neighbors
