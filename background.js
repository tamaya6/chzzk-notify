// Main Service Worker for Chzzk Notify Extension
import { fetchFollowingLives, fetchAllFollowings, fetchUserStatus } from './modules/api.js';
import {
  getSettings,
  saveSettings,
  getCachedChannels,
  setCachedChannels,
  getPreviousState,
  savePreviousState
} from './modules/storage.js';
import {
  notifyLiveStart,
  notifyLiveEnd,
  notifyCategoryChange,
  updateActionBadge,
  getNotificationTarget
} from './modules/notifications.js';

const ALARM_NAME = 'CHZZK_CHECK_ALARM';

// Initialize extension on install or update
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Chzzk Notify] Extension installed/updated.');
  const settings = await getSettings();
  setupAlarm(settings.pollingIntervalMinutes);
  // Perform initial sync (without blasting notifications)
  await performCheck({ isFirstRun: true });
});

// Setup periodic alarm
function setupAlarm(intervalMinutes = 2) {
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: Math.max(1, intervalMinutes)
    });
    console.log(`[Chzzk Notify] Alarm registered with ${intervalMinutes}m interval.`);
  });
}

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await performCheck({ isFirstRun: false });
  }
});

/**
 * Main polling & difference detection engine
 */
export async function performCheck({ isFirstRun = false } = {}) {
  try {
    const settings = await getSettings();
    const { channelSettings } = await getCachedChannels();

    // 1. Fetch live channels & user status
    const [liveResult, userStatus, allFollowingsResult] = await Promise.all([
      fetchFollowingLives(),
      fetchUserStatus(),
      fetchAllFollowings()
    ]);

    if (!liveResult.authenticated && !userStatus.loggedIn) {
      console.warn('[Chzzk Notify] User not logged in to Chzzk.');
      updateActionBadge(0);
      return { authenticated: false, error: 'NOT_LOGGED_IN' };
    }

    const lives = liveResult.lives || [];
    const followings = allFollowingsResult.followings || [];

    // Map all followed channels with current live status
    const liveMap = new Map(lives.map(item => [item.channelId, item]));

    // Merge all followings
    const channelMap = new Map();

    // Add lives first
    for (const live of lives) {
      channelMap.set(live.channelId, {
        ...live,
        notifyEnabled: channelSettings[live.channelId]?.notifyEnabled ?? true
      });
    }

    // Add offline followings
    for (const fol of followings) {
      if (!channelMap.has(fol.channelId)) {
        channelMap.set(fol.channelId, {
          channelId: fol.channelId,
          channelName: fol.channelName,
          channelImageUrl: fol.channelImageUrl,
          verifiedMark: fol.verifiedMark,
          isLive: false,
          notifyEnabled: channelSettings[fol.channelId]?.notifyEnabled ?? true
        });
      }
    }

    const currentChannelList = Array.from(channelMap.values());

    // 2. State difference detection
    const previousState = await getPreviousState();
    const nextState = {};

    const isStateEmpty = Object.keys(previousState).length === 0;

    for (const ch of currentChannelList) {
      const prev = previousState[ch.channelId];
      const isLive = !!ch.isLive;
      const category = ch.liveCategoryValue || '';
      const liveId = ch.liveId || null;

      nextState[ch.channelId] = {
        isLive,
        liveId,
        category,
        channelName: ch.channelName,
        channelImageUrl: ch.channelImageUrl,
        liveTitle: ch.liveTitle
      };

      // Skip triggering notifications on first run or empty state initialization
      if (!isFirstRun && !isStateEmpty && ch.notifyEnabled) {
        if (prev) {
          // A. Offline -> Live
          if (!prev.isLive && isLive) {
            console.log(`[Chzzk Notify] Live started: ${ch.channelName}`);
            await notifyLiveStart(ch, settings);
          }
          // B. Live -> Offline
          else if (prev.isLive && !isLive) {
            console.log(`[Chzzk Notify] Live ended: ${ch.channelName}`);
            await notifyLiveEnd(ch, settings);
          }
          // C. Category change while live
          else if (prev.isLive && isLive && prev.category && category && prev.category !== category) {
            console.log(`[Chzzk Notify] Category changed: ${ch.channelName} (${prev.category} -> ${category})`);
            await notifyCategoryChange(ch, prev.category, category, settings);
          }
        } else if (isLive) {
          // Newly followed channel that is already live
          await notifyLiveStart(ch, settings);
        }
      }
    }

    // 3. Save updated state and cache
    await savePreviousState(nextState);
    await setCachedChannels(currentChannelList, userStatus);

    // 4. Update badge with current live count
    updateActionBadge(lives.length);

    return {
      authenticated: true,
      channels: currentChannelList,
      liveCount: lives.length,
      userInfo: userStatus
    };
  } catch (err) {
    console.error('[Chzzk Notify] Polling error:', err);
    return { error: err.message };
  }
}

/**
 * Handle notification clicks
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const target = getNotificationTarget(notificationId);
  chrome.notifications.clear(notificationId);

  if (target && target.channelId) {
    const settings = await getSettings();
    openStream(target.channelId, settings.openInPipByDefault);
  } else {
    // Open Chzzk homepage as fallback
    chrome.tabs.create({ url: 'https://chzzk.naver.com' });
  }
});

/**
 * Open stream in standard tab or dedicated PiP / popup window
 */
export function openStream(channelId, asPip = false) {
  if (!channelId || typeof channelId !== 'string') return;
  const safeId = encodeURIComponent(channelId);
  const streamUrl = `https://chzzk.naver.com/live/${safeId}`;
  if (asPip) {
    chrome.windows.create({
      url: streamUrl,
      type: 'popup',
      width: 900,
      height: 520,
      focused: true
    });
  } else {
    chrome.tabs.create({ url: streamUrl });
  }
}

/**
 * Handle messages from Popup or Settings
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_NOW') {
    performCheck({ isFirstRun: false }).then(sendResponse);
    return true;
  }

  if (message.type === 'OPEN_STREAM') {
    openStream(message.channelId, message.asPip);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'UPDATE_ALARM') {
    setupAlarm(message.intervalMinutes);
    sendResponse({ success: true });
    return true;
  }
});
