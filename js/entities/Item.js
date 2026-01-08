import { TILE_SIZE, ITEM_TYPES, ASSETS } from '../core/Constants.js';

export default class Item {
    constructor(r, c, type) {
        this.r = r;
        this.c = c;
        this.type = type;
    }

    draw(ctx) {
        const x = this.c * TILE_SIZE;
        const y = this.r * TILE_SIZE;

        const img = ASSETS.items[this.type];

        // Use image if loaded
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            return;
        }

        // Fallback: Emojis with background for visibility
        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;
        const boxSize = TILE_SIZE - 8;

        // Draw generic item background to ensure visibility
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + 4, y + 4, boxSize, boxSize);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeRect(x + 4, y + 4, boxSize, boxSize);

        // Draw Emoji
        ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.type === ITEM_TYPES.EXTRA_BOMB) {
            ctx.fillText('💣', centerX, centerY + 2);
        } else if (this.type === ITEM_TYPES.FLAME) {
            ctx.fillText('🔥', centerX, centerY + 2);
        } else if (this.type === ITEM_TYPES.PUSH) {
            ctx.fillText('💪', centerX, centerY + 2);
        }
    }
}
