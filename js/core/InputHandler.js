export default class InputHandler {
    constructor(game) {
        this.game = game; // Reference to game for triggering actions like 'placeBomb'
        this.keys = {};
        this.setupEventListeners();
        this.setupMobileControls();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }

            // Trigger actions that require single press
            if (e.code === 'Space' && this.game.isPlaying()) {
                this.game.placeBomb();
            }

            if (e.code === 'Escape') {
                this.game.toggleMenu();
            }

            if (e.code === 'Enter') {
                this.game.handleEnter();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupMobileControls() {
        const handleInput = (key, active) => {
            this.keys[key] = active;

            // SPECIAL handling for Bomb button to match direct keydown behavior
            if (key === 'Space' && active && this.game.isPlaying()) {
                this.game.placeBomb();
            }
        };

        const buttons = document.querySelectorAll('.d-btn, .action-btn');

        buttons.forEach(btn => {
            const key = btn.getAttribute('data-key');

            // Touch Events
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling/zooming
                handleInput(key, true);
                btn.classList.add('active');
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleInput(key, false);
                btn.classList.remove('active');
            });

            // Mouse Events (for testing on desktop)
            btn.addEventListener('mousedown', (e) => {
                handleInput(key, true);
                btn.classList.add('active');
            });

            btn.addEventListener('mouseup', (e) => {
                handleInput(key, false);
                btn.classList.remove('active');
            });

            btn.addEventListener('mouseleave', (e) => {
                handleInput(key, false);
                btn.classList.remove('active');
            });
        });
    }

    isDown(code) {
        return !!this.keys[code];
    }
}
