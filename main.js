const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let devices = [];
let connections = [];
let dragging = null;
let selectedForLink = null;

// DEVICE ICONS (simple emojis for now — upgrade later)
const icons = {
  router: "📡",
  switch: "🔀",
  pc: "💻"
};

// Create device (called from HTML buttons)
function addDevice(type) {
  devices.push({
    id: Date.now() + Math.random(),
    type,
    x: Math.random() * (canvas.width - 200) + 100,
    y: Math.random() * (canvas.height - 200) + 100,
    radius: 30
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
    // If we already have a selected device, try to create a connection
    if (selectedForLink && selectedForLink.id !== hit.id) {
      createConnection(selectedForLink, hit);
      selectedForLink = null;
      draw();
      return;
    }

    // If no selected device yet, start dragging OR select for linking
    // Left click drag, but we’ll also use it for selection
    dragging = hit;
    selectedForLink = hit;
    draw();
  } else {
    // Clicked empty space → clear selection
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
  // Prevent duplicates (A-B or B-A)
  const exists = connections.some(c =>
    (c.from === a.id && c.to === b.id) ||
    (c.from === b.id && c.to === a.id)
  );
  if (exists) return;

  connections.push({
    from: a.id,
    to: b.id
  });
}

// Draw grid background
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
    // Outer glow if selected for linking
    if (selectedForLink && selectedForLink.id === d.id) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Node body
    ctx.beginPath();
    ctx.fillStyle = "#111a2e";
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
}

// Animation loop (optional, but keeps it smooth)
function animate() {
  draw();
  requestAnimationFrame(animate);
}

animate();
