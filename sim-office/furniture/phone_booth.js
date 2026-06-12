import * as THREE from 'three';

export function createPhoneBooth({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    
    const w = gridUnit * 0.8;
    const d = gridUnit * 0.8;
    const h = gridUnit * 2.2;
    
    const frameColor = 0x2b2b2b;
    const accentColor = 0xcc3333; // Red accent for a classic phone booth look, or modern dark
    
    // Base/Floor
    addBox(w, 0.1, d, 0, 0.05, 0, 0x111111, group);
    
    // Top roof
    addBox(w, 0.1, d, 0, h, 0, frameColor, group);
    addBox(w - 0.1, 0.1, d - 0.1, 0, h + 0.05, 0, accentColor, group); // Roof accent
    
    // Back wall
    addBox(w, h, 0.1, 0, h/2, -d/2 + 0.05, frameColor, group);
    
    // Side walls (solid with glass panels)
    // Left
    addBox(0.1, h, 0.1, -w/2 + 0.05, h/2, -d/2 + 0.05, frameColor, group); // Back-left pillar
    addBox(0.1, h, 0.1, -w/2 + 0.05, h/2, d/2 - 0.05, frameColor, group);  // Front-left pillar
    addBox(0.1, 0.1, d - 0.2, -w/2 + 0.05, 0.1, 0, frameColor, group);     // Left bottom frame
    addBox(0.1, 0.1, d - 0.2, -w/2 + 0.05, h - 0.05, 0, frameColor, group);// Left top frame
    
    // Right
    addBox(0.1, h, 0.1, w/2 - 0.05, h/2, -d/2 + 0.05, frameColor, group);  // Back-right pillar
    addBox(0.1, h, 0.1, w/2 - 0.05, h/2, d/2 - 0.05, frameColor, group);   // Front-right pillar
    addBox(0.1, 0.1, d - 0.2, w/2 - 0.05, 0.1, 0, frameColor, group);      // Right bottom frame
    addBox(0.1, 0.1, d - 0.2, w/2 - 0.05, h - 0.05, 0, frameColor, group); // Right top frame

    // Glass material
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.8 });
    
    const sideGlassGeo = new THREE.BoxGeometry(0.05, h - 0.2, d - 0.2);
    const leftGlass = new THREE.Mesh(sideGlassGeo, glassMat);
    leftGlass.position.set(-w/2 + 0.05, h/2, 0);
    group.add(leftGlass);
    
    const rightGlass = new THREE.Mesh(sideGlassGeo, glassMat);
    rightGlass.position.set(w/2 - 0.05, h/2, 0);
    group.add(rightGlass);
    
    // Front door (glass with frame)
    addBox(w - 0.2, 0.1, 0.05, 0, 0.1, d/2 - 0.05, frameColor, group);     // Door bottom frame
    addBox(w - 0.2, 0.1, 0.05, 0, h - 0.05, d/2 - 0.05, frameColor, group);// Door top frame
    addBox(0.05, h - 0.2, 0.05, -w/2 + 0.125, h/2, d/2 - 0.05, frameColor, group); // Door left frame
    addBox(0.05, h - 0.2, 0.05, w/2 - 0.125, h/2, d/2 - 0.05, frameColor, group);  // Door right frame
    addBox(0.05, 0.3, 0.05, w/2 - 0.15, h/2, d/2 - 0.02, 0xaaaaaa, group); // Door handle

    const doorGlassGeo = new THREE.BoxGeometry(w - 0.3, h - 0.2, 0.02);
    const door = new THREE.Mesh(doorGlassGeo, glassMat);
    door.position.set(0, h/2, d/2 - 0.05);
    group.add(door);
    
    // Inner phone/shelf
    addBox(0.4, 0.05, 0.2, 0, 1.0, -d/2 + 0.2, 0xdddddd, group); // shelf
    addBox(0.3, 0.4, 0.1, 0, 1.4, -d/2 + 0.15, 0x222222, group); // screen/panel
    addBox(0.05, 0.2, 0.05, 0.2, 1.4, -d/2 + 0.18, 0x111111, group); // handset

    return { group, depth: d };
}
