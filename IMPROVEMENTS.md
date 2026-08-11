# Network Infrastructure Simulator — Enhancement Roadmap

## Overview
This document outlines improvements to enhance Packet Tracer-style features: CLI, VLANs, routing, port labels, ping simulation, troubleshooting, and the cheat bubble learning assistant.

---

## 1. Enhanced Packet Tracer-Style CLI

### Current State
- Per-device CLI terminal with command parsing
- Commands: `hostname`, `ip address`, `gateway`, `vlan`, `interface`, `switchport`, `show running-config`, `ping`

### Improvements

#### 1.1 Advanced Command Parsing
**Add multi-line mode and command history:**
```javascript
// Track command history per device
device.cliHistory = [];
device.cliHistoryIndex = -1;

// Support arrow keys (Up/Down) to navigate history
cliInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowUp') {
    ev.preventDefault();
    if (device.cliHistoryIndex < device.cliHistory.length - 1) {
      device.cliHistoryIndex++;
      cliInput.value = device.cliHistory[device.cliHistoryIndex];
    }
  } else if (ev.key === 'ArrowDown') {
    ev.preventDefault();
    if (device.cliHistoryIndex > 0) {
      device.cliHistoryIndex--;
      cliInput.value = device.cliHistory[device.cliHistoryIndex];
    } else {
      cliInput.value = '';
      device.cliHistoryIndex = -1;
    }
  }
});
```

#### 1.2 Multiline Configuration Mode
**Add support for `configure terminal` (config mode):**
- Prefix "config# " when in config mode
- Exit with `exit` or `end`
- Track context (e.g., "interface g0/0" persists across commands)

```javascript
device.cliMode = 'exec'; // 'exec' | 'config' | 'interface'
device.cliContext = null; // { type: 'interface', name: 'g0/0' }

// Example output:
// router# configure terminal
// router(config)# interface g0/0
// router(config-if)# ip address 10.0.0.1 255.255.255.0
// router(config-if)# exit
// router(config)# exit
// router#
```

#### 1.3 Enhanced `show` Commands
Implement realistic outputs:
- `show interfaces`
- `show ip route`
- `show vlans`
- `show version`

**Example:**
```
switch# show vlans

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Fa0/1, Fa0/2, Fa0/3, Fa0/4
10   Engineering                      active    Fa0/5, Fa0/6
20   Management                       active    Fa0/7
```

---

## 2. Enhanced VLAN Support

### Current State
- VLANs configurable per switch port (access/trunk)
- Per-PC VLAN assignment
- Basic VLAN-aware ping routing

### Improvements

#### 2.1 VLAN Database Visualization
**Add a VLAN panel in the config UI:**
```javascript
// Show VLAN inventory on switch
const vlanTableDiv = document.createElement('div');
vlanTableDiv.innerHTML = `
  <table>
    <tr><th>VLAN ID</th><th>Name</th><th>Ports</th></tr>
    ${device.config.vlans.map(v => `
      <tr>
        <td>${v.id}</td>
        <td><input value="${v.name || ''}" /></td>
        <td>${(device.config.ports || []).filter(p => p.vlan === v.id).map(p => p.label).join(',')}</td>
      </tr>
    `).join('')}
  </table>
`;
```

#### 2.2 Trunk Port with Tagged VLANs
**Support 802.1Q tagging:**
- Trunk ports allow multiple VLANs with tagging
- Native VLAN support (untagged frames)
- Block specific VLANs per trunk

```javascript
// Port config extended:
port = {
  label: 'Fa0/1',
  mode: 'trunk', // 'access' | 'trunk'
  accessVlan: null,
  allowedVlans: [1, 10, 20], // Trunk allowed VLANs
  nativeVlan: 1 // VLAN for untagged frames
}
```

#### 2.3 Inter-VLAN Routing via Router Subinterfaces
**Support router subinterfaces:**
```
router# configure terminal
router(config)# interface g0/0
router(config-if)# no shutdown
router(config-if)# interface g0/0.10
router(config-subif)# encapsulation dot1q 10
router(config-subif)# ip address 192.168.10.1 255.255.255.0
```

---

