
export class SoundManager {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;

    constructor() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API not supported");
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (enabled && this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    private playTone(frequency: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) {
        if (!this.enabled || !this.audioContext) return;

        // Resume context if suspended (browser policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.error("Audio resume failed", e));
        }

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime + startTime);

        gain.gain.setValueAtTime(volume, this.audioContext.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(this.audioContext.currentTime + startTime);
        osc.stop(this.audioContext.currentTime + startTime + duration);
    }

    playClick() {
        this.playTone(400, 'sine', 0.1, 0, 0.05);
    }

    playSelect() {
        this.playTone(600, 'sine', 0.1, 0, 0.05);
    }

    playConnect() {
        this.playTone(800, 'sine', 0.08, 0, 0.05);
    }

    playSuccess() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(523.25, 'sine', 0.1, 0, 0.1); // C5
        this.playTone(659.25, 'sine', 0.3, 0.1, 0.1); // E5
    }

    playBonus() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(880, 'sine', 0.1, 0, 0.1);
        this.playTone(1100, 'sine', 0.2, 0.1, 0.1);
    }

    playError() {
        if (!this.enabled || !this.audioContext) return;
        this.playTone(150, 'sawtooth', 0.2, 0, 0.08);
    }

    playLevelComplete() {
        if (!this.enabled || !this.audioContext) return;
        // C Major Arpeggio
        this.playTone(523.25, 'sine', 0.2, 0, 0.1); // C5
        this.playTone(659.25, 'sine', 0.2, 0.15, 0.1); // E5
        this.playTone(783.99, 'sine', 0.2, 0.30, 0.1); // G5
        this.playTone(1046.50, 'sine', 0.6, 0.45, 0.1); // C6
    }

    playDiceRoll() {
        if (!this.enabled || !this.audioContext) return;
        // Simulate tumbling with varying low tones
        const count = 5;
        for (let i = 0; i < count; i++) {
            const time = i * 0.06;
            const freq = 100 + Math.random() * 200;
            this.playTone(freq, 'square', 0.05, time, 0.05);
        }
        // Final thud
        this.playTone(80, 'square', 0.2, count * 0.06, 0.1);
    }
}
