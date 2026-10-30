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
    const list = data?.content?.followingList ||
                 data?.content?.followings ||
                 data?.content?.data ||
                 (Array.isArray(data?.content) ? data.content : []);

    const lives = list.map(item => {
      const channel = item.channel || {};
      const liveInfo = item.liveInfo || item.liveDetail || {};
      let rawThumb = liveInfo.liveImageUrl || liveInfo.defaultThumbnailImageUrl || channel.channelImageUrl || '';
      if (rawThumb && typeof rawThumb === 'string') {
        rawThumb = rawThumb.replace(/\{type\}|%7Btype%7D/g, '720');
      }

      return {
        channelId: channel.channelId || item.channelId,
        channelName: channel.channelName || 'Unknown Streamer',
        channelImageUrl: channel.channelImageUrl || '',
        verifiedMark: !!channel.verifiedMark,
        isLive: true,
        liveId: liveInfo.liveId || liveInfo.liveNo || null,
        liveTitle: liveInfo.liveTitle || 'Untitled Stream',
        liveImageUrl: rawThumb,
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
    let allItems = [];
    let page = 0;
    let hasMore = true;

    // Fetch pages (up to 5 pages / 250 channels)
    while (hasMore && page < 5) {
      const url = `${CHZZK_API_BASE}/service/v1/channels/followings?size=50&page=${page}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (res.status === 401 || res.status === 403) {
        return { authenticated: false, followings: [] };
      }
      if (!res.ok) {
        // Fallback for single query without page parameter
        if (page === 0) {
          const fallbackRes = await fetch(`${CHZZK_API_BASE}/service/v1/channels/followings?size=100`, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            console.log('[Chzzk API] Followings fallback response:', fallbackData);
            const rawList = fallbackData?.content?.followingList ||
                            fallbackData?.content?.followings ||
                            fallbackData?.content?.data ||
                            (Array.isArray(fallbackData?.content) ? fallbackData.content : []);
            allItems.push(...rawList);
          }
        }
        break;
      }

      const data = await res.json();
      console.log(`[Chzzk API] Followings page ${page} response:`, data);

      const rawList = data?.content?.followingList ||
                      data?.content?.followings ||
                      data?.content?.data ||
                      (Array.isArray(data?.content) ? data.content : []);

      if (!Array.isArray(rawList) || rawList.length === 0) {
        break;
      }

      allItems.push(...rawList);

      const pageInfo = data?.content?.page;
      if (pageInfo && (pageInfo.more === true || (pageInfo.next !== null && pageInfo.next !== undefined))) {
        page++;
      } else {
        hasMore = false;
      }
    }

    const followings = allItems.map(item => {
      const ch = item.channel || item;
      return {
        channelId: ch.channelId || item.channelId,
        channelName: ch.channelName || item.channelName || 'Unknown Streamer',
        channelImageUrl: ch.channelImageUrl || item.channelImageUrl || '',
        verifiedMark: !!(ch.verifiedMark ?? item.verifiedMark)
      };
    }).filter(ch => ch.channelId);

    console.log(`[Chzzk API] Successfully fetched ${followings.length} total followings.`);
    return { authenticated: true, followings };
  } catch (err) {
    console.error('Failed to fetch followings list:', err);
    return { authenticated: false, followings: [], error: err.message };
  }
}