## 3. Enhanced Routing

### Current State
- Static routes configurable per router
- Basic BFS path finding for ping
- Network-level routing hints

### Improvements

#### 3.1 Dynamic Routing Simulation (RIP/OSPF)
**Add simplified protocol support:**
```javascript
device.routingProtocol = 'static'; // 'static' | 'rip' | 'ospf'
device.ripMetrics = new Map(); // network -> metric
device.ospfCost = new Map(); // link -> cost

// On connection creation, auto-advertise routes
function announceRoute(device, network, metric) {
  // Broadcast to neighbors (simplified Bellman-Ford)
  for (const connId of device.connections) {
    const conn = connections.get(connId);
    const neighbor = (conn.devA === device) ? conn.devB : conn.devA;
    if (neighbor.type !== 'router') continue;
    // Update neighbor's routing table if cheaper
  }
}
```

#### 3.2 Visualize Routing Tables
**Display active routes in `show ip route` output:**
```
router# show ip route
Codes: C - connected, S - static, R - RIP, O - OSPF

      10.0.0.0/24 is subnetted, 2 subnets
C        10.0.0.0 is directly connected, g0/0
C        10.1.0.0 is directly connected, g0/1
S        192.168.1.0/24 [1/0] via 10.0.0.254
R        172.16.0.0/16 [120/1] via 10.0.0.2, 00:00:05, g0/0
```

#### 3.3 Path Tracing and Route Analysis
**Add `traceroute` command:**
```javascript
if (root === 'traceroute') {
  const target = parts[1];
  const route = traceRoute(srcDevice, target);
  // Returns: [device1, device2, device3, ...]
  out.output = route.map((d, i) => `${i+1}. ${d.config.name} (${d.config.ip || 'N/A'})`).join('\n');
}
```

---

## 4. Enhanced Port Labeling

### Current State
- Automatic `fa0/X` labels on device connection
- Labels visible on SVG cable lines
- Port mapping stored per device

### Improvements

#### 4.1 Customizable Port Ranges
**Support different device port configurations:**
```javascript
device.portLayout = {
  router: { prefix: 'g', startSlot: 0, count: 2 }, // g0/0, g0/1
  switch: { prefix: 'fa', startSlot: 0, count: 24 }, // fa0/1 - fa0/24
  pc: { prefix: 'eth', startSlot: 0, count: 1 } // eth0
}
```

#### 4.2 Port Status Visualization
**Color-code port state in config panel:**
```css
.port-status {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
}
.port-status.up { background: #28a745; } /* green */
.port-status.down { background: #dc3545; } /* red */
.port-status.disabled { background: #999; } /* gray */
```

#### 4.3 Port Descriptions
**Add per-port notes:**
```
Switch(config-if)# interface fa0/5
Switch(config-if)# description Link to Router-1
```

---

## 5. Enhanced Ping Simulation

### Current State
- BFS-based connectivity check
- VLAN-aware filtering
- Routing hints on failure

### Improvements

#### 5.1 Packet Trace Visualization
**Show ping flow on canvas:**
```javascript
function showPingTrace(srcDevice, targetIP, route) {
  // Animate line color change along path
  route.forEach((device, i) => {
    setTimeout(() => {
      device.el.style.outline = '4px solid #ffc107';
    }, i * 300);
  });
  setTimeout(() => {
    route.forEach(d => updateNetworkStatus()); // restore status color
  }, route.length * 300);
}
```

#### 5.2 TTL (Time-To-Live) Simulation
**Limit hop count:**
```javascript
function runPing(srcDevice, target, ttl = 64) {
  let hopCount = 0;
  const visited = new Set();
  const q = [(srcDevice, 0)];
  
  while (q.length) {
    const [cur, depth] = q.shift();
    if (depth > ttl) return { success: false, message: `TTL exceeded`, hopCount };
    // ... rest of BFS
  }
}
```

