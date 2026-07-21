/**
 * PIN://CORE Web Audio API Synthesizer & Sound Effects Core
 * Synthesizes dynamic electronic effects and continuous synthwave loop
 */

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.musicPlaying = false;
        this.sfxEnabled = true;
        this.musicEnabled = true;

        this.musicOsc1 = null;
        this.musicOsc2 = null;
        this.musicGain = null;
        this.musicIntervalId = null;

        // Sequence of synth notes for continuous background ambient loop
        this.musicNotes = [
            110.00, 110.00, 130.81, 146.83, 110.00, 110.00, 164.81, 146.83, // A Bassline
            98.00,  98.00,  116.54, 130.81, 98.00,  98.00,  146.83, 130.81,  // G Bassline
            110.00, 110.00, 130.81, 146.83, 110.00, 110.00, 164.81, 146.83, // A Bassline
            123.47, 123.47, 146.83, 164.81, 123.47, 123.47, 196.00, 164.81  // B Bassline
        ];
        this.musicStep = 0;
    }

    initContext() {
        if (!this.ctx) {
            // Audio context must be triggered on user action (click/start)
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    setSFXEnabled(enabled) {
        this.sfxEnabled = enabled;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
    }

    // Dynamic Sound Effects synthesis using pure oscillators
    playSFX(type) {
        if (!this.sfxEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        switch (type) {
            case "click":
                // Fast high pitch click
                osc.type = "sine";
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case "pulse":
                // Soft resonant pulse
                osc.type = "triangle";
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case "glitch":
                // Retro digital glitch sequence
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.setValueAtTime(600, now + 0.04);
                osc.frequency.setValueAtTime(300, now + 0.08);
                osc.frequency.setValueAtTime(900, now + 0.12);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.setValueAtTime(0.15, now + 0.04);
                gainNode.gain.setValueAtTime(0.05, now + 0.08);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
                break;

            case "bass":
                // Rich punchy electronic synth bass
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                // Add sub-harmonic oscillator
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = "triangle";
                subOsc.frequency.setValueAtTime(40, now);
                subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                subGain.gain.setValueAtTime(0.5, now);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                osc.start(now);
                osc.stop(now + 0.3);
                subOsc.start(now);
                subOsc.stop(now + 0.3);
                break;

            case "charge":
                // Swelling energy ramp
                osc.type = "sine";
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
                gainNode.gain.setValueAtTime(0.01, now);
                gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.5);
                gainNode.gain.setValueAtTime(0.2, now + 0.5);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;

            case "laser":
                // Futuristic laser beam
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(2000, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
        }
    }

    // Interactive Synthwave background beat loop
    startMusic() {
        if (!this.musicEnabled || this.musicPlaying) return;
        this.initContext();
        if (!this.ctx) return;

        this.musicPlaying = true;
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        this.musicGain.connect(this.ctx.destination);

        // Run sequential synth arpeggio step sequencer
        const tempo = 140; // BPM
        const stepTime = 60 / tempo / 2; // Eighth notes

        this.musicIntervalId = setInterval(() => {
            if (!this.musicPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Bassline synth note
            const baseFreq = this.musicNotes[this.musicStep % this.musicNotes.length];
            const oscBass = this.ctx.createOscillator();
            const gainBass = this.ctx.createGain();

            oscBass.type = "triangle";
            oscBass.frequency.setValueAtTime(baseFreq, now);
            oscBass.connect(gainBass);
            gainBass.connect(this.musicGain);

            gainBass.gain.setValueAtTime(0.5, now);
            gainBass.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 0.9);

            oscBass.start(now);
            oscBass.stop(now + stepTime * 0.9);

            // Add retro drums / high hat on alternate steps
            if (this.musicStep % 4 === 2) {
                // Snare snare synth sound
                const snareOsc = this.ctx.createOscillator();
                const snareGain = this.ctx.createGain();
                snareOsc.type = "sawtooth";
                snareOsc.frequency.setValueAtTime(180, now);
                snareOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
                snareOsc.connect(snareGain);
                snareGain.connect(this.musicGain);
                snareGain.gain.setValueAtTime(0.15, now);
                snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                snareOsc.start(now);
                snareOsc.stop(now + 0.08);
            }

            // Lead Synth arpeggios mapping based on level progress
            if (this.musicStep % 8 === 0 || this.musicStep % 8 === 3 || this.musicStep % 8 === 6) {
                const oscLead = this.ctx.createOscillator();
                const gainLead = this.ctx.createGain();
                oscLead.type = "sine";
                // Transposed high melody note
                oscLead.frequency.setValueAtTime(baseFreq * 4, now);
                oscLead.connect(gainLead);
                gainLead.connect(this.musicGain);

                gainLead.gain.setValueAtTime(0.15, now);
                gainLead.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.8);

                oscLead.start(now);
                oscLead.stop(now + stepTime * 0.8);
            }

            this.musicStep++;
        }, stepTime * 1000);
    }

    stopMusic() {
        if (this.musicIntervalId) {
            clearInterval(this.musicIntervalId);
            this.musicIntervalId = null;
        }
        if (this.musicGain) {
            try {
                this.musicGain.disconnect();
            } catch (e) {}
            this.musicGain = null;
        }
        this.musicPlaying = false;
    }
}
export const audio = new AudioManager();
