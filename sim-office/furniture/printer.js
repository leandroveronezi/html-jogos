import * as THREE from 'three';

export function createPrinter({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    const w = gridUnit * 0.8;
    const h = gridUnit * 0.6;
    const d = gridUnit * 0.7;

    // Base da impressora
    addBox(w, h, d, 0, h / 2, 0, colors.printer_body, group);
    
    // Bandeja de cima
    addBox(w * 0.6, 0.1, d * 0.5, 0, h + 0.05, -d * 0.1, colors.printer_tray, group);
    
    // Bandeja de baixo
    addBox(w * 0.4, 0.05, d * 0.3, 0, h * 0.3, d * 0.5, colors.printer_tray, group);

    // Painel luminoso (emissão de luz verde intermitente simulando 'pronto')
    const panelGeo = new THREE.PlaneGeometry(0.2, 0.1);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x00ff00, emissiveIntensity: 1 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(w * 0.2, h * 0.9, d / 2 + 0.01);
    group.add(panel);

    // Animação luz painel
    setInterval(() => {
        panelMat.emissiveIntensity = Math.random() > 0.5 ? 1.5 : 0.2;
    }, 1500);

    return { group, depth: d };
}
