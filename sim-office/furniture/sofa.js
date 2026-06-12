import * as THREE from 'three';

export function createSofa({ gridUnit, colors, addBox }) {
    const sofaGroup = new THREE.Group();
    addBox(gridUnit * 1.2, 0.1, gridUnit * 0.5, 0, 0.05, 0, 0x333333, sofaGroup); // base
    addBox(gridUnit * 1.15, gridUnit * 0.2, gridUnit * 0.48, 0, gridUnit * 0.1 + 0.05, 0, colors.sofa, sofaGroup); // assento
    addBox(gridUnit * 1.15, gridUnit * 0.35, gridUnit * 0.15, 0, gridUnit * 0.35, -gridUnit * 0.16, colors.sofa, sofaGroup); // encosto
    addBox(gridUnit * 0.15, gridUnit * 0.25, gridUnit * 0.5, -gridUnit * 0.55, gridUnit * 0.2, 0, colors.sofa, sofaGroup); // braco esq
    addBox(gridUnit * 0.15, gridUnit * 0.25, gridUnit * 0.5, gridUnit * 0.55, gridUnit * 0.2, 0, colors.sofa, sofaGroup); // braco dir
    
    const p1 = addBox(0.3, 0.3, 0.1, -gridUnit * 0.3, gridUnit * 0.25, -gridUnit * 0.1, 0xddbb99, sofaGroup); // almofada
    p1.rotation.set(0.2, 0, 0.2);
    const p2 = addBox(0.3, 0.3, 0.1, gridUnit * 0.3, gridUnit * 0.25, -gridUnit * 0.1, 0x99bbdd, sofaGroup); // almofada
    p2.rotation.set(0.2, 0, -0.1);
    
    return sofaGroup;
}
