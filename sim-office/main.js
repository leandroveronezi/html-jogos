import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLORS } from './colors.js';
import {
    BREAK_DURATION_MAX,
    BREAK_DURATION_MIN,
    BATHROOM_DURATION_MAX,
    BATHROOM_DURATION_MIN,
    CHANCE_TO_ACT_ON_NEED,
    DOOR_HEIGHT_FACTOR,
    EXT_WALL_HEIGHT_FACTOR,
    GRID_UNIT,
    MAX_TASKS,
    NEED_THRESHOLD,
    NUM_WORKERS,
    STUCK_CHECK_INTERVAL,
    TASK_DURATION_MAX,
    TASK_DURATION_MIN,
    WALL_HEIGHT_FACTOR,
    WALL_THICKNESS,
    WORK_TIME_BEFORE_BATHROOM_CHANCE,
    WORK_TIME_BEFORE_BREAK_CHANCE
    BASE_TASK_REWARD,
    BASE_WORKER_COST,
    RENT_COST_PER_DAY
} from './config.js';
import { createSofa } from './furniture/sofa.js';
import { createPlant } from './furniture/plant.js';
import { createDesk } from './furniture/desk.js';
import { createCoffeeMachine } from './furniture/coffee_machine.js';
import { createBookshelf } from './furniture/bookshelf.js';
import { createBeanbag } from './furniture/beanbag.js';
import { createCafeCounter } from './furniture/cafe_counter.js';
import { createMeetingTable } from './furniture/meeting_table.js';
import { createTV } from './furniture/tv.js';
import { createWhiteboard } from './furniture/whiteboard.js';
import { createPrinter } from './furniture/printer.js';
import { createWaterCooler } from './furniture/water_cooler.js';
import { createVendingMachine } from './furniture/vending_machine.js';
import { createArcade } from './furniture/arcade.js';
import { createBigTree, createTrashCan } from './furniture/tree.js';
import { createStandingDesk } from './furniture/standing_desk.js';
import { createPhoneBooth } from './furniture/phone_booth.js';
import { createPingPong } from './furniture/ping_pong.js';
import { initWorkerGeometries, createWorker } from './furniture/worker.js';
import { officeLayout } from './layout.js';
import { isWalkable, findPath, isSameZone } from './utils/pathfinding.js';
import { gridToWorld, worldToGrid } from './utils/grid.js';
import { generateIdentity } from './utils/names.js';

const WORLD_DEPTH_UNITS = officeLayout.length;
const WORLD_WIDTH_UNITS = officeLayout[0].length;

// --- Estado Global ---
const workers = [];
const officeTasks = [];
let nextTaskId = 0;
const deskSpots = [];
const loungeSpots = [];
const cafeSpots = [];
const meetingSpots = [];
const bathroomSpotsM = [];
const bathroomSpotsF = [];
let workerIdCounter = 0;
let stuckCheckTimer = STUCK_CHECK_INTERVAL;
let simulationTime = 8.0; // Começa às 8:00 (início do expediente)
let activeEvent = null;
let eventTimer = 0;

// --- Economy State ---
let companyFunds = 10000;
let companyLevel = 1;
let totalRevenue = 0;
let dailyCost = 0;
let tasksCompleted = 0;
let gameSpeed = 1;
let companyLevelThresholds = [0, 5000, 15000, 30000, 60000];
let companyLevelNames = ["", "Garagem", "Startup", "Agência", "Corporação", "Império"];

const MEETING_CHANCE = 0.12;
const MEETING_DURATION_MIN = 7000;
const MEETING_DURATION_MAX = 14000;
const WANDER_CHANCE = 0.08;
const WANDER_RADIUS = 4;

// --- Three.js Setup ---
const canvas = document.getElementById('webglCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth * 0.95, window.innerHeight * 0.85);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// Câmera
const camera = new THREE.PerspectiveCamera(45, (window.innerWidth * 0.95) / (window.innerHeight * 0.85), 0.1, 1000);
camera.position.set(WORLD_WIDTH_UNITS * GRID_UNIT / 2, 40, WORLD_DEPTH_UNITS * GRID_UNIT + 20);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(WORLD_WIDTH_UNITS * GRID_UNIT / 2, 0, WORLD_DEPTH_UNITS * GRID_UNIT / 2);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Não deixa a câmera passar pra baixo do chão

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
dirLight.position.set(10, 40, -10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
const d = 30;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xaabbff, 0.3);
fillLight.position.set(-10, 20, 10);
scene.add(fillLight);

window.addEventListener('resize', () => {
    const width = window.innerWidth * 0.95;
    const height = window.innerHeight * 0.85;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// --- Raycaster para Tooltip (Identidade NPC) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltipEl = document.getElementById('npcTooltip');
const ttName = document.getElementById('ttName');
const ttRole = document.getElementById('ttRole');
const ttMood = document.getElementById('ttMood');
const ttState = document.getElementById('ttState');

window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (tooltipEl) {
        tooltipEl.style.left = `${event.clientX}px`;
        tooltipEl.style.top = `${event.clientY - 10}px`;
    }

    if (mouse.x >= -1 && mouse.x <= 1 && mouse.y >= -1 && mouse.y <= 1) {
        raycaster.setFromCamera(mouse, camera);
        const workerMeshes = workers.map(w => w.meshGroup).filter(g => g.visible);
        const intersects = raycaster.intersectObjects(workerMeshes, true);
        
        if (intersects.length > 0) {
            let rootGroup = intersects[0].object;
            while (rootGroup.parent && rootGroup.userData.workerId === undefined) {
                rootGroup = rootGroup.parent;
            }
            
            if (rootGroup.userData.workerId !== undefined) {
                const worker = workers.find(w => w.id === rootGroup.userData.workerId);
                if (worker && worker.identity) {
                    tooltipEl.classList.remove('hidden');
                    ttName.textContent = worker.identity.name;
                    ttRole.textContent = worker.identity.role;
                    ttRole.style.backgroundColor = worker.identity.roleColor;
                    
                    let emoji = '😐';
                    if (worker.mood > 0.7) emoji = '😄';
                    else if (worker.mood > 0.4) emoji = '🙂';
                    else if (worker.mood > 0.2) emoji = '😩';
                    else emoji = '🤬';
                    ttMood.textContent = emoji;
                    
                    let st = 'Trabalhando';
                    if (worker.state === 'idle') st = 'Ocioso';
                    if (worker.state === 'on_break' || worker.state === 'moving_to_break') st = 'Pausa para café';
                    if (worker.state === 'in_meeting' || worker.state === 'moving_to_meeting') st = 'Em Reunião';
                    if (worker.state === 'using_bathroom' || worker.state === 'moving_to_bathroom') st = 'Banheiro';
                    if (worker.state === 'chatting') st = 'Conversando';
                    if (worker.state === 'moving_to_desk' || worker.state === 'moving_to_desk_for_work') st = 'Indo trabalhar';
                    if (worker.state === 'moving_to_wander') st = 'Andando à toa';
                    ttState.textContent = st;
                    return;
                }
            }
        }
    }
    if (tooltipEl) tooltipEl.classList.add('hidden');
});

// --- Corrigir NPCs Presos ---
function correctStuckWorkers() {
    workers.forEach(worker => {
        if (!isWalkable(worker.currentGrid[0], worker.currentGrid[1])) {
            console.warn(`Worker ${worker.id} stuck at non-walkable grid ${worker.currentGrid}. Attempting correction.`);
            let foundWalkable = false;
            const neighbors = [
                { dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 },
                { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }, { dx: 1, dz: 1 }
            ];
            for (const n of neighbors) {
                const checkX = worker.currentGrid[0] + n.dx;
                const checkZ = worker.currentGrid[1] + n.dz;
                if (isWalkable(checkX, checkZ)) {
                    const [newWorldX, , newWorldZ] = gridToWorld(checkX, checkZ);
                    worker.pos = [newWorldX, 0, newWorldZ];
                    worker.currentGrid = [checkX, checkZ];
                    worker.targetPos = [...worker.pos];
                    worker.currentPath = null;
                    worker.pathIndex = 0;
                    worker.state = 'idle';
                    worker.stateTimer = 500 + Math.random() * 1000;
                    worker.isInsideBathroom = false;
                    releaseReservedSpot(worker, 'targetBreakSpot');
                    releaseReservedSpot(worker, 'targetMeetingSpot');
                    foundWalkable = true;
                    break;
                }
            }
            if (!foundWalkable) {
                if (worker.deskGrid) {
                    const deskGridX = worker.deskGrid[0];
                    const deskGridZ = worker.deskGrid[1];
                    if (isWalkable(deskGridX, deskGridZ)) {
                        const [deskWorldX, , deskWorldZ] = gridToWorld(deskGridX, deskGridZ);
                        worker.pos = [deskWorldX, 0, deskWorldZ];
                        worker.currentGrid = [deskGridX, deskGridZ];
                        worker.targetPos = [...worker.pos];
                        worker.currentPath = null;
                        worker.pathIndex = 0;
                        worker.state = 'idle';
                        worker.stateTimer = 1000;
                        worker.isInsideBathroom = false;
                        releaseReservedSpot(worker, 'targetBreakSpot');
                        releaseReservedSpot(worker, 'targetMeetingSpot');
                    }
                }
            }
        }
    });
}

function createSpeechBubble(parentGroup) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 1.5, 1.5);
    sprite.position.y = 2.8; 
    sprite.visible = false;
    
    sprite.userData = { canvas, ctx, tex, timer: 0 };
    parentGroup.add(sprite);
    return sprite;
}

