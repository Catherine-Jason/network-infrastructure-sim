// Ping + packet animation logic

import { State } from "./state.js";
import { findPath } from "./pathfinding.js";

export function startPing(devices, connections) {
    const source = devices.find(d => d.id === State.pingSourceId);
    const target = devices.find(d => d.id === State.pingTargetId);

    if (!source || !target) return;

    const path = findPath(source.id, target.id, connections);

    if (!path) {
        source.state = "error";
        alert("❌ Ping failed: No path found");
        State.pingSourceId = null;
        State.pingTargetId = null;
        return;
    }

    // Convert device IDs to coordinates
    let points = path.map(id => {
        let d = devices.find(x => x.id === id);
        return { x: d.x, y: d.y };
    });

    State.packet = {
        points,
        index: 0,
        progress: 0
    };
}

export function drawPacket(ctx) {
    const p = State.packet;
    if (!p) return;

    let a = p.points[p.index];
    let b = p.points[p.index + 1];

    if (!b) {
        State.packet = null;
        State.pingSourceId = null;
        State.pingTargetId = null;
        alert("✅ Ping success");
        return;
    }

    let x = a.x + (b.x - a.x) * p.progress;
    let y = a.y + (b.y - a.y) * p.progress;

    // ✉️ YOUR ICON HERE
    ctx.font = "22px Arial";
    ctx.fillStyle = "#00ffcc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✉️", x, y);

    p.progress += 0.03;

    if (p.progress >= 1) {
        p.index++;
        p.progress = 0;
    }
}
    // Interpolate
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

