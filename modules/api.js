// Chzzk Web API Client module

const CHZZK_API_BASE = 'https://api.chzzk.naver.com';
const NAVER_GAME_API = 'https://comm-api.game.naver.com';

/**
 * Checks current user login status on Chzzk / Naver Game
 */
export async function fetchUserStatus() {
  try {
    const res = await fetch(`${NAVER_GAME_API}/nng_main/v1/user/getUserStatus`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return { loggedIn: false };
    const json = await res.json();
    if (json.content && json.content.loggedIn) {
      return {
        loggedIn: true,
        userIdHash: json.content.userIdHash,
        nickname: json.content.nickname
      };
    }
    return { loggedIn: false };
  } catch (err) {
    console.warn('Failed to check user status:', err);
    return { loggedIn: false, error: err.message };
  }
}

/**
 * Fetches currently live channels from followed list
 */
export async function fetchFollowingLives() {
  try {
    const res = await fetch(`${CHZZK_API_BASE}/service/v1/channels/followings/live?size=50`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (res.status === 401 || res.status === 403) {
      return { authenticated: false, lives: [] };
    }
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    const list = data?.content?.followingList || [];

    const lives = list.map(item => {
      const channel = item.channel || {};
      const liveInfo = item.liveInfo || {};
      return {
        channelId: channel.channelId || item.channelId,
        channelName: channel.channelName || 'Unknown Streamer',
        channelImageUrl: channel.channelImageUrl || '',
        verifiedMark: !!channel.verifiedMark,
        isLive: true,
        liveId: liveInfo.liveId || null,
        liveTitle: liveInfo.liveTitle || 'Untitled Stream',
        liveImageUrl: liveInfo.liveImageUrl || liveInfo.defaultThumbnailImageUrl || '',
        concurrentUserCount: liveInfo.concurrentUserCount || 0,
        liveCategoryValue: liveInfo.liveCategoryValue || liveInfo.liveCategory || 'Just Chatting',
        openDate: liveInfo.openDate || ''
      };
    });

    return { authenticated: true, lives };
  } catch (err) {
    console.error('Failed to fetch following lives:', err);
    return { authenticated: false, lives: [], error: err.message };
  }
}

/**
 * Fetches all followed channels (both live and offline)
 */
export async function fetchAllFollowings() {
  try {
    const res = await fetch(`${CHZZK_API_BASE}/service/v1/channels/followings?size=100`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (res.status === 401 || res.status === 403) {
      return { authenticated: false, followings: [] };
    }
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    const list = data?.content?.data || [];

    const followings = list.map(item => {
      const ch = item.channel || {};
      return {
        channelId: ch.channelId || item.channelId,
        channelName: ch.channelName || 'Unknown Streamer',
        channelImageUrl: ch.channelImageUrl || '',
        verifiedMark: !!ch.verifiedMark
      };
    });

    return { authenticated: true, followings };
  } catch (err) {
    console.error('Failed to fetch followings list:', err);
    return { authenticated: false, followings: [], error: err.message };
  }
}
