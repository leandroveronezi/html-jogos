import { officeLayout } from '../layout.js';

export function isWalkable(gridX, gridZ) {
    if (gridZ < 0 || gridZ >= officeLayout.length || gridX < 0 || gridX >= officeLayout[0].length) return false;
    const tileType = officeLayout[gridZ]?.[gridX];
    switch(tileType) {
        case 1: case 10: case 2: case 3: case 4: case 5: case 6: case 7: case 8: case 9: case 'T': case 13: case 14: case 15: case 16: case 17: case 18: case 19: return false;
        case 0: case 11: case 12: default: return true;
    }
}

export function findPath(startX, startZ, targetX, targetZ) {
    function heuristic(x1, z1, x2, z2) { return Math.abs(x1-x2) + Math.abs(z1-z2); }
    const startNode = { x: startX, z: startZ, g: 0, h: heuristic(startX, startZ, targetX, targetZ), f: 0, parent: null };
    startNode.f = startNode.h;
    const openList = [startNode];
    const closedList = new Set();
    while (openList.length > 0) {
        openList.sort((a, b) => a.f - b.f);
        const currentNode = openList.shift();
        if (currentNode.x === targetX && currentNode.z === targetZ) {
            const path = [];
            let temp = currentNode;
            while (temp) { path.push([temp.x, temp.z]); temp = temp.parent; }
            return path.reverse();
        }
        closedList.add(`${currentNode.x},${currentNode.z}`);
        const neighbors = [
            { x: currentNode.x, z: currentNode.z - 1 },
            { x: currentNode.x, z: currentNode.z + 1 },
            { x: currentNode.x - 1, z: currentNode.z },
            { x: currentNode.x + 1, z: currentNode.z }
        ];
        for (const neighborCoords of neighbors) {
            const nx = neighborCoords.x;
            const nz = neighborCoords.z;
            const neighborKey = `${nx},${nz}`;
            if (!isWalkable(nx, nz) || closedList.has(neighborKey)) continue;
            const gCostTentative = currentNode.g + 1;
            let neighborNode = openList.find(node => node.x === nx && node.z === nz);
            if (!neighborNode) {
                neighborNode = { x: nx, z: nz, g: gCostTentative, h: heuristic(nx, nz, targetX, targetZ), f: 0, parent: currentNode };
                neighborNode.f = neighborNode.g + neighborNode.h;
                openList.push(neighborNode);
            } else if (gCostTentative < neighborNode.g) {
                neighborNode.parent = currentNode;
                neighborNode.g = gCostTentative;
                neighborNode.f = neighborNode.g + neighborNode.h;
            }
        }
    }
    console.warn(`A* Path not found from (${startX},${startZ}) to (${targetX},${targetZ})`);
    return null;
}
