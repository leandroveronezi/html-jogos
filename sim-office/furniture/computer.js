import * as THREE from 'three';

export function createComputer({ gridUnit, colors, deskHeight, addBox }) {
    const computerGroup = new THREE.Group();
    const mh = 0.5, mw = 0.7, md = 0.05;
    
    const monitor = addBox(mw, mh, md, 0, deskHeight + mh / 2, -gridUnit * 0.15, colors.computer_monitor, computerGroup);
    const screenGeo = new THREE.PlaneGeometry(mw - 0.05, mh - 0.05);
    const screenMat = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        emissive: 0x88ccff,
        emissiveIntensity: 1.5
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0, md / 2 + 0.001);
    monitor.add(screen);
    
    // Luz projetada pelo monitor apenas para frente
    const screenLight = new THREE.SpotLight(0x88ccff, 0.5, 3, Math.PI / 3, 0.5, 1);
    screenLight.position.set(0, 0, 0.2);
    const screenTarget = new THREE.Object3D();
    screenTarget.position.set(0, 0, 1);
    monitor.add(screenLight);
    monitor.add(screenTarget);
    screenLight.target = screenTarget;
    
    // Animação da tela do computador
    setInterval(() => {
        // Cores vibrantes simulando código (VSCode Syntax Highlighting)
        const codeColors = [0x569cd6, 0x4ec9b0, 0xce9178, 0xdcdcaa, 0xc586c0, 0x9cdcfe];
        const randomColor = codeColors[Math.floor(Math.random() * codeColors.length)];
        screenMat.emissive.setHex(randomColor);
        screenLight.color.setHex(randomColor);
    }, 200 + Math.random() * 800);
    
    addBox(0.1, 0.1, 0.1, 0, deskHeight + 0.05, -gridUnit * 0.18, colors.computer_base, computerGroup);
    
    return computerGroup;
}
