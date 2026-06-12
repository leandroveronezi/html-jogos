import { GRID_UNIT } from '../config.js';

export function gridToWorld(gridX, gridZ) {
    return [gridX * GRID_UNIT + GRID_UNIT / 2, 0, gridZ * GRID_UNIT + GRID_UNIT / 2];
}

export function worldToGrid(worldX, worldZ) {
    return [Math.floor(worldX / GRID_UNIT), Math.floor(worldZ / GRID_UNIT)];
}
