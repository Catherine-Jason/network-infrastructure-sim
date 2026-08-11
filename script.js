// Enhanced script for network-infrastructure-sim
// Adds: device configuration panels, cheat bubble learning assistant,
// port labeling, VLANs, routers, switches, PC configs, ping simulation,
// status colors, troubleshooting hints, autosave persistence.
// Additional: CLI-like command terminal per-device and cheat bubble shows exact commands to run per step (Packet Tracer style).

const canvas = document.getElementById("canvas");
const connectModeBtn = document.getElementById("connectModeBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

// SVG overlay for cables
const svgNS = "http://www.w3.org/2000/svg";
const svg = document.createElementNS(svgNS, "svg");
svg.setAttribute("aria-hidden", "true");
canvas.insertBefore(svg, canvas.firstChild);

let connectMode = false;
let firstDevice = null;

const devices = new Map();       // id -> Device
const connections = new Map();   // id -> Connection

// Cheat/learning state
const CHEAT_KEY = 'nis-cheat-v1';
const STORAGE_KEY = 'nis-layout-v2';

const cheatSteps = [
  'Place devices',
  'Name devices',
  'Assign IPs',
  'Configure VLANs',
  'Label cable ports',
  'Verify connectivity',
  'Ping test',
  'Troubleshooting'
];

// Packet-Tracer style required commands per step (examples)
const cheatCommands = [
  ['# Place devices using the GUI (no CLI commands)'],
  ['hostname <name>  # e.g. hostname PC1 or hostname R1'],
  ['interface <name>\n ip address <x.x.x.x/24>\n no shutdown  # on router', 'ip address <x.x.x.x/24>  # on PC use: ip address 192.168.1.10'],
  ['vlan <id>  # on switch\ninterface fa0/1\n switchport mode access\n switchport access vlan <id>'],
  ['(Automatic) cables create fa0/x labels; use GUI to cable devices'],
  ['show ip interface brief  # verify interface states and IPs'],
  ['ping <ip>  # from PC CLI or router CLI'],
  ['show ip route\nshow running-config\nshow interfaces  # use these to troubleshoot']
];

function uid(prefix = "") { return prefix + Math.random().toString(36).slice(2, 9); }

// Create UI elements: device config panel and cheat bubble
const configPanel = document.createElement('div');
configPanel.id = 'configPanel';
configPanel.style.cssText = 'position:absolute; right:16px; top:100px; width:360px; background:white; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.15); padding:12px; z-index:50; font-family:Arial; display:none;';
canvas.parentElement.appendChild(configPanel);

const cheatBubble = document.createElement('div');
cheatBubble.id = 'cheatBubble';
cheatBubble.style.cssText = 'position:fixed; left:16px; bottom:16px; width:320px; background:#fff8e1; border-radius:12px; padding:12px; box-shadow:0 8px 24px rgba(0,0,0,0.15); z-index:60; font-family:Arial;';
canvas.parentElement.appendChild(cheatBubble);

function renderCheatBubble() {
  const state = JSON.parse(localStorage.getItem(CHEAT_KEY) || '{}');
  const stepIndex = state.stepIndex || 0;
  const open = state.open !== undefined ? state.open : true;

  cheatBubble.innerHTML = '';
  if (!open) {
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Show Learning Assistant';
    openBtn.onclick = () => { state.open = true; localStorage.setItem(CHEAT_KEY, JSON.stringify(state)); renderCheatBubble(); };
    cheatBubble.appendChild(openBtn);
    return;
  }

  const title = document.createElement('div');
  title.style.fontWeight = '700';
  title.textContent = 'Learning Assistant (CLI hints)';
  cheatBubble.appendChild(title);

  const step = document.createElement('div');
  step.style.margin = '8px 0';
  step.textContent = `Step ${stepIndex + 1}: ${cheatSteps[stepIndex] || 'Complete'}`;
  cheatBubble.appendChild(step);

  // Show exact CLI command hints as preformatted text
  const pre = document.createElement('pre');
  pre.style.background = '#fff'; pre.style.padding = '8px'; pre.style.borderRadius='6px'; pre.style.fontSize='12px'; pre.style.maxHeight='180px'; pre.style.overflow='auto';
  pre.textContent = (cheatCommands[stepIndex] || ['']).join('\n\n');
  cheatBubble.appendChild(pre);

  const hint = document.createElement('div');
  hint.style.fontSize = '13px';
  hint.style.color = '#334';
  hint.style.marginBottom = '8px';
  hint.textContent = getHintForStep(stepIndex);
  cheatBubble.appendChild(hint);

  const controls = document.createElement('div');
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next Step';
  nextBtn.style.marginRight = '8px';
  nextBtn.onclick = () => { state.stepIndex = Math.min(stepIndex + 1, cheatSteps.length - 1); localStorage.setItem(CHEAT_KEY, JSON.stringify(state)); renderCheatBubble(); };
  controls.appendChild(nextBtn);

  const autoCheck = document.createElement('button'); autoCheck.textContent='Auto-Check'; autoCheck.style.marginRight='8px'; autoCheck.onclick = ()=>{ if (checkStepComplete(stepIndex)) { state.stepIndex = Math.min(stepIndex+1,cheatSteps.length-1); localStorage.setItem(CHEAT_KEY, JSON.stringify(state)); renderCheatBubble(); alert('Step complete — advanced.'); } else alert('Step not complete yet.'); };
  controls.appendChild(autoCheck);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.onclick = () => { state.open = false; localStorage.setItem(CHEAT_KEY, JSON.stringify(state)); renderCheatBubble(); };
  controls.appendChild(closeBtn);

  cheatBubble.appendChild(controls);
}

function getHintForStep(idx) {
  switch(idx) {
    case 0: return 'Drag devices from the toolbar into the canvas.';
    case 1: return 'Click a device, open the CLI and run: hostname PC1';
    case 2: return 'Assign IPs using: ip address 192.168.1.10/24 or interface g0/0\n ip address 10.0.0.1/24';
    case 3: return 'Create VLANs on the switch: vlan 10  then on interface: switchport mode access\n switchport access vlan 10';
    case 4: return 'Connect cables; labels are assigned automatically (fa0/1, fa0/2...). Use GUI to cable.';
    case 5: return 'Run show ip interface brief to verify interfaces are up and IPs assigned.';
    case 6: return 'From a PC CLI run: ping 192.168.1.2';
    case 7: return 'Use show running-config and show ip route to find mismatches.';
    default: return '';
  }
}

// Auto-completion check for steps (basic heuristics)
function checkStepComplete(idx) {
  if (idx === 0) return devices.size > 0;
  if (idx === 1) {
    for (const d of devices.values()) { if (!d.config.name || d.config.name.match(/^pc-|^router|^switch/)) return false; } return true;
  }
  if (idx === 2) { // all PCs have IP
    for (const d of devices.values()) { if (d.type === 'pc' && !d.config.ip) return false; } return true;
  }
  if (idx === 3) { // switches have at least one VLAN or ports assigned
    for (const d of devices.values()) { if (d.type === 'switch') { if (!d.config.ports || Object.keys(d.config.ports).length===0) return false; } } return true;
  }
  if (idx === 4) return connections.size > 0;
  if (idx === 5) return true; // can't easily verify here
  if (idx === 6) return true; // ping is user-driven
  if (idx === 7) return true;
  return false;
}

renderCheatBubble();

// Button wiring for spawning
document.querySelectorAll('.device-btn').forEach(btn => btn.addEventListener('click', e => spawnDevice(btn.dataset.type)));

connectModeBtn.addEventListener('click', () => {
  connectMode = !connectMode;
  firstDevice = null;
  connectModeBtn.classList.toggle('active', connectMode);
  connectModeBtn.textContent = connectMode ? 'Cable Mode: ON' : 'Cable Mode: OFF';
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all devices and connections?')) return;
  devices.forEach(d => d.destroy()); devices.clear();
  connections.forEach(c => c.destroy()); connections.clear();
  scheduleAutosave();
});

saveBtn.addEventListener('click', () => { saveLayout(); alert('Saved.'); });
loadBtn.addEventListener('click', () => loadLayout());
exportBtn.addEventListener('click', () => exportLayout());
importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { const data = JSON.parse(reader.result); loadLayoutFromData(data); } catch (err) { alert('Invalid file: ' + err.message); }
  };
  reader.readAsText(f); fileInput.value = '';
});

