async function play(text, options = {}) {
  if (!text) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[AudioBridge] speechSynthesis not available');
    return;
  }

  const { volume = 15, speed = 5, pitch = 5 } = options;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = volume / 15;
  utterance.rate = speed / 5;
  utterance.pitch = pitch / 5;
  utterance.lang = 'zh-CN';

  return new Promise((resolve) => {
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

function stop() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function stopFlashcardAudio() {
  stop();
}

async function playFlashcardAudio(input, options = {}) {
  if (!input) return;
  stop();
  if (options.isTTS) {
    return await play(input, options.ttsOptions || {});
  } else {
    const audio = new Audio(input);
    audio.volume = options.volume || 0.2;
    return audio.play().catch(() => {});
  }
}

if (typeof window !== 'undefined') {
  window.playFlashcardAudio = playFlashcardAudio;
  window.stopFlashcardAudio = stopFlashcardAudio;
}

export { play, stop, playFlashcardAudio, stopFlashcardAudio };
export default { play, stop };
