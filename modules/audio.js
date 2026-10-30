// Unified Web Audio Tone Synthesizer

export async function playTone(type = 'chime', volume = 0.6) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('AudioContext not supported');
      return;
    }

    const audioCtx = new AudioContextClass();

    // Auto-resume if suspended (required by Chrome autoplay policy)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const clampedVolume = Math.max(0, Math.min(1, volume));
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(clampedVolume, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'pop') {
      // Pleasant bubble pop tone
      const osc = audioCtx.createOscillator();
      const popGain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      popGain.gain.setValueAtTime(clampedVolume, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(popGain);
      popGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'bell') {
      // Clear bell chime (E5 harmonic)
      const osc = audioCtx.createOscillator();
      const bellGain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5

      bellGain.gain.setValueAtTime(clampedVolume, now);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(bellGain);
      bellGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.9);
    } else {
      // Default: Elegant two-tone chime (G5 -> C6)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc2.frequency.setValueAtTime(1046.50, now + 0.12); // C6

      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();

      gain1.gain.setValueAtTime(clampedVolume * 0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      gain2.gain.setValueAtTime(clampedVolume, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      osc2.connect(gain2);

      gain1.connect(masterGain);
      gain2.connect(masterGain);

      osc1.start(now);
      osc1.stop(now + 0.29);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.62);
    }
  } catch (err) {
    console.error('Tone generation error:', err);
  }
}