// Spawn device and attach Device class
function spawnDevice(type) {
  const el = createDeviceElement(type);
  const rect = canvas.getBoundingClientRect();
  const startX = Math.max(10, Math.floor(rect.width / 2 - 40 + (Math.random() - 0.5) * 80));
  const startY = Math.max(10, Math.floor(rect.height / 2 - 40 + (Math.random() - 0.5) * 80));
  const device = new Device(el, startX, startY, type);
  devices.set(device.id, device);
  scheduleAutosave();
  return device;
}

function createDeviceElement(type) {
  const div = document.createElement('div');
  div.classList.add('device');
  div.setAttribute('data-type', type);
  if (type === 'router') div.innerHTML = `<i class="fa-solid fa-route"></i>`;
  else if (type === 'switch') div.innerHTML = `<i class="fa-solid fa-network-wired"></i>`;
  else div.innerHTML = `<i class="fa-solid fa-desktop"></i>`;
  div.style.position = 'absolute'; div.style.left = '0px'; div.style.top = '0px';
  canvas.appendChild(div);
  return div;
}

// Device class
class Device {
  constructor(el, x = 100, y = 100, type = 'pc', id = null) {
    this.el = el; this.type = type; this.id = id || uid('dev_');
    this.el.dataset.id = this.id; this.x = x; this.y = y; this.connections = new Set();
    this.nextPort = 1; // for fa0/X labeling
    this.ports = new Map(); // portLabel -> connectionId

    // configuration model
    this.config = { name: `${type}-${this.id.slice(-4)}` };
    if (type === 'pc') this.config = Object.assign(this.config, { ip: '', vlan: '', gateway: '' });
    if (type === 'switch') this.config = Object.assign(this.config, { ports: {} });
    if (type === 'router') this.config = Object.assign(this.config, { interfaces: [] , routes: [] });

    this.status = 'unknown'; // unknown/green/red/yellow
    this._isDragging = false; this._movedSinceDown = false;
    this._applyTransform();

    this.el.addEventListener('pointerdown', this._onPointerDown.bind(this));
    this.el.addEventListener('click', (e) => this._onClick(e));
    this.el.addEventListener('dblclick', (e) => this.destroy());

    // add name label
    this.nameLabel = document.createElement('div');
    this.nameLabel.style.position = 'absolute';
    this.nameLabel.style.fontSize = '12px';
    this.nameLabel.style.left = '0';
    this.nameLabel.style.top = '84px';
    this.nameLabel.style.width = '100px';
    this.nameLabel.style.textAlign = 'center';
    this.nameLabel.style.pointerEvents = 'none';
    this.el.appendChild(this.nameLabel);
    this._renderName();
  }

