import * as THREE from 'three';

export function createCoffeeMachine({ gridUnit, addBox }) {
    const coffeeGroup = new THREE.Group();
    const coffeeDepth = gridUnit * 0.3;
    addBox(gridUnit * 0.4, gridUnit * 0.6, coffeeDepth, 0, gridUnit * 0.3, 0, 0x222222, coffeeGroup);
    addBox(gridUnit * 0.35, gridUnit * 0.5, gridUnit * 0.28, 0, gridUnit * 0.3, 0.02, 0x444444, coffeeGroup);
    addBox(gridUnit * 0.4, 0.1, gridUnit * 0.2, 0, 0.05, gridUnit * 0.15, 0x111111, coffeeGroup);
    addBox(0.1, 0.1, 0.1, 0, gridUnit * 0.4, gridUnit * 0.15, 0x111111, coffeeGroup); // saida
    addBox(0.08, 0.12, 0.08, 0, 0.16, gridUnit * 0.15, 0xffffff, coffeeGroup); // copo
    addBox(gridUnit * 0.2, 0.2, 0.02, 0, gridUnit * 0.5, gridUnit * 0.15, 0x00aaff, coffeeGroup); // painel
    
    return { coffeeGroup, coffeeDepth };
}
