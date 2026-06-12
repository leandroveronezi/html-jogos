import * as THREE from 'three';

export function createCafeCounter({ gridUnit, addBox }) {
    const counterGroup = new THREE.Group();
    const cafeDepth = gridUnit * 0.45;
    addBox(gridUnit, gridUnit * 0.7, gridUnit * 0.4, 0, gridUnit * 0.35, 0, 0x444444, counterGroup);
    addBox(gridUnit * 1.05, 0.1, cafeDepth, 0, gridUnit * 0.7 + 0.05, 0, 0xffffff, counterGroup); // tampo
    addBox(0.4, 0.05, 0.3, -gridUnit * 0.2, gridUnit * 0.7 + 0.1, 0, 0xaa6633, counterGroup); // bandeja
    addBox(0.1, 0.1, 0.1, -gridUnit * 0.2, gridUnit * 0.7 + 0.15, 0, 0xcc3333, counterGroup); // maca
    addBox(0.12, 0.1, 0.1, -gridUnit * 0.1, gridUnit * 0.7 + 0.15, 0, 0xcccc33, counterGroup); // banana
    
    return { counterGroup, cafeDepth };
}
