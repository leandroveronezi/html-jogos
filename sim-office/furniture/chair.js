import * as THREE from 'three';

// NPC hip height ≈ 0.9 (SCALE 2, legL.position.y = 0.45*2)
// Chair seat top must be close to 0.9 so the NPC looks seated, not hovering.
// gridUnit = 2.0 → chairSeatHeight = gridUnit * 0.45 = 0.9

export function createOfficeChair({ gridUnit, colors, addBox }) {
    const chairGroup = new THREE.Group();
    const chairSeatHeight  = gridUnit * 0.45;   // 0.9 — matches NPC hip level
    const chairVisualZOffset = gridUnit * 0.38;
    chairGroup.position.set(0, 0, chairVisualZOffset);

    // Star base (5 spokes)
    const baseRadius = 0.42;
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const legGroup = new THREE.Group();
        legGroup.rotation.y = angle;
        addBox(0.07, 0.05, baseRadius, 0, 0.07, baseRadius / 2, colors.chair_base, legGroup);
        addBox(0.09, 0.09, 0.09, 0, 0.045, baseRadius - 0.045, 0x111111, legGroup);
        chairGroup.add(legGroup);
    }

    // Central column
    addBox(0.07, chairSeatHeight - 0.12, 0.07, 0, chairSeatHeight / 2, 0, colors.chair_base, chairGroup);

    // Seat cushion
    const seatW = gridUnit * 0.40;
    const seatD = gridUnit * 0.40;
    addBox(seatW, 0.10, seatD, 0, chairSeatHeight, 0, colors.chair_seat, chairGroup);

    // Backrest
    const backGroup = new THREE.Group();
    backGroup.position.set(0, chairSeatHeight + 0.35, seatD / 2 - 0.06);
    backGroup.rotation.x = -0.15;

    addBox(seatW * 0.80, 0.50, 0.07, 0, 0, 0, colors.chair_back, backGroup);
    const sideW = seatW * 0.20;
    const sideL = addBox(sideW, 0.48, 0.07, -seatW * 0.40 + sideW / 2, 0, 0.035, colors.chair_back, backGroup);
    sideL.rotation.y = 0.3;
    const sideR = addBox(sideW, 0.48, 0.07,  seatW * 0.40 - sideW / 2, 0, 0.035, colors.chair_back, backGroup);
    sideR.rotation.y = -0.3;
    addBox(0.05, 0.38, 0.05, 0, -0.18, -0.06, colors.chair_base, backGroup);
    chairGroup.add(backGroup);

    // Armrests
    const armH = 0.26;
    addBox(0.05, armH, 0.05, -seatW / 2 - 0.025, chairSeatHeight + armH / 2,  0, colors.chair_base, chairGroup);
    addBox(0.07, 0.05, 0.28, -seatW / 2 - 0.025, chairSeatHeight + armH,      0.06, 0x222222, chairGroup);
    addBox(0.05, armH, 0.05,  seatW / 2 + 0.025, chairSeatHeight + armH / 2,  0, colors.chair_base, chairGroup);
    addBox(0.07, 0.05, 0.28,  seatW / 2 + 0.025, chairSeatHeight + armH,      0.06, 0x222222, chairGroup);

    return chairGroup;
}
