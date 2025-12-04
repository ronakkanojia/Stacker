class AudioManager {
  private ctx: AudioContext | null = null;
  // C Major Scale frequencies
  private notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];

  constructor() {
    // We defer creation until first interaction to satisfy browser policies
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playPlace(score: number) {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Calculate pitch based on C Major scale
    // We loop through the 7 notes, increasing octave every 7 blocks
    const noteIndex = score % 7;
    const octave = Math.floor(score / 7);
    const baseFreq = this.notes[noteIndex];
    // Every 7 blocks (octave), frequency doubles
    const freq = baseFreq * Math.pow(2, octave);

    // Limit max frequency to avoid it getting too piercing (cap at ~2000Hz)
    osc.frequency.setValueAtTime(Math.min(freq, 2093), t);
    osc.type = 'sine';

    // Envelope (Attack -> Decay)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playFail() {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }
}

export const audioManager = new AudioManager();
