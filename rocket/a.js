// ... (Código do worker exatamente como na versão anterior) ...
// --- Constantes (serão recebidas da main thread) ---
let INPUT_NODES, HIDDEN_NODES, OUTPUT_NODES;
let SIMULATION_TIMEOUT_FRAMES;
let canvasWidth, canvasHeight; // Tamanho lógico do canvas
let gravity, thrust, sideThrust, maxSpeedX, maxSpeedY, fuelMax;
let landingPadWidth, landingPadHeight; // Dimensões do pad

// --- Funções Utilitárias do Worker ---
const activation = x => 1 / (1 + Math.exp(-x));
const createMatrix = (rows, cols) => { let m = []; for (let i = 0; i < rows; i++) { m[i] = new Array(cols).fill(0); } return m; };
const arrayToMatrix = (arr) => { let m = createMatrix(arr.length, 1); for (let i = 0; i < arr.length; i++) { m[i][0] = arr[i]; } return m; };
const matrixToArray = (matrix) => { let arr = []; for (let i = 0; i < matrix.length; i++) { arr.push(matrix[i][0]); } return arr; };
const multiply = (mA, mB) => {
    const rA = mA.length, cA = mA[0].length, rB = mB.length, cB = mB[0].length; if (cA !== rB) return null; let res = createMatrix(rA, cB); for (let i = 0; i
        < rA; i++) {
        for (let j = 0; j
            < cB; j++) {
            let s = 0; for (let k = 0; k
                < cA; k++) { s += mA[i][k] * (cB === 1 ? mB[k][0] : mB[k][j]); } res[i][j] = s;
        }
    } return res;
};
const add = (mA, mB) => {
    if (mA.length !== mB.length || mA[0].length !== mB[0].length) return null; let res = createMatrix(mA.length, mA[0].length); for (let i = 0; i
        < mA.length; i++)for (let j = 0; j
            < mA[0].length; j++)res[i][j] = mA[i][j] + mB[i][j]; return res;
};
const map = (m, fn) => {
    let res = createMatrix(m.length, m[0].length); for (let i = 0; i
        < m.length; i++)for (let j = 0; j
            < m[0].length; j++)res[i][j] = fn(m[i][j]); return res;
};

// --- Lógica de Predição da Rede Neural (dentro do worker) ---
function predict(inputArray, nnData) {
    let inputs = arrayToMatrix(inputArray);
    let hidden = multiply(nnData.weights_ih, inputs);
    hidden = add(hidden, nnData.bias_h);
    hidden = map(hidden, activation);
    let output = multiply(nnData.weights_ho, hidden);
    output = add(output, nnData.bias_o);
    output = map(output, activation);
    return matrixToArray(output);
}

// --- Função Principal de Simulação no Worker ---
function runSimulationForNN(nnData, simConfig) {
    // Estado inicial da simulação específica
    let r = { x: simConfig.startX, y: simConfig.startY, width: 20, height: 80, fuel: fuelMax, speedX: simConfig.startSpeedX, speedY: simConfig.startSpeedY, angle: simConfig.startAngle, isThrusting: false, thrustingLeft: false, thrustingRight: false };
    const pad = { x: simConfig.landingPadX, y: 0, width: landingPadWidth, height: landingPadHeight };
    const currentWindStrength = simConfig.windStrength; const currentWindDirection = simConfig.windDirection;
    let localFrameCount = 0; let gameOver = false; let success = false; let reason = "";

    // Loop de simulação
    while (!gameOver && localFrameCount < SIMULATION_TIMEOUT_FRAMES) {
        localFrameCount++;
        // 1. Controle IA
        if (r.fuel > 0) {
            const normX = (r.x + r.width / 2) / canvasWidth; const normY = Math.max(0, Math.min(1, r.y / canvasHeight)); const normVx = Math.max(-1, Math.min(1, r.speedX / maxSpeedX)); const normVy = Math.max(-1, Math.min(1, r.speedY / maxSpeedY)); let normAngle = (r.angle - Math.PI) / Math.PI; if (normAngle > 1) normAngle -= 2; if (normAngle < -1) normAngle += 2; const normAng = Math.max(-1, Math.min(1, normAngle)); const targetCenterX = pad.x + pad.width / 2; const distToTargetX = (targetCenterX - (r.x + r.width / 2)) / (canvasWidth / 2); const normDistX = Math.max(-1, Math.min(1, distToTargetX)); const normWind = Math.max(-1, Math.min(1, currentWindStrength * currentWindDirection * 2)); const inputs = [normX, normY, normVx, normVy, normAng, normDistX, normWind];
            const outputs = predict(inputs, nnData); const threshold = 0.55;
            r.isThrusting = outputs[0] > threshold; r.thrustingLeft = outputs[1] > threshold; r.thrustingRight = outputs[2] > threshold;
            if (r.thrustingLeft && r.thrustingRight) { if (outputs[1] > outputs[2]) r.thrustingRight = false; else r.thrustingLeft = false; }
        } else { r.isThrusting = false; r.thrustingLeft = false; r.thrustingRight = false; }
        // 2. Física
        r.speedY += gravity; const windEffect = currentWindStrength * currentWindDirection * 0.015 * Math.max(0.1, r.y / canvasHeight); r.speedX += windEffect;
        if (r.isThrusting && r.fuel > 0) { const angle = r.angle; r.speedX += thrust * Math.sin(angle); r.speedY += -thrust * Math.cos(angle); r.fuel -= 0.35; }
        if (r.thrustingLeft && r.fuel > 0) { r.angle += sideThrust; r.fuel -= 0.08; } if (r.thrustingRight && r.fuel > 0) { r.angle -= sideThrust; r.fuel -= 0.08; }
        r.angle = (r.angle + 2 * Math.PI) % (2 * Math.PI); r.speedX = Math.max(-maxSpeedX, Math.min(maxSpeedX, r.speedX)); r.speedY = Math.max(-maxSpeedY * 1.5, Math.min(maxSpeedY, r.speedY)); r.y += r.speedY; r.x += r.speedX;
        // 3. Fim de Jogo
        const rBY = r.y; const safeLandSpeedY = 1.5; const safeLandSpeedX = 1.0; const angleTolerance = 15 * (Math.PI / 180); const angleDiff = Math.abs(r.angle - Math.PI); const isAngleSafe = angleDiff <= angleTolerance || Math.abs(angleDiff - 2 * Math.PI) <= angleTolerance;
        if (r.x <= 0 || r.x + r.width >= canvasWidth) { gameOver = true; success = false; reason = "Colidiu Lateralmente"; }
        else if (rBY <= pad.height && r.x + r.width > pad.x && r.x < pad.x + pad.width) {
            if (Math.abs(r.speedY) <= safeLandSpeedY && Math.abs(r.speedX) <= safeLandSpeedX && isAngleSafe) { gameOver = true; success = true; reason = "Pouso Suave!"; }
            else { let cr = ""; if (Math.abs(r.speedY) > safeLandSpeedY) cr += 'VelY alta (' + (-r.speedY * 10).toFixed(1) + '). '; if (Math.abs(r.speedX) > safeLandSpeedX) cr += 'VelX alta (' + (r.speedX * 10).toFixed(1) + '). '; if (!isAngleSafe) { let deg = (r.angle * 180 / Math.PI) - 180; deg = (deg + 360) % 360; if (deg > 180) deg -= 360; cr += 'Ângulo ruim (' + Math.round(deg) + '°).'; } gameOver = true; success = false; reason = "Crash Plataforma: " + cr; }
        } else if (rBY <= 0) { gameOver = true; success = false; reason = "Caiu fora."; }
    }
    if (!gameOver && localFrameCount >= SIMULATION_TIMEOUT_FRAMES) { gameOver = true; success = false; reason = "Timeout"; }
    // 4. Fitness
    const fitness = calculateFitnessWorker(success, reason, r, pad);
    return { fitness: fitness, success: success, reason: reason };
}

