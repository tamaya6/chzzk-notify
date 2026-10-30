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
  triggerSync();
});

function getLang() {
  return userSettings.language || 'auto';
}

/**
 * Lightweight declarative DOM element builder
 */
function el(tag, props = {}, ...children) {
  const elem = document.createElement(tag);
  for (const [key, val] of Object.entries(props)) {
    if (val === undefined || val === null) continue;
    if (key === 'className') {
      elem.className = val;
    } else if (key === 'textContent') {
      elem.textContent = val;
    } else if (key.startsWith('on') && typeof val === 'function') {
      elem.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'dataset' && typeof val === 'object') {
      Object.assign(elem.dataset, val);
    } else {
      elem.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (child instanceof Node) {
      elem.appendChild(child);
    }
  }
  return elem;
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

/**
 * Create safe image with fallback handling
 */
function createSafeImage(src, fallback, className = '') {
  const img = el('img', {
    className,
    alt: '',
    src: safeUrl(src, fallback)
  });
  img.addEventListener('error', () => {
    if (img.src !== fallback) {
      img.src = fallback;
    }
  });
  return img;
}

/**
 * Open stream in tab or PiP via background service worker
 */
function requestOpenStream(channelId, asPip = false) {
  if (!channelId) return;
  chrome.runtime.sendMessage({
    type: 'OPEN_STREAM',
    channelId,
    asPip
  });
}

/**
 * Create notification toggle bell button component
 */
function createBellButton(ch, lang, size = 14) {
  const notifyTitle = ch.notifyEnabled ? t('notifyOn', {}, lang) : t('notifyOff', {}, lang);

  const bellSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bellSvg.setAttribute('viewBox', '0 0 24 24');
  bellSvg.setAttribute('width', String(size));
  bellSvg.setAttribute('height', String(size));
  bellSvg.setAttribute('fill', ch.notifyEnabled ? 'currentColor' : 'none');
  bellSvg.setAttribute('stroke', 'currentColor');
  bellSvg.setAttribute('stroke-width', '2');

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9');
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M13.73 21a2 2 0 0 1-3.46 0');
  bellSvg.appendChild(path1);
  bellSvg.appendChild(path2);

  const btn = el('button', {
    className: `bell-btn ${ch.notifyEnabled ? 'active' : ''}`,
    title: notifyTitle,
    onclick: async (e) => {
      e.stopPropagation();
      const newState = !ch.notifyEnabled;
      ch.notifyEnabled = newState;
      await updateChannelNotifySetting(ch.channelId, newState);
      btn.classList.toggle('active', newState);
      bellSvg.setAttribute('fill', newState ? 'currentColor' : 'none');
      btn.title = newState ? t('notifyOn', {}, lang) : t('notifyOff', {}, lang);
    }
  }, bellSvg);

  return btn;
}

/**
 * Apply localized strings to static UI elements
 */
function applyI18n() {
  const lang = getLang();

  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (key) elem.textContent = t(key, {}, lang);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-title');
    if (key) elem.title = t(key, {}, lang);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-placeholder');
    if (key) elem.placeholder = t(key, {}, lang);
  });
}

function setupEventListeners() {
  const btnRefresh = document.getElementById('btnRefresh');
  btnRefresh.addEventListener('click', () => {
    btnRefresh.classList.add('rotating');
    triggerSync().finally(() => {
      setTimeout(() => btnRefresh.classList.remove('rotating'), 600);
    });
  });

  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');

  searchInput.addEventListener('input', () => {
    btnClearSearch.style.display = searchInput.value.trim() ? 'block' : 'none';
    renderChannels();
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.style.display = 'none';
    searchInput.focus();
    renderChannels();
  });

  const toggleOffline = document.getElementById('toggleOfflineSection');
  toggleOffline.addEventListener('click', () => {
    isOfflineOpen = !isOfflineOpen;
    document.getElementById('offlineList').style.display = isOfflineOpen ? 'flex' : 'none';
    document.getElementById('offlineChevron').classList.toggle('rotated', isOfflineOpen);
  });

  const settingsModal = document.getElementById('settingsModal');
  document.getElementById('btnSettings').addEventListener('click', openSettingsModal);
  document.getElementById('btnCloseSettings').addEventListener('click', () => settingsModal.style.display = 'none');
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  document.getElementById('btnSaveSettings').addEventListener('click', saveSettingsFromModal);
  document.getElementById('btnTestSound').addEventListener('click', testSound);
  document.getElementById('btnTestNotification')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' });
  });

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

  document.getElementById('liveCountBadge').textContent = liveList.length;
  document.getElementById('offlineCountBadge').textContent = offlineList.length;

  const liveContainer = document.getElementById('liveList');
  liveContainer.innerHTML = '';
  if (liveList.length === 0) {
    liveContainer.appendChild(el('div', {
      className: 'empty-state',
      textContent: query ? t('noLiveMatching', {}, lang) : t('noLiveCurrent', {}, lang)
    }));
  } else {
    liveList.forEach(ch => liveContainer.appendChild(createLiveCard(ch, lang)));
  }

  const offlineContainer = document.getElementById('offlineList');
  offlineContainer.innerHTML = '';
  if (offlineList.length === 0) {
    offlineContainer.appendChild(el('div', {
      className: 'empty-state',
      textContent: query ? t('noOfflineMatching', {}, lang) : t('noOfflineCurrent', {}, lang)
    }));
  } else {
    offlineList.forEach(ch => offlineContainer.appendChild(createOfflineRow(ch, lang)));
  }
}