  _renderName() {
    this.nameLabel.textContent = this.config.name || '';
  }

  _applyTransform() { this.el.style.transform = `translate(${this.x}px, ${this.y}px)`; }

  _onPointerDown(e) {
    e.preventDefault(); this.el.setPointerCapture(e.pointerId); this._isDragging = true; this._movedSinceDown = false;
    const startX = e.clientX, startY = e.clientY, initialX = this.x, initialY = this.y;
    const onMove = (ev) => { const dx = ev.clientX - startX, dy = ev.clientY - startY; if (Math.abs(dx)>3||Math.abs(dy)>3) this._movedSinceDown=true; this.x = initialX + dx; this.y = initialY + dy; this._applyTransform(); this.connections.forEach(id=>{ const c=connections.get(id); if(c) c.update(); }); };
    const onUp = (ev) => { this._isDragging=false; try{this.el.releasePointerCapture(ev.pointerId);}catch{}; this.el.removeEventListener('pointermove', onMove); this.el.removeEventListener('pointerup', onUp); this.el.removeEventListener('pointercancel', onUp); scheduleAutosave(); };
    this.el.addEventListener('pointermove', onMove); this.el.addEventListener('pointerup', onUp); this.el.addEventListener('pointercancel', onUp);
  }

  _onClick(e) {
    if (this._movedSinceDown) return; // ignore drag as click
    if (connectMode) {
      if (!firstDevice) { firstDevice = this; this.el.classList.add('selected'); return; }
      if (firstDevice === this) { this.el.classList.remove('selected'); firstDevice = null; return; }
      const label = prompt('Label for connection (optional):', '');
      const conn = createConnection(firstDevice, this, label || '');
      if (conn) { connections.set(conn.id, conn); scheduleAutosave(); }
      firstDevice.el.classList.remove('selected'); firstDevice = null; return;
    }
    // open config panel for editing
    openConfigPanel(this);
  }

  destroy() {
    Array.from(this.connections).forEach(connId => { const conn = connections.get(connId); if (conn) conn.destroy(); });
    this.connections.clear(); if (this.el && this.el.parentElement) this.el.remove(); devices.delete(this.id); scheduleAutosave();
  }

  center() { const canvasRect = canvas.getBoundingClientRect(); const elRect = this.el.getBoundingClientRect(); return { x: (elRect.left - canvasRect.left) + elRect.width/2, y: (elRect.top - canvasRect.top) + elRect.height/2 }; }

  getFreePortLabel() { const label = `fa0/${this.nextPort++}`; return label; }
}

// Connection class with port labels displayed near each endpoint
class Connection {
  constructor(devA, devB, label = '') {
    this.id = uid('conn_'); this.devA = devA; this.devB = devB; this.label = label || '';
    this.group = document.createElementNS(svgNS, 'g');
    this.line = document.createElementNS(svgNS, 'line');
    this.line.setAttribute('stroke', '#2b6cff'); this.line.setAttribute('stroke-width','4'); this.line.setAttribute('stroke-linecap','round'); this.line.dataset.id = this.id; this.line.style.pointerEvents='auto';
    this.group.appendChild(this.line);

    // port labels near each device
    this.textA = document.createElementNS(svgNS,'text'); this.textB = document.createElementNS(svgNS,'text');
    this.textA.setAttribute('font-size','12'); this.textB.setAttribute('font-size','12');
    this.textA.setAttribute('fill','#10305a'); this.textB.setAttribute('fill','#10305a');

    // assign port labels
    this.portA = this.devA.getFreePortLabel(); this.portB = this.devB.getFreePortLabel();
    this.textA.textContent = this.portA; this.textB.textContent = this.portB;

    this.group.appendChild(this.textA); this.group.appendChild(this.textB);
    if (this.label) { this.textLabel = document.createElementNS(svgNS,'text'); this.textLabel.textContent = this.label; this.textLabel.setAttribute('font-size','12'); this.textLabel.setAttribute('fill','#073'); this.group.appendChild(this.textLabel); }

    svg.appendChild(this.group);

    // backrefs and port bookkeeping
    this.devA.connections.add(this.id); this.devB.connections.add(this.id);
    this.devA.ports.set(this.portA, this.id); this.devB.ports.set(this.portB, this.id);

    this.line.addEventListener('dblclick', (e)=>{ e.stopPropagation(); this.destroy(); });

    this.update();
  }

  update() {
    const a = this.devA.center(); const b = this.devB.center();
    this.line.setAttribute('x1', a.x); this.line.setAttribute('y1', a.y); this.line.setAttribute('x2', b.x); this.line.setAttribute('y2', b.y);
    // place port labels near endpoints offset a bit
    const dx = b.x - a.x; const dy = b.y - a.y; const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx/len, uy = dy/len;
    this.textA.setAttribute('x', a.x + ux*20 + 6); this.textA.setAttribute('y', a.y + uy*20 + 6);
    this.textB.setAttribute('x', b.x - ux*20 + 6); this.textB.setAttribute('y', b.y - uy*20 + 6);
    if (this.textLabel) { const midX = (a.x+b.x)/2 + 6; const midY = (a.y+b.y)/2 - 6; this.textLabel.setAttribute('x', midX); this.textLabel.setAttribute('y', midY); }
  }

  destroy() {
    if (this.group && this.group.parentElement) this.group.remove();
    if (this.devA) { this.devA.connections.delete(this.id); if (this.portA) this.devA.ports.delete(this.portA); }
    if (this.devB) { this.devB.connections.delete(this.id); if (this.portB) this.devB.ports.delete(this.portB); }
    connections.delete(this.id); scheduleAutosave();
  }
}

