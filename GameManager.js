import * as THREE from 'three';
import { Ghost } from './Ghost.js';

export class GameManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.ghosts = [];
        this.gameStarted = false;
        this.gamePaused = false;
        this.powerUpActive = false;
        this.powerUpTimer = 0;
        this.powerUpDuration = 10; // seconds
        this.coinsCollected = 0;
        this.coinsNeeded = 20; // Level 1 starts with 20 coins

        this.init();
        this.createStartScreen();
        this.createHowToPlayScreen(); // Fix: Create the modal so it can be opened
        this.createHUD();
        this.setupAudio();
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' || e.key === 'Z') {
                // Toggle mute
                const muteBtn = document.getElementById('muteBtn');
                if (muteBtn) muteBtn.click();
            } else if (e.key === 'x' || e.key === 'X') {
                // Toggle pause
                this.togglePause();
            }
        });
    }

    setupAudio() {
        // Create simple retro-style background music using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.bgMusicPlaying = false;
    }

    startBackgroundMusic() {
        if (this.bgMusicPlaying) return;
        this.bgMusicPlaying = true;

        // More fun Pac-Man style melody
        const notes = [
            { freq: 493.88, duration: 0.15 }, // B4
            { freq: 587.33, duration: 0.15 }, // D5
            { freq: 659.25, duration: 0.15 }, // E5
            { freq: 783.99, duration: 0.15 }, // G5
            { freq: 880.00, duration: 0.15 }, // A5
            { freq: 783.99, duration: 0.15 }, // G5
            { freq: 659.25, duration: 0.15 }, // E5
            { freq: 587.33, duration: 0.3 },  // D5

            { freq: 523.25, duration: 0.15 }, // C5
            { freq: 659.25, duration: 0.15 }, // E5
            { freq: 783.99, duration: 0.15 }, // G5
            { freq: 880.00, duration: 0.15 }, // A5
            { freq: 987.77, duration: 0.15 }, // B5
            { freq: 880.00, duration: 0.15 }, // A5
            { freq: 783.99, duration: 0.15 }, // G5
            { freq: 659.25, duration: 0.3 },  // E5
        ];

        let noteIndex = 0;
        const playNote = () => {
            if (!this.bgMusicPlaying) return;

            const note = notes[noteIndex];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = note.freq;
            oscillator.type = 'square'; // Retro sound

            gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + note.duration);

            noteIndex = (noteIndex + 1) % notes.length;
            setTimeout(playNote, note.duration * 1000);
        };

        playNote();
    }

    stopBackgroundMusic() {
        this.bgMusicPlaying = false;
    }

    startGame() {
        this.gameStarted = true;
        this.startBackgroundMusic();
    }

    createStartScreen() {
        const startScreen = document.createElement('div');
        startScreen.id = 'startScreen';
        startScreen.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: url('start_screen_bg.jpg') no-repeat center center fixed; 
            background-size: cover;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            color: white; font-family: 'Arial', sans-serif; z-index: 10;
        `;

        // Overlay to make text readable if image is bright
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); z-index: -1;
        `;
        startScreen.appendChild(overlay);

        const title = document.createElement('h1');
        title.innerText = 'PACMAN SPACE WORLD';
        title.style.cssText = 'font-size: 60px; margin-bottom: 20px; text-shadow: 4px 4px 0 #000; color: #ffcc00;';
        startScreen.appendChild(title);

        const startBtn = document.createElement('button');
        startBtn.innerText = 'Start Game';
        startBtn.style.cssText = `
            padding: 15px 40px; font-size: 24px; cursor: pointer;
            background: #ffcc00; border: none; border-radius: 30px;
            color: #000; font-weight: bold; margin-bottom: 20px;
            box-shadow: 0 4px 0 #b38f00; transition: transform 0.1s;
        `;
        startBtn.onmousedown = () => startBtn.style.transform = 'translateY(4px)';
        startBtn.onmouseup = () => startBtn.style.transform = 'translateY(0)';
        startBtn.onclick = () => {
            this.startGame();
            startScreen.style.display = 'none';
        };
        startScreen.appendChild(startBtn);

        const howToPlayBtn = document.createElement('button');
        howToPlayBtn.innerText = 'How to Play';
        howToPlayBtn.style.cssText = `
            padding: 10px 30px; font-size: 18px; cursor: pointer;
            background: #333; border: 2px solid #fff; border-radius: 20px;
            color: #fff; transition: background 0.2s;
        `;
        howToPlayBtn.onclick = () => {
            document.getElementById('howToPlayModal').style.display = 'flex';
        };
        startScreen.appendChild(howToPlayBtn);

        document.body.appendChild(startScreen);
    }

    createHowToPlayScreen() {
        const modal = document.createElement('div');
        modal.id = 'howToPlayModal';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 30px; border-radius: 10px; z-index: 1001;
            max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            display: none;
        `;
        modal.innerHTML = `
            <h2 style="color: #333; margin-top: 0;">Como Jogar</h2>
            <p style="color: #666; line-height: 1.6;">
                <strong>Controles:</strong><br>
                • Setas Esquerda/Direita ou A/D: Girar<br>
                • Seta Cima ou W: Andar para frente<br><br>
                <strong>Objetivo:</strong><br>
                • Colete moedas amarelas para ganhar pontos<br>
                • Evite os fantasmas ou você perde uma vida<br>
                • Pegue a bola vermelha para poder comer os fantasmas<br><br>
                <strong>Dica:</strong> Você não pode andar para trás, então planeje seus movimentos!
            </p>
            <button id="closeModal" style="padding: 10px 30px; font-size: 18px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 5px; width: 100%;">Fechar</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('closeModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    createHUD() {
        const hud = document.createElement('div');
        hud.id = 'gameHUD';
        hud.style.position = 'absolute';
        hud.style.top = '10px';
        hud.style.left = '10px';
        hud.style.color = 'white';
        hud.style.fontFamily = 'Arial, sans-serif';
        hud.style.fontSize = '20px';
        hud.innerHTML = `
            <div>Score: <span id="score">0</span></div>
            <div>Lives: <span id="lives">3</span></div>
            <div>Level: <span id="level">1</span></div>
            <div>Coins: <span id="coinsCollected">0</span>/<span id="coinsNeeded">20</span></div>
        `;
        document.body.appendChild(hud);
        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives');
        this.levelEl = document.getElementById('level');
        this.coinsCollectedEl = document.getElementById('coinsCollected');
        this.coinsNeededEl = document.getElementById('coinsNeeded');

        // Power-up timer bar
        const powerUpBar = document.createElement('div');
        powerUpBar.id = 'powerUpBar';
        powerUpBar.style.cssText = `
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            width: 300px; height: 30px; background: rgba(0,0,0,0.5);
            border: 2px solid white; border-radius: 5px; display: none;
        `;
        powerUpBar.innerHTML = `
            <div id="powerUpFill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #ff0000, #ff6600); border-radius: 3px; transition: width 0.1s;"></div>
        `;
        document.body.appendChild(powerUpBar);
        this.powerUpBarEl = powerUpBar;
        this.powerUpFillEl = document.getElementById('powerUpFill');

        // Add mute button
        const muteBtn = document.createElement('button');
        muteBtn.id = 'muteBtn';
        muteBtn.style.cssText = `
            position: absolute; top: 10px; right: 10px;
            padding: 10px 20px; font-size: 16px; cursor: pointer;
            background: #333; color: white; border: 2px solid white;
            border-radius: 5px; font-family: Arial;
        `;
        muteBtn.innerHTML = '🔊 Som (Z)';
        document.body.appendChild(muteBtn);

        muteBtn.addEventListener('click', () => {
            if (this.bgMusicPlaying) {
                this.stopBackgroundMusic();
                muteBtn.innerHTML = '🔇 Mudo (Z)';
                muteBtn.style.background = '#666';
            } else {
                this.startBackgroundMusic();
                muteBtn.innerHTML = '🔊 Som (Z)';
                muteBtn.style.background = '#333';
            }
        });

        // Add pause button
        const pauseBtn = document.createElement('button');
        pauseBtn.id = 'pauseBtn';
        pauseBtn.style.cssText = `
            position: absolute; top: 60px; right: 10px;
            padding: 10px 20px; font-size: 16px; cursor: pointer;
            background: #333; color: white; border: 2px solid white;
            border-radius: 5px; font-family: Arial;
        `;
        pauseBtn.innerHTML = '⏸ Pausar (X)';
        document.body.appendChild(pauseBtn);

        pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });
    }

    togglePause() {
        if (!this.gameStarted) return;

        if (this.gamePaused) {
            // Resume
            this.gamePaused = false;
            const pauseMenu = document.getElementById('pauseMenu');
            if (pauseMenu) pauseMenu.remove();
            // Resume music if it was playing
            if (this.bgMusicPlaying) {
                this.startBackgroundMusic();
            }
        } else {
            // Pause
            this.gamePaused = true;
            this.stopBackgroundMusic();
            this.createPauseMenu();
        }
    }

    createPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pauseMenu';
        pauseMenu.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 1000;
        `;
        pauseMenu.innerHTML = `
            <h1 style="color: white; font-family: Arial; font-size: 50px; margin-bottom: 40px;">PAUSADO</h1>
            <button id="resumeBtn" style="padding: 15px 40px; font-size: 24px; margin: 10px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 8px;">Retomar</button>
            <button id="quitPauseBtn" style="padding: 15px 40px; font-size: 24px; margin: 10px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 8px;">Sair</button>
        `;
        document.body.appendChild(pauseMenu);

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('quitPauseBtn').addEventListener('click', () => {
            location.reload(); // Fix: Reload page instead of window.close() which often fails
        });
    }

    init() {
        // Spawn Ghosts - avoid green colors
        const baseColors = [0xff0000, 0xffb8ff, 0x00ffff, 0xffb852]; // Blinky, Pinky, Inky, Clyde
        const numGhosts = 15;

        for (let i = 0; i < numGhosts; i++) {
            let color;
            if (i < baseColors.length) {
                color = baseColors[i];
            } else {
                // Random bright color (avoid green hues)
                let hue;
                do {
                    hue = Math.random();
                } while (hue > 0.2 && hue < 0.45); // Avoid green range (0.25-0.4)
                color = new THREE.Color().setHSL(hue, 1, 0.5).getHex();
            }

            const ghost = new Ghost(this.scene, this.world, color);
            ghost.setTarget(this.player);
            ghost.state = 'CHASE'; // Default to chase for now
            this.ghosts.push(ghost);
        }
    }

    update(delta) {
        if (!this.gameStarted || this.gamePaused) return;

        // Update power-up timer
        if (this.powerUpActive) {
            this.powerUpTimer -= delta;
            const percentage = (this.powerUpTimer / this.powerUpDuration) * 100;
            this.powerUpFillEl.style.width = percentage + '%';

            if (this.powerUpTimer <= 0) {
                this.powerUpActive = false;
                this.powerUpBarEl.style.display = 'none';
                // Reset ghosts to chase
                for (const ghost of this.ghosts) {
                    ghost.resetState();
                }
            }
        }

        // Update Ghosts
        for (const ghost of this.ghosts) {
            ghost.update(delta, this.ghosts);

            // Ghost Collision
            const dist = this.player.mesh.position.distanceTo(ghost.mesh.position);
            if (dist < 2.5) {
                if (this.powerUpActive) {
                    // Eat Ghost
                    this.addScore(200);
                    ghost.placeRandomly();
                    ghost.resetState();
                } else {
                    // Die
                    this.playerDie();
                }
            }
        }

        // Collectible Collision
        for (let i = this.world.collectibles.length - 1; i >= 0; i--) {
            const item = this.world.collectibles[i];
            if (!item.active) continue;

            const dist = this.player.mesh.position.distanceTo(item.mesh.position);
            if (dist < 2) {
                item.active = false;
                item.mesh.visible = false;

                if (item.type === 'coin') {
                    this.addScore(10);
                    this.coinsCollected++;
                    this.coinsCollectedEl.innerText = this.coinsCollected;

                    // Check level completion
                    if (this.coinsCollected >= this.coinsNeeded) {
                        this.nextLevel();
                    }
                } else if (item.type === 'power') {
                    this.addScore(50);
                    this.activatePowerPellet();
                }
            }
        }
    }

    activatePowerPellet() {
        this.powerUpActive = true;
        this.powerUpTimer = this.powerUpDuration;
        this.powerUpBarEl.style.display = 'block';

        for (const ghost of this.ghosts) {
            ghost.setFlee();
        }
    }

    nextLevel() {
        this.level++;

        if (this.level > 10) {
            this.gameWon();
            return;
        }

        this.levelEl.innerText = this.level;
        this.coinsCollected = 0;
        this.coinsNeeded = this.level * 20;
        this.coinsCollectedEl.innerText = this.coinsCollected;
        this.coinsNeededEl.innerText = this.coinsNeeded;

        // Increase ghost speed
        for (const ghost of this.ghosts) {
            ghost.speed = 0.05 + (this.level - 1) * 0.01;
        }

        // Regenerate collectibles
        this.world.regenerateCollectibles(this.coinsNeeded);
    }

    gameWon() {
        this.gamePaused = true;
        this.stopBackgroundMusic();

        const winScreen = document.createElement('div');
        winScreen.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 1000;
        `;
        winScreen.innerHTML = `
            <h1 style="color: #FFD700; font-family: Arial; font-size: 60px; margin-bottom: 20px;">PARABÉNS!</h1>
            <p style="color: white; font-size: 30px; margin-bottom: 40px;">Você completou todos os 10 níveis!</p>
            <p style="color: white; font-size: 24px; margin-bottom: 40px;">Score Final: ${this.score}</p>
            <button id="playAgainBtn" style="padding: 15px 40px; font-size: 24px; margin: 10px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 8px;">Jogar Novamente</button>
        `;
        document.body.appendChild(winScreen);

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            location.reload();
        });
    }

    playerDie() {
        this.lives--;
        this.livesEl.innerText = this.lives;
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions
            for (const ghost of this.ghosts) {
                ghost.placeRandomly();
            }
        }
    }

    gameOver() {
        this.gamePaused = true;
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'gameOverScreen';
        gameOverScreen.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 1000;
        `;
        gameOverScreen.innerHTML = `
            <h1 style="color: #FF4444; font-family: Arial; font-size: 60px; margin-bottom: 20px;">GAME OVER</h1>
            <p style="color: white; font-size: 30px; margin-bottom: 40px;">Score: ${this.score}</p>
            <button id="tryAgainBtn" style="padding: 15px 40px; font-size: 24px; margin: 10px; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 8px;">Tentar Novamente</button>
            <button id="quitBtn" style="padding: 15px 40px; font-size: 24px; margin: 10px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 8px;">Sair</button>
        `;
        document.body.appendChild(gameOverScreen);

        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            location.reload();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            window.close();
        });
    }

    addScore(points) {
        this.score += points;
        this.scoreEl.innerText = this.score;
    }
}
