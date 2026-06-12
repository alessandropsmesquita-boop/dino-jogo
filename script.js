const dino = document.getElementById("dino");
const obstacle = document.getElementById("obstacle");
const currentScoreEl = document.getElementById("current-score");
const highScoreEl = document.getElementById("high-score");
const gameOverScreen = document.getElementById("game-over-screen");
const restartBtn = document.getElementById("restart-btn");
const gameCanvas = document.querySelector(".game");

let score = 0;
let highScore = localStorage.getItem("dino_hi") || 0;
let isGameOver = false;
let isJumping = false;
let currentSeason = "autumn";

const baseSpeed = 6;
let currentSpeed = baseSpeed;
let obstacleLeft = 600;
let backgroundPos = 0;

highScoreEl.innerText = "HI " + String(highScore).padStart(5, '0');

// Gerador de Som 8-Bits Nativo
let audioCtx = null;
function playBeep(freq, duration, type = "sine") {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        if (freq === 150) osc.frequency.exponentialRampToValueAtTime(380, audioCtx.currentTime + duration);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { console.log("Áudio bloqueado."); }
}

function jump() {
    if (isGameOver || isJumping) return;
    isJumping = true;
    dino.classList.add("jump");
    playBeep(160, 0.12, "square");

    setTimeout(() => {
        dino.classList.remove("jump");
        isJumping = false;
    }, 450);
}

function spawnNextObstacle() {
    obstacleLeft = 600;
    obstacle.className = "obstacle-cactus"; // Mantém sempre o cacto estruturado
}

// Analisa a pontuação e ajusta os efeitos climáticos relativos de fundo
function updateWeatherAndEnvironment() {
    let targetSeason = "autumn";

    if (score >= 300) targetSeason = "summer";
    else if (score >= 200) targetSeason = "spring";
    else if (score >= 100) targetSeason = "winter";

    // Modifica a classe do cenário para ativar a animação de clima correta via CSS
    if (targetSeason !== currentSeason) {
        gameCanvas.classList.remove("season-autumn", "season-winter", "season-spring", "season-summer");
        gameCanvas.classList.add("season-" + targetSeason);
        currentSeason = targetSeason;
    }
}

// Loop de Processamento (60 Quadros por Segundo estável)
let gameLoopId;
let frames = 0;

function gameLoop() {
    if (isGameOver) return;

    // Deslocamento horizontal contínuo do Cacto
    obstacleLeft -= currentSpeed;
    if (obstacleLeft < -40) {
        spawnNextObstacle();
    }
    obstacle.style.left = obstacleLeft + "px";

    // Rolagem do chão
    backgroundPos -= currentSpeed * 0.75;
    gameCanvas.style.backgroundPositionX = backgroundPos + "px";

    frames++;
    if (frames % 5 === 0) {
        score++;
        currentScoreEl.innerText = String(score).padStart(5, '0');
        
        // Verifica transição de clima em tempo real
        updateWeatherAndEnvironment();

        // A cada 100 pontos: Toca som clássico e acelera o passo!
        if (score > 0 && score % 100 === 0) {
            playBeep(550, 0.05, "square");
            setTimeout(() => playBeep(750, 0.08, "square"), 60);
            currentSpeed += 0.8;
        }
    }

    // Processamento de Caixa de Colisão
    let dinoRect = dino.getBoundingClientRect();
    let obsRect = obstacle.getBoundingClientRect();

    if (
        dinoRect.right - 14 > obsRect.left &&
        dinoRect.left + 14 < obsRect.right &&
        dinoRect.bottom - 6 > obsRect.top &&
        dinoRect.top + 6 < obsRect.bottom
    ) {
        triggerGameOver();
        return;
    }

    gameLoopId = requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
    isGameOver = true;
    cancelAnimationFrame(gameLoopId);
    playBeep(110, 0.4, "sawtooth"); // Som de batida seca

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("dino_hi", highScore);
        highScoreEl.innerText = "HI " + String(highScore).padStart(5, '0');
    }

    gameOverScreen.classList.remove("hidden");
}

function restartGame() {
    score = 0;
    frames = 0;
    currentSpeed = baseSpeed;
    isGameOver = false;
    currentSeason = "autumn";
    
    currentScoreEl.innerText = "00000";
    gameOverScreen.classList.add("hidden");
    
    dino.className = ""; 
    gameCanvas.className = "game season-autumn";
    
    spawnNextObstacle();
    cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Ouvintes globais (Ações de toque e teclado)
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        if (isGameOver) restartGame();
        else jump();
    }
});

const handleAction = (e) => {
    if (e.target === restartBtn) return;
    e.preventDefault();
    if (isGameOver) restartGame();
    else jump();
};

window.addEventListener("touchstart", handleAction, { passive: false });
window.addEventListener("click", handleAction);

restartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    restartGame();
});

spawnNextObstacle();
gameLoopId = requestAnimationFrame(gameLoop);
