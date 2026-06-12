import * as THREE from 'three';

export function createBeanbag({ gridUnit, colors, addBox }) {
    const beanGroup = new THREE.Group();
    addBox(gridUnit * 0.5, gridUnit * 0.3, gridUnit * 0.5, 0, gridUnit * 0.15, 0, colors.beanbag, beanGroup);
    const b2 = addBox(gridUnit * 0.45, gridUnit * 0.35, gridUnit * 0.45, 0, gridUnit * 0.17, 0, colors.beanbag, beanGroup);
    b2.rotation.y = Math.PI / 4;
    const b3 = addBox(gridUnit * 0.3, gridUnit * 0.4, gridUnit * 0.3, 0, gridUnit * 0.2, 0, colors.beanbag, beanGroup);
    b3.rotation.z = 0.2;
    return beanGroup;
}
