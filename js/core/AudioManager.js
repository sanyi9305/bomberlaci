export default class AudioManager {
    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        AudioManager.instance = this;

        this.sounds = {};
        this.bgm = null;

        // Volume State
        this.bgmVolume = 0.5;
        this.sfxVolume = 1.0;
        this.isBgmMuted = false;
        this.isSfxMuted = false;

        // Audio Context (created on first interaction)
        this.audioCtx = null;
        this.bgmGain = null;
        this.sfxGain = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // Create separate gain nodes
            this.bgmGain = this.audioCtx.createGain();
            this.sfxGain = this.audioCtx.createGain();

            this.updateGains();

            this.bgmGain.connect(this.audioCtx.destination);
            this.sfxGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    updateGains() {
        if (this.bgmGain) {
            this.bgmGain.gain.value = this.isBgmMuted ? 0 : this.bgmVolume;
        }
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.isSfxMuted ? 0 : this.sfxVolume;
        }
    }

    async load(audioFiles) {
        this.init();

        const promises = Object.entries(audioFiles).map(async ([name, src]) => {
            try {
                const response = await fetch(src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                this.sounds[name] = audioBuffer;
            } catch (error) {
                console.error(`Failed to load sound: ${name}`, error);
            }
        });

        await Promise.all(promises);
    }

    play(name) {
        if (!this.sounds[name]) return;

        // Auto-resume on play attempt if needed (for browser policy)
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const source = this.audioCtx.createBufferSource();
        source.buffer = this.sounds[name];
        // Connect to SFX gain node
        if (this.sfxGain) {
            source.connect(this.sfxGain);
        } else {
            source.connect(this.audioCtx.destination);
        }
        source.start(0);
    }

    playBGM(name) {
        if (!this.sounds[name]) return;

        if (this.bgm) {
            this.bgm.stop();
        }

        const source = this.audioCtx.createBufferSource();
        source.buffer = this.sounds[name];
        source.loop = true;

        // Connect to BGM gain node
        if (this.bgmGain) {
            source.connect(this.bgmGain);
        } else {
            source.connect(this.audioCtx.destination);
        }

        source.start(0);
        this.bgm = source;
    }

    stopBGM() {
        if (this.bgm) {
            this.bgm.stop();
            this.bgm = null;
        }
    }

    setBGMVolume(value) {
        this.bgmVolume = Math.max(0, Math.min(1, parseFloat(value)));
        this.updateGains();
    }

    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, parseFloat(value)));
        this.updateGains();
    }

    toggleBGMMute(isMuted) {
        this.isBgmMuted = isMuted !== undefined ? isMuted : !this.isBgmMuted;
        this.updateGains();
        return this.isBgmMuted;
    }

    toggleSFXMute(isMuted) {
        this.isSfxMuted = isMuted !== undefined ? isMuted : !this.isSfxMuted;
        this.updateGains();
        return this.isSfxMuted;
    }

    suspend() {
        if (this.audioCtx && this.audioCtx.state === 'running') {
            this.audioCtx.suspend();
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

}
