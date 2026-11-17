export interface StudyMusicTrack {
  id: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  kind: 'builtin' | 'custom';
  tag: string;
  objectUrl?: string;
}

export const BUILTIN_STUDY_TRACKS: StudyMusicTrack[] = [
  {
    id: 'lofi_chords',
    titleEn: 'Lo-Fi Study Chords',
    titleHi: 'लो-फ़ाई स्टडी कॉर्ड्स',
    subtitleEn: 'Warm electric-piano chord loop for long study blocks',
    subtitleHi: 'लंबे अध्ययन सत्र के लिए शांत लो-फ़ाई संगीत',
    kind: 'builtin',
    tag: 'Lo-Fi · 72 BPM',
  },
  {
    id: 'alpha_focus',
    titleEn: 'Deep Alpha Focus (432 Hz)',
    titleHi: 'डीप अल्फ़ा फ़ोकस (432 Hz)',
    subtitleEn: 'Harmonic concentration waves for problem solving',
    subtitleHi: 'गहन एकाग्रता और न्यूमेरिकल हल करने के लिए',
    kind: 'builtin',
    tag: 'Alpha Wave',
  },
  {
    id: 'monsoon_rain',
    titleEn: 'Monsoon Study Rain',
    titleHi: 'मानसून स्टडी रेन',
    subtitleEn: 'Soft rainfall ambience that masks distractions',
    subtitleHi: 'बाहरी शोर को रोकने के लिए हल्की बारिश की ध्वनि',
    kind: 'builtin',
    tag: 'Nature Ambience',
  },
  {
    id: 'brown_noise',
    titleEn: 'Library Brown Noise',
    titleHi: 'लाइब्रेरी ब्राउन नॉइज़',
    subtitleEn: 'Deep warm acoustic noise ideal for Mock Tests',
    subtitleHi: 'मॉक टेस्ट के दौरान ध्यान केंद्रित रखने के लिए',
    kind: 'builtin',
    tag: 'Mock Test Safe',
  },
  {
    id: 'piano_zen',
    titleEn: 'Midnight Revision Chimes',
    titleHi: 'रात्रि रिवीजन चाइम्स',
    subtitleEn: 'Gentle pentatonic notes for calm formula revision',
    subtitleHi: 'सूत्र दोहराव के लिए शांत पियानो नोट्स',
    kind: 'builtin',
    tag: 'Calm Revision',
  },
];

class StudyMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeLoopTimer: number | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private currentVolume = 0.45;
  private isLooping = true;
  private onEndedCallback: (() => void) | null = null;
  private onTimeUpdateCallback: ((current: number, duration: number) => void) | null = null;

  private ensureAudioContext(): AudioContext | null {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
        Promise.resolve(this.ctx.resume()).catch(() => {});
      }
      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setCallbacks(
    onTimeUpdate: (current: number, duration: number) => void,
    onEnded: () => void
  ): void {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
  }

  public setVolume(volume: number): void {
    const safe = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0.45));
    this.currentVolume = safe;
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(safe, this.ctx.currentTime, 0.04);
      } catch {
        // Ignore AudioParam timing errors
      }
    }
    if (this.htmlAudio) {
      this.htmlAudio.volume = safe;
    }
  }

  public setLoop(loop: boolean): void {
    this.isLooping = loop;
    if (this.htmlAudio) {
      this.htmlAudio.loop = loop;
    }
  }

  public seek(seconds: number): void {
    if (this.htmlAudio && Number.isFinite(seconds)) {
      try {
        this.htmlAudio.currentTime = Math.max(0, seconds);
      } catch {
        // Ignore invalid seek
      }
    }
  }

  public stop(): void {
    if (this.activeLoopTimer !== null) {
      window.clearInterval(this.activeLoopTimer);
      this.activeLoopTimer = null;
    }
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
      } catch {
        // Already stopped
      }
      try {
        node.disconnect();
      } catch {
        // Already disconnected
      }
    }
    this.activeNodes = [];

    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
      } catch {
        // Ignore pause error
      }
    }
  }

  public playTrack(track: StudyMusicTrack): boolean {
    this.stop();

    if (track.kind === 'custom' && track.objectUrl) {
      try {
        if (!this.htmlAudio) {
          this.htmlAudio = new Audio();
          this.htmlAudio.addEventListener('timeupdate', () => {
            if (!this.htmlAudio) return;
            this.onTimeUpdateCallback?.(
              this.htmlAudio.currentTime || 0,
              Number.isFinite(this.htmlAudio.duration) ? this.htmlAudio.duration : 0
            );
          });
          this.htmlAudio.addEventListener('ended', () => {
            if (!this.isLooping) {
              this.onEndedCallback?.();
            }
          });
        }
        this.htmlAudio.src = track.objectUrl;
        this.htmlAudio.volume = this.currentVolume;
        this.htmlAudio.loop = this.isLooping;
        const playPromise = this.htmlAudio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
        return true;
      } catch {
        return false;
      }
    }

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.masterGain) return false;

    this.onTimeUpdateCallback?.(0, 0);

    switch (track.id) {
      case 'alpha_focus':
        this.startAlphaFocus(ctx, this.masterGain);
        break;
      case 'monsoon_rain':
        this.startNoiseAmbience(ctx, this.masterGain, 'rain');
        break;
      case 'brown_noise':
        this.startNoiseAmbience(ctx, this.masterGain, 'brown');
        break;
      case 'piano_zen':
        this.startPentatonicChimes(ctx, this.masterGain);
        break;
      case 'lofi_chords':
      default:
        this.startLofiChords(ctx, this.masterGain);
        break;
    }

    return true;
  }

  private startLofiChords(ctx: AudioContext, dest: GainNode): void {
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 349.23], // Fmaj7
      [196.0, 246.94, 293.66, 392.0], // G6
    ];

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.connect(dest);
    this.activeNodes.push(filter);

    let step = 0;
    const playChord = () => {
      const freqs = chords[step % chords.length];
      step += 1;
      const now = ctx.currentTime;
      freqs.forEach((f, idx) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.11 / freqs.length, now + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.1);
          osc.connect(gain);
          gain.connect(filter);
          osc.start(now);
          osc.stop(now + 3.2);
        } catch {
          // Ignore oscillator cleanup
        }
      });
    };

    playChord();
    this.activeLoopTimer = window.setInterval(playChord, 3200);
  }

  private startAlphaFocus(ctx: AudioContext, dest: GainNode): void {
    try {
      const now = ctx.currentTime;
      const droneA = ctx.createOscillator();
      const droneB = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const mixGain = ctx.createGain();

      droneA.type = 'sine';
      droneA.frequency.setValueAtTime(216, now); // 432/2 warm octave

      droneB.type = 'sine';
      droneB.frequency.setValueAtTime(226, now); // 10 Hz alpha harmonic pulse

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.15, now); // Gentle breathing swell
      lfoGain.gain.setValueAtTime(0.04, now);
      mixGain.gain.setValueAtTime(0.14, now);

      lfo.connect(lfoGain);
      lfoGain.connect(mixGain.gain);

      droneA.connect(mixGain);
      droneB.connect(mixGain);
      mixGain.connect(dest);

      droneA.start(now);
      droneB.start(now);
      lfo.start(now);

      this.activeNodes.push(droneA, droneB, lfo, lfoGain, mixGain);
    } catch {
      // Ignore Web Audio failures
    }
  }

  private startNoiseAmbience(ctx: AudioContext, dest: GainNode, mode: 'rain' | 'brown'): void {
    try {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.03 * white) / 1.03;
        output[i] = mode === 'brown' ? lastOut * 2.6 : lastOut * 1.4 + white * 0.14;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = mode === 'brown' ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(mode === 'brown' ? 360 : 950, ctx.currentTime);
      filter.Q.setValueAtTime(mode === 'brown' ? 0.7 : 0.45, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(mode === 'brown' ? 0.42 : 0.34, ctx.currentTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      source.start(ctx.currentTime);
      this.activeNodes.push(source, filter, gain);
    } catch {
      // Ignore Web Audio failures
    }
  }

  private startPentatonicChimes(ctx: AudioContext, dest: GainNode): void {
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    let idx = 0;
    const triggerNote = () => {
      const note = scale[(idx * 3 + Math.floor(Math.random() * 2)) % scale.length];
      idx += 1;
      const now = ctx.currentTime;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 2.5);
      } catch {
        // Ignore
      }
    };

    triggerNote();
    this.activeLoopTimer = window.setInterval(triggerNote, 1800);
  }
}

export const studyMusicPlayer = new StudyMusicEngine();
