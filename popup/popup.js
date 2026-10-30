// Popup UI logic
import { getSettings, saveSettings, getCachedChannels, updateChannelNotifySetting } from '../modules/storage.js';
import { playTone } from '../modules/audio.js';

let allChannels = [];
let userSettings = {};
let isOfflineOpen = false;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadInitialData();
  // Request fresh sync from background
  triggerSync();
});

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

  btnSettings.addEventListener('click', openSettingsModal);
  btnCloseSettings.addEventListener('click', () => settingsModal.style.display = 'none');
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  btnSaveSettings.addEventListener('click', saveSettingsFromModal);
  btnTestSound.addEventListener('click', testSound);

  const volSlider = document.getElementById('settingSoundVolume');
  volSlider.addEventListener('input', () => {
    document.getElementById('volumeValueLabel').textContent = `${Math.round(volSlider.value * 100)}%`;
  });
}

async function loadInitialData() {
  userSettings = await getSettings();
  const cache = await getCachedChannels();
  allChannels = cache.channels || [];
  updateUserStatusUI(cache.userInfo);
  renderChannels();
}

async function triggerSync() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
    if (res && res.channels) {
      allChannels = res.channels;
      updateUserStatusUI(res.userInfo);
      renderChannels();
    } else if (res && res.error === 'NOT_LOGGED_IN') {
      document.getElementById('loginBanner').style.display = 'flex';
      document.getElementById('userNickname').textContent = '未ログイン';
    }
  } catch (err) {
    console.warn('Sync request failed:', err);
  }
}

function updateUserStatusUI(userInfo) {
  const loginBanner = document.getElementById('loginBanner');
  const userNick = document.getElementById('userNickname');

  if (userInfo && userInfo.loggedIn) {
    loginBanner.style.display = 'none';
    userNick.textContent = userInfo.nickname || 'ログイン中';
    userNick.title = `Chzzkアカウント: ${userInfo.nickname}`;
  } else {
    loginBanner.style.display = 'flex';
    userNick.textContent = '未ログイン';
  }
}

function renderChannels() {
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
  if (liveList.length === 0) {
    liveContainer.innerHTML = `<div class="empty-state">${query ? '該当する配信がありません' : '現在配信中のフォローチャンネルはありません'}</div>`;
  } else {
    liveContainer.innerHTML = '';
    liveList.forEach(ch => {
      liveContainer.appendChild(createLiveCard(ch));
    });
  }

  // Render Offline List
  const offlineContainer = document.getElementById('offlineList');
  if (offlineList.length === 0) {
    offlineContainer.innerHTML = `<div class="empty-state">${query ? '該当するチャンネルがありません' : 'オフラインのチャンネルはありません'}</div>`;
  } else {
    offlineContainer.innerHTML = '';
    offlineList.forEach(ch => {
      offlineContainer.appendChild(createOfflineRow(ch));
    });
  }
}

