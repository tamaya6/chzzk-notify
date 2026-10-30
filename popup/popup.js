// Popup UI logic
import { getSettings, saveSettings, getCachedChannels, updateChannelNotifySetting } from '../modules/storage.js';
import { playTone } from '../modules/audio.js';
import { t } from '../modules/i18n.js';

let allChannels = [];
let userSettings = {};
let isOfflineOpen = false;
let currentUserInfo = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadInitialData();
  // Request fresh sync from background
  triggerSync();
});

function getLang() {
  return userSettings.language || 'auto';
}

/**
 * Safely validate and sanitize URL schemes
 */
function safeUrl(url, fallback = '../icons/icon128.png') {
  if (!url || typeof url !== 'string') return fallback;
  if (/^https?:\/\//i.test(url) || url.startsWith('../') || url.startsWith('chrome-extension://')) {
    return url;
  }
  return fallback;
}

function applyI18n() {
  const lang = getLang();

  // Translate text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key, {}, lang);
    }
  });

  // Translate titles / tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.title = t(key, {}, lang);
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.placeholder = t(key, {}, lang);
    }
  });
}

function setupEventListeners() {
  // Refresh button
  const btnRefresh = document.getElementById('btnRefresh');
  btnRefresh.addEventListener('click', () => {
    btnRefresh.classList.add('rotating');
    triggerSync().finally(() => {
      setTimeout(() => btnRefresh.classList.remove('rotating'), 600);
    });
  });

  // Search input
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    btnClearSearch.style.display = query ? 'block' : 'none';
    renderChannels();
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.style.display = 'none';
    searchInput.focus();
    renderChannels();
  });

  // Toggle offline section
  const toggleOffline = document.getElementById('toggleOfflineSection');
  toggleOffline.addEventListener('click', () => {
    isOfflineOpen = !isOfflineOpen;
    const list = document.getElementById('offlineList');
    const chevron = document.getElementById('offlineChevron');
    list.style.display = isOfflineOpen ? 'flex' : 'none';
    chevron.classList.toggle('rotated', isOfflineOpen);
  });

  // Settings modal
  const btnSettings = document.getElementById('btnSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const settingsModal = document.getElementById('settingsModal');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnTestSound = document.getElementById('btnTestSound');
  const btnTestNotification = document.getElementById('btnTestNotification');

  btnSettings.addEventListener('click', openSettingsModal);
  btnCloseSettings.addEventListener('click', () => settingsModal.style.display = 'none');
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  btnSaveSettings.addEventListener('click', saveSettingsFromModal);
  btnTestSound.addEventListener('click', testSound);
  if (btnTestNotification) {
    btnTestNotification.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' });
    });
  }

  const volSlider = document.getElementById('settingSoundVolume');
  volSlider.addEventListener('input', () => {
    document.getElementById('volumeValueLabel').textContent = `${Math.round(volSlider.value * 100)}%`;
  });
}

async function loadInitialData() {
  userSettings = await getSettings();
  applyI18n();

  const cache = await getCachedChannels();
  allChannels = cache.channels || [];
  currentUserInfo = cache.userInfo;
  updateUserStatusUI(currentUserInfo);
  renderChannels();
}

async function triggerSync() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
    if (res && res.channels) {
      allChannels = res.channels;
      currentUserInfo = res.userInfo;
      updateUserStatusUI(currentUserInfo);
      renderChannels();
    } else if (res && res.error === 'NOT_LOGGED_IN') {
      currentUserInfo = { loggedIn: false };
      updateUserStatusUI(currentUserInfo);
    }
  } catch (err) {
    console.warn('Sync request failed:', err);
  }
}

function updateUserStatusUI(userInfo) {
  const loginBanner = document.getElementById('loginBanner');
  const userNick = document.getElementById('userNickname');
  const lang = getLang();

  if (userInfo && userInfo.loggedIn) {
    loginBanner.style.display = 'none';
    userNick.textContent = userInfo.nickname || 'Online';
    userNick.title = t('loggedInAs', { name: userInfo.nickname }, lang);
  } else {
    loginBanner.style.display = 'flex';
    userNick.textContent = t('notLoggedIn', {}, lang);
    userNick.title = t('notLoggedIn', {}, lang);
  }
}

