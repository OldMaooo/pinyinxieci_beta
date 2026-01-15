// Shared audio player for cards and practice pages
// Provides a unified API to play audio resources using Web Audio API when available, with HTMLAudio fallback.

class AudioPlayer {
  constructor() {
    this.ctx = null;
    this.gain = null;
    this.bufferCache = new Map();
    this.currentSource = null;
    this.isInitialized = false;
    this.useWebAudio = false;
  }

  async init() {
    if (this.isInitialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        this.ctx = new AudioCtx();
        this.gain = this.ctx.createGain();
        this.gain.connect(this.ctx.destination);
        this.useWebAudio = true;
      } catch (e) {
        // fallback to HTMLAudio
        this.ctx = null;
      }
    }
    this.isInitialized = true;
  }

  async resumeContextIfNeeded() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async loadBuffer(url) {
    if (this.bufferCache.has(url)) return this.bufferCache.get(url);
    try {
      const resp = await fetch(url);
      const arrayBuf = await resp.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arrayBuf);
      this.bufferCache.set(url, buffer);
      return buffer;
    } catch (e) {
      // decoding failed, remove potential bad cache
      this.bufferCache.delete(url);
      throw e;
    }
  }

  async play(url, { volume = 0.2, loop = false, type = 'buffer' } = {}) {
    if (!url) return;
    await this.init();
    await this.resumeContextIfNeeded();

    // Stop any current playback
    this.stop();

    if (this.useWebAudio && this.ctx && this.ctx.state !== 'closed') {
      try {
        // Try buffer-based playback
        let buffer = this.bufferCache.get(url);
        if (!buffer) {
          // load and decode
          const resp = await fetch(url);
          const arr = await resp.arrayBuffer();
          buffer = await this.ctx.decodeAudioData(arr);
          this.bufferCache.set(url, buffer);
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = typeof volume === 'number' ? volume : 0.2;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.loop = loop;
        source.start(0);
        this.currentSource = source;
        source.onended = () => { if (this.currentSource === source) this.currentSource = null; };
        return;
      } catch (e) {
        // fallback to HTMLAudio
        this.useWebAudio = false;
      }
    }

    // Fallback: HTMLAudioElement
    const audio = new Audio(url);
    audio.volume = typeof volume === 'number' ? volume : 0.2;
    audio.loop = !!loop;
    audio.play().catch(() => {});
    this.currentSource = audio;
  }

  stop() {
    if (this.currentSource) {
      if (this.useWebAudio && this.currentSource.stop) {
        try { this.currentSource.stop(); } catch (e) { /* ignore */ }
      } else if (this.currentSource instanceof HTMLAudioElement) {
        this.currentSource.pause();
        this.currentSource.currentTime = 0;
      }
      this.currentSource = null;
    }
  }

  setVolume(v) {
    if (this.gain && this.ctx) {
      this.gain.gain.value = v;
    } else if (this.currentSource && this.currentSource instanceof HTMLAudioElement) {
      this.currentSource.volume = v;
    }
  }
}

// export a singleton instance for easy import
const audioPlayer = new AudioPlayer();
export default audioPlayer;

// Expose a global bridge for non-module usage (flashcards UI can call playCardAudio(url))
if (typeof window !== 'undefined') {
  try {
    window.playCardAudio = (url, opts) => audioPlayer.play(url, opts || {});
    window.__audioPlayer__ = audioPlayer;
  } catch (e) {
    // ignore if not in browser or already defined
  }
}