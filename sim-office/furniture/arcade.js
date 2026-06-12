import * as THREE from 'three';

export function createArcade({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    const w = 1.0;
    const h = 2.6; // Aumentado para bater com a altura da cabeca do NPC (aprox 2.6)
    const d = 1.0;

    // Base inferior
    addBox(w, h * 0.5, d, 0, h * 0.25, 0, colors.arcade_body, group);
    
    // Painel de controles (inclinado)
    const ctrlGeo = new THREE.BoxGeometry(w, 0.1, d * 0.6);
    const ctrlMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const ctrl = new THREE.Mesh(ctrlGeo, ctrlMat);
    ctrl.position.set(0, h * 0.55, d * 0.3);
    ctrl.rotation.x = -Math.PI / 8;
    group.add(ctrl);

    // Corpo Superior
    addBox(w, h * 0.45, d * 0.7, 0, h * 0.775, -d * 0.15, colors.arcade_body, group);

    // Tela
    const screenGeo = new THREE.PlaneGeometry(w * 0.8, h * 0.3);
    const screenMat = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        emissive: colors.arcade_screen,
        emissiveIntensity: 1.5
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, h * 0.7, d * 0.21);
    screen.rotation.x = -Math.PI / 16;
    group.add(screen);

    // Luz da tela
    const arcadeLight = new THREE.SpotLight(colors.arcade_screen, 1.0, 4, Math.PI / 3, 0.5, 1);
    arcadeLight.position.set(0, h * 0.7, d * 0.3);
    const arcadeTarget = new THREE.Object3D();
    arcadeTarget.position.set(0, h * 0.5, d + 1);
    group.add(arcadeLight);
    group.add(arcadeTarget);
    arcadeLight.target = arcadeTarget;

    // Animação da tela de jogo
    setInterval(() => {
        const gameColors = [0xff00cc, 0x00ffcc, 0xffff00, 0xff3300];
        const rc = gameColors[Math.floor(Math.random() * gameColors.length)];
        screenMat.emissive.setHex(rc);
        arcadeLight.color.setHex(rc);
    }, 500);

    return { group, depth: d };
}