function renderChannels() {
  const lang = getLang();
  const query = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = allChannels.filter(ch => {
    if (!query) return true;
    const nameMatch = (ch.channelName || '').toLowerCase().includes(query);
    const catMatch = (ch.liveCategoryValue || '').toLowerCase().includes(query);
    const titleMatch = (ch.liveTitle || '').toLowerCase().includes(query);
    return nameMatch || catMatch || titleMatch;
  });

  const liveList = filtered.filter(ch => ch.isLive);
  const offlineList = filtered.filter(ch => !ch.isLive);

  // Update counts
  document.getElementById('liveCountBadge').textContent = liveList.length;
  document.getElementById('offlineCountBadge').textContent = offlineList.length;

  // Render Live Cards
  const liveContainer = document.getElementById('liveList');
  liveContainer.innerHTML = '';
  if (liveList.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = query ? t('noLiveMatching', {}, lang) : t('noLiveCurrent', {}, lang);
    liveContainer.appendChild(emptyDiv);
  } else {
    liveList.forEach(ch => {
      liveContainer.appendChild(createLiveCard(ch, lang));
    });
  }

  // Render Offline List
  const offlineContainer = document.getElementById('offlineList');
  offlineContainer.innerHTML = '';
  if (offlineList.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = query ? t('noOfflineMatching', {}, lang) : t('noOfflineCurrent', {}, lang);
    offlineContainer.appendChild(emptyDiv);
  } else {
    offlineList.forEach(ch => {
      offlineContainer.appendChild(createOfflineRow(ch, lang));
    });
  }
}

function createLiveCard(ch, lang) {
  const card = document.createElement('div');
  card.className = 'live-card';

  // Format viewer count & uptime
  const viewers = (ch.concurrentUserCount || 0).toLocaleString();
  const uptime = calcUptime(ch.openDate, lang);

  let thumbUrl = ch.liveImageUrl || '';
  if (thumbUrl && typeof thumbUrl === 'string') {
    thumbUrl = thumbUrl.replace(/\{type\}|%7Btype%7D/g, '720');
  }
  const resolvedThumb = safeUrl(thumbUrl || ch.channelImageUrl, '../icons/icon128.png');
  const resolvedAvatar = safeUrl(ch.channelImageUrl, '../icons/icon48.png');

  const titleFallback = ch.liveTitle || t('noTitle', {}, lang);
  const openStreamTitle = t('openStreamPage', {}, lang);
  const pipBtnTitle = t('pipTitle', {}, lang);
  const tabBtnTitle = t('tabTitle', {}, lang);
  const notifyTitle = ch.notifyEnabled ? t('notifyOn', {}, lang) : t('notifyOff', {}, lang);
  const watchLabel = t('watch', {}, lang);
  const pipLabel = t('pip', {}, lang);

  // 1. Thumbnail Container
  const thumbContainer = document.createElement('div');
  thumbContainer.className = 'card-thumb-container';
  thumbContainer.dataset.action = 'open-tab';
  thumbContainer.title = openStreamTitle;

  const thumbImg = document.createElement('img');
  thumbImg.className = 'card-thumb-img';
  thumbImg.alt = '';
  thumbImg.src = resolvedThumb;
  thumbImg.addEventListener('error', () => {
    if (ch.channelImageUrl && thumbImg.src !== ch.channelImageUrl) {
      thumbImg.src = safeUrl(ch.channelImageUrl, '../icons/icon128.png');
    } else {
      thumbImg.src = '../icons/icon128.png';
    }
  });

  const badgeLive = document.createElement('div');
  badgeLive.className = 'badge-live-tag';
  badgeLive.textContent = 'LIVE';

  const badgeViewers = document.createElement('div');
  badgeViewers.className = 'badge-viewers';
  badgeViewers.textContent = `👥 ${viewers}`;

  thumbContainer.appendChild(thumbImg);
  thumbContainer.appendChild(badgeLive);
  thumbContainer.appendChild(badgeViewers);

  if (uptime) {
    const badgeUptime = document.createElement('div');
    badgeUptime.className = 'badge-uptime';
    badgeUptime.textContent = `⏱️ ${uptime}`;
    thumbContainer.appendChild(badgeUptime);
  }

  // 2. Card Content
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content';

  const avatarImg = document.createElement('img');
  avatarImg.className = 'streamer-avatar';
  avatarImg.alt = '';
  avatarImg.src = resolvedAvatar;
  avatarImg.addEventListener('error', () => {
    avatarImg.src = '../icons/icon48.png';
  });

  const cardInfo = document.createElement('div');
  cardInfo.className = 'card-info';

  const streamTitle = document.createElement('div');
  streamTitle.className = 'stream-title';
  streamTitle.dataset.action = 'open-tab';
  streamTitle.title = titleFallback;
  streamTitle.textContent = titleFallback;

  const streamSub = document.createElement('div');
  streamSub.className = 'stream-sub';

  const streamerName = document.createElement('span');
  streamerName.className = 'streamer-name';
  streamerName.textContent = ch.channelName || '';
  streamSub.appendChild(streamerName);

  if (ch.liveCategoryValue) {
    const categoryTag = document.createElement('span');
    categoryTag.className = 'category-tag';
    categoryTag.textContent = ch.liveCategoryValue;
    streamSub.appendChild(categoryTag);
  }

  // Action buttons
  const cardActions = document.createElement('div');
  cardActions.className = 'card-actions';

  // Bell toggle button
  const bellBtn = document.createElement('button');
  bellBtn.className = `bell-btn ${ch.notifyEnabled ? 'active' : ''}`;
  bellBtn.dataset.action = 'toggle-notify';
  bellBtn.title = notifyTitle;

  const bellSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bellSvg.setAttribute('viewBox', '0 0 24 24');
  bellSvg.setAttribute('width', '14');
  bellSvg.setAttribute('height', '14');
  bellSvg.setAttribute('fill', ch.notifyEnabled ? 'currentColor' : 'none');
  bellSvg.setAttribute('stroke', 'currentColor');
  bellSvg.setAttribute('stroke-width', '2');

  const bellPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bellPath1.setAttribute('d', 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9');
  const bellPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bellPath2.setAttribute('d', 'M13.73 21a2 2 0 0 1-3.46 0');
  bellSvg.appendChild(bellPath1);
  bellSvg.appendChild(bellPath2);
  bellBtn.appendChild(bellSvg);

  bellBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const newState = !ch.notifyEnabled;
    ch.notifyEnabled = newState;
    await updateChannelNotifySetting(ch.channelId, newState);
    bellBtn.classList.toggle('active', newState);
    bellSvg.setAttribute('fill', newState ? 'currentColor' : 'none');
    bellBtn.title = newState ? t('notifyOn', {}, lang) : t('notifyOff', {}, lang);
  });

  // PiP button
  const pipBtn = document.createElement('button');
  pipBtn.className = 'action-pill-btn pip-btn';
  pipBtn.dataset.action = 'open-pip';
  pipBtn.title = pipBtnTitle;
  pipBtn.textContent = pipLabel;
  pipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({
      type: 'OPEN_STREAM',
      channelId: ch.channelId,
      asPip: true
    });
  });

  // Watch in tab button
  const watchBtn = document.createElement('button');
  watchBtn.className = 'action-pill-btn';
  watchBtn.dataset.action = 'open-tab';
  watchBtn.title = tabBtnTitle;
  watchBtn.textContent = watchLabel;
  watchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({
      type: 'OPEN_STREAM',
      channelId: ch.channelId,
      asPip: false
    });
  });

  cardActions.appendChild(bellBtn);
  cardActions.appendChild(pipBtn);
  cardActions.appendChild(watchBtn);

  cardInfo.appendChild(streamTitle);
  cardInfo.appendChild(streamSub);
  cardInfo.appendChild(cardActions);

  cardContent.appendChild(avatarImg);
  cardContent.appendChild(cardInfo);

  card.appendChild(thumbContainer);
  card.appendChild(cardContent);

  // Card-level open tab clicks
  thumbContainer.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'OPEN_STREAM',
      channelId: ch.channelId,
      asPip: false
    });
  });

  streamTitle.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'OPEN_STREAM',
      channelId: ch.channelId,
      asPip: false
    });
  });

  return card;
}