// --- Cálculo de Fitness (dentro do worker - sem alterações) ---
function calculateFitnessWorker(landedSuccess, reason, rocketState, padState) {
    let fitness = 0; const targetCenterX = padState.x + padState.width / 2; const distToPadCenter = Math.abs((rocketState.x + rocketState.width / 2) - targetCenterX); const finalSpeedYAbs = Math.abs(rocketState.speedY); const finalSpeedXAbs = Math.abs(rocketState.speedX); const angleDiff = Math.abs(rocketState.angle - Math.PI); const angleError = Math.min(angleDiff, Math.abs(angleDiff - 2 * Math.PI));
    if (landedSuccess) { fitness = 10000; fitness += 5000 / (1 + distToPadCenter * 0.1); fitness += 2000 / (1 + finalSpeedYAbs * 10); fitness += 1000 / (1 + finalSpeedXAbs * 10); fitness -= angleError * 1000; fitness += Math.max(0, rocketState.fuel) * 5; }
    else { fitness = -100 / (1 + distToPadCenter * 0.05); fitness -= finalSpeedYAbs * 15; fitness -= finalSpeedXAbs * 8; fitness -= 500; if (reason.includes("Timeout")) fitness -= 300; if (reason.includes("Lateral")) fitness -= 400; if (reason.includes("Caiu fora")) fitness -= 50; fitness -= angleError * 20; fitness -= (fuelMax - Math.max(0, rocketState.fuel)) * 0.5; fitness = Math.max(-5000, fitness); }
    if (!landedSuccess && distToPadCenter < padState.width / 1.5) { fitness += 500; }
    return fitness;
}

// --- Handler de Mensagens do Worker ---
self.onmessage = function (e) {
    const message = e.data;
    if (message.type === 'init') { INPUT_NODES = message.config.INPUT_NODES; HIDDEN_NODES = message.config.HIDDEN_NODES; OUTPUT_NODES = message.config.OUTPUT_NODES; SIMULATION_TIMEOUT_FRAMES = message.config.SIMULATION_TIMEOUT_FRAMES; canvasWidth = message.config.canvasWidth; canvasHeight = message.config.canvasHeight; gravity = message.config.gravity; thrust = message.config.thrust; sideThrust = message.config.sideThrust; maxSpeedX = message.config.maxSpeedX; maxSpeedY = message.config.maxSpeedY; fuelMax = message.config.fuelMax; landingPadWidth = message.config.landingPadWidth; landingPadHeight = message.config.landingPadHeight; }
    else if (message.type === 'evaluate') {
        const task = message.task;
        try { const result = runSimulationForNN(task.nnData, task.simConfig); self.postMessage({ type: 'result', id: task.nnData.id, fitness: result.fitness, success: result.success, reason: result.reason }); }
        catch (simError) { console.error('Erro runSimulationForNN worker:', simError); self.postMessage({ type: 'result', id: task.nnData.id, fitness: -Infinity, success: false, reason: 'Worker Simulation Error' }); }
    }
};