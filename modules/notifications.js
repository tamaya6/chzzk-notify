// Notifications and Badge management module
import { isQuietHours } from './storage.js';

const OFFSCREEN_PATH = 'offscreen/offscreen.html';

// Ensure offscreen document exists for sound playback
let creatingOffscreenPromise = null;
async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;
  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }
  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play notification audio chime for live streams'
  });
  await creatingOffscreenPromise;
  creatingOffscreenPromise = null;
}

async function hasOffscreenDocument() {
  if (!chrome.offscreen || !chrome.offscreen.hasDocument) return false;
  return await chrome.offscreen.hasDocument();
}

/**
 * Play notification sound via offscreen document
 */
export async function playNotificationAudio(soundType = 'chime', volume = 0.6) {
  try {
    await ensureOffscreenDocument();
    chrome.runtime.sendMessage({
      type: 'PLAY_SOUND',
      soundType,
      volume
    });
  } catch (err) {
    console.warn('Failed to play notification audio:', err);
  }
}

/**
 * Update extension action badge with current live count
 */
export function updateActionBadge(liveCount) {
  if (liveCount > 0) {
    chrome.action.setBadgeText({ text: String(liveCount) });
    chrome.action.setBadgeBackgroundColor({ color: '#00FFA3' });
    chrome.action.setBadgeTextColor?.({ color: '#000000' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * Track notification ID to channel mapping for click events
 */
const notificationMap = new Map(); // notificationId -> { channelId, type }

export function getNotificationTarget(notificationId) {
  return notificationMap.get(notificationId);
}

/**
 * Trigger live start notification
 */
export async function notifyLiveStart(channel, settings) {
  if (!settings.notifyOnLiveStart) return;
  if (isQuietHours(settings)) return;

  const notifId = `live_start_${channel.channelId}_${Date.now()}`;
  notificationMap.set(notifId, { channelId: channel.channelId, type: 'live_start' });

  // Chrome notification
  chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: channel.channelImageUrl || 'icons/icon128.png',
    title: `🔴 ${channel.channelName} が配信を開始しました！`,
    message: `${channel.liveTitle}\n[${channel.liveCategoryValue || 'Just Chatting'}]`,
    contextMessage: 'Chzzk Live Notification',
    priority: 2
  });

  // Sound playback
  if (settings.soundEnabled) {
    playNotificationAudio(settings.selectedSound, settings.soundVolume);
  }
}

/**
 * Trigger live ended notification
 */
export async function notifyLiveEnd(channel, settings) {
  if (!settings.notifyOnLiveEnd) return;
  if (isQuietHours(settings)) return;

  const notifId = `live_end_${channel.channelId}_${Date.now()}`;
  notificationMap.set(notifId, { channelId: channel.channelId, type: 'live_end' });

  chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: channel.channelImageUrl || 'icons/icon128.png',
    title: `⏹️ ${channel.channelName} の配信が終了しました`,
    message: `直前のタイトル: ${channel.liveTitle || '(タイトルなし)'}`,
    contextMessage: 'Chzzk Live Notification',
    priority: 1
  });
}

/**
 * Trigger category changed notification
 */
export async function notifyCategoryChange(channel, oldCategory, newCategory, settings) {
  if (!settings.notifyOnCategoryChange) return;
  if (isQuietHours(settings)) return;

  const notifId = `category_${channel.channelId}_${Date.now()}`;
  notificationMap.set(notifId, { channelId: channel.channelId, type: 'category_change' });

  chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: channel.channelImageUrl || 'icons/icon128.png',
    title: `🎮 ${channel.channelName} がカテゴリを変更しました`,
    message: `${oldCategory || '未分類'} ➔ ${newCategory}\n${channel.liveTitle}`,
    contextMessage: 'Chzzk Live Notification',
    priority: 1
  });

  if (settings.soundEnabled) {
    playNotificationAudio('pop', settings.soundVolume * 0.8);
  }
}