function createLiveCard(ch) {
  const card = document.createElement('div');
  card.className = 'live-card';

  // Format viewer count
  const viewers = (ch.concurrentUserCount || 0).toLocaleString();
  const uptime = calcUptime(ch.openDate);

  const thumbUrl = ch.liveImageUrl || '../icons/icon128.png';
  const avatarUrl = ch.channelImageUrl || '../icons/icon48.png';

  card.innerHTML = `
    <div class="card-thumb-container" data-action="open-tab" title="配信ページを開く">
      <img src="${escapeHtml(thumbUrl)}" alt="" class="card-thumb-img">
      <div class="badge-live-tag">LIVE</div>
      <div class="badge-viewers">👥 ${viewers}</div>
      ${uptime ? `<div class="badge-uptime">⏱️ ${uptime}</div>` : ''}
    </div>
    <div class="card-content">
      <img src="${escapeHtml(avatarUrl)}" alt="" class="streamer-avatar">
      <div class="card-info">
        <div class="stream-title" data-action="open-tab" title="${escapeHtml(ch.liveTitle || '')}">
          ${escapeHtml(ch.liveTitle || '(タイトルなし)')}
        </div>
        <div class="stream-sub">
          <span class="streamer-name">${escapeHtml(ch.channelName)}</span>
          ${ch.liveCategoryValue ? `<span class="category-tag">${escapeHtml(ch.liveCategoryValue)}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="bell-btn ${ch.notifyEnabled ? 'active' : ''}" data-action="toggle-notify" title="${ch.notifyEnabled ? '通知ON (クリックでOFF)' : '通知OFF (クリックでON)'}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="${ch.notifyEnabled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button class="action-pill-btn pip-btn" data-action="open-pip" title="PiPミニプレイヤーで開く">
            🗔 PiP
          </button>
          <button class="action-pill-btn" data-action="open-tab" title="通常タブで開く">
            📺 視聴
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach safe image fallback handlers (CSP compliant)
  const thumbImg = card.querySelector('.card-thumb-img');
  thumbImg?.addEventListener('error', () => { thumbImg.src = '../icons/icon128.png'; });
  const avatarImg = card.querySelector('.streamer-avatar');
  avatarImg?.addEventListener('error', () => { avatarImg.src = '../icons/icon48.png'; });

  // Attach card event listeners
  card.querySelectorAll('[data-action="open-tab"]').forEach(el => {
    el.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'OPEN_STREAM',
        channelId: ch.channelId,
        asPip: false
      });
    });
  });

  card.querySelector('[data-action="open-pip"]')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'OPEN_STREAM',
      channelId: ch.channelId,
      asPip: true
    });
  });

  card.querySelector('[data-action="toggle-notify"]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const newState = !ch.notifyEnabled;
    ch.notifyEnabled = newState;
    await updateChannelNotifySetting(ch.channelId, newState);
    btn.classList.toggle('active', newState);
    btn.querySelector('svg').setAttribute('fill', newState ? 'currentColor' : 'none');
    btn.title = newState ? '通知ON (クリックでOFF)' : '通知OFF (クリックでON)';
  });

  return card;
}

function createOfflineRow(ch) {
  const row = document.createElement('div');
  row.className = 'offline-row';

  const avatarUrl = ch.channelImageUrl || '../icons/icon48.png';

  row.innerHTML = `
    <div class="offline-left" title="チャンネルページを開く">
      <img src="${escapeHtml(avatarUrl)}" alt="" class="offline-avatar">
      <span class="offline-name">${escapeHtml(ch.channelName)}</span>
    </div>
    <button class="bell-btn ${ch.notifyEnabled ? 'active' : ''}" data-action="toggle-notify" title="${ch.notifyEnabled ? '通知ON (クリックでOFF)' : '通知OFF (クリックでON)'}">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="${ch.notifyEnabled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </button>
  `;

  const offlineAvatar = row.querySelector('.offline-avatar');
  offlineAvatar?.addEventListener('error', () => { offlineAvatar.src = '../icons/icon48.png'; });

  row.querySelector('.offline-left').addEventListener('click', () => {
    if (ch.channelId) {
      chrome.tabs.create({ url: `https://chzzk.naver.com/${encodeURIComponent(ch.channelId)}` });
    }
  });

  row.querySelector('[data-action="toggle-notify"]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const newState = !ch.notifyEnabled;
    ch.notifyEnabled = newState;
    await updateChannelNotifySetting(ch.channelId, newState);
    btn.classList.toggle('active', newState);
    btn.querySelector('svg').setAttribute('fill', newState ? 'currentColor' : 'none');
    btn.title = newState ? '通知ON (クリックでOFF)' : '通知OFF (クリックでON)';
  });

  return row;
}

function calcUptime(openDateStr) {
  if (!openDateStr) return '';
  try {
    const start = new Date(openDateStr.replace(/-/g, '/')).getTime();
    if (isNaN(start)) return '';
    const diffMs = Math.max(0, Date.now() - start);
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0) {
      return `${hrs}時間${mins}分`;
    }
    return `${mins}分`;
  } catch {
    return '';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function openSettingsModal() {
  userSettings = await getSettings();

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
