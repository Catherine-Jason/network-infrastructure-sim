// Breadth‑First Search pathfinding for network devices

export function findPath(startId, endId, connections) {
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