function connectionExists(a,b) { for(const c of connections.values()){ if((c.devA===a && c.devB===b) || (c.devA===b && c.devB===a)) return true; } return false; }

function createConnection(a,b,label='') { if (a===b) return null; if (connectionExists(a,b)) return null; const conn = new Connection(a,b,label); connections.set(conn.id, conn); updateNetworkStatus(); return conn; }

// --- Configuration panel logic ---
function openConfigPanel(device) {
  configPanel.style.display = 'block';
  configPanel.innerHTML = '';
  const title = document.createElement('div'); title.style.fontWeight='700'; title.textContent = `${device.type.toUpperCase()} Configuration - ${device.config.name}`;
  configPanel.appendChild(title);

  // name
  const nameLabel = document.createElement('label'); nameLabel.textContent = 'Name'; nameLabel.style.display='block';
  const nameInput = document.createElement('input'); nameInput.value = device.config.name || ''; nameInput.style.width='100%';
  nameInput.oninput = () => { device.config.name = nameInput.value; device._renderName(); updateNetworkStatus(); scheduleAutosave(); };
  configPanel.appendChild(nameLabel); configPanel.appendChild(nameInput);

  if (device.type === 'pc') {
    // IP
    const ipLabel = document.createElement('label'); ipLabel.textContent='IP Address (e.g. 192.168.1.10/24)'; ipLabel.style.display='block';
    const ipInput = document.createElement('input'); ipInput.value = device.config.ip || ''; ipInput.style.width='100%';
    ipInput.oninput = () => { device.config.ip = ipInput.value; updateNetworkStatus(); scheduleAutosave(); };
    configPanel.appendChild(ipLabel); configPanel.appendChild(ipInput);

    // VLAN
    const vlanLabel = document.createElement('label'); vlanLabel.textContent='VLAN'; vlanLabel.style.display='block';
    const vlanInput = document.createElement('input'); vlanInput.value = device.config.vlan || ''; vlanInput.style.width='100%';
    vlanInput.oninput = () => { device.config.vlan = vlanInput.value; updateNetworkStatus(); scheduleAutosave(); };
    configPanel.appendChild(vlanLabel); configPanel.appendChild(vlanInput);

    // Gateway
    const gwLabel = document.createElement('label'); gwLabel.textContent='Gateway'; gwLabel.style.display='block';
    const gwInput = document.createElement('input'); gwInput.value = device.config.gateway || ''; gwInput.style.width='100%';
    gwInput.oninput = () => { device.config.gateway = gwInput.value; updateNetworkStatus(); scheduleAutosave(); };
    configPanel.appendChild(gwLabel); configPanel.appendChild(gwInput);

    // Ping tool
    const pingDiv = document.createElement('div'); pingDiv.style.marginTop='8px';
    const pingBtn = document.createElement('button'); pingBtn.textContent='Ping...'; pingBtn.onclick = () => showPingDialog(device);
    pingDiv.appendChild(pingBtn);
    configPanel.appendChild(pingDiv);
  }

  if (device.type === 'switch') {
    const info = document.createElement('div'); info.textContent='Switch ports (access/trunk). Ports assigned automatically when cables created.'; info.style.fontSize='12px'; info.style.margin='6px 0'; configPanel.appendChild(info);
    const portsDiv = document.createElement('div'); portsDiv.style.maxHeight='220px'; portsDiv.style.overflow='auto';
    // render current ports
    function renderPorts() {
      portsDiv.innerHTML='';
      for (const [port, connId] of device.ports.entries()) {
        const row = document.createElement('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.marginBottom='6px';
        const pLabel = document.createElement('div'); pLabel.textContent = port; pLabel.style.width='60px';
        const mode = document.createElement('select'); const optAccess = document.createElement('option'); optAccess.value='access'; optAccess.text='access'; const optTrunk = document.createElement('option'); optTrunk.value='trunk'; optTrunk.text='trunk'; mode.appendChild(optAccess); mode.appendChild(optTrunk);
        const vlanInput = document.createElement('input'); vlanInput.style.width='60px'; vlanInput.placeholder='vlan';
        // load saved state
        const pstate = device.config.ports[port] || { mode:'access', vlan:'' };
        mode.value = pstate.mode; vlanInput.value = pstate.vlan || '';
        mode.onchange = () => { device.config.ports[port] = { mode: mode.value, vlan: vlanInput.value }; scheduleAutosave(); updateNetworkStatus(); };
        vlanInput.oninput = () => { device.config.ports[port] = { mode: mode.value, vlan: vlanInput.value }; scheduleAutosave(); updateNetworkStatus(); };
        row.appendChild(pLabel); row.appendChild(mode); row.appendChild(vlanInput);
        portsDiv.appendChild(row);
      }
    }
    renderPorts();
    configPanel.appendChild(portsDiv);
    // refresh ports periodically while panel open
    const portsInterval = setInterval(renderPorts, 1000);
    configPanel._cleanup = () => clearInterval(portsInterval);
  }

  if (device.type === 'router') {
    const info = document.createElement('div'); info.textContent='Router interfaces and static routes'; info.style.fontSize='12px'; info.style.margin='6px 0'; configPanel.appendChild(info);
    const ifaceDiv = document.createElement('div'); ifaceDiv.style.maxHeight='160px'; ifaceDiv.style.overflow='auto';
    function renderIfaces() {
      ifaceDiv.innerHTML = '';
      (device.config.interfaces || []).forEach((it, idx) => {
        const row = document.createElement('div'); row.style.display='flex'; row.style.gap='6px'; row.style.marginBottom='6px';
        const name = document.createElement('input'); name.value = it.name || `g${idx}`; name.style.width='60px';
        const ip = document.createElement('input'); ip.value = it.ip || ''; ip.style.width='120px';
        const up = document.createElement('select'); const o1 = document.createElement('option'); o1.value='up'; o1.text='up'; const o2 = document.createElement('option'); o2.value='down'; o2.text='down'; up.appendChild(o1); up.appendChild(o2); up.value = it.status||'up';
        const del = document.createElement('button'); del.textContent='Del'; del.onclick = () => { device.config.interfaces.splice(idx,1); renderIfaces(); scheduleAutosave(); updateNetworkStatus(); };
        name.oninput = () => { it.name = name.value; scheduleAutosave(); };
        ip.oninput = () => { it.ip = ip.value; scheduleAutosave(); updateNetworkStatus(); };
        up.onchange = () => { it.status = up.value; scheduleAutosave(); updateNetworkStatus(); };
        row.appendChild(name); row.appendChild(ip); row.appendChild(up); row.appendChild(del);
        ifaceDiv.appendChild(row);
      });
    }
    renderIfaces();
    const addIface = document.createElement('button'); addIface.textContent='Add Interface'; addIface.onclick = () => { device.config.interfaces.push({ name:`g${device.config.interfaces.length}`, ip:'', status:'up' }); renderIfaces(); scheduleAutosave(); };
    configPanel.appendChild(ifaceDiv); configPanel.appendChild(addIface);

    // routing table
    const routesDiv = document.createElement('div'); routesDiv.style.marginTop='8px';
    function renderRoutes() { routesDiv.innerHTML=''; (device.config.routes||[]).forEach((r,idx)=>{ const row=document.createElement('div'); row.style.display='flex'; row.style.gap='6px'; row.style.marginBottom='6px'; const net=document.createElement('input'); net.value=r.network||''; net.style.width='110px'; const via=document.createElement('input'); via.value=r.via||''; via.style.width='110px'; const del=document.createElement('button'); del.textContent='Del'; del.onclick=()=>{ device.config.routes.splice(idx,1); renderRoutes(); scheduleAutosave(); }; net.oninput=()=>{ r.network=net.value; scheduleAutosave(); }; via.oninput=()=>{ r.via=via.value; scheduleAutosave(); }; row.appendChild(net); row.appendChild(via); row.appendChild(del); routesDiv.appendChild(row);} ); }
    renderRoutes();
    const addRoute = document.createElement('button'); addRoute.textContent='Add Route'; addRoute.onclick = ()=>{ device.config.routes = device.config.routes||[]; device.config.routes.push({network:'',via:''}); renderRoutes(); scheduleAutosave(); };
    configPanel.appendChild(routesDiv); configPanel.appendChild(addRoute);
  }

  // CLI terminal area (Packet Tracer-like)
  const cliTitle = document.createElement('div'); cliTitle.textContent='CLI Terminal (type commands)'; cliTitle.style.fontWeight='700'; cliTitle.style.marginTop='10px'; configPanel.appendChild(cliTitle);
  const cliOutput = document.createElement('pre'); cliOutput.style.background='#0b1220'; cliOutput.style.color='#b9f'; cliOutput.style.padding='8px'; cliOutput.style.height='160px'; cliOutput.style.overflow='auto'; cliOutput.style.borderRadius='6px'; cliOutput.style.fontFamily='monospace'; cliOutput.textContent = `Welcome to ${device.config.name}\nType 'help' for commands.`;
  configPanel.appendChild(cliOutput);
  const cliInput = document.createElement('input'); cliInput.style.width='100%'; cliInput.style.boxSizing='border-box'; cliInput.style.marginTop='6px'; cliInput.placeholder='e.g. hostname PC1 or interface g0/0';
  configPanel.appendChild(cliInput);
  cliInput.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') { const cmd = cliInput.value.trim(); cliInput.value=''; if (!cmd) return; cliOutput.textContent += '\n>' + cmd + '\n'; const result = parseDeviceCommand(device, cmd); if (result && result.output) cliOutput.textContent += result.output + '\n'; if (result && result.error) cliOutput.textContent += 'ERROR: ' + result.error + '\n'; cliOutput.scrollTop = cliOutput.scrollHeight; scheduleAutosave(); updateNetworkStatus(); } });

  const closeBtn = document.createElement('button'); closeBtn.textContent='Close'; closeBtn.style.marginTop='8px'; closeBtn.onclick = () => { configPanel.style.display='none'; if (configPanel._cleanup) configPanel._cleanup(); }
  configPanel.appendChild(closeBtn);
}

// Simple command parser that maps CLI strings to changes in device.config
function parseDeviceCommand(device, raw) {
  const out = { output: '' };
  const cmd = raw.trim();
  if (!cmd) return out;
  const parts = cmd.split(/\s+/);
  const root = parts[0].toLowerCase();

  if (root === 'help') {
    out.output = "Commands: hostname <name>, ip address <ip>, gateway <ip>, vlan <id>, interface <name>, no shutdown, shutdown, switchport mode access|trunk, switchport access vlan <id>, show running-config, show ip interface brief, ping <ip>";
    return out;
  }

  if (root === 'hostname') {
    const name = parts.slice(1).join(' ');
    if (!name) { out.error = 'hostname requires a name'; return out; }
    device.config.name = name; device._renderName(); out.output = `Hostname set to ${name}`; return out;
  }

  if (root === 'ip' && parts[1] === 'address') {
    // For PCs we accept: ip address 192.168.1.10/24
    const ip = parts[2]; if (!ip) { out.error='missing ip'; return out; }
    if (device.type === 'pc') { device.config.ip = ip; out.output = `PC IP set to ${ip}`; return out; }
    // for router, must be in interface context; for simplicity if single iface exists set it
    if (device.type === 'router') {
      if (!device.config.interfaces || device.config.interfaces.length===0) { device.config.interfaces = [{ name:'g0/0', ip: ip, status:'up' }]; out.output = `Added interface g0/0 with ${ip}`; return out; }
      device.config.interfaces[0].ip = ip; out.output = `Router interface ${device.config.interfaces[0].name} IP set to ${ip}`; return out;
    }
  }

  if (root === 'gateway') {
    const ip = parts[1]; if (!ip) { out.error='missing gateway'; return out; } device.config.gateway = ip; out.output = `Gateway set to ${ip}`; return out;
  }

  if (root === 'vlan') {
    const id = parts[1]; if (!id) { out.error='missing vlan id'; return out; }
    // On switch: create VLAN entry
    if (device.type === 'switch') { device.config.vlans = device.config.vlans||[]; if (!device.config.vlans.includes(id)) device.config.vlans.push(id); out.output = `Created VLAN ${id} on switch`; return out; }
    // On PC: set VLAN
    if (device.type === 'pc') { device.config.vlan = id; out.output = `PC VLAN set to ${id}`; return out; }
  }

  // interface context commands (simple parser)
  if (root === 'interface') {
    const ifname = parts[1]; if (!ifname) { out.error='missing interface name'; return out; }
    const rest = parts.slice(2).join(' ');
    if (device.type === 'router') {
      // find or create interface
      let intf = (device.config.interfaces||[]).find(i=>i.name===ifname);
      if (!intf) { intf = { name: ifname, ip: '', status:'up' }; device.config.interfaces = device.config.interfaces||[]; device.config.interfaces.push(intf); }
      // if rest contains ip address
      const m = rest.match(/ip address\s+([0-9\.\/]+)/i);
      if (m) { intf.ip = m[1]; out.output = `Set ${ifname} ip ${m[1]}`; return out; }
      out.output = `Interface ${ifname} ready`; return out;
    }
    if (device.type === 'switch') {
      // interface on switch - allow switching to access/trunk and setting VLAN via rest
      const mAccess = rest.match(/switchport access vlan\s+(\S+)/i);
      const mMode = rest.match(/switchport mode\s+(\S+)/i);
      const portLabel = ifname.startsWith('fa') ? ifname : `fa0/${device.nextPort}`; // best effort
      device.config.ports = device.config.ports || {};
      device.config.ports[portLabel] = device.config.ports[portLabel] || { mode: 'access', vlan: '' };
      if (mMode) { device.config.ports[portLabel].mode = mMode[1]; out.output = `Set ${portLabel} mode ${mMode[1]}`; }
      if (mAccess) { device.config.ports[portLabel].vlan = mAccess[1]; out.output = (out.output? out.output+'; ': '') + `Set ${portLabel} access vlan ${mAccess[1]}`; }
      return out;
    }
  }

  if (root === 'switchport') {
    // switchport mode access|trunk or switchport access vlan <id>
    if (parts[1] === 'mode') {
      const mode = parts[2]; // apply to all ports as convenience
      if (device.type !== 'switch') { out.error='switchport commands valid only on switch'; return out; }
      for (const p in device.config.ports) { device.config.ports[p].mode = mode; }
      out.output = `Set all switch ports to ${mode}`; return out;
    }
    if (parts[1] === 'access' && parts[2] === 'vlan') {
      const id = parts[3]; if (!id) { out.error='missing vlan id'; return out; }
      if (device.type !== 'switch') { out.error='switchport commands valid only on switch'; return out; }
      for (const p in device.config.ports) { device.config.ports[p].vlan = id; }
      out.output = `Set all switch access VLAN to ${id}`; return out;
    }
  }

  if (root === 'no' && parts[1] === 'shutdown') {
    if (device.type === 'router') { if (device.config.interfaces && device.config.interfaces[0]) device.config.interfaces[0].status='up'; out.output='Interface activated'; return out; }
  }
  if (root === 'shutdown') {
    if (device.type === 'router') { if (device.config.interfaces && device.config.interfaces[0]) device.config.interfaces[0].status='down'; out.output='Interface shut down'; return out; }
  }

  if (root === 'show') {
    if (parts[1] === 'running-config') { out.output = JSON.stringify(device.config, null, 2); return out; }
    if (parts[1] === 'ip' && parts[2] === 'interface' && parts[3] === 'brief') { // simple
      let s = '';
      if (device.type === 'router') {
        (device.config.interfaces||[]).forEach(i=>{ s+=`${i.name}\t${i.ip||'-'}\t${i.status||'down'}\n`; });
      } else if (device.type === 'pc') {
        s += `-- ${device.config.name} --\nIP: ${device.config.ip || '-'}\nVLAN: ${device.config.vlan || '-'}\nGateway: ${device.config.gateway || '-'}\n`;
      }
      out.output = s; return out;
    }
  }

  if (root === 'ping') {
    const target = parts[1]; if (!target) { out.error='missing target'; return out; }
    const res = runPing(device, target);
    out.output = res.message + '\n' + (res.hints? 'Hints: '+res.hints.join('; ') : ''); return out;
  }

  out.error = 'unknown command'; return out;
}

// Ping dialog and simulation
function showPingDialog(srcDevice) {
  const modal = document.createElement('div'); modal.style.position='fixed'; modal.style.left='0'; modal.style.top='0'; modal.style.right='0'; modal.style.bottom='0'; modal.style.background='rgba(0,0,0,0.4)'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; modal.style.zIndex='200';
  const box = document.createElement('div'); box.style.background='white'; box.style.padding='12px'; box.style.borderRadius='8px'; box.style.width='420px';
  const title = document.createElement('div'); title.textContent=`Ping from ${srcDevice.config.name}`; title.style.fontWeight='700'; box.appendChild(title);
  const targetLabel = document.createElement('label'); targetLabel.textContent='Target IP/Device Name:'; targetLabel.style.display='block'; const targetInput = document.createElement('input'); targetInput.style.width='100%'; box.appendChild(targetLabel); box.appendChild(targetInput);
  const runBtn = document.createElement('button'); runBtn.textContent='Run Ping'; runBtn.onclick = () => { const target = targetInput.value.trim(); const res = runPing(srcDevice, target); alert(res.message + '\n' + (res.hints? 'Hints: '+res.hints.join('; '):'')); document.body.removeChild(modal); };
  const cancelBtn = document.createElement('button'); cancelBtn.textContent='Cancel'; cancelBtn.style.marginLeft='8px'; cancelBtn.onclick = ()=>document.body.removeChild(modal);
  box.appendChild(runBtn); box.appendChild(cancelBtn);
  modal.appendChild(box); document.body.appendChild(modal);
}

function runPing(srcDevice, target) {
  // Resolve target to device or IP
  let targetDevice = null; let targetIP = '';
  for (const d of devices.values()) { if (d.config.name === target) { targetDevice = d; break; } }
  if (!targetDevice) { // try IP match
    for (const d of devices.values()) { if (d.config.ip === target) { targetDevice = d; break; } }
  }
  if (!targetDevice && target.match(/^[0-9.\/]+$/)) targetIP = target;

  // If targetDevice provided, extract its IP if any
  if (targetDevice) targetIP = targetDevice.config.ip || '';

  // Basic checks
  const hints = [];
  if (!srcDevice) return { success:false, message:'Source device missing', hints:['Source device not found'] };
  if (!targetIP) return { success:false, message:'Target not found or has no IP', hints:['Target device or IP could not be resolved'] };
  if (!srcDevice.config.ip) hints.push('Source missing IP');

  // Perform BFS from src through connections to see if path exists to device with matching IP
  const visited = new Set(); const q = [srcDevice]; visited.add(srcDevice.id);
  let found = false; let path = null;
  const parent = {};
  while (q.length) {
    const cur = q.shift();
    // check IP
    if (cur.config.ip === targetIP) { found = true; path = cur; break; }
    // neighbors
    for (const connId of cur.connections) {
      const conn = connections.get(connId); if (!conn) continue;
      const neigh = conn.devA === cur ? conn.devB : conn.devA;
      if (visited.has(neigh.id)) continue;
      // check VLAN/switch rules between cur and neigh via this conn
      if (!linkAllowsTraffic(cur, neigh, conn)) continue;
      visited.add(neigh.id); parent[neigh.id] = cur.id; q.push(neigh);
    }
  }

  if (found) {
    // check VLAN/gateway consistency
    if (srcDevice.type === 'pc' && targetDevice && targetDevice.type === 'pc') {
      // if path crosses a router, allow inter-VLAN
      const crossesRouter = pathCrossesRouter(srcDevice, targetDevice);
      if (!crossesRouter && srcDevice.config.vlan !== targetDevice.config.vlan) hints.push('VLAN mismatch');
    }
    return { success:true, message:`Ping to ${targetIP} successful` , hints: hints };
  }

  // Not found — produce troubleshooting hints
  // Check if VLAN mismatch between source and any connected device
  if (srcDevice.type === 'pc' && targetDevice && targetDevice.type === 'pc') {
    if (!srcDevice.config.vlan || !targetDevice.config.vlan) hints.push('Missing VLAN on one side');
    if (srcDevice.config.vlan !== targetDevice.config.vlan) hints.push('VLAN mismatch');
  }
  // route check
  if (srcDevice.type === 'pc' && targetDevice && targetDevice.type === 'pc') {
    // if networks differ, ensure router has interfaces
    const routeHints = checkRoutingForIPs(srcDevice.config.ip, targetDevice.config.ip);
    hints.push(...routeHints);
  }
  // connection check
  hints.push('Device not connected or path blocked by VLAN/routing rules');
  return { success:false, message:`Ping to ${targetIP} failed`, hints: hints };
}

function linkAllowsTraffic(a, b, conn) {
  // If either endpoint is a switch, apply port config
  if (a.type === 'switch' || b.type === 'switch') {
    // find the switch device
    const sw = a.type === 'switch' ? a : b;
    const other = sw === a ? b : a;
    // determine port label from switch side
    let portLabel = null;
    for (const [p, cid] of sw.ports.entries()) { if (cid === conn.id) { portLabel = p; break; } }
    const pconf = (sw.config.ports && sw.config.ports[portLabel]) || { mode:'access', vlan:'' };
    if (pconf.mode === 'access') {
      // access port: only allows packets tagged as that VLAN (or untagged are treated as that VLAN)
      if (other.type === 'pc') return other.config.vlan == pconf.vlan || other.config.vlan == '' || pconf.vlan == '';
      // for router or switch allow for now (could check subinterfaces)
    }
    // trunk allows all VLANs
  }
  return true; // default allow
}

function pathCrossesRouter(a,b) {
  // simple check: BFS path and see if any router node included
  const visited = new Set(); const q = [a]; visited.add(a.id);
  while (q.length) {
    const cur = q.shift(); if (cur === b) return false; if (cur.type === 'router') return true;
    for (const cid of cur.connections) { const conn = connections.get(cid); if(!conn) continue; const neigh = conn.devA===cur?conn.devB:conn.devA; if(visited.has(neigh.id)) continue; visited.add(neigh.id); q.push(neigh); }
  }
  return false;
}

function checkRoutingForIPs(ipA, ipB) {
  const hints = [];
  if (!ipA || !ipB) { hints.push('Missing IP on one side'); return hints; }
  // naive: extract network by /24 if present else same IP prefix
  const netA = ipA.split('.').slice(0,3).join('.') + '.0'; const netB = ipB.split('.').slice(0,3).join('.') + '.0';
  if (netA === netB) return [];
  // check for router that connects to both nets
  for (const r of devices.values()) {
    if (r.type !== 'router') continue;
    const ifaces = r.config.interfaces || [];
    const nets = ifaces.filter(i=>i.ip).map(i=>i.ip.split('.').slice(0,3).join('.') + '.0');
    if (nets.includes(netA) && nets.includes(netB)) return []; // router connects both networks
  }
  hints.push('No route between networks (check router interfaces or static routes)');
  return hints;
}

// Update network status colors based on configuration/connectivity
function updateNetworkStatus() {
  // For each device compute a simple status
  devices.forEach(d => {
    let status = 'green';
    // missing required config
    if (d.type === 'pc') {
      if (!d.config.ip) status = 'red';
      else if (!d.connections.size) status = 'red';
      else status = 'green';
    }
    if (d.type === 'switch') {
      if (!d.connections.size) status = 'yellow'; else status='green';
    }
    if (d.type === 'router') {
      if (!d.config.interfaces || d.config.interfaces.length===0) status='red'; else status='green';
    }
    d.status = status;
    // apply border color
    if (status === 'green') d.el.style.outline = '4px solid rgba(67, 181, 129, 0.35)';
    else if (status === 'red') d.el.style.outline = '4px solid rgba(255, 80, 80, 0.35)';
    else if (status === 'yellow') d.el.style.outline = '4px solid rgba(255, 210, 60, 0.35)';
    else d.el.style.outline = '';
  });
}

// Persistence: save current layout to localStorage
function saveLayout() {
  const data = { devices: [], connections: [], cheat: JSON.parse(localStorage.getItem(CHEAT_KEY) || '{}') };
  devices.forEach(dev => {
    data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y, config: dev.config, nextPort: dev.nextPort });
  });
  connections.forEach(conn => { data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label, portA: conn.portA, portB: conn.portB }); });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadLayout() {
  const raw = localStorage.getItem(STORAGE_KEY); if (!raw) { alert('No saved layout found'); return; }
  try { const data = JSON.parse(raw); loadLayoutFromData(data); } catch (err) { alert('Load failed: '+err.message); }
}

