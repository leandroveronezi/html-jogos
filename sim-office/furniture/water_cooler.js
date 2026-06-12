import * as THREE from 'three';

export function createWaterCooler({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    const w = 0.6;
    const h = 1.2;
    const d = 0.6;

    // Base do bebedouro
    addBox(w, h, d, 0, h / 2, 0, colors.water_cooler_body, group);
    
    // Garrafa de água (translúcida)
    const bottleRadius = 0.25;
    const bottleHeight = 0.6;
    const bottleGeo = new THREE.CylinderGeometry(bottleRadius, bottleRadius, bottleHeight, 16);
    const bottleMat = new THREE.MeshStandardMaterial({ 
        color: colors.water_cooler_bottle,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.1
    });
    const bottle = new THREE.Mesh(bottleGeo, bottleMat);
    bottle.position.set(0, h + bottleHeight / 2, 0);
    bottle.castShadow = true;
    group.add(bottle);

    // Torneirinhas
    addBox(0.05, 0.05, 0.1, -0.1, h * 0.8, d / 2 + 0.05, 0xff0000, group); // Quente
    addBox(0.05, 0.05, 0.1, 0.1, h * 0.8, d / 2 + 0.05, 0x0000ff, group); // Fria

    return { group, depth: d };
}
