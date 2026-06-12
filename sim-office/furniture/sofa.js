import * as THREE from 'three';

// NPC: SCALE=2.0 → total height ≈ 2.6, hip/seat height ≈ 0.9 (legL.position.y = 0.45*2)
// Sofa seat top should be at ~0.45 so NPC sits with legL pivot at seat level.
// GRID_UNIT = 2.0 → sofa should span ~0.7–0.8 of a grid cell in depth.

export function createSofa({ gridUnit, colors, addBox }) {
    const sofaGroup = new THREE.Group();

    const seatH   = 0.45;   // seat top height (matches NPC hip level)
    const baseH   = 0.12;   // plinth / base slab height
    const cushH   = 0.22;   // seat cushion height
    const backH   = 0.65;   // backrest height above seat
    const backD   = 0.18;   // backrest depth
    const armW    = 0.20;   // armrest width
    const armH    = 0.35;   // armrest height above base
    const w       = gridUnit * 1.15;  // total width
    const depth   = gridUnit * 0.60;  // total depth

    // Base plinth
    addBox(w, baseH, depth, 0, baseH / 2, 0, 0x2a2a2a, sofaGroup);

    // Seat cushion (top at seatH)
    const cushY = baseH + cushH / 2;
    addBox(w - armW * 2, cushH, depth - backD, 0, cushY, backD / 2, colors.sofa, sofaGroup);

    // Backrest
    const backY = baseH + backH / 2;
    addBox(w - armW * 2, backH, backD, 0, backY, -(depth / 2 - backD / 2), colors.sofa, sofaGroup);

    // Left arm
    addBox(armW, armH, depth, -(w / 2 - armW / 2), baseH + armH / 2, 0, colors.sofa, sofaGroup);
    // Right arm
    addBox(armW, armH, depth,  (w / 2 - armW / 2), baseH + armH / 2, 0, colors.sofa, sofaGroup);

    // Pillows (decorative)
    const p1 = addBox(0.28, 0.28, 0.08, -(w * 0.28), baseH + cushH + 0.14, -(depth * 0.1), 0xddbb99, sofaGroup);
    p1.rotation.set(0.15, 0, 0.2);
    const p2 = addBox(0.28, 0.28, 0.08,  (w * 0.28), baseH + cushH + 0.14, -(depth * 0.1), 0x99bbdd, sofaGroup);
    p2.rotation.set(0.15, 0, -0.15);

    // Expose seat height so main.js can use it for NPC positioning
    sofaGroup.userData.seatHeight = seatH;

    return sofaGroup;
}
