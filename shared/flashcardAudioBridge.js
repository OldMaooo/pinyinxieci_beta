// FlashCard Audio Bridge
// Provides a unified audio playback interface for flashcards
// Supports both TTS (text-to-speech) and audio URL playback

/**
 * Plays audio for flashcard functionality
 * Supports both TTS text and audio URLs
 * @param {string} input - Either a text string for TTS or audio URL
 * @param {object} options - Playback options
 * @param {number} options.volume - Volume level (0-1) for audio URLs, or TTS volume (0-15)
 * @param {boolean} options.loop - Whether to loop the audio (for URLs only)
 * @param {boolean} options.isTTS - Whether input is TTS text (default: false)
 * @param {object} options.ttsOptions - TTS-specific options (speed, pitch, voiceId)
 * @returns {Promise<void>}
 */
export async function playFlashcardAudio(input, options = {}) {
  if (!input) return;

  // Stop any currently playing audio before starting new one
  stopFlashcardAudio();

  const { isTTS = false, volume = 0.2, loop = false, ttsOptions = {} } = options;

  if (isTTS) {
    // Handle TTS (text-to-speech)
    return await playFlashcardTTS(input, { ...ttsOptions, volume });
  } else {
    // Handle audio URL playback
    return await playFlashcardAudioURL(input, { volume, loop });
  }
}

/**
 * Plays TTS audio using Baidu TTS or fallback
 * @param {string} text - Text to convert to speech
 * @param {object} options - TTS options
 */
async function playFlashcardTTS(text, options = {}) {
  // Try to use the global Baidu TTS instance first
  if (typeof window !== 'undefined' && window.baiduTTSInstance) {
    try {
      await window.baiduTTSInstance.stop();
      return await window.baiduTTSInstance.play(text, {
        speed: options.speed || '5',
        pitch: options.pitch || '5',
        volume: options.volume || '5',
        voiceId: options.voiceId || '4003'
      });
    } catch (e) {
      console.warn('[FlashCard Audio Bridge] Baidu TTS failed:', e);
    }
  }

  // Fallback to Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = (options.volume || 5) / 15; // Convert 0-15 to 0-1
      utterance.rate = (options.speed || 5) / 5; // Convert 0-15 to relative rate
      utterance.pitch = (options.pitch || 5) / 5; // Convert 0-15 to relative pitch

      // Try to find a Chinese voice
      const voices = speechSynthesis.getVoices();
      // Priority 1: Match practice page logic (Yue/月) for consistency
      let chineseVoice = voices.find(v => v.name.includes('Yue') || v.name.includes('月'));
      
      // Priority 2: Any Chinese voice
      if (!chineseVoice) {
        chineseVoice = voices.find(voice =>
          voice.lang.includes('zh') || voice.name.toLowerCase().includes('chinese')
        );
      }

      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }

      speechSynthesis.speak(utterance);
      return;
    } catch (e) {
      console.warn('[FlashCard Audio Bridge] Web Speech API failed:', e);
    }
  }

  console.warn('[FlashCard Audio Bridge] No TTS available');
}

/**
 * Plays audio from URL using shared audio player
 * @param {string} url - Audio URL to play
 * @param {object} options - Playback options
 */
async function playFlashcardAudioURL(url, options = {}) {
  // Try to use the global shared audio player first
  if (typeof window !== 'undefined' && typeof window.playCardAudio === 'function') {
    try {
      return await window.playCardAudio(url, options);
    } catch (e) {
      console.warn('[FlashCard Audio Bridge] Global playCardAudio failed, falling back to local player:', e);
    }
  }

  // Fallback to local audio player
  try {
    const audioPlayer = await import('./audio-player.js');
    if (audioPlayer.default) {
      return await audioPlayer.default.play(url, options);
    }
  } catch (e) {
    console.warn('[FlashCard Audio Bridge] Local audio player import failed:', e);
  }

  // Ultimate fallback: direct HTML Audio
  console.warn('[FlashCard Audio Bridge] Using HTML Audio fallback');
  const audio = new Audio(url);
  audio.volume = options.volume || 0.2;
  audio.loop = options.loop || false;
  return audio.play().catch(() => {});
}

/**
 * Stops any currently playing flashcard audio
 */
export function stopFlashcardAudio() {
  // Stop Baidu TTS
  if (typeof window !== 'undefined' && window.baiduTTSInstance) {
    try {
      window.baiduTTSInstance.stop();
    } catch (e) {
      // ignore
    }
  }

  // Stop Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel();
  }

  // Stop shared audio player
  if (typeof window !== 'undefined' && typeof window.__audioPlayer__ !== 'undefined') {
    try {
      window.__audioPlayer__.stop();
    } catch (e) {
      // ignore
    }
  }
}

// Export default for convenience
export default {
  play: playFlashcardAudio,
  stop: stopFlashcardAudio
};

// Make available globally for non-module scripts
window.playFlashcardAudio = playFlashcardAudio;
window.stopFlashcardAudio = stopFlashcardAudio;