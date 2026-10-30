// Notifications and Badge management module
import { isQuietHours } from './storage.js';
import { t } from './i18n.js';

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
    // Allow offscreen script to initialize listeners if document was just created
    await new Promise(resolve => setTimeout(resolve, 80));
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
const DEFAULT_ICON = chrome.runtime.getURL('icons/icon128.png');

/**
 * Safely create a notification with fallback to default icon on failure
 */
async function safeCreateNotification(notifId, options) {
  try {
    await chrome.notifications.create(notifId, options);
  } catch (err) {
    console.warn(`[Chzzk Notify] Failed to create notification (${notifId}) with custom icon:`, err);
    try {
      options.iconUrl = DEFAULT_ICON;
      await chrome.notifications.create(notifId, options);
    } catch (fallbackErr) {
      console.error('[Chzzk Notify] Failed to create fallback notification:', fallbackErr);
    }
  }
}

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

  const lang = settings.language || 'auto';

  // Chrome notification
  await safeCreateNotification(notifId, {
    type: 'basic',
    iconUrl: channel.channelImageUrl || DEFAULT_ICON,
    title: t('notifLiveStartTitle', { channelName: channel.channelName }, lang),
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
export async function notifyLiveEnd(channel, settings, prevTitle = '') {
  if (!settings.notifyOnLiveEnd) return;
  if (isQuietHours(settings)) return;

  const notifId = `live_end_${channel.channelId}_${Date.now()}`;
  notificationMap.set(notifId, { channelId: channel.channelId, type: 'live_end' });

  const lang = settings.language || 'auto';
  const title = channel.liveTitle || prevTitle || t('noTitle', {}, lang);

  await safeCreateNotification(notifId, {
    type: 'basic',
    iconUrl: channel.channelImageUrl || DEFAULT_ICON,
    title: t('notifLiveEndTitle', { channelName: channel.channelName }, lang),
    message: t('notifLiveEndMsg', { title }, lang),
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

  const lang = settings.language || 'auto';
  const oldCat = oldCategory || t('notifCategoryUnset', {}, lang);

  await safeCreateNotification(notifId, {
    type: 'basic',
    iconUrl: channel.channelImageUrl || DEFAULT_ICON,
    title: t('notifCategoryTitle', { channelName: channel.channelName }, lang),
    message: t('notifCategoryMsg', { oldCategory: oldCat, newCategory, title: channel.liveTitle || '' }, lang),
    contextMessage: 'Chzzk Live Notification',
    priority: 1
  });

  if (settings.soundEnabled) {
    playNotificationAudio('pop', settings.soundVolume * 0.8);
  }
}

/**
 * Trigger a test notification to verify toast notifications
 */
export async function notifyTest(settings = {}) {
  const notifId = `test_notif_${Date.now()}`;
  notificationMap.set(notifId, { channelId: null, type: 'test' });

  const lang = settings.language || 'auto';

  await safeCreateNotification(notifId, {
    type: 'basic',
    iconUrl: DEFAULT_ICON,
    title: t('notifTestTitle', {}, lang),
    message: t('notifTestMsg', {}, lang),
    contextMessage: 'Chzzk Live Notification',
    priority: 2
  });

  if (settings.soundEnabled !== false) {
    playNotificationAudio(settings.selectedSound || 'chime', settings.soundVolume ?? 0.6);
  }
}
