"use client";

class AviatorSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  constructor() {}

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopEngine();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startIdleEngine() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.stopEngine();
    const now = this.ctx.currentTime;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.01, now);
    this.engineGain.gain.linearRampToValueAtTime(0.12, now + 0.4);
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(280, now);
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.setValueAtTime(78, now);
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(14, now);
    lfoGain.gain.setValueAtTime(18, now);
    lfo.connect(this.engineOsc.frequency);
    lfo.start(now);
    this.engineOsc.connect(this.filterNode);
    this.filterNode.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start(now);
  }

  public startFlightEngine() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.stopEngine();
    const now = this.ctx.currentTime;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.05, now);
    this.engineGain.gain.linearRampToValueAtTime(0.24, now + 0.3);
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(450, now);
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.setValueAtTime(110, now);
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = "triangle";
    this.subOsc.frequency.setValueAtTime(55, now);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.35, now);
    this.subOsc.connect(subGain);
    subGain.connect(this.filterNode);
    this.engineOsc.connect(this.filterNode);
    this.filterNode.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start(now);
    this.subOsc.start(now);
  }

  public updateEnginePitch(multiplier: number) {
    if (this.isMuted || !this.ctx || !this.engineOsc || !this.filterNode) return;
    const now = this.ctx.currentTime;
    const targetFreq = Math.min(880, 110 + Math.log(Math.max(1, multiplier)) * 125);
    const targetFilter = Math.min(3200, 450 + Math.log(Math.max(1, multiplier)) * 480);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    if (this.subOsc) {
      this.subOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.05);
    }
    this.filterNode.frequency.setTargetAtTime(targetFilter, now, 0.05);
  }

  public playCashoutChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [880, 1318.5, 1760];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.28, now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.9);
    });
  }

  public playCrashSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    this.stopEngine();
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.45);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.55);
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 0.4);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.45);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); this.engineOsc.disconnect(); } catch (e) {}
      this.engineOsc = null;
    }
    if (this.subOsc) {
      try { this.subOsc.stop(); this.subOsc.disconnect(); } catch (e) {}
      this.subOsc = null;
    }
    if (this.engineGain) {
      try { this.engineGain.disconnect(); } catch (e) {}
      this.engineGain = null;
    }
  }
}

export const soundEngine = typeof window !== "undefined" ? new AviatorSoundEngine() : (null as any);
