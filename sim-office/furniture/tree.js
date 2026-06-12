import * as THREE from 'three';

export function createBigTree({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    
    // Vaso rústico grande de madeira
    const potH = 0.8;
    const potW = 1.0;
    addBox(potW, potH, potW, 0, potH / 2, 0, 0x8b5a2b, group); // Vaso

    // Tronco principal
    const trunkH = 1.5;
    addBox(0.2, trunkH, 0.2, 0, potH + trunkH / 2, 0, colors.tree_trunk, group);

    // Folhagens (várias caixas para dar volume de árvore)
    const leavesCenterY = potH + trunkH;
    
    // Camada inferior
    addBox(1.5, 0.8, 1.5, 0, leavesCenterY, 0, colors.tree_leaves, group);
    // Camada superior
    addBox(1.0, 0.6, 1.0, 0, leavesCenterY + 0.6, 0, colors.tree_leaves, group);
    // Topo
    addBox(0.5, 0.4, 0.5, 0, leavesCenterY + 1.0, 0, colors.tree_leaves, group);

    // Detalhes extras de folhagem nas laterais
    addBox(0.6, 0.6, 0.6, 0.6, leavesCenterY - 0.2, 0, colors.tree_leaves, group);
    addBox(0.6, 0.6, 0.6, -0.6, leavesCenterY - 0.2, 0, colors.tree_leaves, group);
    addBox(0.6, 0.6, 0.6, 0, leavesCenterY - 0.2, 0.6, colors.tree_leaves, group);
    addBox(0.6, 0.6, 0.6, 0, leavesCenterY - 0.2, -0.6, colors.tree_leaves, group);

    return group;
}

export function createTrashCan({ gridUnit, colors, addBox }) {
    const group = new THREE.Group();
    // Lixeira simples azul/cinza
    addBox(0.4, 0.6, 0.4, 0, 0.3, 0, 0x555566, group);
    return group;
}
