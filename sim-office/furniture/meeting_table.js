import * as THREE from 'three';
import { createOfficeChair } from './chair.js';

export function createMeetingTable({ gridUnit, colors, addBox }) {
    const meetingGroup = new THREE.Group();
    addBox(gridUnit * 2.4, 0.035, gridUnit * 1.9, 0, 0.018, 0, colors.meeting_rug, meetingGroup);
    addBox(gridUnit * 1.8, gridUnit * 0.12, gridUnit * 1.0, 0, gridUnit * 0.7, 0, colors.meeting_table, meetingGroup);
    addBox(0.14, gridUnit * 0.65, 0.14, -gridUnit * 0.75, gridUnit * 0.325, -gridUnit * 0.35, colors.desk_leg, meetingGroup);
    addBox(0.14, gridUnit * 0.65, 0.14, gridUnit * 0.75, gridUnit * 0.325, -gridUnit * 0.35, colors.desk_leg, meetingGroup);
    addBox(0.14, gridUnit * 0.65, 0.14, -gridUnit * 0.75, gridUnit * 0.325, gridUnit * 0.35, colors.desk_leg, meetingGroup);
    addBox(0.14, gridUnit * 0.65, 0.14, gridUnit * 0.75, gridUnit * 0.325, gridUnit * 0.35, colors.desk_leg, meetingGroup);
    addBox(0.7, 0.05, 0.45, -0.45, gridUnit * 0.78, -0.05, 0xf2f2f2, meetingGroup);
    addBox(0.45, 0.04, 0.32, 0.45, gridUnit * 0.79, 0.12, 0xd9e6f2, meetingGroup);
    addBox(0.12, 0.12, 0.12, 0.05, gridUnit * 0.82, -0.25, 0x222222, meetingGroup);
    addBox(0.22, 0.04, 0.16, 0.05, gridUnit * 0.79, 0.32, colors.meeting_accent, meetingGroup);

    const chairOffsets = [
        [-gridUnit * 0.65, 0, -gridUnit * 0.75, 0],
        [0, 0, -gridUnit * 0.75, 0],
        [gridUnit * 0.65, 0, -gridUnit * 0.75, 0],
        [-gridUnit * 0.65, 0, gridUnit * 0.75, Math.PI],
        [0, 0, gridUnit * 0.75, Math.PI],
        [gridUnit * 0.65, 0, gridUnit * 0.75, Math.PI]
    ];
    chairOffsets.forEach(([cx, cy, cz, rotY]) => {
        const chair = createOfficeChair({ gridUnit: gridUnit, colors: colors, addBox });
        chair.position.set(cx, cy, cz);
        chair.rotation.y = rotY;
        meetingGroup.add(chair);
    });

    return meetingGroup;
}
