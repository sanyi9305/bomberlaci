import { TILE_SIZE, COLORS, ASSETS, TILE_TYPES } from '../core/Constants.js';

export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 2;
        this.radius = TILE_SIZE * 0.35;
        this.isDead = false;
        this.score = 0;

        // Power-up Stats
        this.bombCapacity = 1;      // Max bombs at once
        this.bombRange = 2;          // Explosion radius
        this.hasPushAbility = false; // Can kick bombs
        this.pushTimer = 0;          // Duration tracker (30s)
        this.activeBombs = 0;        // Current bombs placed
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

    move(dx, dy, game) {
        if (this.isDead) return;

        const newX = this.x + dx;
        const newY = this.y + dy;
        const rect = this.getRect();

        // Update rect for new position to check probes
        const size = TILE_SIZE * 0.5;
        const offset = (TILE_SIZE - size) / 2;
        const newRect = {
            x: newX + offset,
            y: newY + offset,
            w: size,
            h: size
        };


        // Check for bomb kick
        if (this.hasPushAbility && (dx !== 0 || dy !== 0)) {
            // Determine probe point based on direction
            let probeX, probeY;
            const cx = newRect.x + newRect.w / 2;
            const cy = newRect.y + newRect.h / 2;

            if (dx > 0) { // Right
                probeX = newRect.x + newRect.w + 4; // Look ahead
                probeY = cy;
            } else if (dx < 0) { // Left
                probeX = newRect.x - 4;
                probeY = cy;
            } else if (dy > 0) { // Down
                probeX = cx;
                probeY = newRect.y + newRect.h + 4;
            } else if (dy < 0) { // Up
                probeX = cx;
                probeY = newRect.y - 4;
            }

            const targetR = Math.floor(probeY / TILE_SIZE);
            const targetC = Math.floor(probeX / TILE_SIZE);

            // Check if moving into a bomb
            const bombHere = game.bombs.find(b => b.r === targetR && b.c === targetC && b.solid);
            if (bombHere && !bombHere.isSliding) {
                // Trigger bomb kick
                const direction = {
                    dr: dy > 0 ? 1 : (dy < 0 ? -1 : 0),
                    dc: dx > 0 ? 1 : (dx < 0 ? -1 : 0)
                };

                bombHere.isSliding = true;
                bombHere.slideDirection = direction;
                bombHere.slideTilesRemaining = 5; // Kick bomb 5 tiles

                // Clear the bomb from its current map position
                game.map.grid[bombHere.r][bombHere.c] = TILE_TYPES.EMPTY;
                bombHere.solid = false; // Make it passable so player can walk through

                // Allow player to move into the space
            }
        }

        // Check all corners
        if (!game.isColliding(newRect.x, newRect.y) &&
            !game.isColliding(newRect.x + newRect.w, newRect.y) &&
            !game.isColliding(newRect.x, newRect.y + newRect.h) &&
            !game.isColliding(newRect.x + newRect.w, newRect.y + newRect.h)) {
            this.x = newX;
            this.y = newY;
            return;
        }

        // Slide along walls (try X only)
        if (dx !== 0) {
            const slideRect = {
                x: newX + offset,
                y: this.y + offset,
                w: size,
                h: size
            };
            if (!game.isColliding(slideRect.x, slideRect.y) &&
                !game.isColliding(slideRect.x + slideRect.w, slideRect.y) &&
                !game.isColliding(slideRect.x, slideRect.y + slideRect.h) &&
                !game.isColliding(slideRect.x + slideRect.w, slideRect.y + slideRect.h)) {
                this.x = newX;
                return;
            }
        }

        // Slide along walls (try Y only)
        if (dy !== 0) {
            const slideRect = {
                x: this.x + offset,
                y: newY + offset,
                w: size,
                h: size
            };
            if (!game.isColliding(slideRect.x, slideRect.y) &&
                !game.isColliding(slideRect.x + slideRect.w, slideRect.y) &&
                !game.isColliding(slideRect.x, slideRect.y + slideRect.h) &&
                !game.isColliding(slideRect.x + slideRect.w, slideRect.y + slideRect.h)) {
                this.y = newY;
            }
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        if (ASSETS.player && ASSETS.player.complete && ASSETS.player.naturalWidth !== 0) {
            // Draw Image
            ctx.drawImage(ASSETS.player, this.x, this.y, TILE_SIZE, TILE_SIZE);
        } else {
            // Fallback: Original Shape
            const cx = this.x + TILE_SIZE / 2;
            const cy = this.y + TILE_SIZE / 2;

            // Body
            ctx.fillStyle = COLORS.PLAYER;
            ctx.beginPath();
            ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 2, 3, 0, Math.PI * 2);
            ctx.arc(cx + 5, cy - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 2, 1.5, 0, Math.PI * 2);
            ctx.arc(cx + 5, cy - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