function createOfflineRow(ch, lang) {
  const row = document.createElement('div');
  row.className = 'offline-row';

  const resolvedAvatar = safeUrl(ch.channelImageUrl, '../icons/icon48.png');
  const openChannelTitle = t('openChannelPage', {}, lang);
  const notifyTitle = ch.notifyEnabled ? t('notifyOn', {}, lang) : t('notifyOff', {}, lang);

  const leftDiv = document.createElement('div');
  leftDiv.className = 'offline-left';
  leftDiv.title = openChannelTitle;

  const avatarImg = document.createElement('img');
  avatarImg.className = 'offline-avatar';
  avatarImg.alt = '';
  avatarImg.src = resolvedAvatar;
  avatarImg.addEventListener('error', () => { avatarImg.src = '../icons/icon48.png'; });

  const nameSpan = document.createElement('span');
  nameSpan.className = 'offline-name';
  nameSpan.textContent = ch.channelName || '';

  leftDiv.appendChild(avatarImg);
  leftDiv.appendChild(nameSpan);

  leftDiv.addEventListener('click', () => {
    if (ch.channelId) {
      chrome.tabs.create({ url: `https://chzzk.naver.com/${encodeURIComponent(ch.channelId)}` });
    }
  });

  // Bell toggle button
  const bellBtn = document.createElement('button');
  bellBtn.className = `bell-btn ${ch.notifyEnabled ? 'active' : ''}`;
  bellBtn.dataset.action = 'toggle-notify';
  bellBtn.title = notifyTitle;

  const bellSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bellSvg.setAttribute('viewBox', '0 0 24 24');
  bellSvg.setAttribute('width', '13');
  bellSvg.setAttribute('height', '13');
  bellSvg.setAttribute('fill', ch.notifyEnabled ? 'currentColor' : 'none');
  bellSvg.setAttribute('stroke', 'currentColor');
  bellSvg.setAttribute('stroke-width', '2');

  const bellPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bellPath1.setAttribute('d', 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9');
  const bellPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bellPath2.setAttribute('d', 'M13.73 21a2 2 0 0 1-3.46 0');
  bellSvg.appendChild(bellPath1);
  bellSvg.appendChild(bellPath2);
  bellBtn.appendChild(bellSvg);

  bellBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const newState = !ch.notifyEnabled;
    ch.notifyEnabled = newState;
    await updateChannelNotifySetting(ch.channelId, newState);
    bellBtn.classList.toggle('active', newState);
    bellSvg.setAttribute('fill', newState ? 'currentColor' : 'none');
    bellBtn.title = newState ? t('notifyOn', {}, lang) : t('notifyOff', {}, lang);
  });

  row.appendChild(leftDiv);
  row.appendChild(bellBtn);

  return row;
}

