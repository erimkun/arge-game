/**
 * Sound Utility using Web Audio API
 * No external assets required!
 */

// AudioContext singleton to prevent multiple contexts
let audioContext = null;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
};

// Basit osilatör sesi
const playTone = (freq, type, duration, vol = 0.1) => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.error('Audio play failed', e);
    }
};

export const playSound = {
    click: () => playTone(800, 'sine', 0.1, 0.05),

    join: () => {
        setTimeout(() => playTone(600, 'sine', 0.1, 0.1), 0);
        setTimeout(() => playTone(800, 'sine', 0.1, 0.1), 100);
        setTimeout(() => playTone(1200, 'sine', 0.3, 0.1), 200);
    },

    vote: () => {
        playTone(400, 'triangle', 0.1, 0.1);
        setTimeout(() => playTone(600, 'triangle', 0.2, 0.1), 50);
    },

    error: () => {
        playTone(150, 'sawtooth', 0.3, 0.1);
    },

    win: () => {
        const now = 0;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'sine', 0.5, 0.1), i * 150);
        });
    }
};