function showBubble(worker, emoji, duration) {
    if(!worker.bubbleSprite) return;
    const { canvas, ctx, tex } = worker.bubbleSprite.userData;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(64, 50, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(64, 90);
    ctx.lineTo(50, 110);
    ctx.lineTo(75, 80);
    ctx.fill();
    
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(emoji, 64, 54);
    
    tex.needsUpdate = true;
    worker.bubbleSprite.visible = true;
    worker.bubbleSprite.userData.timer = duration;
}

function generateTasks(count) {
    for (let i = 0; i < count; i++) {
        if (officeTasks.length >= MAX_TASKS) break;
        officeTasks.push({
            id: nextTaskId++,
            duration: TASK_DURATION_MIN + Math.random() * (TASK_DURATION_MAX - TASK_DURATION_MIN),
            assignedWorkerId: null,
            status: 'pending'
        });
    }
}

function releaseReservedSpot(worker, key) {
    const spot = worker[key];
    if (spot?.reservedBy === worker.id) spot.reservedBy = null;
    worker[key] = null;
}

function pickReservedSpot(worker, pool) {
    const available = pool.filter(spot => spot.reservedBy === null || spot.reservedBy === worker.id);
    if (available.length === 0) return null;

    available.sort((a, b) => {
        const da = Math.abs(a.gridX - worker.currentGrid[0]) + Math.abs(a.gridZ - worker.currentGrid[1]);
        const db = Math.abs(b.gridX - worker.currentGrid[0]) + Math.abs(b.gridZ - worker.currentGrid[1]);
        return da - db;
    });

    const shortlist = available.slice(0, Math.min(5, available.length));
    const spot = shortlist[Math.floor(Math.random() * shortlist.length)];
    spot.reservedBy = worker.id;
    return spot;
}

function findWanderDestination(worker) {
    const candidates = [];
    for (let dz = -WANDER_RADIUS; dz <= WANDER_RADIUS; dz++) {
        for (let dx = -WANDER_RADIUS; dx <= WANDER_RADIUS; dx++) {
            const gridX = worker.currentGrid[0] + dx;
            const gridZ = worker.currentGrid[1] + dz;
            const distance = Math.abs(dx) + Math.abs(dz);
            if (distance >= 2 && distance <= WANDER_RADIUS && isWalkable(gridX, gridZ)) {
                candidates.push([gridX, gridZ]);
            }
        }
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function addMeetingSeatSpot(tableX, tableZ, gridX, gridZ, seatOffsetX, seatOffsetZ, rotationY) {
    if (!isWalkable(gridX, gridZ) || meetingSpots.some(p => p.gridX === gridX && p.gridZ === gridZ)) return;
    meetingSpots.push({
        gridX,
        gridZ,
        type: 9,
        targetGridX: tableX,
        targetGridZ: tableZ,
        seatOffsetX,
        seatOffsetZ,
        rotationY,
        reservedBy: null
    });
}

// --- Funções de Construção (Three.js) ---
function addBox(w, h, d, x, y, z, color, parent = scene) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function initializeWorld() {
    deskSpots.length = 0; loungeSpots.length = 0; cafeSpots.length = 0; meetingSpots.length = 0;
    bathroomSpotsM.length = 0; bathroomSpotsF.length = 0;
    workerIdCounter = 0;

    // Chão
    const floorGeo = new THREE.PlaneGeometry(WORLD_WIDTH_UNITS * GRID_UNIT, WORLD_DEPTH_UNITS * GRID_UNIT);
    const floorMat = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.9, metalness: 0.05 });
    
    // Textura quadriculada procedural no chão
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 512; ctx.canvas.height = 512;
    ctx.fillStyle = '#d9d9d3'; ctx.fillRect(0,0,512,512);
    ctx.fillStyle = '#c5c5c0';
    for(let i=0; i<8; i++) {
        for(let j=0; j<8; j++) {
            if((i+j)%2 === 0) ctx.fillRect(i*64, j*64, 64, 64);
        }
    }
    const tex = new THREE.CanvasTexture(ctx.canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(WORLD_WIDTH_UNITS/2, WORLD_DEPTH_UNITS/2);
    floorMat.map = tex;

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(WORLD_WIDTH_UNITS * GRID_UNIT / 2, 0, WORLD_DEPTH_UNITS * GRID_UNIT / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // 1. Processar Layout para Itens Visuais
    for (let z = 0; z < WORLD_DEPTH_UNITS; z++) {
        for (let x = 0; x < WORLD_WIDTH_UNITS; x++) {
            const tileType = officeLayout[z]?.[x];
            if (tileType === undefined || tileType === 1 || tileType === 10 || tileType === 0 || tileType === 11 || tileType === 12) continue;
            const [worldX, , worldZ] = gridToWorld(x, z);

            switch(tileType) {
                case 2: { // Mesa
                    const deskGroup = createDesk({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    deskGroup.position.set(worldX, 0, worldZ);
                    scene.add(deskGroup);
                    break;
                }
                case 3: { // Maquina Cafe
                    const { coffeeGroup, coffeeDepth } = createCoffeeMachine({ gridUnit: GRID_UNIT, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { coffeeGroup.rotation.y = Math.PI; offsetZ = wallDist - coffeeDepth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { coffeeGroup.rotation.y = 0; offsetZ = -(wallDist - coffeeDepth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { coffeeGroup.rotation.y = -Math.PI/2; offsetX = wallDist - coffeeDepth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { coffeeGroup.rotation.y = Math.PI/2; offsetX = -(wallDist - coffeeDepth/2); }
                    
                    coffeeGroup.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(coffeeGroup);
                    break;
                }
                case 4: { // Biblioteca
                    const { bsGroup, sd } = createBookshelf({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { bsGroup.rotation.y = Math.PI; offsetZ = wallDist - sd/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { bsGroup.rotation.y = 0; offsetZ = -(wallDist - sd/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { bsGroup.rotation.y = -Math.PI/2; offsetX = wallDist - sd/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { bsGroup.rotation.y = Math.PI/2; offsetX = -(wallDist - sd/2); }
                    
                    bsGroup.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(bsGroup);
                    break;
                }
                case 5: { // Sofa
                    const sofaGroup = createSofa({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { sofaGroup.rotation.y = Math.PI; offsetZ = wallDist - GRID_UNIT*0.25; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { sofaGroup.rotation.y = 0; offsetZ = -(wallDist - GRID_UNIT*0.25); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { sofaGroup.rotation.y = -Math.PI/2; offsetX = wallDist - GRID_UNIT*0.25; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { sofaGroup.rotation.y = Math.PI/2; offsetX = -(wallDist - GRID_UNIT*0.25); }
                    
                    sofaGroup.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(sofaGroup);
                    break;
                }
                case 6: { // Planta
                    const plantGroup = createPlant({ gridUnit: GRID_UNIT, colors: COLORS });
                    
                    plantGroup.position.set(worldX, 0, worldZ);
                    plantGroup.rotation.y = Math.random() * Math.PI * 2;
                    scene.add(plantGroup);
                    break;
                }
                case 7: { // Pufe
                    const beanGroup = createBeanbag({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    beanGroup.position.set(worldX, 0, worldZ);
                    scene.add(beanGroup);
                    break;
                }
                case 8: { // Balcao Cafe
                    const { counterGroup, cafeDepth } = createCafeCounter({ gridUnit: GRID_UNIT, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { counterGroup.rotation.y = Math.PI; offsetZ = wallDist - cafeDepth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { counterGroup.rotation.y = 0; offsetZ = -(wallDist - cafeDepth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { counterGroup.rotation.y = -Math.PI/2; offsetX = wallDist - cafeDepth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { counterGroup.rotation.y = Math.PI/2; offsetX = -(wallDist - cafeDepth/2); }
                    
                    counterGroup.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(counterGroup);
                    break;
                }
                case 9: { // Mesa de reuniao
                    const meetingGroup = createMeetingTable({ gridUnit: GRID_UNIT, colors: COLORS, addBox });

                    meetingGroup.position.set(worldX, 0, worldZ);
                    scene.add(meetingGroup);
                    break;
                }
                case 'T': { // TV
                    const { tvGroup, tvDepth } = createTV({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { tvGroup.rotation.y = Math.PI; offsetZ = wallDist - tvDepth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { tvGroup.rotation.y = 0; offsetZ = -(wallDist - tvDepth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { tvGroup.rotation.y = -Math.PI/2; offsetX = wallDist - tvDepth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { tvGroup.rotation.y = Math.PI/2; offsetX = -(wallDist - tvDepth/2); }
                    
                    tvGroup.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(tvGroup);
                    break;
                }
                case 13: { // Whiteboard
                    const { boardGroup, bDepth } = createWhiteboard({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { boardGroup.rotation.y = Math.PI; offsetZ = wallDist - bDepth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { boardGroup.rotation.y = 0; offsetZ = -(wallDist - bDepth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { boardGroup.rotation.y = -Math.PI/2; offsetX = wallDist - bDepth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { boardGroup.rotation.y = Math.PI/2; offsetX = -(wallDist - bDepth/2); }
                    
                    boardGroup.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(boardGroup);
                    break;
                }
                case 14: { // Printer
                    const { group, depth } = createPrinter({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { group.rotation.y = Math.PI; offsetZ = wallDist - depth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { group.rotation.y = 0; offsetZ = -(wallDist - depth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { group.rotation.y = -Math.PI/2; offsetX = wallDist - depth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { group.rotation.y = Math.PI/2; offsetX = -(wallDist - depth/2); }
                    
                    group.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(group);
                    break;
                }
                case 15: { // Water Cooler
                    const { group, depth } = createWaterCooler({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { group.rotation.y = Math.PI; offsetZ = wallDist - depth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { group.rotation.y = 0; offsetZ = -(wallDist - depth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { group.rotation.y = -Math.PI/2; offsetX = wallDist - depth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { group.rotation.y = Math.PI/2; offsetX = -(wallDist - depth/2); }
                    
                    group.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(group);
                    break;
                }
                case 16: { // Vending Machine
                    const { group, depth } = createVendingMachine({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { group.rotation.y = Math.PI; offsetZ = wallDist - depth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { group.rotation.y = 0; offsetZ = -(wallDist - depth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { group.rotation.y = -Math.PI/2; offsetX = wallDist - depth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { group.rotation.y = Math.PI/2; offsetX = -(wallDist - depth/2); }
                    
                    group.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(group);
                    break;
                }
                case 17: { // Arcade Machine
                    const { group, depth } = createArcade({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { group.rotation.y = Math.PI; offsetZ = wallDist - depth/2; }
                    else if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { group.rotation.y = 0; offsetZ = -(wallDist - depth/2); }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { group.rotation.y = -Math.PI/2; offsetX = wallDist - depth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { group.rotation.y = Math.PI/2; offsetX = -(wallDist - depth/2); }
                    
                    group.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(group);
                    break;
                }
                case 18: { // Big Tree
                    const treeGroup = createBigTree({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    treeGroup.position.set(worldX, 0, worldZ);
                    treeGroup.rotation.y = Math.random() * Math.PI * 2;
                    scene.add(treeGroup);
                    break;
                }
                case 19: { // Trash Can
                    const trashGroup = createTrashCan({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    trashGroup.position.set(worldX, 0, worldZ);
                    scene.add(trashGroup);
                    break;
                }
                case 20: { // Standing Desk
                    const deskGroup = createStandingDesk({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    deskGroup.position.set(worldX, 0, worldZ);
                    scene.add(deskGroup);
                    break;
                }
                case 22: { // Phone Booth
                    const { group, depth } = createPhoneBooth({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    
                    let offsetZ = 0, offsetX = 0;
                    const wallDist = GRID_UNIT - WALL_THICKNESS/2;
                    
                    if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) { group.rotation.y = 0; offsetZ = -(wallDist - depth/2); }
                    else if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) { group.rotation.y = Math.PI; offsetZ = wallDist - depth/2; }
                    else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) { group.rotation.y = -Math.PI/2; offsetX = wallDist - depth/2; }
                    else if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) { group.rotation.y = Math.PI/2; offsetX = -(wallDist - depth/2); }
                    
                    // Secondary snapping to lean against the side wall as well
                    if (group.rotation.y === 0 || group.rotation.y === Math.PI) {
                        if (officeLayout[z]?.[x-1] === 10 || officeLayout[z]?.[x-1] === 1) offsetX = -(wallDist - depth/2);
                        else if (officeLayout[z]?.[x+1] === 10 || officeLayout[z]?.[x+1] === 1) offsetX = wallDist - depth/2;
                    } else {
                        if (officeLayout[z-1]?.[x] === 10 || officeLayout[z-1]?.[x] === 1) offsetZ = -(wallDist - depth/2);
                        else if (officeLayout[z+1]?.[x] === 10 || officeLayout[z+1]?.[x] === 1) offsetZ = wallDist - depth/2;
                    }
                    
                    group.position.set(worldX + offsetX, 0, worldZ + offsetZ);
                    scene.add(group);
                    break;
                }
                case 23: { // Ping Pong
                    const group = createPingPong({ gridUnit: GRID_UNIT, colors: COLORS, addBox });
                    group.position.set(worldX, 0, worldZ);
                    scene.add(group);
                    break;
                }
            }
        }
    }

    // 2. Pontos de Interesse (Mesma lógica)
    for (let z = 0; z < WORLD_DEPTH_UNITS; z++) {
        for (let x = 0; x < WORLD_WIDTH_UNITS; x++) {
            const tileType = officeLayout[z]?.[x];
            const [worldX, , worldZ] = gridToWorld(x, z);

            if (tileType === 2 || tileType === 20) {
                const targetGridZ = z + 1;
                if (isWalkable(x, targetGridZ)) {
                    const [targetWorldX, , targetWorldZ] = gridToWorld(x, targetGridZ);
                    deskSpots.push({ pos: [targetWorldX, 0, targetWorldZ], gridX: x, gridZ: targetGridZ, deskGridActual: [x, z], workerId: null, isStanding: tileType === 20 });
                }
            } else if (tileType === 5 || tileType === 7 || tileType === 'T' || tileType === 4 || tileType === 14 || tileType === 15 || tileType === 16 || tileType === 17 || tileType === 22) {
                const checkNeighbors = [{dx:0,dz:1},{dx:0,dz:-1},{dx:1,dz:0},{dx:-1,dz:0}];
                for (const n of checkNeighbors) {
                    const nx = x + n.dx, nz = z + n.dz;
                    if (isWalkable(nx, nz) && !loungeSpots.some(p => p.gridX === nx && p.gridZ === nz)) loungeSpots.push({gridX: nx, gridZ: nz, type: tileType, targetGridX: x, targetGridZ: z, reservedBy: null});
                }
            } else if (tileType === 23) {
                if (isWalkable(x - 1, z) && !loungeSpots.some(p => p.gridX === x - 1 && p.gridZ === z)) loungeSpots.push({gridX: x - 1, gridZ: z, type: 23, targetGridX: x, targetGridZ: z, reservedBy: null, side: -1});
                if (isWalkable(x + 1, z) && !loungeSpots.some(p => p.gridX === x + 1 && p.gridZ === z)) loungeSpots.push({gridX: x + 1, gridZ: z, type: 23, targetGridX: x, targetGridZ: z, reservedBy: null, side: 1});
            } else if (tileType === 3 || tileType === 8) {
                const checkNeighbors = [{dx:0,dz:1},{dx:0,dz:-1},{dx:1,dz:0},{dx:-1,dz:0}];
                for (const n of checkNeighbors) {
                    const nx = x + n.dx, nz = z + n.dz;
                    if (isWalkable(nx, nz) && !cafeSpots.some(p => p.gridX === nx && p.gridZ === nz)) cafeSpots.push({gridX: nx, gridZ: nz, type: tileType, targetGridX: x, targetGridZ: z, reservedBy: null});
                }
            } else if (tileType === 9) {
                addMeetingSeatSpot(x, z, x - 1, z - 1, -GRID_UNIT*0.65, -GRID_UNIT*0.80, 0);
                addMeetingSeatSpot(x, z, x, z - 1, 0, -GRID_UNIT*0.80, 0);
                addMeetingSeatSpot(x, z, x + 1, z - 1, GRID_UNIT*0.65, -GRID_UNIT*0.80, 0);
                addMeetingSeatSpot(x, z, x - 1, z + 1, -GRID_UNIT*0.65, GRID_UNIT*0.80, Math.PI);
                addMeetingSeatSpot(x, z, x, z + 1, 0, GRID_UNIT*0.80, Math.PI);
                addMeetingSeatSpot(x, z, x + 1, z + 1, GRID_UNIT*0.65, GRID_UNIT*0.80, Math.PI);
            } else if (tileType === 11) {
                bathroomSpotsM.push({gridX: x, gridZ: z});
            } else if (tileType === 12) {
                bathroomSpotsF.push({gridX: x, gridZ: z});
            }
        }
    }
    const uniqueLounge = Array.from(new Map(loungeSpots.map(item => [`${item.gridX},${item.gridZ}`, item])).values());
    const uniqueCafe = Array.from(new Map(cafeSpots.map(item => [`${item.gridX},${item.gridZ}`, item])).values());
    loungeSpots.length = 0; loungeSpots.push(...uniqueLounge);
    cafeSpots.length = 0; cafeSpots.push(...uniqueCafe);

    // 3. Processar Paredes e Portas
    // 3. Processar Paredes e Portas (Centralizadas)
    const isWallTile = (tx, tz) => {
        const t = officeLayout[tz]?.[tx];
        return t === 1 || t === 10 || t === 11 || t === 12;
    };

    for (let z = 0; z < WORLD_DEPTH_UNITS; z++) {
        for (let x = 0; x < WORLD_WIDTH_UNITS; x++) {
            const tile = officeLayout[z]?.[x];
            if (!isWallTile(x, z)) continue;

            const isExt = tile === 1 || tile === 11 || tile === 12;
            const wh = (isExt ? EXT_WALL_HEIGHT_FACTOR : WALL_HEIGHT_FACTOR) * GRID_UNIT;
            const wc = isExt ? COLORS.wall : COLORS.wall_internal;
            const dh = DOOR_HEIGHT_FACTOR * GRID_UNIT;
            const cx = x * GRID_UNIT + GRID_UNIT / 2;
            const cz = z * GRID_UNIT + GRID_UNIT / 2;

            const hasLeft = isWallTile(x - 1, z);
            const hasRight = isWallTile(x + 1, z);
            const hasTop = isWallTile(x, z - 1);
            const hasBottom = isWallTile(x, z + 1);

            const isHorizontal = hasLeft || hasRight;
            const isVertical = hasTop || hasBottom;

            if (tile === 11 || tile === 12) {
                const doorColor = tile === 11 ? COLORS.door_m : COLORS.door_f;
                if ((hasTop || hasBottom) && !hasLeft && !hasRight) {
                    addBox(WALL_THICKNESS, dh, GRID_UNIT, cx, dh/2, cz, doorColor);
                    addBox(WALL_THICKNESS, wh - dh, GRID_UNIT, cx, dh + (wh - dh)/2, cz, wc);
                } else {
                    addBox(GRID_UNIT, dh, WALL_THICKNESS, cx, dh/2, cz, doorColor);
                    addBox(GRID_UNIT, wh - dh, WALL_THICKNESS, cx, dh + (wh - dh)/2, cz, wc);
                }
            } else {
                const isLoungeWindow = (z === 0 && x >= 15 && x <= 21);
                
                if (isLoungeWindow) {
                    const winH = GRID_UNIT * 0.8;
                    const botH = GRID_UNIT * 0.4;
                    const topH = wh - (botH + winH);
                    addBox(GRID_UNIT, botH, WALL_THICKNESS, cx, botH/2, cz, wc);
                    addBox(GRID_UNIT, topH, WALL_THICKNESS, cx, botH + winH + topH/2, cz, wc);
                    const frameW = 0.1;
                    addBox(frameW, winH, Math.max(WALL_THICKNESS, 0.15), cx - GRID_UNIT/2 + frameW/2, botH + winH/2, cz, 0x444444);
                    addBox(frameW, winH, Math.max(WALL_THICKNESS, 0.15), cx + GRID_UNIT/2 - frameW/2, botH + winH/2, cz, 0x444444);
                    const glass = addBox(GRID_UNIT - frameW*2, winH, 0.05, cx, botH + winH/2, cz, 0x88ccff);
                    glass.material.transparent = true;
                    glass.material.opacity = 0.5;
                } else {
                    const hw = GRID_UNIT / 2;
                    const ht = WALL_THICKNESS / 2;
                    const segLen = hw - ht;
                    
                    // Pilar central
                    addBox(WALL_THICKNESS, wh, WALL_THICKNESS, cx, wh/2, cz, wc);
                    
                    if (segLen > 0) {
                        if (hasLeft) {
                            addBox(segLen, wh, WALL_THICKNESS, cx - hw + segLen/2, wh/2, cz, wc);
                        }
                        if (hasRight) {
                            addBox(segLen, wh, WALL_THICKNESS, cx + ht + segLen/2, wh/2, cz, wc);
                        }
                        if (hasTop) {
                            addBox(WALL_THICKNESS, wh, segLen, cx, wh/2, cz - hw + segLen/2, wc);
                        }
                        if (hasBottom) {
                            addBox(WALL_THICKNESS, wh, segLen, cx, wh/2, cz + ht + segLen/2, wc);
                        }
                    }
                }
            }
        }
    }

    // 4. Criar Workers com Three.js Meshes
    const availableDeskSpots = [...deskSpots];
    
    // Geometrias reutilizáveis para os NPCs
    initWorkerGeometries(COLORS);

    for (let i = 0; i < NUM_WORKERS; i++) {
        if (availableDeskSpots.length === 0) break;
        const deskIndex = Math.floor(Math.random() * availableDeskSpots.length);
        const assignedDeskSpot = availableDeskSpots.splice(deskIndex, 1)[0];
        assignedDeskSpot.workerId = workerIdCounter;
        const startPos = assignedDeskSpot.pos;
        const startGrid = [assignedDeskSpot.gridX, assignedDeskSpot.gridZ];

        const shirtColor = COLORS.worker_shirt_colors[i % COLORS.worker_shirt_colors.length];
        const { workerGroup, animParts } = createWorker({ startPos, shirtColor });
        workerGroup.userData.workerId = workerIdCounter;
        scene.add(workerGroup);

        const identity = generateIdentity();
        const [doorWorldX, , doorWorldZ] = gridToWorld(12, 14);
        workerGroup.visible = simulationTime >= 8 && simulationTime < 18;

        workers.push({
            id: workerIdCounter++,
            identity: identity,
            pos: [doorWorldX + (Math.random() - 0.5), 0, doorWorldZ + (Math.random() - 0.5)],
            targetPos: [doorWorldX, 0, doorWorldZ],
            currentGrid: [12, 14],
            targetGrid: [...startGrid],
            deskGrid: assignedDeskSpot.deskGridActual,
            deskSpotGrid: startGrid,
            isStandingDesk: assignedDeskSpot.isStanding || false,
            speed: 0.8 + Math.random() * 0.4,
            state: simulationTime >= 8 && simulationTime < 18 ? 'moving_to_desk' : 'left_office',
            stateTimer: 1000 + Math.random() * 5000,
            needs: { bathroom: Math.random()*0.5, break: Math.random()*0.5 },
            mood: 0.5 + Math.random() * 0.5,
            chatTarget: null,
            timeSinceBreak: Math.random() * WORK_TIME_BEFORE_BREAK_CHANCE,
            timeSinceBathroom: Math.random() * WORK_TIME_BEFORE_BATHROOM_CHANCE,
            currentTask: null,
            taskProgress: 0,
            currentPath: null,
            pathIndex: 0,
            isInsideBathroom: false,
            targetBreakSpot: null,
            targetMeetingSpot: null,
            meshGroup: workerGroup,
            animParts: animParts,
            bubbleSprite: createSpeechBubble(workerGroup)
        });

        // Se já é horário de trabalho, calcular caminho inicial agora
        if (simulationTime >= 8 && simulationTime < 18) {
            const lastWorker = workers[workers.length - 1];
            const initPath = findPath(12, 14, startGrid[0], startGrid[1]);
            if (initPath && initPath.length > 1) {
                lastWorker.currentPath = initPath;
                lastWorker.pathIndex = 1;
                const [tx, , tz] = gridToWorld(initPath[1][0], initPath[1][1]);
                lastWorker.targetPos = [tx, 0, tz];
            } else {
                lastWorker.state = 'idle';
                lastWorker.stateTimer = 1000;
            }
        }
    }

    generateTasks(MAX_TASKS / 2);
}

function assignTask(worker) {
    if (worker.currentTask) return true;
    const idx = officeTasks.findIndex(t => t.status === 'pending');
    if (idx !== -1) {
        const task = officeTasks[idx];
        task.assignedWorkerId = worker.id;
        task.status = 'assigned';
        worker.currentTask = task;
        worker.taskProgress = task.duration;
        return true;
    }
    return false;
}

// --- Lógica de Atualização ---
function updateWorkers(deltaTimeSeconds) {
    const dtMs = deltaTimeSeconds * 1000;
    // Cache de workers visíveis e ativos para evitar filtragem O(n²) por worker
    const activeWorkers = workers.filter(w => w.meshGroup.visible && !w.isInsideBathroom);
    if (officeTasks.filter(t => t.status === 'pending').length < workers.length / 4 &&
        officeTasks.filter(t => t.status !== 'completed').length < MAX_TASKS * 0.8) {
        generateTasks(workers.length / 2);
    }

    if (activeEvent) {
        eventTimer -= dtMs;
        if (eventTimer <= 0) {
            activeEvent = null;
            const alertEl = document.getElementById('eventAlert');
            if (alertEl) alertEl.classList.add('hidden');
        }
    } else {
        if (Math.random() < 0.0003 && simulationTime >= 9 && simulationTime < 17) {
            activeEvent = Math.random() < 0.5 ? 'pizza' : 'fire_drill';
            eventTimer = 15000;
            const alertEl = document.getElementById('eventAlert');
            if (alertEl) {
                alertEl.classList.remove('hidden');
                document.getElementById('eventIcon').textContent = activeEvent === 'pizza' ? '🍕' : '🚨';
                document.getElementById('eventText').textContent = activeEvent === 'pizza' ? 'Pizza no escritório!' : 'Treinamento de Incêndio!';
                alertEl.style.background = activeEvent === 'pizza' ? 'rgba(255, 152, 0, 0.9)' : 'rgba(244, 67, 54, 0.9)';
                alertEl.style.border = activeEvent === 'pizza' ? '2px solid #ff9800' : '2px solid #ff5252';
            }
        }
    }

    const isWorkingHours = simulationTime >= 8 && simulationTime < 18;
    const isLunchTime = simulationTime >= 12 && simulationTime < 13;

    workers.forEach(worker => {
        // Handle Overrides
        if (activeEvent === 'fire_drill') {
            if (worker.state !== 'moving_to_exit' && worker.state !== 'waiting_outside') {
                worker.state = 'moving_to_exit';
                const pth = findPath(worker.currentGrid[0], worker.currentGrid[1], 12, 14);
                if (pth && pth.length > 1) {
                    worker.currentPath = pth; worker.pathIndex = 1;
                    const [tx, , tz] = gridToWorld(pth[1][0], pth[1][1]);
                    worker.targetPos = [tx, 0, tz];
                }
                releaseReservedSpot(worker, 'targetBreakSpot');
                releaseReservedSpot(worker, 'targetMeetingSpot');
                if (worker.currentTask) { worker.currentTask.status = 'pending'; worker.currentTask.assignedWorkerId = null; worker.currentTask = null; }
            }
        } else if (activeEvent === 'pizza') {
            if (worker.state !== 'moving_to_break' && worker.state !== 'on_break') {
                const pool = [...loungeSpots, ...cafeSpots];
                const spot = pickReservedSpot(worker, pool);
                if (spot) {
                    worker.targetBreakSpot = spot;
                    worker.state = 'moving_to_break';
                    const pth = findPath(worker.currentGrid[0], worker.currentGrid[1], spot.gridX, spot.gridZ);
                    if (pth && pth.length > 1) {
                        worker.currentPath = pth; worker.pathIndex = 1;
                        const [tx, , tz] = gridToWorld(pth[1][0], pth[1][1]);
                        worker.targetPos = [tx, 0, tz];
                    }
                    if (worker.currentTask) { worker.currentTask.status = 'pending'; worker.currentTask.assignedWorkerId = null; worker.currentTask = null; }
                }
            }
        } else {
            if (!isWorkingHours) {
                if (worker.state !== 'moving_to_exit' && worker.state !== 'left_office') {
                    worker.state = 'moving_to_exit';
                    const pth = findPath(worker.currentGrid[0], worker.currentGrid[1], 12, 14);
                    if (pth && pth.length > 1) {
                        worker.currentPath = pth; worker.pathIndex = 1;
                        const [tx, , tz] = gridToWorld(pth[1][0], pth[1][1]);
                        worker.targetPos = [tx, 0, tz];
                    } else {
                        worker.state = 'left_office';
                        worker.meshGroup.visible = false;
                    }
                    releaseReservedSpot(worker, 'targetBreakSpot');
                    releaseReservedSpot(worker, 'targetMeetingSpot');
                    if (worker.currentTask) { worker.currentTask.status = 'pending'; worker.currentTask.assignedWorkerId = null; worker.currentTask = null; }
                }
            } else if (isLunchTime) {
                if (worker.state !== 'moving_to_break' && worker.state !== 'on_break' && worker.state !== 'using_bathroom' && !worker.state.startsWith('moving_to_bathroom') && worker.state !== 'left_office') {
                    const pool = [...loungeSpots, ...cafeSpots];
                    const spot = pickReservedSpot(worker, pool);
                    if (spot) {
                        worker.targetBreakSpot = spot;
                        worker.state = 'moving_to_break';
                        const pth = findPath(worker.currentGrid[0], worker.currentGrid[1], spot.gridX, spot.gridZ);
                        if (pth && pth.length > 1) {
                            worker.currentPath = pth; worker.pathIndex = 1;
                            const [tx, , tz] = gridToWorld(pth[1][0], pth[1][1]);
                            worker.targetPos = [tx, 0, tz];
                        }
                        if (worker.currentTask) { worker.currentTask.status = 'pending'; worker.currentTask.assignedWorkerId = null; worker.currentTask = null; }
                    }
                }
            } else if (worker.state === 'left_office' || worker.state === 'waiting_outside') {
                worker.meshGroup.visible = true;
                if (worker.state === 'left_office') {
                    const [dx, , dz] = gridToWorld(12, 14);
                    worker.pos = [dx + (Math.random() - 0.5), 0, dz + (Math.random() - 0.5)];
                    worker.currentGrid = [12, 14];
                }
                worker.state = 'moving_to_desk';
                const pth = findPath(worker.currentGrid[0], worker.currentGrid[1], worker.deskSpotGrid[0], worker.deskSpotGrid[1]);
                if (pth && pth.length > 1) {
                    worker.currentPath = pth; worker.pathIndex = 1;
                    const [tx, , tz] = gridToWorld(pth[1][0], pth[1][1]);
                    worker.targetPos = [tx, 0, tz];
                } else {
                    worker.state = 'idle'; worker.stateTimer = 1000;
                }
            }
        }
        
        if (worker.state === 'left_office') return;

        if (worker.bubbleSprite && worker.bubbleSprite.visible) {
            worker.bubbleSprite.userData.timer -= dtMs;
            if (worker.bubbleSprite.userData.timer <= 0) worker.bubbleSprite.visible = false;
            worker.bubbleSprite.position.y = 2.8 + Math.sin(Date.now() * 0.005) * 0.1;
        }

        if (worker.isInsideBathroom) {
            worker.stateTimer -= dtMs;
            if (worker.state === 'using_bathroom' && worker.stateTimer <= 0) {
                worker.isInsideBathroom = false;
                const destinationGrid = worker.deskSpotGrid;
                worker.state = 'moving_to_desk';
                const doorGrid = worldToGrid(worker.pos[0], worker.pos[2]);
                if (!isWalkable(doorGrid[0], doorGrid[1]) &&
                    (officeLayout[doorGrid[1]]?.[doorGrid[0]] === 11 || officeLayout[doorGrid[1]]?.[doorGrid[0]] === 12)) {
                    worker.currentGrid = [...doorGrid];
                }
                const path = findPath(worker.currentGrid[0], worker.currentGrid[1], destinationGrid[0], destinationGrid[1]);
                if (path && path.length > 1) {
                    worker.currentPath = path; worker.pathIndex = 1;
                    const [targetWorldX, , targetWorldZ] = gridToWorld(path[1][0], path[1][1]);
                    worker.targetPos = [targetWorldX, 0, targetWorldZ];
                } else {
                    worker.state = 'idle'; worker.stateTimer = 1000 + Math.random() * 1000;
                    worker.currentPath = null; worker.pathIndex = 0;
                }
            }
            return;
        }

        worker.stateTimer -= dtMs;
        worker.currentGrid = worldToGrid(worker.pos[0], worker.pos[2]);
        const isAtDeskSpot = worker.currentGrid[0] === worker.deskSpotGrid[0] && worker.currentGrid[1] === worker.deskSpotGrid[1];

        if (worker.state === 'working' || (worker.state === 'idle' && isAtDeskSpot)) {
            worker.timeSinceBreak += dtMs;
            worker.timeSinceBathroom += dtMs;
            if (worker.timeSinceBreak > WORK_TIME_BEFORE_BREAK_CHANCE)
                worker.needs.break += Math.random() * 0.00015 * dtMs * (worker.timeSinceBreak / WORK_TIME_BEFORE_BREAK_CHANCE);
            if (worker.timeSinceBathroom > WORK_TIME_BEFORE_BATHROOM_CHANCE)
                worker.needs.bathroom += Math.random() * 0.00012 * dtMs * (worker.timeSinceBathroom / WORK_TIME_BEFORE_BATHROOM_CHANCE);
            worker.needs.break = Math.min(worker.needs.break, 1.0);
            worker.needs.bathroom = Math.min(worker.needs.bathroom, 1.0);
            
            if (worker.state === 'working') {
                worker.mood = Math.max(0, worker.mood - 0.00003 * dtMs); 
            }

            if (Math.random() < 0.001) {
                if (worker.needs.bathroom > 0.8) showBubble(worker, '🚽', 3000);
                else if (worker.needs.break > 0.8) showBubble(worker, '☕', 3000);
                else if (worker.mood < 0.2) showBubble(worker, '😫', 3000);
            }
        }
        
        if (worker.state === 'on_break') {
            worker.mood = Math.min(1.0, worker.mood + 0.0001 * dtMs);
        }

        if (worker.state === 'working' && worker.currentTask) {
            const speedMultiplier = 0.5 + worker.mood;
            worker.taskProgress -= dtMs * speedMultiplier;
            worker.stateTimer = worker.taskProgress;
        }

        if (worker.state.startsWith('moving_')) {
            if (!worker.currentPath || worker.pathIndex >= worker.currentPath.length) {
                if (worker.currentPath && worker.pathIndex >= worker.currentPath.length) {
                    const finalGrid = worker.currentPath[worker.currentPath.length - 1];
                    let [finalWorldX, , finalWorldZ] = gridToWorld(finalGrid[0], finalGrid[1]);
                    
                    worker.pos[0] = finalWorldX; worker.pos[2] = finalWorldZ;
                    worker.currentGrid = [...finalGrid];
                }
                worker.currentPath = null; worker.pathIndex = 0;
                if (worker.state === 'moving_to_desk') { worker.state = 'idle'; worker.stateTimer = 500 + Math.random()*1500; }
                else if (worker.state === 'moving_to_break') { worker.state = 'on_break'; worker.stateTimer = BREAK_DURATION_MIN + Math.random()*(BREAK_DURATION_MAX-BREAK_DURATION_MIN); }
                else if (worker.state === 'moving_to_meeting') { worker.state = 'in_meeting'; worker.stateTimer = MEETING_DURATION_MIN + Math.random()*(MEETING_DURATION_MAX-MEETING_DURATION_MIN); }
                else if (worker.state === 'moving_to_wander') { worker.state = 'idle'; worker.stateTimer = 800 + Math.random()*1800; }
                else if (worker.state === 'moving_to_bathroom') { worker.isInsideBathroom = true; worker.state = 'using_bathroom'; worker.stateTimer = BATHROOM_DURATION_MIN + Math.random()*(BATHROOM_DURATION_MAX-BATHROOM_DURATION_MIN); }
                else if (worker.state === 'moving_to_desk_for_work') { worker.state = 'working'; worker.stateTimer = worker.currentTask ? worker.taskProgress : 500; }
                else if (worker.state === 'moving_to_exit') {
                    if (activeEvent === 'fire_drill') {
                        worker.state = 'waiting_outside';
                        worker.stateTimer = 2000;
                    } else {
                        worker.state = 'left_office';
                        worker.meshGroup.visible = false;
                        worker.stateTimer = 2000;
                    }
                }
                else { worker.state = 'idle'; worker.stateTimer = 500; }
            } else {
                let targetGrid = worker.currentPath[worker.pathIndex];
                let [targetWorldX, , targetWorldZ] = gridToWorld(targetGrid[0], targetGrid[1]);
                

                let dx = targetWorldX - worker.pos[0];
                let dz = targetWorldZ - worker.pos[2];
                let dist = Math.sqrt(dx * dx + dz * dz);
                
                while (dist < 0.6 && worker.pathIndex < worker.currentPath.length - 1) {
                    worker.pathIndex++;
                    targetGrid = worker.currentPath[worker.pathIndex];
                    const nextTargetWorldPos = gridToWorld(targetGrid[0], targetGrid[1]);
                    targetWorldX = nextTargetWorldPos[0];
                    targetWorldZ = nextTargetWorldPos[2];
                    
                    dx = targetWorldX - worker.pos[0];
                    dz = targetWorldZ - worker.pos[2];
                    dist = Math.sqrt(dx * dx + dz * dz);
                }

                worker.targetPos = [targetWorldX, 0, targetWorldZ];
                const moveAmount = worker.speed * GRID_UNIT * deltaTimeSeconds;

                let sepX = 0, sepZ = 0, closeCount = 0;
                for (const other of activeWorkers) {
                    if (other.id !== worker.id) {
                        const ddx = worker.pos[0] - other.pos[0];
                        const ddz = worker.pos[2] - other.pos[2];
                        const sqDist = ddx * ddx + ddz * ddz;
                        if (sqDist > 0 && sqDist < 1.0) {
                            const d = Math.sqrt(sqDist);
                            const overlap = 1.0 - d;
                            sepX += (ddx / d) * overlap;
                            sepZ += (ddz / d) * overlap;
                            closeCount++;
                        }
                    }
                }

                let dirX = dist > 0 ? dx / dist : 0;
                let dirZ = dist > 0 ? dz / dist : 0;

                if ((worker.state === 'moving_to_wander' || worker.state === 'moving_to_break') && !worker.chatTarget && Math.random() < 0.02) {
                    for (const other of workers) {
                        if (other.id !== worker.id && !other.chatTarget && !other.isInsideBathroom && 
                            (other.state === 'moving_to_wander' || other.state === 'idle' || other.state === 'moving_to_break')) {
                            const dSq = (worker.pos[0] - other.pos[0])**2 + (worker.pos[2] - other.pos[2])**2;
                            if (dSq < 6.0) {
                                worker.chatTarget = other;
                                other.chatTarget = worker;
                                worker.state = 'chatting';
                                other.state = 'chatting';
                                const chatTime = 4000 + Math.random() * 4000;
                                worker.stateTimer = chatTime;
                                other.stateTimer = chatTime;
                                worker.currentPath = null;
                                other.currentPath = null;
                                worker.meshGroup.rotation.y = Math.atan2(other.pos[0] - worker.pos[0], other.pos[2] - worker.pos[2]);
                                other.meshGroup.rotation.y = Math.atan2(worker.pos[0] - other.pos[0], worker.pos[2] - other.pos[2]);
                                showBubble(worker, ['💬','😂','🤔','👍','🗣️'][Math.floor(Math.random()*5)], chatTime);
                                showBubble(other, ['💬','😂','🤔','👍','🗣️'][Math.floor(Math.random()*5)], chatTime);
                                // currentPath is now null — stop processing movement for this worker this frame
                                return;
                            }
                        }
                    }
                }

                if (closeCount > 0) {
                    dirX += sepX * 0.7;
                    dirZ += sepZ * 0.7;
                    const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
                    if (len > 0) { dirX /= len; dirZ /= len; }
                }

                if (dist < moveAmount && worker.pathIndex === worker.currentPath.length - 1) {
                    worker.pos[0] = targetWorldX; worker.pos[2] = targetWorldZ;
                    worker.pathIndex++;
                } else {
                    let newPosX = worker.pos[0] + dirX * moveAmount;
                    let newPosZ = worker.pos[2] + dirZ * moveAmount;
                    const newGrid = worldToGrid(newPosX, newPosZ);
                    if (!isWalkable(newGrid[0], newGrid[1])) {
                        const gridXOnly = worldToGrid(newPosX, worker.pos[2]);
                        if (isWalkable(gridXOnly[0], gridXOnly[1])) newPosZ = worker.pos[2];
                        else {
                            const gridZOnly = worldToGrid(worker.pos[0], newPosZ);
                            if (isWalkable(gridZOnly[0], gridZOnly[1])) newPosX = worker.pos[0];
                            else { newPosX = worker.pos[0]; newPosZ = worker.pos[2]; }
                        }
                    }
                    worker.pos[0] = newPosX; worker.pos[2] = newPosZ;
                }
            }
        }
        else if (worker.stateTimer <= 0 || worker.state === 'idle') {
            let needsPath = false; let destinationGrid = null; let nextState = worker.state; let decidedAction = false;
            if (worker.state === 'idle') {
                if (!decidedAction && worker.needs.bathroom > NEED_THRESHOLD) {
                    const chance = worker.needs.bathroom > 0.9 ? 1.0 : (CHANCE_TO_ACT_ON_NEED + (worker.needs.bathroom - NEED_THRESHOLD) * 2);
                    if (Math.random() < chance) {
                        const [wx, wz] = worker.currentGrid;
                        // Tenta banheiro preferido, se não acessível tenta o outro
                        const preferred = Math.random() > 0.5 ? bathroomSpotsF : bathroomSpotsM;
                        const alternate = preferred === bathroomSpotsF ? bathroomSpotsM : bathroomSpotsF;
                        const allBath = [...preferred, ...alternate];
                        const reachableBath = allBath.filter(s => isSameZone(wx, wz, s.gridX, s.gridZ));
                        if (reachableBath.length > 0) {
                            const targetSpot = reachableBath[Math.floor(Math.random() * reachableBath.length)];
                            destinationGrid = [targetSpot.gridX, targetSpot.gridZ]; nextState = 'moving_to_bathroom'; needsPath = true; worker.needs.bathroom = 0; worker.timeSinceBathroom = 0; decidedAction = true;
                        }
                    }
                }
                if (!decidedAction && worker.needs.break > NEED_THRESHOLD) {
                    const chance = worker.needs.break > 0.9 ? 1.0 : (CHANCE_TO_ACT_ON_NEED + (worker.needs.break - NEED_THRESHOLD) * 2);
                    if (Math.random() < chance) {
                        // Filtra apenas spots acessíveis da mesma zona do worker
                        const [wx, wz] = worker.currentGrid;
                        const breakPool = [...loungeSpots, ...cafeSpots].filter(s => isSameZone(wx, wz, s.gridX, s.gridZ));
                        if (breakPool.length > 0) {
                            const targetSpot = pickReservedSpot(worker, breakPool);
                            if (targetSpot) {
                                destinationGrid = [targetSpot.gridX, targetSpot.gridZ]; nextState = 'moving_to_break'; needsPath = true; worker.needs.break = 0; worker.timeSinceBreak = 0; decidedAction = true;
                                worker.targetBreakSpot = targetSpot;
                            }
                        } else worker.stateTimer = 1500 + Math.random()*2000;
                    }
                }
                if (!decidedAction && !worker.currentTask && meetingSpots.length > 0 && Math.random() < MEETING_CHANCE) {
                    const [wx, wz] = worker.currentGrid;
                    const reachableMeetingSpots = meetingSpots.filter(s => isSameZone(wx, wz, s.gridX, s.gridZ));
                    if (reachableMeetingSpots.length > 0) {
                        const targetSpot = pickReservedSpot(worker, reachableMeetingSpots);
                        if (targetSpot) {
                            destinationGrid = [targetSpot.gridX, targetSpot.gridZ]; nextState = 'moving_to_meeting'; needsPath = true; decidedAction = true;
                            worker.targetMeetingSpot = targetSpot;
                        }
                    }
                }
                if (!decidedAction && !worker.currentTask && Math.random() < WANDER_CHANCE) {
                    const wanderDestination = findWanderDestination(worker);
                    if (wanderDestination) {
                        destinationGrid = wanderDestination; nextState = 'moving_to_wander'; needsPath = true; decidedAction = true;
                    }
                }
                if (!decidedAction && worker.currentTask && worker.state !== 'working') {
                    if (!isAtDeskSpot) { destinationGrid = worker.deskSpotGrid; nextState = 'moving_to_desk_for_work'; needsPath = true; decidedAction = true; }
                    else { worker.state = 'working'; worker.stateTimer = worker.currentTask.duration; decidedAction = true; needsPath = false; }
                }
                if (!decidedAction && !worker.currentTask) {
                    if (Math.random() < 0.5 && assignTask(worker)) {
                        if (!isAtDeskSpot) { destinationGrid = worker.deskSpotGrid; nextState = 'moving_to_desk_for_work'; needsPath = true; }
                        else { worker.state = 'working'; worker.stateTimer = worker.currentTask.duration; needsPath = false; }
                        decidedAction = true;
                    }
                }
                if (!decidedAction && worker.state === 'idle') worker.stateTimer = 2000 + Math.random()*3000;
            } else if (worker.stateTimer <= 0) {
                switch (worker.state) {
                    case 'working':
                        if (worker.currentTask) { 
                            worker.currentTask.status = 'completed'; 
                            worker.currentTask = null; 
                            tasksCompleted++;
                            totalRevenue += BASE_TASK_REWARD * (0.8 + Math.random()*0.4);
                        }
                        worker.taskProgress = 0; worker.state = 'idle'; worker.stateTimer = 1500 + Math.random()*3000;
                        decidedAction = true; needsPath = false; break;
                    case 'on_break':
                        releaseReservedSpot(worker, 'targetBreakSpot');
                        destinationGrid = worker.deskSpotGrid; nextState = 'moving_to_desk'; needsPath = true; decidedAction = true; break;
                    case 'in_meeting':
                        releaseReservedSpot(worker, 'targetMeetingSpot');
                        destinationGrid = worker.deskSpotGrid; nextState = 'moving_to_desk'; needsPath = true; decidedAction = true; break;
                    case 'chatting':
                        worker.state = 'idle'; worker.stateTimer = 1000 + Math.random()*2000;
                        if (worker.chatTarget) {
                            worker.chatTarget.chatTarget = null;
                            worker.chatTarget = null;
                        }
                        worker.mood = Math.min(1.0, worker.mood + 0.2);
                        decidedAction = true; needsPath = false; break;
                }
            }
            if (needsPath && destinationGrid) {
                const path = findPath(worker.currentGrid[0], worker.currentGrid[1], destinationGrid[0], destinationGrid[1]);
                if (path && path.length > 1) {
                    worker.currentPath = path; worker.pathIndex = 1; worker.state = nextState;
                    const [targetWorldX, , targetWorldZ] = gridToWorld(path[1][0], path[1][1]);
                    worker.targetPos = [targetWorldX, 0, targetWorldZ];
                } else {
                    worker.state = 'idle'; worker.stateTimer = 3000 + Math.random() * 2000;
                    if (nextState === 'moving_to_bathroom') worker.needs.bathroom = NEED_THRESHOLD;
                    if (nextState === 'moving_to_break') { worker.needs.break = NEED_THRESHOLD; releaseReservedSpot(worker, 'targetBreakSpot'); }
                    if (nextState === 'moving_to_meeting') releaseReservedSpot(worker, 'targetMeetingSpot');
                    if (nextState === 'moving_to_desk_for_work' && worker.currentTask) { worker.currentTask.status = 'pending'; worker.currentTask.assignedWorkerId = null; worker.currentTask = null; }
                }
            } else if (needsPath && !destinationGrid) {
                worker.state = 'idle'; worker.stateTimer = 1000;
            }
        }
    });
}

// --- Render Loop (Three.js) ---
let lastTime = 0;
const taskPendingVal = document.getElementById('taskPendingVal');
const taskActiveVal = document.getElementById('taskActiveVal');
const timeOfDayVal = document.getElementById('timeOfDayVal');
const countWorking = document.getElementById('countWorking');
const countBreak = document.getElementById('countBreak');
const countMeeting = document.getElementById('countMeeting');
const countBathroom = document.getElementById('countBathroom');
const moodBar = document.getElementById('moodBar');

function renderLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    const deltaTimeSeconds = deltaTime * 0.001 || 0;
    lastTime = timestamp;

    updateWorkers(deltaTimeSeconds);
    controls.update();

    stuckCheckTimer -= deltaTime;
    if (stuckCheckTimer <= 0) {
        correctStuckWorkers();
        stuckCheckTimer = STUCK_CHECK_INTERVAL;
    }

    const pendingTasks = officeTasks.filter(t => t.status === 'pending').length;
    const activeTasks = officeTasks.filter(t => t.status === 'assigned').length;
    if (taskPendingVal) taskPendingVal.textContent = pendingTasks;
    if (taskActiveVal) taskActiveVal.textContent = activeTasks;

    // --- HUD Expandido Stats ---
    let wWorking = 0, wBreak = 0, wMeeting = 0, wBathroom = 0, avgMood = 0;
    if (workers.length > 0) {
        workers.forEach(w => {
            avgMood += w.mood;
            if (w.state === 'working' || (w.state === 'idle' && w.currentGrid[0] === w.deskSpotGrid[0] && w.currentGrid[1] === w.deskSpotGrid[1])) wWorking++;
            else if (w.state === 'on_break' || w.state === 'moving_to_break') wBreak++;
            else if (w.state === 'in_meeting' || w.state === 'moving_to_meeting' || w.state === 'chatting') wMeeting++;
            else if (w.state === 'using_bathroom' || w.state === 'moving_to_bathroom' || w.isInsideBathroom) wBathroom++;
        });
        avgMood /= workers.length;
    }
    if (countWorking) countWorking.textContent = wWorking;
    if (countBreak) countBreak.textContent = wBreak;
    if (countMeeting) countMeeting.textContent = wMeeting;
    if (countBathroom) countBathroom.textContent = wBathroom;
    if (moodBar) moodBar.style.width = `${avgMood * 100}%`;

    // --- Ciclo de Dia e Noite ---
    simulationTime += deltaTimeSeconds * (1/20); // 1s real = 3 min no jogo
    if (simulationTime >= 24) simulationTime = 0;
    
    let timeStr = "Madrugada";
    if (simulationTime >= 6 && simulationTime < 12) timeStr = "Manhã";
    else if (simulationTime >= 12 && simulationTime < 18) timeStr = "Tarde";
    else if (simulationTime >= 18 && simulationTime < 24) timeStr = "Noite";
    
    const hour = Math.floor(simulationTime).toString().padStart(2, '0');
    const min = Math.floor((simulationTime % 1) * 60).toString().padStart(2, '0');
    if (timeOfDayVal) timeOfDayVal.textContent = `${hour}:${min} (${timeStr})`;

    // Rotação do Sol e Cores
    const sunAngle = (simulationTime / 24) * Math.PI * 2 - Math.PI / 2;
    dirLight.position.x = Math.cos(sunAngle) * 50;
    dirLight.position.y = Math.sin(sunAngle) * 50;
    
    if (simulationTime >= 6 && simulationTime <= 18) {
        // Dia
        const intensity = Math.sin((simulationTime - 6) / 12 * Math.PI);
        dirLight.color.setHex(0xfff5e6);
        dirLight.intensity = intensity * 0.8 + 0.1; // Nunca apaga 100%
        ambientLight.intensity = intensity * 0.4 + 0.4; // Base maior para clarear mais
        scene.background.lerpColors(new THREE.Color(0x050510), new THREE.Color(0x87CEEB), intensity);
    } else {
        // Noite
        dirLight.color.setHex(0x224488); // Cor de luz da lua (azulada)
        dirLight.intensity = 0.2; // Luz suave
        ambientLight.intensity = 0.3; // Garante que não fique breu total
        scene.background.lerpColors(new THREE.Color(0x87CEEB), new THREE.Color(0x050510), 0.05);
    }

    // Atualizar Meshes dos NPCs
    workers.forEach(w => {
        // Nunca mostrar workers que saíram do escritório
        if (w.state === 'left_office') {
            w.meshGroup.visible = false;
            return;
        }
        if (!w.isInsideBathroom) {
            w.meshGroup.visible = true;

            const isMoving = w.state.startsWith('moving_');
            const isAtDeskSpot = w.currentGrid[0] === w.deskSpotGrid[0] && w.currentGrid[1] === w.deskSpotGrid[1];
            const isSitting = (w.state === 'working' || w.state === 'idle') && isAtDeskSpot && !isMoving;

            const isAtBreakSpot = w.targetBreakSpot && w.currentGrid[0] === w.targetBreakSpot.gridX && w.currentGrid[1] === w.targetBreakSpot.gridZ;
            const isBreaking = w.state === 'on_break' && isAtBreakSpot && !isMoving;
            const isAtMeetingSpot = w.targetMeetingSpot && w.currentGrid[0] === w.targetMeetingSpot.gridX && w.currentGrid[1] === w.targetMeetingSpot.gridZ;
            const isMeeting = w.state === 'in_meeting' && isAtMeetingSpot && !isMoving;
            const isChatting = w.state === 'chatting' && !isMoving;

            if (isSitting) {
                const [deskWorldX, , deskWorldZ] = gridToWorld(w.deskGrid[0], w.deskGrid[1]);
                
                if (w.isStandingDesk) {
                    w.meshGroup.position.set(deskWorldX, 0, deskWorldZ + GRID_UNIT * 0.4);
                    w.meshGroup.rotation.y = Math.PI;
                    w.animParts.legL.rotation.x = 0;
                    w.animParts.legR.rotation.x = 0;
                    if (w.state === 'working') {
                        const typeAnim = Math.sin(timestamp * 0.015) * 0.1;
                        w.animParts.armL.rotation.x = -Math.PI / 3 + typeAnim;
                        w.animParts.armR.rotation.x = -Math.PI / 3 - typeAnim;
                    } else {
                        w.animParts.armL.rotation.x = -Math.PI / 6;
                        w.animParts.armR.rotation.x = -Math.PI / 6;
                    }
                } else {
                    // Chair seat = gridUnit*0.45 = 0.9; NPC hip = 0.9 → group y = 0
                    const chairZOffset = GRID_UNIT * 0.38;
                    w.meshGroup.position.set(deskWorldX, 0, deskWorldZ + chairZOffset);
                    w.meshGroup.rotation.y = Math.PI; // Face the desk

                    w.animParts.legL.rotation.x = -Math.PI / 2;
                    w.animParts.legR.rotation.x = -Math.PI / 2;

                    if (w.state === 'working') {
                        const typeAnim = Math.sin(timestamp * 0.015) * 0.1;
                        w.animParts.armL.rotation.x = -Math.PI / 3 + typeAnim;
                        w.animParts.armR.rotation.x = -Math.PI / 3 - typeAnim;
                    } else {
                        w.animParts.armL.rotation.x = -Math.PI / 6;
                        w.animParts.armR.rotation.x = -Math.PI / 6;
                    }
                }
            } else if (isMeeting) {
                const targetProp = w.targetMeetingSpot;
                const [propX, , propZ] = gridToWorld(targetProp.targetGridX, targetProp.targetGridZ);
                // Chair seat = gridUnit*0.45 = 0.9; NPC hip = 0.9 → group y = 0
                w.meshGroup.position.set(propX + targetProp.seatOffsetX, 0, propZ + targetProp.seatOffsetZ);
                w.meshGroup.rotation.y = targetProp.rotationY;
                const explainAnim = Math.sin(timestamp * 0.004);
                w.animParts.armL.rotation.x = -0.4 + explainAnim * 0.2;
                w.animParts.armR.rotation.x = -0.8 - explainAnim * 0.35;
                w.animParts.legL.rotation.x = -Math.PI / 2;
                w.animParts.legR.rotation.x = -Math.PI / 2;
            } else if (isChatting) {
                const talkAnim = Math.sin(timestamp * 0.008);
                w.animParts.armL.rotation.x = -0.3 + talkAnim * 0.2;
                w.animParts.armR.rotation.x = 0.3 - talkAnim * 0.2;
                w.animParts.legL.rotation.x = 0;
                w.animParts.legR.rotation.x = 0;
            } else if (isBreaking) {
                const targetProp = w.targetBreakSpot;
                const [propX, , propZ] = gridToWorld(targetProp.targetGridX, targetProp.targetGridZ);
                const [wX, , wZ] = gridToWorld(w.currentGrid[0], w.currentGrid[1]);
                
                if (targetProp.type === 5 || targetProp.type === 7) { // Sofa ou Pufe
                    // Sofa seat top = 0.45; NPC hip pivot = 0.9 → group y = 0.45 - 0.9 = -0.45
                    w.meshGroup.position.set(propX, -0.45, propZ); // senta no sofa
                    w.meshGroup.rotation.y = Math.atan2(wX - propX, wZ - propZ); // olha pra onde veio
                    w.animParts.legL.rotation.x = -Math.PI / 2;
                    w.animParts.legR.rotation.x = -Math.PI / 2;
                    w.animParts.armL.rotation.x = -Math.PI / 6;
                    w.animParts.armR.rotation.x = -Math.PI / 6;
                } else if (targetProp.type === 4) { // Biblioteca
                    const visX = w.pos[0] + (propX - w.pos[0]) * 0.75;
                    const visZ = w.pos[2] + (propZ - w.pos[2]) * 0.75;
                    w.meshGroup.position.set(visX, 0, visZ);
                    w.meshGroup.rotation.y = Math.atan2(propX - w.pos[0], propZ - w.pos[2]); // olha pro prop
                    const reachAnim = Math.sin(timestamp * 0.005);
                    w.animParts.armR.rotation.x = -Math.PI / 2 + reachAnim * 0.3; // lendo/pegando livro
                    w.animParts.armL.rotation.x = -0.2;
                    w.animParts.legL.rotation.x = 0;
                    w.animParts.legR.rotation.x = 0;
                } else if (targetProp.type === 3 || targetProp.type === 8) { // Cafe
                    const visX = w.pos[0] + (propX - w.pos[0]) * 0.75;
                    const visZ = w.pos[2] + (propZ - w.pos[2]) * 0.75;
                    w.meshGroup.position.set(visX, 0, visZ);
                    w.meshGroup.rotation.y = Math.atan2(propX - w.pos[0], propZ - w.pos[2]);
                    const drinkAnim = Math.abs(Math.sin(timestamp * 0.003));
                    w.animParts.armR.rotation.x = -Math.PI / 1.2 * drinkAnim; // bebendo
                    w.animParts.armL.rotation.x = -0.2;
                    w.animParts.legL.rotation.x = 0;
                    w.animParts.legR.rotation.x = 0;
                } else if (targetProp.type === 22) { // Phone Booth
                    w.meshGroup.position.set(propX, 0, propZ);
                    w.meshGroup.rotation.y = 0;
                    const talkAnim = Math.sin(timestamp * 0.008);
                    w.animParts.armL.rotation.x = -0.3 + talkAnim * 0.2;
                    w.animParts.armR.rotation.x = -Math.PI / 1.5; // segurando celular
                    w.animParts.legL.rotation.x = 0;
                    w.animParts.legR.rotation.x = 0;
                    if (!w.bubbleSprite.visible && Math.random() < 0.005) showBubble(w, '📞', 3000);
                } else if (targetProp.type === 23) { // Ping Pong
                    w.meshGroup.position.set(w.pos[0], 0, w.pos[2]);
                    w.meshGroup.rotation.y = targetProp.side === -1 ? Math.PI / 2 : -Math.PI / 2;
                    const playAnim = Math.sin(timestamp * 0.015);
                    w.animParts.armR.rotation.x = -Math.PI / 3 + playAnim * 0.5;
                    w.animParts.armL.rotation.x = -0.2;
                    w.animParts.legL.rotation.x = 0;
                    w.animParts.legR.rotation.x = 0;
                    if (!w.bubbleSprite.visible && Math.random() < 0.005) showBubble(w, '🏓', 2000);
                } else { // TV ou outros
                    w.meshGroup.position.set(w.pos[0], 0, w.pos[2]);
                    w.meshGroup.rotation.y = Math.atan2(propX - w.pos[0], propZ - w.pos[2]);
                    w.animParts.armL.rotation.x = 0;
                    w.animParts.armR.rotation.x = 0;
                    w.animParts.legL.rotation.x = 0;
                    w.animParts.legR.rotation.x = 0;
                }
            } else {
                w.meshGroup.position.set(w.pos[0], 0, w.pos[2]);

                if (!w.walkCycle) w.walkCycle = 0;
                if (isMoving) w.walkCycle += deltaTimeSeconds * 15;
                else w.walkCycle = 0;

                const bobbing = isMoving ? Math.abs(Math.sin(w.walkCycle)) * 0.05 : 0;
                w.meshGroup.position.y = bobbing; // O grupo inteiro pula suavemente
                
                // Balanço dos braços e pernas
                const swing = isMoving ? Math.sin(w.walkCycle) * 0.6 : 0;
                w.animParts.armL.rotation.x = -swing;
                w.animParts.armR.rotation.x = swing;
                w.animParts.legL.rotation.x = swing;
                w.animParts.legR.rotation.x = -swing;

                if (isMoving && w.targetPos) {
                    const dx = w.targetPos[0] - w.pos[0];
                    const dz = w.targetPos[2] - w.pos[2];
                    if (dx !== 0 || dz !== 0) w.meshGroup.rotation.y = Math.atan2(dx, dz);
                }
            }
        } else {
            w.meshGroup.visible = false;
        }
    });

    // --- Economy HUD updates ---
    dailyCost = RENT_COST_PER_DAY + (workers.length * BASE_WORKER_COST);
    document.getElementById('revenueVal').textContent = 'R$ ' + totalRevenue.toFixed(0);
    document.getElementById('costVal').textContent = 'R$ ' + dailyCost.toFixed(0);
    
    // Level progress
    if (companyLevel < companyLevelThresholds.length - 1) {
        let currentThresh = companyLevelThresholds[companyLevel];
        let nextThresh = companyLevelThresholds[companyLevel + 1];
        let pct = Math.max(0, Math.min(100, ((totalRevenue - currentThresh) / (nextThresh - currentThresh)) * 100));
        document.getElementById('levelPct').textContent = pct.toFixed(0) + '%';
        document.getElementById('levelBar').style.width = pct + '%';
        
        if (totalRevenue >= nextThresh) {
            companyLevel++;
            document.getElementById('levelNum').textContent = companyLevel;
            document.getElementById('companyLevel').textContent = companyLevelNames[companyLevel];
            showToast('Nível da Empresa subiu para: ' + companyLevelNames[companyLevel] + '!');
        }
    } else {
        document.getElementById('levelPct').textContent = 'MAX';
        document.getElementById('levelBar').style.width = '100%';
    }
    
    // Production & Mood bars
    let prodVal = workers.length > 0 ? (wWorking / workers.length) * 100 : 0;
    document.getElementById('prodPct').textContent = prodVal.toFixed(0) + '%';
    document.getElementById('prodBar').style.width = prodVal + '%';
    
    document.getElementById('moodPct').textContent = (avgMood * 100).toFixed(0) + '%';
    document.getElementById('taskDoneVal').textContent = tasksCompleted;

    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
}

// --- Action & Event Handlers ---
window.logEvent = function(msg, type='info') {
    const logEl = document.getElementById('eventLog');
    if(!logEl) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const h = Math.floor(simulationTime).toString().padStart(2, '0');
    const m = Math.floor((simulationTime % 1) * 60).toString().padStart(2, '0');
    entry.innerHTML = `<span class="log-time">[${h}:${m}]</span> ${msg}`;
    logEl.prepend(entry);
    if(logEl.children.length > 20) logEl.lastChild.remove();
}

window.showToast = function(msg) {
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

window.managerAction = function(actionType) {
    switch(actionType) {
        case 'pizza':
            if (totalRevenue < 300) { showToast('Receita insuficiente!'); return; }
            totalRevenue -= 300;
            workers.forEach(w => w.mood = Math.min(1.0, w.mood + 0.3));
            logEvent('Você comprou Pizza para a equipe!', 'good');
            showToast('Pizza pedida! Humor +30%');
            break;
            
        case 'coffee':
            if (totalRevenue < 150) { showToast('Receita insuficiente!'); return; }
            totalRevenue -= 150;
            workers.forEach(w => w.needs.break = Math.max(0, w.needs.break - 0.5));
            logEvent('Café especial liberado. Menos pausas!', 'good');
            showToast('Café especial! Menos vontade de pausa.');
            break;

        case 'happy_hour':
            if (totalRevenue < 800) { showToast('Receita insuficiente!'); return; }
            if (simulationTime < 16) { showToast('Muito cedo para Happy Hour!'); return; }
            totalRevenue -= 800;
            workers.forEach(w => {
                if(w.state !== 'left_office' && w.state !== 'moving_to_exit') {
                    const pool = [...loungeSpots, ...cafeSpots];
                    const spot = pickReservedSpot(w, pool);
                    if(spot) {
                        w.targetBreakSpot = spot;
                        w.state = 'moving_to_break';
                        const pth = findPath(w.currentGrid[0], w.currentGrid[1], spot.gridX, spot.gridZ);
                        if (pth && pth.length > 1) {
                            w.currentPath = pth; w.pathIndex = 1;
                        }
                    }
                }
                w.mood = 1.0;
            });
            logEvent('Happy Hour iniciado!', 'good');
            break;

        case 'deadline':
            workers.forEach(w => {
                w.speed *= 1.5;
                w.mood -= 0.4;
            });
            logEvent('DEADLINE! Velocidade alta, humor caiu.', 'bad');
            showToast('Modo Deadline ativado!');
            setTimeout(() => {
                workers.forEach(w => w.speed /= 1.5);
                logEvent('O deadline passou. Ritmo normalizado.', 'info');
            }, 30000); // 30 sec real time
            break;

        case 'all_hands':
            workers.forEach(w => {
                if(w.state !== 'left_office' && w.state !== 'moving_to_exit') {
                    const spot = pickReservedSpot(w, meetingSpots);
                    if(spot) {
                        w.targetMeetingSpot = spot;
                        w.state = 'moving_to_meeting';
                        const pth = findPath(w.currentGrid[0], w.currentGrid[1], spot.gridX, spot.gridZ);
                        if (pth && pth.length > 1) {
                            w.currentPath = pth; w.pathIndex = 1;
                        }
                    }
                }
            });
            logEvent('Reunião All-Hands chamada.', 'info');
            break;
            
        case 'fire_drill':
            activeEvent = 'fire_drill';
            eventTimer = 15000;
            const alertEl = document.getElementById('eventAlert');
            if (alertEl) {
                alertEl.classList.remove('hidden');
                document.getElementById('eventIcon').textContent = '🚨';
                document.getElementById('eventText').textContent = 'Simulação de Incêndio!';
                document.getElementById('eventSubText').textContent = 'Todos devem evacuar o prédio';
                alertEl.style.borderColor = '#ff5252';
            }
            logEvent('Simulação de incêndio iniciada.', 'bad');
            break;
            
        case 'hire':
            showToast('RH ocupado no momento. Implementação em breve!');
            break;
            
        default:
            showToast('Ação não implementada ainda.');
            break;
    }
}

// Iniciar
initializeWorld();
requestAnimationFrame(renderLoop);