function calcUptime(openDateStr, lang) {
  if (!openDateStr) return '';
  try {
    const start = new Date(openDateStr.replace(/-/g, '/')).getTime();
    if (isNaN(start)) return '';
    const diffMs = Math.max(0, Date.now() - start);
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0) {
      return t('uptimeHoursMins', { hrs, mins }, lang);
    }
    return t('uptimeMins', { mins }, lang);
  } catch {
    return '';
  }
}

async function openSettingsModal() {
  userSettings = await getSettings();

  document.getElementById('settingLanguage').value = userSettings.language || 'auto';
  document.getElementById('settingPollingInterval').value = userSettings.pollingIntervalMinutes;
  document.getElementById('settingNotifyLiveStart').checked = userSettings.notifyOnLiveStart;
  document.getElementById('settingNotifyLiveEnd').checked = userSettings.notifyOnLiveEnd;
  document.getElementById('settingNotifyCategoryChange').checked = userSettings.notifyOnCategoryChange;
  document.getElementById('settingOpenInPip').checked = userSettings.openInPipByDefault;

  document.getElementById('settingSoundEnabled').checked = userSettings.soundEnabled;
  document.getElementById('settingSelectedSound').value = userSettings.selectedSound;
  document.getElementById('settingSoundVolume').value = userSettings.soundVolume;
  document.getElementById('volumeValueLabel').textContent = `${Math.round(userSettings.soundVolume * 100)}%`;

  document.getElementById('settingQuietHours').checked = userSettings.quietHoursEnabled;
  document.getElementById('settingQuietHoursStart').value = userSettings.quietHoursStart;
  document.getElementById('settingQuietHoursEnd').value = userSettings.quietHoursEnd;

  document.getElementById('settingsModal').style.display = 'flex';
}

async function saveSettingsFromModal() {
  const newSettings = {
    language: document.getElementById('settingLanguage').value,
    pollingIntervalMinutes: Number(document.getElementById('settingPollingInterval').value),
    notifyOnLiveStart: document.getElementById('settingNotifyLiveStart').checked,
    notifyOnLiveEnd: document.getElementById('settingNotifyLiveEnd').checked,
    notifyOnCategoryChange: document.getElementById('settingNotifyCategoryChange').checked,
    openInPipByDefault: document.getElementById('settingOpenInPip').checked,

    soundEnabled: document.getElementById('settingSoundEnabled').checked,
    selectedSound: document.getElementById('settingSelectedSound').value,
    soundVolume: Number(document.getElementById('settingSoundVolume').value),

    quietHoursEnabled: document.getElementById('settingQuietHours').checked,
    quietHoursStart: document.getElementById('settingQuietHoursStart').value,
    quietHoursEnd: document.getElementById('settingQuietHoursEnd').value
  };

  userSettings = await saveSettings(newSettings);

  // Apply new language to popup UI immediately
  applyI18n();
  updateUserStatusUI(currentUserInfo);
  renderChannels();

  // Notify background to update alarm interval
  chrome.runtime.sendMessage({
    type: 'UPDATE_ALARM',
    intervalMinutes: userSettings.pollingIntervalMinutes
  });

  document.getElementById('settingsModal').style.display = 'none';
}

function testSound() {
  const soundType = document.getElementById('settingSelectedSound').value;
  const volume = Number(document.getElementById('settingSoundVolume').value);
  playTone(soundType, volume);
}
