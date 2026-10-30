// Multi-language (i18n) translation module for Japanese, Korean, and English

export const TRANSLATIONS = {
  ja: {
    // Header & User Status
    notLoggedIn: '未ログイン',
    loggedInAs: 'Chzzkアカウント: {name}',
    btnRefresh: '今すぐ更新',
    btnSettings: '設定',
    
    // Search
    searchPlaceholder: '配信者・ゲーム・タイトルを検索...',
    
    // Login banner
    loginBannerTitle: 'Chzzkにログインしてください',
    loginBannerDesc: 'フォロー中の配信者を自動取得・通知するにはChzzkへのログインが必要です。',
    openChzzk: 'Chzzkを開く',
    
    // Stream sections
    live: '配信中',
    offline: 'オフライン',
    loading: '読み込み中...',
    noLiveMatching: '該当する配信がありません',
    noLiveCurrent: '現在配信中のフォローチャンネルはありません',
    noOfflineMatching: '該当するチャンネルがありません',
    noOfflineCurrent: 'オフラインのチャンネルはありません',
    
    // Cards
    watch: '📺 視聴',
    pip: '🗔 PiP',
    pipTitle: 'PiPミニプレイヤーで開く',
    tabTitle: '通常タブで開く',
    notifyOn: '通知ON (クリックでOFF)',
    notifyOff: '通知OFF (クリックでON)',
    noTitle: '(タイトルなし)',
    openStreamPage: '配信ページを開く',
    openChannelPage: 'チャンネルページを開く',
    uptimeHoursMins: '{hrs}時間{mins}分',
    uptimeMins: '{mins}分',
    
    // Settings Modal
    settingsTitle: '設定',
    settingLanguage: '表示言語',
    langAuto: '自動 (ブラウザ設定)',
    langJa: '日本語',
    langKo: '한국어',
    langEn: 'English',
    
    settingPollingInterval: '更新間隔',
    interval1m: '1分 (最速)',
    interval2m: '2分 (推奨)',
    interval3m: '3分',
    interval5m: '5分',
    
    settingEventsTitle: '通知イベント',
    btnTestNotification: 'テスト通知を表示',
    settingNotifyLiveStart: '配信開始通知',
    settingNotifyLiveEnd: '配信終了通知',
    settingNotifyCategoryChange: 'カテゴリ（ゲーム）変更通知',
    settingOpenInPip: '通知クリック時にPiP（ミニプレイヤー）で開く',
    
    settingSoundTitle: 'サウンド設定',
    settingSoundEnabled: '通知音を鳴らす',
    soundChime: 'チャイム (標準)',
    soundPop: 'ポップ音',
    soundBell: 'ベル音',
    btnTestSound: '試聴',
    settingVolume: '音量',
    
    settingQuietHoursTitle: 'おやすみモード (Do Not Disturb)',
    settingQuietHoursEnabled: '指定時間帯の通知と音をミュート',
    
    btnSaveSettings: '設定を保存',
    
    // Notifications
    notifLiveStartTitle: '🔴 {channelName} が配信を開始しました！',
    notifLiveEndTitle: '⏹️ {channelName} の配信が終了しました',
    notifLiveEndMsg: '直前のタイトル: {title}',
    notifCategoryTitle: '🎮 {channelName} がカテゴリを変更しました',
    notifCategoryMsg: '{oldCategory} ➔ {newCategory}\n{title}',
    notifCategoryUnset: '未分類',
    notifTestTitle: '🔔 テスト通知: Chzzk Notify',
    notifTestMsg: '配信通知のテストです。トーストが正常に表示されています！'
  },
  ko: {
    // Header & User Status
    notLoggedIn: '로그인 필요',
    loggedInAs: '치지직 계정: {name}',
    btnRefresh: '새로고침',
    btnSettings: '설정',
    
    // Search
    searchPlaceholder: '스트리머, 게임, 제목 검색...',
    
    // Login banner
    loginBannerTitle: '치지직에 로그인해주세요',
    loginBannerDesc: '팔로우 중인 스트리머 목록을 불러오고 알림을 받으려면 로그인이 필요합니다.',
    openChzzk: '치지직 열기',
    
    // Stream sections
    live: '생방송 중',
    offline: '오프라인',
    loading: '불러오는 중...',
    noLiveMatching: '검색 결과와 일치하는 방송이 없습니다',
    noLiveCurrent: '현재 방송 중인 팔로우 채널이 없습니다',
    noOfflineMatching: '검색 결과와 일치하는 채널이 없습니다',
    noOfflineCurrent: '오프라인 채널이 없습니다',
    
    // Cards
    watch: '📺 시청',
    pip: '🗔 PiP',
    pipTitle: 'PiP 미니 플레이어로 열기',
    tabTitle: '일반 탭으로 열기',
    notifyOn: '알림 ON (클릭하여 OFF)',
    notifyOff: '알림 OFF (클릭하여 ON)',
    noTitle: '(제목 없음)',
    openStreamPage: '방송 페이지 열기',
    openChannelPage: '채널 페이지 열기',
    uptimeHoursMins: '{hrs}시간 {mins}분',
    uptimeMins: '{mins}분',
    
    // Settings Modal
    settingsTitle: '설정',
    settingLanguage: '표시 언어',
    langAuto: '자동 (브라우저 설정)',
    langJa: '日本語',
    langKo: '한국어',
    langEn: 'English',
    
    settingPollingInterval: '확인 주기',
    interval1m: '1분 (가장 빠름)',
    interval2m: '2분 (권장)',
    interval3m: '3분',
    interval5m: '5분',
    
    settingEventsTitle: '알림 이벤트',
    btnTestNotification: '테스트 알림 표시',
    settingNotifyLiveStart: '방송 시작 알림',
    settingNotifyLiveEnd: '방송 종료 알림',
    settingNotifyCategoryChange: '카테고리(게임) 변경 알림',
    settingOpenInPip: '알림 클릭 시 PiP(미니 플레이어)로 열기',
    
    settingSoundTitle: '사운드 설정',
    settingSoundEnabled: '알림음 재생',
    soundChime: '차임 (기본)',
    soundPop: '팝 소리',
    soundBell: '벨 소리',
    btnTestSound: '미리듣기',
    settingVolume: '음량',
    
    settingQuietHoursTitle: '방해 금지 모드 (Do Not Disturb)',
    settingQuietHoursEnabled: '설정한 시간대 동안 알림 및 소리 음소거',
    
    btnSaveSettings: '설정 저장',
    
    // Notifications
    notifLiveStartTitle: '🔴 {channelName} 님이 방송을 시작했습니다!',
    notifLiveEndTitle: '⏹️ {channelName} 님의 방송이 종료되었습니다',
    notifLiveEndMsg: '이전 제목: {title}',
    notifCategoryTitle: '🎮 {channelName} 님이 카테고리를 변경했습니다',
    notifCategoryMsg: '{oldCategory} ➔ {newCategory}\n{title}',
    notifCategoryUnset: '미분류',
    notifTestTitle: '🔔 테스트 알림: Chzzk Notify',
    notifTestMsg: '방송 알림 테스트입니다. 토스트 알림이 정상적으로 표시되고 있습니다!'
  },
  en: {
    // Header & User Status
    notLoggedIn: 'Not logged in',
    loggedInAs: 'Chzzk Account: {name}',
    btnRefresh: 'Refresh',
    btnSettings: 'Settings',
    
    // Search
    searchPlaceholder: 'Search streamer, game, title...',
    
    // Login banner
    loginBannerTitle: 'Please log in to Chzzk',
    loginBannerDesc: 'You must be logged in to Chzzk to load followed streamers and receive notifications.',
    openChzzk: 'Open Chzzk',
    
    // Stream sections
    live: 'Live',
    offline: 'Offline',
    loading: 'Loading...',
    noLiveMatching: 'No matching streams found',
    noLiveCurrent: 'No followed channels are currently live',
    noOfflineMatching: 'No matching channels found',
    noOfflineCurrent: 'No offline channels',
    
    // Cards
    watch: '📺 Watch',
    pip: '🗔 PiP',
    pipTitle: 'Open in PiP mini player',
    tabTitle: 'Open in new tab',
    notifyOn: 'Notifications ON (click to disable)',
    notifyOff: 'Notifications OFF (click to enable)',
    noTitle: '(No title)',
    openStreamPage: 'Open stream page',
    openChannelPage: 'Open channel page',
    uptimeHoursMins: '{hrs}h {mins}m',
    uptimeMins: '{mins}m',
    
    // Settings Modal
    settingsTitle: 'Settings',
    settingLanguage: 'Language',
    langAuto: 'Auto (Browser default)',
    langJa: '日本語',
    langKo: '한국어',
    langEn: 'English',
    
    settingPollingInterval: 'Check Interval',
    interval1m: '1 min (Fastest)',
    interval2m: '2 min (Recommended)',
    interval3m: '3 min',
    interval5m: '5 min',
    
    settingEventsTitle: 'Notification Events',
    btnTestNotification: 'Show Test Notification',
    settingNotifyLiveStart: 'Live start notification',
    settingNotifyLiveEnd: 'Live end notification',
    settingNotifyCategoryChange: 'Category (game) change notification',
    settingOpenInPip: 'Open in PiP (mini player) on notification click',
    
    settingSoundTitle: 'Sound Settings',
    settingSoundEnabled: 'Play notification sound',
    soundChime: 'Chime (Default)',
    soundPop: 'Pop',
    soundBell: 'Bell',
    btnTestSound: 'Test',
    settingVolume: 'Volume',
    
    settingQuietHoursTitle: 'Do Not Disturb (Quiet Hours)',
    settingQuietHoursEnabled: 'Mute notifications and sound during set hours',
    
    btnSaveSettings: 'Save Settings',
    
    // Notifications
    notifLiveStartTitle: '🔴 {channelName} is now live!',
    notifLiveEndTitle: '⏹️ {channelName}\'s stream has ended',
    notifLiveEndMsg: 'Last title: {title}',
    notifCategoryTitle: '🎮 {channelName} changed category',
    notifCategoryMsg: '{oldCategory} ➔ {newCategory}\n{title}',
    notifCategoryUnset: 'Uncategorized',
    notifTestTitle: '🔔 Test Notification: Chzzk Notify',
    notifTestMsg: 'Stream notification test. Desktop toast is working properly!'
  }
};

/**
 * Determine active language code ('ja', 'ko', or 'en')
 */
export function resolveLanguage(langSetting = 'auto') {
  if (langSetting && langSetting !== 'auto' && TRANSLATIONS[langSetting]) {
    return langSetting;
  }

  // Detect from browser UI language
  const browserLang = (
    (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function' ? chrome.i18n.getUILanguage() : '') ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    'ja'
  ).toLowerCase();

  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('en')) return 'en';
  return 'ja'; // default to Japanese
}

/**
 * Translate a key into the active language with optional parameter interpolation
 */
export function t(key, params = {}, langSetting = 'auto') {
  const lang = resolveLanguage(langSetting);
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.ja;
  let text = dict[key] || TRANSLATIONS.ja[key] || key;

  if (params && typeof params === 'object') {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal ?? ''));
    }
  }

  return text;
}

