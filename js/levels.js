// Level definitions (self-paced, no timers)
window.App = window.App || {};
App.Levels = [
    {
        id: "level1_practice",
        name: "Practice Mode",
        tasks: [
            { id: "p1", type: "deviceExists", deviceType: "pc", minCount: 1, description: "There is a PC on the canvas" },
            { id: "p2", type: "commandExecuted", deviceId: "pc_practice", command: "ipconfig", description: "Type 'ipconfig' in the terminal" }
        ],
        initialScenario: {
            id: "level1_practice",
            devices: [ App.DeviceModel.createDevice("pc", "pc_practice", "PC-Practice", 300, 300) ],
            links: []
        }
    },
    {
        id: "level2_basicLAN",
        name: "Basic Connectivity",
        tasks: [
            { id: "l2t1", type: "deviceExists", deviceType: "switch", minCount: 1, description: "Add a switch" },
            { id: "l2t2", type: "deviceExists", deviceType: "pc", minCount: 2, description: "Add two PCs (PC-A and PC-B)" },
            { id: "l2t3", type: "linkExists", between: ["pcA","switch1"], description: "Connect PC-A to the switch" },
            { id: "l2t4", type: "linkExists", between: ["pcB","switch1"], description: "Connect PC-B to the switch" },
            { id: "l2t5", type: "pingSuccess", from: "pcA", to: "pcB", description: "Ping PC-B from PC-A successfully" }
        ],
        initialScenario: {
            id: "level2_basicLAN",
            devices: [
                App.DeviceModel.createDevice("switch", "switch1", "Switch1", 400, 200),
                App.DeviceModel.createDevice("pc", "pcA", "PC-A", 200, 300),
                App.DeviceModel.createDevice("pc", "pcB", "PC-B", 600, 300)
            ],
            links: []
        }
    }
];
