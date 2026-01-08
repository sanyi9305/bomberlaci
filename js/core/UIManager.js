export default class UIManager {
    constructor() {
        this.elements = {
            menu: document.getElementById('menu-overlay'),
            status: document.getElementById('status'),
            difficulty: document.getElementById('difficulty-indicator'),
            score: document.getElementById('score'),
            level: document.getElementById('level'),
            mobileControls: document.getElementById('mobile-controls'),
            gameOverScreen: document.getElementById('game-over-screen'),
            finalScore: document.getElementById('final-score'),
            tryAgainBtn: document.getElementById('try-again-btn'),
            mainMenuBtn: document.getElementById('main-menu-btn'),
            difficultyBtns: document.querySelectorAll('.difficulty-btn'),
            bgmVolume: document.getElementById('bgm-volume'),
            sfxVolume: document.getElementById('sfx-volume'),
            bgmMute: document.getElementById('bgm-mute'),
            sfxMute: document.getElementById('sfx-mute')
        };
    }

    setupMenu(startGameCallback) {
        this.elements.difficultyBtns.forEach(btn => {
            // Remove old listeners to prevent duplicates if any reset happens (though UIManager is usually singleton)
            // Using simple onclick for safety or assume new instance
            btn.onclick = () => {
                const difficulty = btn.getAttribute('data-difficulty');
                startGameCallback(difficulty);
            };
        });
    }

    setupGameOver(restartCallback, menuCallback) {
        this.elements.tryAgainBtn.onclick = () => {
            this.hideGameOver();
            this.showMobileControls();
            restartCallback();
        };

        this.elements.mainMenuBtn.onclick = () => {
            this.hideGameOver();
            menuCallback();
        };
    }

    setupAudioControls(audioManager) {
        // BGM Volume
        this.elements.bgmVolume.oninput = (e) => {
            audioManager.setBGMVolume(e.target.value);
        };
        // SFX Volume
        this.elements.sfxVolume.oninput = (e) => {
            audioManager.setSFXVolume(e.target.value);
        };
        // BGM Mute
        this.elements.bgmMute.onchange = (e) => {
            audioManager.toggleBGMMute(e.target.checked);
        };
        // SFX Mute
        this.elements.sfxMute.onchange = (e) => {
            audioManager.toggleSFXMute(e.target.checked);
        };
    }

    showMenu() {
        this.elements.menu.classList.remove('hidden');
        this.elements.status.textContent = 'Menu';
        this.elements.difficulty.textContent = '';
    }

    hideMenu() {
        this.elements.menu.classList.add('hidden');
    }

    updateStatus(difficultyLabel) {
        this.elements.difficulty.textContent = difficultyLabel;
    }

    updateScore(score) {
        this.elements.score.textContent = `Score: ${score}`;
    }

    updateLevel(level) {
        this.elements.level.textContent = `Level: ${level}`;
    }

    startGameUI() {
        this.elements.status.textContent = 'Playing';
        this.elements.status.style.color = '#fff'; // Reset color
        this.elements.mobileControls.style.display = ''; // Reset CSS
    }

    showGameOver(score) {
        this.elements.gameOverScreen.classList.remove('hidden');
        this.elements.finalScore.textContent = `Final Score: ${score}`;
        this.elements.mobileControls.style.display = 'none';
        this.elements.status.textContent = 'GAME OVER';
        this.elements.status.style.color = '#e74c3c';
    }

    hideGameOver() {
        this.elements.gameOverScreen.classList.add('hidden');
    }

    showMobileControls() {
        this.elements.mobileControls.style.display = '';
    }
}