#### 5.3 Multiple Pings with Statistics
**Ping command with count:**
```
PC1# ping 192.168.1.10 -c 4
PING 192.168.1.10 (192.168.1.10) 56(84) bytes of data.
64 bytes from 192.168.1.10: icmp_seq=1 ttl=64 time=1ms
64 bytes from 192.168.1.10: icmp_seq=2 ttl=64 time=1ms
64 bytes from 192.168.1.10: icmp_seq=3 ttl=64 time=1ms
64 bytes from 192.168.1.10: icmp_seq=4 ttl=64 time=1ms

--- 192.168.1.10 statistics ---
4 packets transmitted, 4 received, 0% loss, time 4ms
rtt min/avg/max/stddev = 1/1/1/0 ms
```

---

## 6. Enhanced Troubleshooting

### Current State
- Hint generation on ping failure
- Status color coding (green/red/yellow)
- Basic connectivity checks

### Improvements

#### 6.1 Diagnostic Flowchart
**Interactive troubleshooting guide:**
```javascript
const diagnostics = [
  {
    id: 'no-ip',
    title: 'Device has no IP',
    check: (d) => d.type === 'pc' && !d.config.ip,
    hint: 'Assign an IP: ip address 192.168.1.10/24',
    fix: () => { /* auto-populate if user confirms */ }
  },
  {
    id: 'no-connection',
    title: 'Device not connected',
    check: (d) => d.connections.size === 0,
    hint: 'Cable device to switch/router',
    fix: () => { /* highlight cable button */ }
  },
  {
    id: 'vlan-mismatch',
    title: 'VLAN mismatch between devices',
    check: (pc1, pc2) => pc1.config.vlan !== pc2.config.vlan && !routerBetween(pc1, pc2),
    hint: `Set same VLAN: ${pc1.config.vlan} or ${pc2.config.vlan}`,
    fix: () => { /* suggest command */ }
  }
];
```

#### 6.2 Show Commands for Diagnostics
**Implement full network inspection suite:**
- `show cdp neighbors` — device discovery
- `show interfaces status` — port states
- `show mac-address-table` — MAC learning
- `show ip arp` — ARP cache

#### 6.3 Config Validation Tool
**Pre-ping validation:**
```javascript
function validateNetworkConfig() {
  const issues = [];
  
  devices.forEach(dev => {
    if (dev.type === 'pc' && !dev.config.ip) {
      issues.push({ severity: 'error', device: dev, message: 'Missing IP' });
    }
    if (dev.type === 'router' && dev.config.interfaces.length === 0) {
      issues.push({ severity: 'error', device: dev, message: 'No interfaces configured' });
    }
    // Check for duplicate IPs
  });
  
  return issues;
}
```

---

## 7. Enhanced Cheat Bubble Learning System

### Current State
- 8-step tutorial (place → name → IP → VLAN → cable → verify → ping → troubleshoot)
- Auto-check for step completion
- CLI hints for each step
- Persistent state in localStorage

### Improvements

#### 7.1 Guided Mode with Popup Overlay
**Highlight active UI elements:**
```javascript
function highlightStep(stepIndex) {
  const highlights = {
    0: '.device-btn[data-type="pc"]',      // highlight PC button
    1: '#configPanel input[value*="name"]', // highlight name field
    2: '#configPanel input[value*="ip"]',   // highlight IP field
    3: '#configPanel input[value*="vlan"]', // highlight VLAN field
    // ...
  };
  
  document.querySelectorAll('.highlight-active').forEach(e => 
    e.classList.remove('highlight-active')
  );
  
  const sel = highlights[stepIndex];
  if (sel) document.querySelector(sel)?.classList.add('highlight-active');
}
```

#### 7.2 Video/Animation Demonstrations
**Auto-play short clips for each step:**
```javascript
const stepAnimations = {
  0: () => { /* spawn device, drag, drop */ },
  1: () => { /* open config, type name */ },
  2: () => { /* enter IP address */ },
  3: () => { /* configure VLAN */ }
};

// Play on demand
if (state.showAnimation) {
  stepAnimations[stepIndex]?.();
}
```

