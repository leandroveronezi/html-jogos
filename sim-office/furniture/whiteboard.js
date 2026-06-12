import * as THREE from 'three';

export function createWhiteboard({ gridUnit, colors, addBox }) {
    const boardGroup = new THREE.Group();
    const bDepth = 0.08;
    addBox(gridUnit * 1.6, gridUnit * 1.0, bDepth, 0, gridUnit * 1.2, 0, colors.meeting_board, boardGroup);
    addBox(gridUnit * 1.7, 0.06, 0.1, 0, gridUnit * 0.7, bDepth / 2, colors.meeting_accent, boardGroup);
    addBox(0.7, 0.05, 0.06, -0.2, gridUnit * 1.3, bDepth / 2 + 0.01, 0x3b82f6, boardGroup);
    addBox(0.45, 0.05, 0.06, 0.35, gridUnit * 1.1, bDepth / 2 + 0.01, 0x22c55e, boardGroup);
    
    return { boardGroup, bDepth };
}
