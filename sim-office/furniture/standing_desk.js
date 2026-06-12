import * as THREE from 'three';
import { createComputer } from './computer.js';

export function createStandingDesk({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    
    const w = gridUnit * 0.9;
    const d = gridUnit * 0.5; // Mesma profundidade da mesa normal
    const h = gridUnit * 1.0; // Mais alta (standing)
    const deskTopThickness = 0.1;
    
    // Tampo da mesa
    addBox(w, deskTopThickness, d, 0, h - deskTopThickness/2, 0, colors.desk_top || 0xdddddd, group);
    
    // Pernas (formato T lateral)
    const legH = h - deskTopThickness;
    addBox(0.1, legH, 0.1, -w/2 + 0.1, legH/2, 0, colors.desk_leg || 0x222222, group);
    addBox(0.1, legH, 0.1, w/2 - 0.1, legH/2, 0, colors.desk_leg || 0x222222, group);
    
    // Pés da base
    addBox(0.1, 0.05, d - 0.1, -w/2 + 0.1, 0.025, 0, colors.desk_leg || 0x222222, group);
    addBox(0.1, 0.05, d - 0.1, w/2 - 0.1, 0.025, 0, colors.desk_leg || 0x222222, group);
    
    // Adiciona o mesmo computador animado da mesa normal
    const computerGroup = createComputer({ gridUnit, colors, deskHeight: h, addBox });
    group.add(computerGroup);

    return group;
}
