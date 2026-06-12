import * as THREE from 'three';

export function createOfficeChair({ gridUnit, colors, addBox }) {
    const chairGroup = new THREE.Group();
    const chairSeatHeight = gridUnit * 0.4;
    const chairVisualZOffset = gridUnit * 0.35;
    chairGroup.position.set(0, 0, chairVisualZOffset);

    const baseRadius = 0.35;
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const legGroup = new THREE.Group();
        legGroup.rotation.y = angle;
        addBox(0.06, 0.04, baseRadius, 0, 0.06, baseRadius / 2, colors.chair_base, legGroup);
        addBox(0.08, 0.08, 0.08, 0, 0.04, baseRadius - 0.04, 0x111111, legGroup);
        chairGroup.add(legGroup);
    }

    addBox(0.06, chairSeatHeight - 0.1, 0.06, 0, chairSeatHeight / 2, 0, colors.chair_base, chairGroup);

    const seatW = gridUnit * 0.35;
    const seatD = gridUnit * 0.35;
    addBox(seatW, 0.08, seatD, 0, chairSeatHeight, 0, colors.chair_seat, chairGroup);

    const backGroup = new THREE.Group();
    backGroup.position.set(0, chairSeatHeight + 0.3, seatD / 2 - 0.05);
    backGroup.rotation.x = -0.15;

    addBox(seatW * 0.8, 0.4, 0.06, 0, 0, 0, colors.chair_back, backGroup);
    const sideW = seatW * 0.2;
    const sideL = addBox(sideW, 0.38, 0.06, -seatW * 0.4 + sideW / 2, 0, 0.03, colors.chair_back, backGroup);
    sideL.rotation.y = 0.3;
    const sideR = addBox(sideW, 0.38, 0.06, seatW * 0.4 - sideW / 2, 0, 0.03, colors.chair_back, backGroup);
    sideR.rotation.y = -0.3;
    addBox(0.05, 0.3, 0.04, 0, -0.15, -0.05, colors.chair_base, backGroup);
    chairGroup.add(backGroup);

    const armH = 0.22;
    addBox(0.04, armH, 0.04, -seatW / 2 - 0.02, chairSeatHeight + armH / 2, 0, colors.chair_base, chairGroup);
    addBox(0.06, 0.04, 0.25, -seatW / 2 - 0.02, chairSeatHeight + armH, 0.05, 0x222222, chairGroup);
    addBox(0.04, armH, 0.04, seatW / 2 + 0.02, chairSeatHeight + armH / 2, 0, colors.chair_base, chairGroup);
    addBox(0.06, 0.04, 0.25, seatW / 2 + 0.02, chairSeatHeight + armH, 0.05, 0x222222, chairGroup);

    return chairGroup;
}
