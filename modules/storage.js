// Storage management module

export const DEFAULT_SETTINGS = {
  language: 'auto', // 'auto', 'ja', 'ko', 'en'
  pollingIntervalMinutes: 2,
  notifyOnLiveStart: true,
  notifyOnLiveEnd: true,
  notifyOnCategoryChange: true,
  soundEnabled: true,
  soundVolume: 0.6,
  selectedSound: 'chime', // 'chime', 'pop', 'bell'
  quietHoursEnabled: false,
  quietHoursStart: '00:00',
  quietHoursEnd: '08:00',
  openInPipByDefault: false
};

export async function getSettings() {
  const result = await chrome.storage.local.get(['settings']);
  return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
}

export async function saveSettings(newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  await chrome.storage.local.set({ settings: updated });
  return updated;
}

export async function getCachedChannels() {
  const result = await chrome.storage.local.get(['channels', 'lastUpdated', 'userInfo', 'channelSettings']);
  return {
    channels: result.channels || [],
    lastUpdated: result.lastUpdated || null,
    userInfo: result.userInfo || null,
    channelSettings: result.channelSettings || {} // channelId -> { notifyEnabled: boolean }
  };
}

export async function setCachedChannels(channels, userInfo = null) {
  const data = {
    channels,
    lastUpdated: Date.now()
  };
  if (userInfo !== null) {
    data.userInfo = userInfo;
  }
  await chrome.storage.local.set(data);
}

export async function updateChannelNotifySetting(channelId, enabled) {
  const result = await chrome.storage.local.get(['channelSettings']);
  const channelSettings = result.channelSettings || {};
  channelSettings[channelId] = { notifyEnabled: enabled };
  await chrome.storage.local.set({ channelSettings });
  return channelSettings;
}

export async function getPreviousState() {
  const result = await chrome.storage.local.get(['previousState']);
  return result.previousState || {}; // channelId -> { isLive, liveId, category }
}

export async function savePreviousState(state) {
  await chrome.storage.local.set({ previousState: state });
}

export function isQuietHours(settings) {
  if (!settings.quietHoursEnabled) return false;
  try {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins < endMins;
    } else {
      // Over midnight (e.g. 23:00 to 07:00)
      return currentMins >= startMins || currentMins < endMins;
    }
  } catch (err) {
    console.error('Error evaluating quiet hours:', err);
    return false;
  }
}