function createLiveCard(ch, lang) {
  const viewers = (ch.concurrentUserCount || 0).toLocaleString();
  const uptime = calcUptime(ch.openDate, lang);
  const titleFallback = ch.liveTitle || t('noTitle', {}, lang);

  let thumbUrl = ch.liveImageUrl || '';
  if (thumbUrl && typeof thumbUrl === 'string') {
    thumbUrl = thumbUrl.replace(/\{type\}|%7Btype%7D/g, '720');
  }

  const thumbImg = createSafeImage(thumbUrl || ch.channelImageUrl, '../icons/icon128.png', 'card-thumb-img');
  const avatarImg = createSafeImage(ch.channelImageUrl, '../icons/icon48.png', 'streamer-avatar');

  return el('div', { className: 'live-card' },
    el('div', {
      className: 'card-thumb-container',
      title: t('openStreamPage', {}, lang),
      onclick: () => requestOpenStream(ch.channelId, false)
    },
      thumbImg,
      el('div', { className: 'badge-live-tag', textContent: 'LIVE' }),
      el('div', { className: 'badge-viewers', textContent: `👥 ${viewers}` }),
      uptime ? el('div', { className: 'badge-uptime', textContent: `⏱️ ${uptime}` }) : null
    ),
    el('div', { className: 'card-content' },
      avatarImg,
      el('div', { className: 'card-info' },
        el('div', {
          className: 'stream-title',
          title: titleFallback,
          textContent: titleFallback,
          onclick: () => requestOpenStream(ch.channelId, false)
        }),
        el('div', { className: 'stream-sub' },
          el('span', { className: 'streamer-name', textContent: ch.channelName || '' }),
          ch.liveCategoryValue ? el('span', { className: 'category-tag', textContent: ch.liveCategoryValue }) : null
        ),
        el('div', { className: 'card-actions' },
          createBellButton(ch, lang, 14),
          el('button', {
            className: 'action-pill-btn pip-btn',
            title: t('pipTitle', {}, lang),
            textContent: t('pip', {}, lang),
            onclick: (e) => {
              e.stopPropagation();
              requestOpenStream(ch.channelId, true);
            }
          }),
          el('button', {
            className: 'action-pill-btn',
            title: t('tabTitle', {}, lang),
            textContent: t('watch', {}, lang),
            onclick: (e) => {
              e.stopPropagation();
              requestOpenStream(ch.channelId, false);
            }
          })
        )
      )
    )
  );
}

function createOfflineRow(ch, lang) {
  const avatarImg = createSafeImage(ch.channelImageUrl, '../icons/icon48.png', 'offline-avatar');

  return el('div', { className: 'offline-row' },
    el('div', {
      className: 'offline-left',
      title: t('openChannelPage', {}, lang),
      onclick: () => {
        if (ch.channelId) {
          chrome.tabs.create({ url: `https://chzzk.naver.com/${encodeURIComponent(ch.channelId)}` });
        }
      }
    },
      avatarImg,
      el('span', { className: 'offline-name', textContent: ch.channelName || '' })
    ),
    createBellButton(ch, lang, 13)
  );
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
    return hrs > 0
      ? t('uptimeHoursMins', { hrs, mins }, lang)
      : t('uptimeMins', { mins }, lang);
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

  applyI18n();
  updateUserStatusUI(currentUserInfo);
  renderChannels();

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
