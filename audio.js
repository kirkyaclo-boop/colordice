// Sound synthesizer using Web Audio API (Zero external assets, works offline)
class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.6;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Wood / Dice impact click
    playDiceClick(freq = 420, decay = 0.08, volMultiplier = 1.0) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Wooden resonance
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + decay);

        // Lowpass filter for deep wooden thud
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        gain.gain.setValueAtTime(this.volume * 0.4 * volMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay);

        // Add small burst of noise for dice texture
        this.playNoiseBurst(decay * 0.7, 0.15 * volMultiplier);
    }

    playNoiseBurst(duration, vol) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.volume * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    // Sound during the dice roll sequence
    playRollSequence(durationMs = 1200) {
        if (!this.enabled) return;
        this.init();
        
        const count = 10;
        const interval = durationMs / count;
        for (let i = 0; i < count; i++) {
            const delay = (i * interval) + (Math.random() * 30 - 15);
            setTimeout(() => {
                const pitch = 350 + Math.random() * 200;
                const vol = (1 - (i / (count * 1.5))) * 0.9;
                this.playDiceClick(pitch, 0.06 + Math.random() * 0.04, vol);
            }, Math.max(0, delay));
        }
    }

    // Solid landing impact
    playLandThud() {
        if (!this.enabled) return;
        this.init();
        this.playDiceClick(220, 0.15, 1.5);
        setTimeout(() => this.playDiceClick(280, 0.1, 0.8), 60);
    }

    // Chip sound
    playChipSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Tactile UI click
    playUiClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(this.volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
    }

    // Win chime / fanfare
    playWin(matchCount = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const baseNotes = matchCount >= 3 
            ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5, E5, G5, C6, E6, G6
            : matchCount === 2 
            ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
            : [523.25, 659.25, 783.99]; // C5, E5, G5

        baseNotes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(this.volume * 0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.35);
            }, idx * 90);
        });
    }
}

window.soundFX = new SoundFX();
