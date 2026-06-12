import * as THREE from 'three';

export function createPlant({ gridUnit, colors }) {
    const plantGroup = new THREE.Group();
    
    // Vaso (Pot)
    const potGeo = new THREE.CylinderGeometry(gridUnit * 0.2, gridUnit * 0.15, gridUnit * 0.4, 8);
    const potMat = new THREE.MeshStandardMaterial({ color: colors.plant_pot, roughness: 0.8 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(0, gridUnit * 0.2, 0);
    pot.castShadow = true;
    pot.receiveShadow = true;
    plantGroup.add(pot);
    
    // Tronco (Trunk)
    const trunkGeo = new THREE.CylinderGeometry(gridUnit * 0.03, gridUnit * 0.04, gridUnit * 0.5, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, gridUnit * 0.4 + gridUnit * 0.25, 0);
    trunk.castShadow = true;
    plantGroup.add(trunk);
    
    // Folhas (Leaves) - 3 pequenos icosaedros
    const leafGeo = new THREE.IcosahedronGeometry(gridUnit * 0.25, 1);
    const leafMat = new THREE.MeshStandardMaterial({ color: colors.plant_leaves, roughness: 0.6, flatShading: true });
    
    const leaf1 = new THREE.Mesh(leafGeo, leafMat);
    leaf1.position.set(0, gridUnit * 0.8, 0);
    leaf1.castShadow = true;
    plantGroup.add(leaf1);
    
    const leaf2 = new THREE.Mesh(leafGeo, leafMat);
    leaf2.position.set(gridUnit * 0.15, gridUnit * 0.65, gridUnit * 0.1);
    leaf2.castShadow = true;
    plantGroup.add(leaf2);
    
    const leaf3 = new THREE.Mesh(leafGeo, leafMat);
    leaf3.position.set(-gridUnit * 0.15, gridUnit * 0.65, -gridUnit * 0.1);
    leaf3.castShadow = true;
    plantGroup.add(leaf3);
    
    return plantGroup;
}
