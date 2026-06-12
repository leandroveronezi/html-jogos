import * as THREE from 'three';

export function createPingPong({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    
    // Table is 2 units wide, 1 unit deep (or vice versa)
    // Let's make it fit in one grid unit visually but extend a bit
    const w = gridUnit * 1.4;
    const d = gridUnit * 0.8;
    const h = gridUnit * 0.75;
    
    // Table top
    addBox(w, 0.05, d, 0, h, 0, 0x1e88e5, group);
    
    // White lines
    addBox(w, 0.06, 0.02, 0, h, 0, 0xffffff, group); // middle line horizontal
    addBox(0.02, 0.06, d, 0, h, 0, 0xffffff, group); // middle line vertical
    
    // Net
    const netMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, wireframe: true });
    const netGeo = new THREE.BoxGeometry(0.02, 0.15, d);
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, h + 0.075, 0);
    group.add(net);
    
    // Legs
    addBox(0.05, h, 0.05, -w/2 + 0.1, h/2, -d/2 + 0.1, 0x333333, group);
    addBox(0.05, h, 0.05, w/2 - 0.1, h/2, -d/2 + 0.1, 0x333333, group);
    addBox(0.05, h, 0.05, -w/2 + 0.1, h/2, d/2 - 0.1, 0x333333, group);
    addBox(0.05, h, 0.05, w/2 - 0.1, h/2, d/2 - 0.1, 0x333333, group);

    // Paddles
    addBox(0.1, 0.02, 0.15, -0.4, h + 0.03, 0.2, 0xd32f2f, group);
    addBox(0.1, 0.02, 0.15, 0.4, h + 0.03, -0.2, 0x1976d2, group);

    return group;
}
