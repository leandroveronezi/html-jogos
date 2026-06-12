import * as THREE from 'three';
import { createOfficeChair } from './chair.js';

// NPC hip height ≈ 0.9 (SCALE 2.0, leg 0.45*2)
// Chair seat height = gridUnit * 0.4 = 0.8  ← matches hip level
// Table top height  = gridUnit * 0.75 = 1.5  ← comfortable above chair
// gridUnit = 2.0

export function createMeetingTable({ gridUnit, colors, addBox }) {
    const meetingGroup = new THREE.Group();

    const tableW  = gridUnit * 1.9;  // table top width
    const tableD  = gridUnit * 1.1;  // table top depth
    const tableH  = gridUnit * 0.75; // table top height (1.5 units)
    const legH    = tableH - 0.06;   // leg height
    const legSize = 0.16;

    // Rug / felt pad
    addBox(gridUnit * 2.6, 0.03, gridUnit * 2.0, 0, 0.015, 0, colors.meeting_rug, meetingGroup);

    // Table top
    addBox(tableW, 0.07, tableD, 0, tableH, 0, colors.meeting_table, meetingGroup);

    // Four legs
    const lx = tableW / 2 - 0.15;
    const lz = tableD / 2 - 0.15;
    addBox(legSize, legH, legSize, -lx,  legH / 2, -lz, colors.desk_leg, meetingGroup);
    addBox(legSize, legH, legSize,  lx,  legH / 2, -lz, colors.desk_leg, meetingGroup);
    addBox(legSize, legH, legSize, -lx,  legH / 2,  lz, colors.desk_leg, meetingGroup);
    addBox(legSize, legH, legSize,  lx,  legH / 2,  lz, colors.desk_leg, meetingGroup);

    // Props on the table
    addBox(0.7,  0.05, 0.45, -0.45, tableH + 0.065, -0.05, 0xf2f2f2, meetingGroup); // paper
    addBox(0.45, 0.04, 0.32,  0.45, tableH + 0.065,  0.12, 0xd9e6f2, meetingGroup); // laptop
    addBox(0.12, 0.12, 0.12,  0.05, tableH + 0.1,   -0.25, 0x222222, meetingGroup); // phone
    addBox(0.22, 0.04, 0.16,  0.05, tableH + 0.065,  0.32, colors.meeting_accent, meetingGroup); // notepad

    // Six chairs — rotations: chairs at -Z face +Z (Math.PI), chairs at +Z face -Z (0)
    // Backrest is at local +Z, so rotation=Math.PI flips it away from the table on the -Z side
    const chairOffsets = [
        [-gridUnit * 0.65, 0, -gridUnit * 0.85, Math.PI],
        [0,                0, -gridUnit * 0.85, Math.PI],
        [ gridUnit * 0.65, 0, -gridUnit * 0.85, Math.PI],
        [-gridUnit * 0.65, 0,  gridUnit * 0.85, 0],
        [0,                0,  gridUnit * 0.85, 0],
        [ gridUnit * 0.65, 0,  gridUnit * 0.85, 0],
    ];
    chairOffsets.forEach(([cx, cy, cz, rotY]) => {
        const chair = createOfficeChair({ gridUnit: gridUnit, colors: colors, addBox });
        chair.position.set(cx, cy, cz);
        chair.rotation.y = rotY;
        meetingGroup.add(chair);
    });

    return meetingGroup;
}
