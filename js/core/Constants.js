export const TILE_SIZE = 40;
export const COLS = 15;
export const ROWS = 13;

export const TILE_TYPES = {
    EMPTY: 0,
    WALL_HARD: 1,
    WALL_SOFT: 2,
    BOMB: 3,
    EXPLOSION: 4
};

export const COLORS = {
    BACKGROUND: '#27ae60',
    WALL_HARD: '#2c3e50',
    WALL_SOFT: '#d35400',
    BOMB: '#222',
    EXPLOSION: '#f39c12',
    EXPLOSION_CENTER: '#f1c40f',
    PLAYER: '#3498db',
    ENEMY: '#e74c3c'
};

export const DIFFICULTY_CONFIG = {
    beginner: {
        enemyCount: 3,
        enemySpeed: 0.8,
        enemyAI: 'random',
        label: '🟢 Beginner'
    },
    advanced: {
        enemyCount: 5,
        enemySpeed: 1.2,
        enemyAI: 'random',
        label: '🟡 Advanced'
    },
    pro: {
        enemyCount: 8,
        enemySpeed: 1.8,
        enemyAI: 'smart',
        label: '🔴 Pro'
    }
};

export const ITEM_TYPES = {
    EXTRA_BOMB: 'EXTRA_BOMB',
    FLAME: 'FLAME',
    PUSH: 'PUSH'
};

// Asset Loading
export const ASSETS = {
    tiles: {},
    items: {},
    player: new Image()
};

export const AUDIO_FILES = {
    explosion: 'assets/sounds/explosion.wav',
    place_bomb: 'assets/sounds/place_bomb.wav',
    powerup: 'assets/sounds/powerup.wav',
    game_over: 'assets/sounds/game_over.wav',
    bgm: 'assets/sounds/bgm.mp3'
};

// Pre-load logic
const TILE_IMAGES = {
    [TILE_TYPES.WALL_HARD]: 'assets/tile_wall_hard.png',
    [TILE_TYPES.WALL_SOFT]: 'assets/tile_wall_soft.png',
    [TILE_TYPES.BOMB]: 'assets/tile_bomb.png',
    [TILE_TYPES.EXPLOSION]: 'assets/tile_explosion.png'
};

const ITEM_IMAGE_SOURCES = {
    [ITEM_TYPES.EXTRA_BOMB]: 'assets/item_bomb.png',
    [ITEM_TYPES.FLAME]: 'assets/item_flame.png',
    [ITEM_TYPES.PUSH]: 'assets/item_push.png'
};

// Start loading tiles
Object.entries(TILE_IMAGES).forEach(([type, src]) => {
    const img = new Image();
    img.src = src;
    ASSETS.tiles[type] = img;
});

// Start loading items
Object.entries(ITEM_IMAGE_SOURCES).forEach(([type, src]) => {
    const img = new Image();
    img.src = src;
    ASSETS.items[type] = img;
});

// Start loading player
ASSETS.player.src = 'assets/player.png';
