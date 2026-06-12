import * as THREE from 'three';

export function createVendingMachine({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    const w = gridUnit * 1.2;
    const h = gridUnit * 2.2;
    const d = gridUnit * 0.8;

    // Corpo principal
    addBox(w, h, d, 0, h / 2, 0, colors.vending_body, group);
    
    // Vidro Frontal (brilhante/transparente)
    const glassW = w * 0.8;
    const glassH = h * 0.6;
    const glassGeo = new THREE.PlaneGeometry(glassW, glassH);
    const glassMat = new THREE.MeshStandardMaterial({ 
        color: colors.vending_glass,
        emissive: colors.vending_glow,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.5
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(-w * 0.05, h * 0.6, d / 2 + 0.01);
    group.add(glass);

    // Prateleiras e "Salgadinhos" simulados
    for (let i = 0; i < 3; i++) {
        const shelfY = h * 0.4 + (i * glassH / 3);
        addBox(glassW * 0.9, 0.05, d * 0.4, -w * 0.05, shelfY, d * 0.2, 0x333333, group);
        
        // Items na prateleira
        for (let j = 0; j < 4; j++) {
            const itemColor = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00][Math.floor(Math.random() * 4)];
            addBox(0.15, 0.2, 0.1, -w * 0.05 - glassW * 0.3 + (j * 0.25), shelfY + 0.125, d * 0.3, itemColor, group);
        }
    }

    // Painel de luz interno
    const vendLight = new THREE.SpotLight(0xffffff, 0.8, 4, Math.PI / 2, 0.5, 1);
    vendLight.position.set(0, h * 0.8, d / 2 + 0.1);
    const vendTarget = new THREE.Object3D();
    vendTarget.position.set(0, 0, d / 2 + 2);
    group.add(vendLight);
    group.add(vendTarget);
    vendLight.target = vendTarget;

    // Abertura de pegar o item
    addBox(w * 0.6, 0.3, 0.1, -w * 0.05, h * 0.15, d / 2 + 0.02, 0x111111, group);

    return { group, depth: d };
}