#### 7.3 Scenario Challenges
**Pre-built network scenarios to solve:**
```javascript
const scenarios = [
  {
    name: 'Simple VLAN Setup',
    description: 'Create 2 VLANs on a switch, assign PCs',
    checkpoints: [
      { desc: 'Create VLAN 10 on switch', check: () => /* ... */ },
      { desc: 'Assign PC1 to VLAN 10', check: () => /* ... */ },
      { desc: 'Assign PC2 to VLAN 20', check: () => /* ... */ },
      { desc: 'Ping between VLANs fails (expected)', check: () => /* ... */ }
    ]
  },
  {
    name: 'Inter-VLAN Routing',
    description: 'Route between VLANs with a router',
    checkpoints: [ /* ... */ ]
  }
];
```

#### 7.4 Persistent Learning Progress
**Track completion per user:**
```javascript
const LEARNING_KEY = 'nis-learning-v1';
// {
//   completedSteps: [0, 1, 2, ...],
//   completedScenarios: ['simple-vlan', ...],
//   totalTimeSpent: 3600000 (ms),
//   commandsEntered: 42
// }
```

#### 7.5 Contextual Hints During CLI
**Offer in-line command suggestions:**
```javascript
cliInput.addEventListener('input', (ev) => {
  const partial = ev.target.value.trim();
  const suggestions = getCommandSuggestions(device.type, partial);
  showAutocompletePopup(suggestions);
});

// Output: ["hostname", "help", "interface g0/0", ...]
```

---

## 8. Additional Polish & UX

### 8.1 Dark Mode Toggle
```css
body.dark-mode {
  background: #1a1a2e;
  color: #eee;
}

body.dark-mode #canvas {
  background: #16213e;
}

body.dark-mode .device {
  background: #0f3460;
  color: #eee;
}
```

### 8.2 Keyboard Shortcuts
- `C` — Toggle Cable Mode
- `D` — Open Device Config
- `S` — Save Layout
- `L` — Load Layout
- `Ctrl+Z` — Undo (if undo stack maintained)
- `?` — Show Cheat Bubble

### 8.3 Responsive Mobile UI
- Tablet-friendly toolbar (vertical scroll)
- Config panel repositions on small screens
- Touch-friendly drag-and-drop

### 8.4 Zoom & Pan
```javascript
let zoomLevel = 1;
canvas.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    zoomLevel += e.deltaY > 0 ? -0.1 : 0.1;
    zoomLevel = Math.max(0.5, Math.min(2, zoomLevel));
    canvas.style.transform = `scale(${zoomLevel})`;
  }
});
```

### 8.5 Export/Import Enhancements
- **Export as PNG/SVG** — visual topology diagram
- **Export as Markdown** — network documentation
- **Import from Cisco IOS configs** — parse device configs

---

## Implementation Priority

### Phase 1 (High Impact, Quick Wins)
1. CLI command history (arrow keys)
2. Enhanced `show` commands output formatting
3. Config validation tool
4. Port status indicators (up/down/disabled)
5. Ping trace animation

### Phase 2 (Medium Effort)
1. Multiline configure terminal mode
2. VLAN database visualization
3. Scenario challenges
4. Keyboard shortcuts
5. Dark mode toggle

### Phase 3 (Advanced)
1. Subinterfaces for inter-VLAN routing
2. Dynamic routing simulation (RIP/OSPF)
3. Animated demonstrations
4. Zoom & pan
5. iOS config import parser

---

## File Change Summary

| File | Changes |
|------|---------|
| `script.js` | Extend CLI parser; add routing; VLAN enhancements; ping tracer; diagnostics; scenarios |
| `style.css` | Port status colors; highlight-active class; dark mode; responsive tweaks |
| `index.html` | Optional: add dark mode toggle button; keyboard help modal |
| `README.md` | Document new features; add keyboard shortcuts; link to scenario guides |

---

## Testing Checklist

- [ ] CLI history navigation works on all device types
- [ ] Multiline config mode enters/exits correctly
- [ ] VLAN traffic blocked between unrouted VLANs
- [ ] Ping works across routed VLANs via subinterfaces
- [ ] Troubleshooting hints are accurate
- [ ] Scenario challenges auto-verify completion
- [ ] Learning progress persists across sessions
- [ ] Dark mode is comfortable and complete
- [ ] Mobile layout is usable
- [ ] Export/import cycle preserves all state

