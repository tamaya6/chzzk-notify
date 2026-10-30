// Offscreen audio player for Chrome Manifest V3
import { playTone } from '../modules/audio.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PLAY_SOUND') {
    playTone(message.soundType || 'chime', message.volume ?? 0.6).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
});
