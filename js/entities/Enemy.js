import { TILE_SIZE, COLORS } from '../core/Constants.js';

export default class Enemy {
    constructor(r, c, speed, aiType) {
        this.x = c * TILE_SIZE;
        this.y = r * TILE_SIZE;
        this.speed = speed;
        this.aiType = aiType;
        this.radius = TILE_SIZE * 0.35;
        this.direction = this.getRandomDirection();
        this.isDead = false;
        this.moveTimer = 0;
        this.thinkInterval = 500; // ms between AI decisions
        this.standingOnBomb = null; // Track bomb this enemy is on
    }

    getRandomDirection() {
        const dirs = [
            { dx: 0, dy: -1 },  // Up
            { dx: 0, dy: 1 },   // Down
            { dx: -1, dy: 0 },  // Left
            { dx: 1, dy: 0 }    // Right
        ];
        return dirs[Math.floor(Math.random() * dirs.length)];
    }

    getRect() {
        const size = TILE_SIZE * 0.5; // Smaller collision box for better accuracy
        const offset = (TILE_SIZE - size) / 2;
        return {
            x: this.x + offset,
            y: this.y + offset,
            w: size,
            h: size
        };
    }

    update(game, deltaTime) {
        if (this.isDead) return;

        this.moveTimer += deltaTime;

        // AI Decision Making
        if (this.moveTimer >= this.thinkInterval) {
            this.moveTimer = 0;

            if (this.aiType === 'smart') {
                this.smartAI(game);
            } else {
                // Random AI - occasionally change direction
                if (Math.random() < 0.1) {
                    this.direction = this.getRandomDirection();
                }
            }
        }

        // Move in current direction
        const dx = this.direction.dx * this.speed;
        const dy = this.direction.dy * this.speed;

        const newX = this.x + dx;
        const newY = this.y + dy;

        // Get new position rect
        const size = TILE_SIZE * 0.5;
        const offset = (TILE_SIZE - size) / 2;
        const newRect = {
            x: newX + offset,
            y: newY + offset,
            w: size,
            h: size
        };

        // Check collision (passing 'this' so isColliding knows it's an enemy)
        if (!game.isCollidingForEnemy(newRect.x, newRect.y, this) &&
            !game.isCollidingForEnemy(newRect.x + newRect.w, newRect.y, this) &&
            !game.isCollidingForEnemy(newRect.x, newRect.y + newRect.h, this) &&
            !game.isCollidingForEnemy(newRect.x + newRect.w, newRect.y + newRect.h, this)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Hit a wall, change direction
            this.direction = this.getRandomDirection();
        }
    }

    smartAI(game) {
        const player = game.player;
        const myGridR = Math.floor((this.y + TILE_SIZE / 2) / TILE_SIZE);
        const myGridC = Math.floor((this.x + TILE_SIZE / 2) / TILE_SIZE);
        const playerGridR = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);
        const playerGridC = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);

        // Simple line-of-sight: Same row or column?
        if (myGridR === playerGridR) {
            // Move horizontally toward player
            this.direction = myGridC < playerGridC ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
        } else if (myGridC === playerGridC) {
            // Move vertically toward player
            this.direction = myGridR < playerGridR ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };
        } else {
            // Not in line of sight, use random movement
            if (Math.random() < 0.2) {
                this.direction = this.getRandomDirection();
            }
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        const cx = this.x + TILE_SIZE / 2;
        const cy = this.y + TILE_SIZE / 2;

        // Body
        ctx.fillStyle = COLORS.ENEMY;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (angry)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 2, 3, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 1, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Mean mouth
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 4, 5, 0, Math.PI);
        ctx.stroke();
    }
}