function exportLayout() {
  const data = { devices: [], connections: [], cheat: JSON.parse(localStorage.getItem(CHEAT_KEY) || '{}') };
  devices.forEach(dev => { data.devices.push({ id: dev.id, type: dev.type, x: dev.x, y: dev.y, config: dev.config, nextPort: dev.nextPort }); });
  connections.forEach(conn => { data.connections.push({ id: conn.id, a: conn.devA.id, b: conn.devB.id, label: conn.label, portA: conn.portA, portB: conn.portB }); });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='nis-layout.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function loadLayoutFromData(data) {
  if (!data || !Array.isArray(data.devices)) { alert('Invalid layout data'); return; }
  // clear
  devices.forEach(d => d.destroy()); devices.clear(); connections.forEach(c=>c.destroy()); connections.clear();
  const idToDevice = new Map();
  for (const d of data.devices) {
    const el = createDeviceElement(d.type || 'pc'); const device = new Device(el, d.x||100, d.y||100, d.type||'pc', d.id);
    device.config = d.config || device.config; device.nextPort = d.nextPort || device.nextPort; devices.set(device.id, device); idToDevice.set(device.id, device);
  }
  if (Array.isArray(data.connections)) {
    for (const c of data.connections) {
      const a = idToDevice.get(c.a); const b = idToDevice.get(c.b); if (!a||!b) continue; if (connectionExists(a,b)) continue; const conn = new Connection(a,b,c.label||''); conn.portA = c.portA || conn.portA; conn.portB = c.portB || conn.portB; connections.set(conn.id, conn);
    }
  }
  if (data.cheat) localStorage.setItem(CHEAT_KEY, JSON.stringify(data.cheat)); renderCheatBubble(); updateNetworkStatus(); scheduleAutosave();
}

// Autosave
let autosaveTimer = null; function scheduleAutosave() { if (autosaveTimer) clearTimeout(autosaveTimer); autosaveTimer = setTimeout(()=>{ try{ saveLayout(); }catch(e){console.warn('Autosave failed', e);} }, 700); }

// Load on startup
window.addEventListener('DOMContentLoaded', ()=>{
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const data = JSON.parse(raw); if (data && Array.isArray(data.devices)) loadLayoutFromData(data); }
  } catch (err) { console.warn('Failed to load layout on startup', err); }
});

// Recompute visual positions for existing connections on resize
window.addEventListener('resize', ()=>{ connections.forEach(c=>c.update()); });

// Initial update loop to refresh status occasionally
setInterval(()=>{ updateNetworkStatus(); connections.forEach(c=>c.update()); }, 1200);

// Utility access for debugging
window.nis = { devices, connections, runPing, parseDeviceCommand };
