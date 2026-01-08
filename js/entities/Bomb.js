import { TILE_SIZE, TILE_TYPES, ROWS, COLS, ASSETS } from '../core/Constants.js';

export default class Bomb {
    constructor(r, c, range = 2) {
        this.r = r;
        this.c = c;
        this.timer = 3000; // 3 seconds
        this.solid = false;
        this.range = range;

        // Sliding/Kick properties
        this.isSliding = false;
        this.slideDirection = null; // { dr, dc }
        this.slideSpeed = 3; // pixels per frame
        this.slideX = c * TILE_SIZE; // Pixel position for smooth sliding
        this.slideY = r * TILE_SIZE;
        this.slideTilesRemaining = 0;
    }

    update(deltaTime, game) {
        this.timer -= deltaTime;

        // Handle sliding movement
        if (this.isSliding && this.slideTilesRemaining > 0) {
            const targetX = this.slideX + this.slideDirection.dc * this.slideSpeed;
            const targetY = this.slideY + this.slideDirection.dr * this.slideSpeed;

            // Check if we've moved far enough to cross into next tile
            const oldTileC = Math.floor(this.slideX / TILE_SIZE);
            const oldTileR = Math.floor(this.slideY / TILE_SIZE);
            const newTileC = Math.floor(targetX / TILE_SIZE);
            const newTileR = Math.floor(targetY / TILE_SIZE);

            // Check collision at target tile
            if (newTileC !== oldTileC || newTileR !== oldTileR) {
                // Check if target tile is valid
                if (newTileR < 0 || newTileR >= ROWS || newTileC < 0 || newTileC >= COLS ||
                    game.map.grid[newTileR][newTileC] === TILE_TYPES.WALL_HARD ||
                    game.map.grid[newTileR][newTileC] === TILE_TYPES.WALL_SOFT ||
                    game.map.grid[newTileR][newTileC] === TILE_TYPES.BOMB) {

                    // Stop sliding
                    this.isSliding = false;
                    this.slideTilesRemaining = 0;
                    this.solid = true; // Make solid when hitting obstacle
                    // Snap to current tile
                    this.slideX = oldTileC * TILE_SIZE;
                    this.slideY = oldTileR * TILE_SIZE;
                    return this.timer <= 0;
                }

                // Update map - remove bomb from old position
                // NOTE: In the original, map holds tile types. 
                // We need to ensure Game logic coordinates this.
                // Here we assume game.map.grid[r][c] works.
                if (game.map.grid[oldTileR][oldTileC] === TILE_TYPES.BOMB) {
                    game.map.grid[oldTileR][oldTileC] = TILE_TYPES.EMPTY;
                }
                // Add to new position
                this.r = newTileR;
                this.c = newTileC;
                game.map.grid[newTileR][newTileC] = TILE_TYPES.BOMB;


                this.slideTilesRemaining--;
                if (this.slideTilesRemaining <= 0) {
                    this.isSliding = false;
                    this.solid = true; // Make bomb solid again when it stops
                }
            }

            this.slideX = targetX;
            this.slideY = targetY;
        }

        return this.timer <= 0;
    }

    draw(ctx) {
        // 1. Pozíció kiszámítása (csúszás vagy rács alapú)
        const rawX = this.isSliding ? this.slideX : this.c * TILE_SIZE;
        const rawY = this.isSliding ? this.slideY : this.r * TILE_SIZE;

        // Középpont kiszámítása
        const centerX = rawX + TILE_SIZE / 2;
        const centerY = rawY + TILE_SIZE / 2;

        const bombImg = ASSETS.tiles[TILE_TYPES.BOMB];

        // --- "A" TERV: KÉP KIRAJZOLÁSA ---
        if (bombImg && bombImg.complete && bombImg.naturalWidth !== 0) {
            const padding = 2; // Pici margó, hogy ne érjen össze a szomszédokkal
            const size = TILE_SIZE - (padding * 2);
            ctx.drawImage(
                bombImg,
                Math.floor(rawX + padding),
                Math.floor(rawY + padding),
                size,
                size
            );
            return; // Ha kész a kép, itt meg is állunk.
        }


        const fontSize = Math.floor(TILE_SIZE * 0.75);

        ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText('💣', centerX, centerY + (fontSize * 0.1));

        // 5. Árnyék kikapcsolása
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}
