import * as THREE from 'three';
import { createOfficeChair } from './chair.js';
import { createComputer } from './computer.js';

export function createDesk({ gridUnit, colors, addBox }) {
    const deskGroup = new THREE.Group();
    const deskHeight = gridUnit * 0.7;
    const deskTopThickness = 0.1;
    const legHeight = deskHeight - deskTopThickness;
    addBox(gridUnit * 0.9, deskTopThickness, gridUnit * 0.5, 0, deskHeight - deskTopThickness / 2, 0, colors.desk_top, deskGroup);
    addBox(0.1, legHeight, 0.1, -gridUnit * 0.4, legHeight / 2, 0, colors.desk_leg, deskGroup);
    addBox(0.1, legHeight, 0.1, gridUnit * 0.4, legHeight / 2, 0, colors.desk_leg, deskGroup);
    const drawerWidth = gridUnit * 0.3, drawerHeight = legHeight * 0.9;
    addBox(drawerWidth, drawerHeight, gridUnit * 0.45, gridUnit * 0.4 - drawerWidth / 2, drawerHeight / 2, 0, colors.desk_drawer, deskGroup);
    
    const chairGroup = createOfficeChair({ gridUnit, colors, addBox });
    deskGroup.add(chairGroup);
    
    const computerGroup = createComputer({ gridUnit, colors, deskHeight, addBox });
    deskGroup.add(computerGroup);

    return deskGroup;
}
