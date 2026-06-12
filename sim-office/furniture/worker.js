import * as THREE from 'three';

let headGeo, headMat, limbGeo, pantsMat;

const SCALE = 2.0;

export function initWorkerGeometries(colors) {
    if (!headGeo) {
        headGeo = new THREE.BoxGeometry(0.35 * SCALE, 0.35 * SCALE, 0.35 * SCALE);
        headMat = new THREE.MeshStandardMaterial({ color: colors.worker_skin, roughness: 0.5 });
        limbGeo = new THREE.BoxGeometry(0.15 * SCALE, 0.45 * SCALE, 0.15 * SCALE);
        limbGeo.translate(0, -0.225 * SCALE, 0); 
        pantsMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    }
}

export function createWorker({ startPos, shirtColor }) {
    const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });

    const workerGroup = new THREE.Group();
    workerGroup.position.set(startPos[0], 0, startPos[2]);
    
    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.4 * SCALE, 0.5 * SCALE, 0.25 * SCALE);
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = (0.45 + 0.25) * SCALE; // pernas + metade do torso
    torso.castShadow = true;
    
    // Head
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = (0.45 + 0.5 + 0.175) * SCALE; // pernas + torso + metade cabeça
    head.castShadow = true;

    // Limbs (Membros)
    const armL = new THREE.Mesh(limbGeo, torsoMat);
    armL.position.set(-0.28 * SCALE, (0.45 + 0.5) * SCALE, 0); // altura do ombro
    armL.castShadow = true;
    
    const armR = new THREE.Mesh(limbGeo, torsoMat);
    armR.position.set(0.28 * SCALE, (0.45 + 0.5) * SCALE, 0);
    armR.castShadow = true;
    
    const legL = new THREE.Mesh(limbGeo, pantsMat);
    legL.position.set(-0.12 * SCALE, 0.45 * SCALE, 0); // altura do quadril
    legL.castShadow = true;
    
    const legR = new THREE.Mesh(limbGeo, pantsMat);
    legR.position.set(0.12 * SCALE, 0.45 * SCALE, 0);
    legR.castShadow = true;

    workerGroup.add(torso);
    workerGroup.add(head);
    workerGroup.add(armL);
    workerGroup.add(armR);
    workerGroup.add(legL);
    workerGroup.add(legR);
    
    return {
        workerGroup,
        animParts: { armL, armR, legL, legR, torso, head }
    };
}
