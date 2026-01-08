import { TILE_SIZE, COLS, ROWS, TILE_TYPES, ASSETS } from '../core/Constants.js';

export default class GameMap {
    constructor() {
        this.grid = [];
        this.softWallsCount = 0;
    }

    generate(softWallsCount = 0) { // softWallsCount parameter for tracking? 
        // Actually, the map generation determines the count. 
        // The Game class tracks it for win condition/score if needed, or we track it here.
        // Let's track it here and let Game access it.

        this.grid = [];
        this.softWallsCount = 0;

        for (let r = 0; r < ROWS; r++) {
            const row = [];
            for (let c = 0; c < COLS; c++) {
                // Borders
                if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
                    row.push(TILE_TYPES.WALL_HARD);
                }
                // Checkerboard pattern
                else if (r % 2 === 0 && c % 2 === 0) {
                    row.push(TILE_TYPES.WALL_HARD);
                }
                // Safe zone around player start
                else if ((r === 1 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 1)) {
                    row.push(TILE_TYPES.EMPTY);
                }
                // Random soft walls
                else if (Math.random() < 0.35) {
                    row.push(TILE_TYPES.WALL_SOFT);
                    this.softWallsCount++;
                } else {
                    row.push(TILE_TYPES.EMPTY);
                }
            }
            this.grid.push(row);
        }
    }

    draw(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        // 1. Draw Checkerboard Floor
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                // Alternate colors
                if ((r + c) % 2 === 0) {
                    ctx.fillStyle = '#2c2c2c'; // Dark Charcoal
                } else {
                    ctx.fillStyle = '#363636'; // Slightly Lighter Grey
                }
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }

        // 2. Vignette Effect (Cinematic Shadow)
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, TILE_SIZE * 3, // Inner circle
            width / 2, height / 2, width          // Outer circle
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");     // Transparent center
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");   // Dark corners

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 3. Draw Walls
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                const tile = this.grid[r][c];

                if (tile === TILE_TYPES.WALL_HARD) {
                    // --- KŐFAL (HARD WALL) ---
                    const img = ASSETS.tiles[TILE_TYPES.WALL_HARD];
                    if (img && img.complete && img.naturalWidth !== 0) {
                        ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
                    } else {
                        // Emoji Fallback
                        this.drawEmoji(ctx, '🧱', x, y);
                    }

                } else if (tile === TILE_TYPES.WALL_SOFT) {
                    // --- DOBOZ (SOFT WALL) ---
                    const img = ASSETS.tiles[TILE_TYPES.WALL_SOFT];
                    if (img && img.complete && img.naturalWidth !== 0) {
                        ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
                    } else {
                        // Emoji Fallback
                        this.drawEmoji(ctx, '📦', x, y);
                    }
                }
            }
        }
    }

    drawEmoji(ctx, char, x, y) {
        const fontSize = Math.floor(TILE_SIZE * 0.90);
        ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillText(char, x + TILE_SIZE / 2, y + TILE_SIZE / 2 + (fontSize * 0.1));
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}
