import InputHandler from './InputHandler.js';
import UIManager from './UIManager.js';
import GameMap from '../world/Map.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Bomb from '../entities/Bomb.js';
import Explosion from '../entities/Explosion.js';
import Item from '../entities/Item.js';
import AudioManager from './AudioManager.js';
import { rectIntersect } from './Utils.js';
import { TILE_SIZE, COLS, ROWS, TILE_TYPES, DIFFICULTY_CONFIG, ITEM_TYPES, AUDIO_FILES } from './Constants.js';

export default class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = COLS * TILE_SIZE;
        this.canvas.height = ROWS * TILE_SIZE;
        this.ctx.imageSmoothingEnabled = false;

        this.input = new InputHandler(this);
        this.ui = new UIManager();
        this.map = new GameMap();
        this.audio = new AudioManager();

        // Load Audio
        this.audio.load(AUDIO_FILES);

        this.player = null;
        this.enemies = [];
        this.bombs = [];
        this.explosions = [];
        this.items = [];

        this.state = 'MENU';
        this.difficulty = null;
        this.lastTime = 0;
        this.level = 1;
        this.levelMessageTimer = 0;

        // Initialize UI listeners
        this.ui.setupMenu((difficulty) => this.startGame(difficulty));
        this.ui.setupGameOver(() => this.startLevel(), () => this.showMenu());
        this.ui.setupAudioControls(this.audio);

        this.showMenu();
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    showMenu() {
        this.state = 'MENU';
        this.ui.showMenu();
        // Browser policy: Resume context on user interaction (handled in startGame usually, but ensure init)
        this.audio.init();
    }

    toggleMenu() {
        if (this.state === 'PLAYING') {
            this.showMenu();
        } else if (this.state === 'MENU' && this.player) {
            // Resume if game exists
            this.state = 'PLAYING';
            this.ui.hideMenu();
            this.ui.startGameUI();
        }
    }

    handleEnter() {
        if (this.state === 'GAMEOVER' || this.state === 'WIN') {
            this.showMenu();
        }
    }

    isPlaying() {
        return this.state === 'PLAYING';
    }

    startGame(difficulty) {
        this.difficulty = DIFFICULTY_CONFIG[difficulty];
        this.ui.hideMenu();
        this.ui.startGameUI();
        this.ui.updateStatus(this.difficulty.label);

        // Audio
        this.audio.playBGM('bgm');

        // Start New Session
        this.level = 1;
        this.player = new Player(TILE_SIZE, TILE_SIZE);

        this.startLevel();
        this.state = 'PLAYING';
    }

    startLevel() {
        this.map.generate();
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.items = [];

        // Reset Player Position (Keep Score)
        if (this.player) {
            this.player.x = TILE_SIZE;
            this.player.y = TILE_SIZE;
            this.player.isDead = false;
        }

        this.spawnEnemies();

        this.levelMessageTimer = 2000;
        this.ui.updateLevel(this.level);

        // Ensure state is PLAYING so update loop runs
        this.state = 'PLAYING';

        // Restart BGM if needed (optional based on design, but good for restart)
        this.audio.playBGM('bgm');
    }

    spawnEnemies() {
        const baseCount = this.difficulty.enemyCount;
        const count = baseCount + (this.level - 1);
        const speed = this.difficulty.enemySpeed;
        const aiType = this.difficulty.enemyAI;

        for (let i = 0; i < count; i++) {
            let r, c;
            let attempts = 0;
            do {
                r = Math.floor(Math.random() * (ROWS - 2)) + 1;
                c = Math.floor(Math.random() * (COLS - 2)) + 1;
                attempts++;
            } while (
                (this.map.grid[r][c] !== TILE_TYPES.EMPTY ||
                    (r <= 2 && c <= 2)) && // Not near player
                attempts < 100
            );

            if (attempts < 100) {
                this.enemies.push(new Enemy(r, c, speed, aiType));
            }
        }
    }

    placeBomb() {
        if (!this.player || this.state !== 'PLAYING') return;

        // Check if player can place more bombs
        if (this.player.activeBombs >= this.player.bombCapacity) return;

        const r = Math.floor((this.player.y + TILE_SIZE / 2) / TILE_SIZE);
        const c = Math.floor((this.player.x + TILE_SIZE / 2) / TILE_SIZE);

        if (this.map.grid[r][c] !== TILE_TYPES.EMPTY) return;

        const existing = this.bombs.find(b => b.r === r && b.c === c);
        if (existing) return;

        const bomb = new Bomb(r, c, this.player.bombRange);
        this.bombs.push(bomb);
        this.map.grid[r][c] = TILE_TYPES.BOMB;
        this.player.activeBombs++;

        this.audio.play('place_bomb');
    }

    isColliding(pixelX, pixelY) {
        const c = Math.floor(pixelX / TILE_SIZE);
        const r = Math.floor(pixelY / TILE_SIZE);

        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;

        const tile = this.map.grid[r][c];

        if (tile === TILE_TYPES.BOMB) {
            const bomb = this.bombs.find(b => b.r === r && b.c === c);
            if (bomb && !bomb.solid) return false;
            return true;
        }

        return tile === TILE_TYPES.WALL_HARD || tile === TILE_TYPES.WALL_SOFT;
    }

    isCollidingForEnemy(pixelX, pixelY, enemy) {
        const c = Math.floor(pixelX / TILE_SIZE);
        const r = Math.floor(pixelY / TILE_SIZE);

        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;

        const tile = this.map.grid[r][c];

        if (tile === TILE_TYPES.BOMB) {
            const bomb = this.bombs.find(b => b.r === r && b.c === c);

            if (bomb && enemy.standingOnBomb === bomb) {
                return false;
            }

            if (bomb && !bomb.solid) return false;
            return true;
        }

        return tile === TILE_TYPES.WALL_HARD || tile === TILE_TYPES.WALL_SOFT;
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING') return;

        if (this.levelMessageTimer > 0) {
            this.levelMessageTimer -= deltaTime;
            return;
        }

        // Player Movement
        let dx = 0, dy = 0;
        if (this.input.isDown('ArrowUp')) dy = -this.player.speed;
        if (this.input.isDown('ArrowDown')) dy = this.player.speed;
        if (this.input.isDown('ArrowLeft')) dx = -this.player.speed;
        if (this.input.isDown('ArrowRight')) dx = this.player.speed;

        this.player.move(dx, dy, this);

        // Update bomb solidity
        const playerRect = this.player.getRect();
        this.bombs.forEach(bomb => {
            if (!bomb.solid) {
                const bombRect = {
                    x: bomb.c * TILE_SIZE,
                    y: bomb.r * TILE_SIZE,
                    w: TILE_SIZE,
                    h: TILE_SIZE
                };
                if (!rectIntersect(playerRect, bombRect)) {
                    bomb.solid = true;
                }
            }
        });

        // Update bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            if (this.bombs[i].update(deltaTime, this)) {
                this.explode(this.bombs[i]);
                this.bombs.splice(i, 1);
                this.player.activeBombs--;
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            if (this.explosions[i].update(deltaTime)) {
                const e = this.explosions[i];
                if (this.map.grid[e.r][e.c] === TILE_TYPES.EXPLOSION) {
                    this.map.grid[e.r][e.c] = TILE_TYPES.EMPTY;
                }
                this.explosions.splice(i, 1);
            }
        }

        // Check explosion collisions
        this.checkExplosionCollisions();

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this, deltaTime);

            // Update bomb standing status
            const enemyR = Math.floor((enemy.y + TILE_SIZE / 2) / TILE_SIZE);
            const enemyC = Math.floor((enemy.x + TILE_SIZE / 2) / TILE_SIZE);
            const bombHere = this.bombs.find(b => b.r === enemyR && b.c === enemyC);

            if (bombHere && enemy.standingOnBomb === bombHere) {
                const enemyRect = enemy.getRect();
                const bombRect = {
                    x: bombHere.c * TILE_SIZE,
                    y: bombHere.r * TILE_SIZE,
                    w: TILE_SIZE,
                    h: TILE_SIZE
                };

                if (!rectIntersect(enemyRect, bombRect)) {
                    bombHere.solid = true;
                    enemy.standingOnBomb = null;
                }
            } else if (bombHere && !enemy.standingOnBomb) {
                enemy.standingOnBomb = bombHere;
            } else if (!bombHere) {
                enemy.standingOnBomb = null;
            }
        });

        // Check enemy-player collision
        this.checkEnemyPlayerCollision();

        // Level Up
        if (this.enemies.length === 0 && this.state === 'PLAYING') {
            this.level++;
            this.player.score += 1000;
            this.startLevel();
        }

        // Check item pickup
        const pR = Math.floor((this.player.y + TILE_SIZE / 2) / TILE_SIZE);
        const pC = Math.floor((this.player.x + TILE_SIZE / 2) / TILE_SIZE);

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (item.r === pR && item.c === pC) {
                if (item.type === ITEM_TYPES.EXTRA_BOMB) {
                    this.player.bombCapacity++;
                } else if (item.type === ITEM_TYPES.FLAME) {
                    this.player.bombRange++;
                } else if (item.type === ITEM_TYPES.PUSH) {
                    this.player.hasPushAbility = true;
                    this.player.pushTimer = 30000;
                }

                this.items.splice(i, 1);
                this.player.score += 25;
                this.audio.play('powerup');
            }
        }

        // Update push timer
        if (this.player.pushTimer > 0) {
            this.player.pushTimer -= deltaTime;
            if (this.player.pushTimer <= 0) {
                this.player.hasPushAbility = false;
                this.player.pushTimer = 0;
            }
        }

        // Update UI
        this.ui.updateScore(this.player.score);
    }

    explode(bomb) {
        this.createExplosion(bomb.r, bomb.c);
        this.audio.play('explosion');

        const dirs = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];

        dirs.forEach(d => {
            for (let i = 1; i <= bomb.range; i++) {
                const r = bomb.r + d.dr * i;
                const c = bomb.c + d.dc * i;

                if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;

                const tile = this.map.grid[r][c];

                if (tile === TILE_TYPES.WALL_HARD) {
                    break;
                } else if (tile === TILE_TYPES.WALL_SOFT) {
                    this.createExplosion(r, c);
                    this.player.score += 10;
                    this.map.softWallsCount--; // Correctly access softWallsCount

                    if (Math.random() < 0.25) {
                        const itemTypes = [ITEM_TYPES.EXTRA_BOMB, ITEM_TYPES.FLAME, ITEM_TYPES.PUSH];
                        const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                        this.items.push(new Item(r, c, randomType));
                    }

                    break;
                } else {
                    this.createExplosion(r, c);
                }
            }
        });

        this.map.grid[bomb.r][bomb.c] = TILE_TYPES.EXPLOSION;
    }

    createExplosion(r, c) {
        this.explosions.push(new Explosion(r, c));
        this.map.grid[r][c] = TILE_TYPES.EXPLOSION;
    }

    checkExplosionCollisions() {
        this.explosions.forEach(exp => {
            // Check player
            const pR = Math.floor((this.player.y + TILE_SIZE / 2) / TILE_SIZE);
            const pC = Math.floor((this.player.x + TILE_SIZE / 2) / TILE_SIZE);

            if (pR === exp.r && pC === exp.c && !this.player.isDead) {
                this.playerDie();
            }

            // Check enemies
            this.enemies = this.enemies.filter(enemy => {
                const eR = Math.floor((enemy.y + TILE_SIZE / 2) / TILE_SIZE);
                const eC = Math.floor((enemy.x + TILE_SIZE / 2) / TILE_SIZE);

                if (eR === exp.r && eC === exp.c) {
                    this.player.score += 50;
                    return false;
                }
                return true;
            });
        });
    }

    checkEnemyPlayerCollision() {
        if (this.player.isDead) return;

        const playerRect = this.player.getRect();

        this.enemies.forEach(enemy => {
            const enemyRect = enemy.getRect();
            if (rectIntersect(playerRect, enemyRect)) {
                this.playerDie();
            }
        });
    }

    playerDie() {
        this.player.isDead = true;
        this.state = 'GAMEOVER';
        this.ui.showGameOver(this.player.score);
        this.audio.stopBGM();
        this.audio.play('game_over');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'MENU' || !this.player || this.map.grid.length === 0) {
            return;
        }

        this.map.draw(this.ctx); // Rendering logic moved to Map
        this.explosions.forEach(exp => exp.draw(this.ctx));
        this.bombs.forEach(bomb => bomb.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.player.draw(this.ctx);

        // Level overlay manually handled here or UIManager?
        // Let's keep it here for simplicity of access to ctx
        if (this.levelMessageTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.font = 'bold 40px "Segoe UI"';
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, this.canvas.height / 2);

            this.ctx.font = '20px "Segoe UI"';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`Get Ready!`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}
