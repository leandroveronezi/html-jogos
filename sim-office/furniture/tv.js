import * as THREE from 'three';

export function createTV({ gridUnit, colors, addBox }) {
    const tvGroup = new THREE.Group();
    const tvDepth = 0.1;
    addBox(gridUnit * 1.5, gridUnit * 0.8, tvDepth, 0, gridUnit * 1.2, 0, colors.tv_bezel, tvGroup);
    const tvScreenGeo = new THREE.PlaneGeometry(gridUnit * 1.4, gridUnit * 0.7);
    const tvScreenMat = new THREE.MeshStandardMaterial({ 
        color: 0x000000, 
        emissive: 0x88ccff,
        emissiveIntensity: 1.5 
    });
    const tvScreen = new THREE.Mesh(tvScreenGeo, tvScreenMat);
    tvScreen.position.set(0, gridUnit * 1.2, tvDepth / 2 + 0.001);
    tvGroup.add(tvScreen);
    
    // Luz projetada pela TV apenas para frente
    const tvLight = new THREE.SpotLight(0x88ccff, 1.0, 5, Math.PI / 3, 0.5, 1);
    tvLight.position.set(0, gridUnit * 1.2, tvDepth / 2 + 0.1);
    const tvTarget = new THREE.Object3D();
    tvTarget.position.set(0, gridUnit * 1.2, tvDepth / 2 + 2);
    tvGroup.add(tvLight);
    tvGroup.add(tvTarget);
    tvLight.target = tvTarget;
    
    // Animação da TV (simulando cores do computador)
    setInterval(() => {
        // Cores vibrantes simulando código (VSCode Syntax Highlighting)
        const tvColors = [0x569cd6, 0x4ec9b0, 0xce9178, 0xdcdcaa, 0xc586c0, 0x9cdcfe];
        const randomTvColor = tvColors[Math.floor(Math.random() * tvColors.length)];
        tvScreenMat.emissive.setHex(randomTvColor);
        tvLight.color.setHex(randomTvColor);
    }, 200 + Math.random() * 800);
    
    addBox(gridUnit * 1.8, 0.4, gridUnit * 0.4, 0, 0.2, 0, 0x222222, tvGroup); // Rack
    
    return { tvGroup, tvDepth };
}
