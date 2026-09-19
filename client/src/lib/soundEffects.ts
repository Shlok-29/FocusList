// Web Audio API Sound Effects & Procedural Ambient Generator

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientSource: { stop: () => void; setVolume: (v: number) => void } | null = null;
  private activeAmbientType: string | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ambientSource) {
      this.ambientSource.setVolume(0);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // Play a soft tactile click sound for UI buttons
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio fallback silent
    }
  }

  // Play a harmonious chime when completing a task
  public playCompletionChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        const startTime = this.ctx.currentTime + idx * 0.06;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Play a gentle zen alarm for Pomodoro session completion
  public playAlarmSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      freqs.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.8);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Procedural Ambient Soundscapes (Rain, White Noise, Binaural Beats, Fireplace)
  public startAmbient(type: 'rain' | 'binaural' | 'whitenoise' | 'fireplace', volume: number = 0.3) {
    this.stopAmbient();
    if (this.isMuted || volume <= 0) return;

    try {
      this.initCtx();
      if (!this.ctx) return;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);

      let stopFn = () => {};

      if (type === 'rain' || type === 'whitenoise') {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'rain') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          } else {
            output[i] = white * 0.1;
          }
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 800 : 1200, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        stopFn = () => {
          try { whiteNoise.stop(); } catch {}
        };
      } else if (type === 'binaural') {
        const oscL = this.ctx.createOscillator();
        const oscR = this.ctx.createOscillator();
        const merger = this.ctx.createChannelMerger(2);

        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, this.ctx.currentTime);
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(210, this.ctx.currentTime);

        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);

        merger.connect(masterGain);
        oscL.start();
        oscR.start();

        stopFn = () => {
          try {
            oscL.stop();
            oscR.stop();
          } catch {}
        };
      } else if (type === 'fireplace') {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);

        source.connect(filter);
        filter.connect(masterGain);
        source.start();

        stopFn = () => {
          try { source.stop(); } catch {}
        };
      }

      this.activeAmbientType = type;
      this.ambientSource = {
        stop: stopFn,
        setVolume: (v: number) => {
          if (this.ctx) {
            masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime);
          }
        },
      };
    } catch {
      // Audio fallback silent
    }
  }

  public setAmbientVolume(volume: number) {
    if (this.ambientSource) {
      this.ambientSource.setVolume(this.isMuted ? 0 : volume);
    }
  }

  public stopAmbient() {
    if (this.ambientSource) {
      this.ambientSource.stop();
      this.ambientSource = null;
      this.activeAmbientType = null;
    }
  }

  public getActiveAmbient() {
    return this.activeAmbientType;
  }
}

export const soundFx = new SoundEngine();
