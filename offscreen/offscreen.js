// Offscreen audio player for Chrome Manifest V3
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PLAY_SOUND') {
    playSound(message.soundType || 'chime', message.volume ?? 0.6);
    sendResponse({ success: true });
  }
  return true;
});

function playSound(type, volume) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), audioCtx.currentTime);
    gainNode.connect(audioCtx.destination);

    if (type === 'pop') {
      // Short friendly bubble pop
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);

      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

      osc.connect(gainNode);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } else if (type === 'bell') {
      // Resonant bell tone
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5

      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);

      osc.connect(gainNode);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } else {
      // Default: Elegant two-tone chime (G5 -> C6)
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc2.frequency.setValueAtTime(1046.50, now + 0.12); // C6

      const noteGain1 = audioCtx.createGain();
      const noteGain2 = audioCtx.createGain();

      noteGain1.gain.setValueAtTime(volume * 0.8, now);
      noteGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noteGain2.gain.setValueAtTime(volume, now + 0.12);
      noteGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(noteGain1);
      osc2.connect(noteGain2);
      noteGain1.connect(gainNode);
      noteGain2.connect(gainNode);

      osc1.start(now);
      osc1.stop(now + 0.26);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.56);
    }
  } catch (err) {
    console.error('Audio playback error:', err);
  }
}
