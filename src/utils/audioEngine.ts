// Browser-native procedural Web Audio API sound engine (zero external assets)

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private alarmInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupGlobalUnlockListeners();
  }

  // Robust global gesture listener to unlock Web Audio on mobile/Quest browsers
  private setupGlobalUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
      // Keep listeners until successfully unlocked and running
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (this.ctx && this.ctx.state === 'running') {
        this.isUnlocked = true;
      }
    } catch {
      // AudioContext safe catch
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      this.unlock();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopEmergencyAlarm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // 1. Robotic Servo Motor Whir: Smooth frequency-ramped harmonic oscillator
  public playMotorWhir(duration: number = 0.4, basePitch: number = 220): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;

      // Primary tone oscillator
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';

      // Lowpass filter to simulate mechanical chassis dampening
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration);

      // Frequency ramping (accelerate -> cruise -> decelerate)
      osc.frequency.setValueAtTime(basePitch * 0.85, now);
      osc.frequency.exponentialRampToValueAtTime(basePitch * 1.25, now + duration * 0.45);
      osc.frequency.exponentialRampToValueAtTime(basePitch * 0.75, now + duration);

      // Volume envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + duration * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext safe fail
    }
  }

  // 2. High-Frequency Tactile Click: Snappy transient UI feedback
  public playClickSound(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1950, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // AudioContext safe fail
    }
  }

  // 3. Pneumatic Gripper Exhaust Hiss (Compressor discharge / clamp)
  public playPneumaticHiss(duration: number = 0.22): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2400, ctx.currentTime);
      bandpass.Q.setValueAtTime(3.0, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {
      // AudioContext safe fail
    }
  }

  // 4. Mechanical Disassembly Sound (Exploded View expansion / collapse)
  public playMechanicalDisassembly(exploded: boolean): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';

      const startF = exploded ? 240 : 480;
      const endF = exploded ? 520 : 200;

      osc1.frequency.setValueAtTime(startF, now);
      osc1.frequency.exponentialRampToValueAtTime(endF, now + 0.35);

      osc2.frequency.setValueAtTime(startF * 1.5, now);
      osc2.frequency.exponentialRampToValueAtTime(endF * 1.5, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch {
      // AudioContext safe fail
    }
  }

  // 5. Emergency Alarm: Pulsing industrial two-tone siren
  public playEmergencyAlarm(): void {
    if (this.isMuted || this.alarmInterval) return;
    const ctx = this.getContext();
    if (!ctx) return;

    let highTone = true;
    const pulseSiren = () => {
      if (this.isMuted || !this.alarmInterval) return;
      const currentCtx = this.getContext();
      if (!currentCtx || currentCtx.state !== 'running') return;

      const now = currentCtx.currentTime;
      const osc = currentCtx.createOscillator();
      const gain = currentCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(highTone ? 880 : 660, now);
      highTone = !highTone;

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(currentCtx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    };

    pulseSiren();
    this.alarmInterval = setInterval(pulseSiren, 250);
  }

  public stopEmergencyAlarm(): void {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }
}

export const audioEngine = new AudioEngine();
