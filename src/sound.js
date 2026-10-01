// sound.js - Web Audio API Synthesizer for Sheep & Wolf

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.2, gainStart = 0.3, gainEnd = 0.001) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainStart * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(gainEnd, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Sheep bleat ("Baaa")
  playSheepBleat() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // Vibrato frequency sweep
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(350, now + 0.1);
      osc.frequency.linearRampToValueAtTime(310, now + 0.25);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Wolf howl / growl
  playWolfSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // Grass munching crunch
  playMunch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Two quick clicks
      this.playTone(450, 'triangle', 0.08, 0.25, 0.01);
      setTimeout(() => {
        this.playTone(550, 'triangle', 0.09, 0.3, 0.01);
      }, 70);
    } catch (e) {}
  }

  // Breeding chime (sweet sparkle)
  playBreeding() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.3, 0.2, 0.01);
      }, idx * 80);
    });
  }

  // Turn step / End Week whoosh
  playTurnStep() {
    this.playTone(280, 'sine', 0.15, 0.25, 0.01);
  }

  // Wolf eating sheep
  playWolfEat() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.playTone(180, 'sawtooth', 0.2, 0.3, 0.01);
      setTimeout(() => {
        this.playTone(120, 'sawtooth', 0.3, 0.35, 0.01);
      }, 120);
    } catch (e) {}
  }

  // Level Win Fanfare
  playWinFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 150 }, // C5
      { f: 659.25, d: 150 }, // E5
      { f: 783.99, d: 150 }, // G5
      { f: 1046.50, d: 400 } // C6
    ];
    let time = 0;
    melody.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, 'triangle', note.d / 1000, 0.35, 0.01);
      }, time);
      time += note.d;
    });
  }

  // Game Over Sad Sound
  playGameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const melody = [
      { f: 392.00, d: 250 }, // G4
      { f: 369.99, d: 250 }, // F#4
      { f: 349.23, d: 300 }, // F4
      { f: 293.66, d: 600 }  // D4
    ];
    let time = 0;
    melody.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, 'sawtooth', note.d / 1000, 0.2, 0.01);
      }, time);
      time += note.d;
    });
  }

  // Celebratory Happy Birthday Tune
  playBirthdayTune() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Happy Birthday notes (G4 G4 A4 G4 C5 B4 | G4 G4 A4 G4 D5 C5)
    const notes = [
      { f: 392.00, d: 240 }, // G4
      { f: 392.00, d: 240 }, // G4
      { f: 440.00, d: 420 }, // A4
      { f: 392.00, d: 420 }, // G4
      { f: 523.25, d: 420 }, // C5
      { f: 493.88, d: 750 }, // B4

      { f: 392.00, d: 240 }, // G4
      { f: 392.00, d: 240 }, // G4
      { f: 440.00, d: 420 }, // A4
      { f: 392.00, d: 420 }, // G4
      { f: 587.33, d: 420 }, // D5
      { f: 523.25, d: 850 }  // C5
    ];
    let time = 0;
    notes.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, 'triangle', note.d / 1000, 0.35, 0.01);
      }, time);
      time += note.d + 60;
    });
  }
}

export const soundManager = new SoundManager();
