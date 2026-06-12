import { officeLayout } from '../layout.js';

export function isWalkable(gridX, gridZ) {
    if (gridZ < 0 || gridZ >= officeLayout.length || gridX < 0 || gridX >= officeLayout[0].length) return false;
    const tileType = officeLayout[gridZ]?.[gridX];
    switch(tileType) {
        case 1: case 10: case 2: case 3: case 4: case 5: case 6: case 8: case 9: case 'T': case 14: case 15: case 16: case 17: case 18: case 19: case 20: case 22: case 23: return false;
        case 0: case 7: case 11: case 12: case 13: default: return true;
    }
}

// --- Mapa de zonas de conectividade (flood-fill) ---
// Cada célula walkable recebe um zoneId. Células em zonas diferentes não têm rota entre si.
let _zoneMap = null;

function buildZoneMap() {
    const rows = officeLayout.length;
    const cols = officeLayout[0].length;
    const map = new Map(); // "x,z" -> zoneId
    let nextZone = 0;
    const DIRS = [{dx:0,dz:-1},{dx:0,dz:1},{dx:-1,dz:0},{dx:1,dz:0}];

    for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
            const key = `${x},${z}`;
            if (!isWalkable(x, z) || map.has(key)) continue;
            // BFS flood-fill a partir desta célula
            const zoneId = nextZone++;
            const queue = [[x, z]];
            map.set(key, zoneId);
            while (queue.length > 0) {
                const [cx, cz] = queue.shift();
                for (const {dx, dz} of DIRS) {
                    const nx = cx + dx, nz = cz + dz;
                    const nKey = `${nx},${nz}`;
                    if (isWalkable(nx, nz) && !map.has(nKey)) {
                        map.set(nKey, zoneId);
                        queue.push([nx, nz]);
                    }
                }
            }
        }
    }
    return map;
}

export function getZoneId(gridX, gridZ) {
    if (!_zoneMap) _zoneMap = buildZoneMap();
    return _zoneMap.get(`${gridX},${gridZ}`) ?? -1;
}

export function isSameZone(ax, az, bx, bz) {
    const za = getZoneId(ax, az);
    if (za === -1) return false;
    return za === getZoneId(bx, bz);
}

export function findPath(startX, startZ, targetX, targetZ) {
    // Verifica rapidamente se origem e destino estão na mesma zona antes de rodar o A*
    if (!isSameZone(startX, startZ, targetX, targetZ)) return null;

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
    // Sem log de warn — já sabemos que zonas são iguais mas não tem rota (não deveria ocorrer)
    return null;
}
