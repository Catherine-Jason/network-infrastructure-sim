// ==========================================
// SCENARIO VALIDATOR — CHECK IF SOLVED
// ==========================================

import { State } from "../core/state.js";
import { sameSubnet } from "../core/utils.js";
import { getDeviceById } from "../core/state.js";

export function validateScenario() {
    const scenario = State.currentScenario;
    if (!scenario || !scenario.validation) return false;

    for (const rule of scenario.validation) {
        if (!checkRule(rule)) return false;
    }

    return true;
}

function checkRule(rule) {
    switch (rule.type) {

        case "ip":
            return checkIP(rule);

        case "vlan":
            return checkVLAN(rule);

        case "route":
            return checkRoute(rule);

        case "ping":
            return checkPing(rule);

        case "cloud":
            return checkCloud(rule);

        default:
            return false;
    }
}

// ----------------------
// RULE CHECKERS
// ----------------------

function checkIP(rule) {
    const dev = getDeviceById(rule.device);
    if (!dev) return false;

    const intf = dev.interfaces[rule.interface];
    if (!intf) return false;

    return intf.ip === rule.ip && intf.mask === rule.mask;
}

function checkVLAN(rule) {
    const dev = getDeviceById(rule.device);
    if (!dev || dev.type !== "switch") return false;

    const intf = dev.interfaces[rule.interface];
    if (!intf) return false;

    return intf.vlan === rule.vlan;
}

function checkRoute(rule) {
    const dev = getDeviceById(rule.device);
    if (!dev || dev.type !== "router") return false;

    return dev.routingTable.some(r =>
        r.network === rule.network &&
        r.mask === rule.mask &&
        r.nextHop === rule.nextHop
    );
}

function checkPing(rule) {
    const src = getDeviceById(rule.source);
    const dst = getDeviceById(rule.target);

    if (!src || !dst) return false;

    const srcIp = src.interface.ip;
    const dstIp = dst.interface.ip;

    return sameSubnet(srcIp, dstIp, src.interface.mask);
}

function checkCloud(rule) {
    const cloud = getDeviceById(rule.device);
    if (!cloud || cloud.type !== "cloud") return false;

    if (rule.mode && cloud.mode !== rule.mode) return false;

    if (rule.translate) {
        for (const from in rule.translate) {
            if (cloud.vlanTranslation[from] !== rule.translate[from]) {
                return false;
            }
        }
    }

    return true;
}

