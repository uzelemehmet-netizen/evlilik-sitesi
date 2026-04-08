import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseDb';
import { useMatchmakingResetAtMs } from '../utils/matchmakingReset';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
  return 0;
}

function getOtherUidFromMatch(match, currentUid) {
  const aId = safeStr(match?.aUserId);
  const bId = safeStr(match?.bUserId);
  if (!currentUid) return '';
  if (aId && aId === currentUid) return bId;
  if (bId && bId === currentUid) return aId;
  return '';
}

function getOtherProfileFromMatch(match, currentUid) {
  const aId = safeStr(match?.aUserId);
  const bId = safeStr(match?.bUserId);
  const mySide = currentUid && aId === currentUid ? 'a' : currentUid && bId === currentUid ? 'b' : '';
  if (!mySide) return null;
  const otherSide = mySide === 'a' ? 'b' : 'a';
  return match?.profiles?.[otherSide] && typeof match.profiles[otherSide] === 'object' ? match.profiles[otherSide] : null;
}

function filterInboxLikes(raw, uid, cutoffMs) {
  const me = safeStr(uid);
  const list = Array.isArray(raw) ? raw : [];
  return list.filter((x) => {
    if (!x || typeof x !== 'object') return false;
    const createdAtMs = typeof x?.createdAtMs === 'number' && Number.isFinite(x.createdAtMs) ? x.createdAtMs : 0;
    if (cutoffMs > 0 && createdAtMs > 0 && createdAtMs < cutoffMs) return false;
    if (safeStr(x?.type) && safeStr(x?.type) !== 'like') return false;
    if (safeStr(x?.status) !== 'pending') return false;
    const fromUid = safeStr(x?.fromUid);
    const toUid = safeStr(x?.toUid);
    if (me && fromUid && fromUid === me) return false;
    if (me && toUid && toUid !== me) return false;
    const matchId = safeStr(x?.matchId || x?.id);
    return !!matchId;
  });
}

function filterPendingRequests(list, resetAtMs) {
  const items = Array.isArray(list) ? list : [];
  return items.filter((x) => {
    if (safeStr(x?.type) === 'people_list') return false;
    if (safeStr(x?.status) !== 'pending') return false;
    const createdAtMs = typeof x?.createdAtMs === 'number' && Number.isFinite(x.createdAtMs) ? x.createdAtMs : 0;
    if (resetAtMs > 0 && createdAtMs > 0 && createdAtMs < resetAtMs) return false;
    return true;
  });
}

function isVisibleMatch(match, resetAtMs) {
  const status = safeStr(match?.status);
  if (!status || status === 'cancelled') return false;
  const createdAtMs =
    (typeof match?.createdAtMs === 'number' && Number.isFinite(match.createdAtMs) ? match.createdAtMs : 0) || asMs(match?.createdAt) || 0;
  if (resetAtMs > 0 && createdAtMs > 0 && createdAtMs < resetAtMs) return false;
  return true;
}

function getMatchUpdatedAtMs(match) {
  return (
    (typeof match?.chatLastMessageAtMsAny === 'number' && Number.isFinite(match.chatLastMessageAtMsAny) ? match.chatLastMessageAtMsAny : 0) ||
    (typeof match?.updatedAtMs === 'number' && Number.isFinite(match.updatedAtMs) ? match.updatedAtMs : 0) ||
    asMs(match?.updatedAt) ||
    (typeof match?.createdAtMs === 'number' && Number.isFinite(match.createdAtMs) ? match.createdAtMs : 0) ||
    asMs(match?.createdAt) ||
    0
  );
}

export default function useStudioInboxHub(uid) {
  const mmReset = useMatchmakingResetAtMs();
  const resetAtMs = typeof mmReset?.resetAtMs === 'number' && Number.isFinite(mmReset.resetAtMs) ? mmReset.resetAtMs : 0;

  const cleanUid = safeStr(uid);

  const [inboxLikes, setInboxLikes] = useState([]);
  const [inboxAccess, setInboxAccess] = useState([]);
  const [inboxProfileAccess, setInboxProfileAccess] = useState([]);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (!cleanUid) {
      setInboxLikes([]);
      return;
    }

    const ref = query(collection(db, 'matchmakingUsers', cleanUid, 'inboxLikes'), orderBy('createdAtMs', 'desc'), limit(30));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxLikes(filterInboxLikes(items, cleanUid, resetAtMs));
      },
      () => setInboxLikes([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [cleanUid, resetAtMs]);

  useEffect(() => {
    if (!cleanUid) {
      setInboxAccess([]);
      return;
    }

    const ref = query(collection(db, 'matchmakingUsers', cleanUid, 'inboxPreMatchRequests'), orderBy('createdAtMs', 'desc'), limit(40));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxAccess(items);
      },
      () => setInboxAccess([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [cleanUid]);

  useEffect(() => {
    if (!cleanUid) {
      setInboxProfileAccess([]);
      return;
    }

    const ref = query(collection(db, 'matchmakingUsers', cleanUid, 'inboxAccessRequests'), orderBy('createdAtMs', 'desc'), limit(40));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxProfileAccess(items);
      },
      () => setInboxProfileAccess([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [cleanUid]);

  useEffect(() => {
    if (!cleanUid) {
      setInboxMessages([]);
      return;
    }

    const ref = query(collection(db, 'matchmakingUsers', cleanUid, 'inboxMessages'), orderBy('createdAtMs', 'desc'), limit(60));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        const filtered = items.filter((item) => {
          const createdAtMs = typeof item?.createdAtMs === 'number' && Number.isFinite(item.createdAtMs) ? item.createdAtMs : 0;
          if (resetAtMs > 0 && createdAtMs > 0 && createdAtMs < resetAtMs) return false;
          return !!safeStr(item?.text);
        });
        setInboxMessages(filtered);
      },
      () => setInboxMessages([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [cleanUid, resetAtMs]);

  useEffect(() => {
    if (!cleanUid) {
      setMatches([]);
      return;
    }

    let unsub = null;
    let didFallback = false;

    const startListen = (preferUpdatedAt) => {
      const base = [collection(db, 'matchmakingMatches'), where('userIds', 'array-contains', cleanUid)];
      const ref = preferUpdatedAt ? query(...base, orderBy('updatedAt', 'desc'), limit(60)) : query(...base, limit(60));

      unsub = onSnapshot(
        ref,
        (snap) => {
          const items = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
          setMatches(items);
        },
        (error) => {
          const code = safeStr(error?.code);
          if (!didFallback && preferUpdatedAt && code === 'failed-precondition') {
            didFallback = true;
            try {
              unsub?.();
            } catch {
              // noop
            }
            startListen(false);
            return;
          }
          setMatches([]);
        }
      );
    };

    startListen(true);

    return () => {
      try {
        unsub?.();
      } catch {
        // noop
      }
    };
  }, [cleanUid]);

  const visibleMatches = useMemo(() => {
    return (Array.isArray(matches) ? matches : [])
      .filter((match) => isVisibleMatch(match, resetAtMs))
      .slice()
      .sort((a, b) => {
        const diff = getMatchUpdatedAtMs(b) - getMatchUpdatedAtMs(a);
        if (diff !== 0) return diff;
        return safeStr(a?.id).localeCompare(safeStr(b?.id));
      });
  }, [matches, resetAtMs]);

  const pendingRequests = useMemo(() => {
    return filterPendingRequests([...(Array.isArray(inboxAccess) ? inboxAccess : []), ...(Array.isArray(inboxProfileAccess) ? inboxProfileAccess : [])], resetAtMs);
  }, [inboxAccess, inboxProfileAccess, resetAtMs]);

  const unreadInboxMessagesCount = useMemo(() => {
    return (Array.isArray(inboxMessages) ? inboxMessages : []).filter((item) => {
      const readAtMs = typeof item?.readAtMs === 'number' && Number.isFinite(item.readAtMs) ? item.readAtMs : 0;
      return !!safeStr(item?.text) && readAtMs <= 0;
    }).length;
  }, [inboxMessages]);

  const unreadMatchMessagesCount = useMemo(() => {
    return visibleMatches.reduce((sum, match) => {
      const unreadMap = match?.chatUnreadByUid && typeof match.chatUnreadByUid === 'object' ? match.chatUnreadByUid : {};
      const unread = cleanUid && typeof unreadMap?.[cleanUid] === 'number' ? unreadMap[cleanUid] : 0;
      return sum + (Number.isFinite(unread) && unread > 0 ? unread : 0);
    }, 0);
  }, [cleanUid, visibleMatches]);

  const messageThreads = useMemo(() => {
    const mergedByUid = new Map();

    visibleMatches.forEach((match) => {
      const matchId = safeStr(match?.id);
      const targetUid = getOtherUidFromMatch(match, cleanUid);
      const profile = getOtherProfileFromMatch(match, cleanUid) || {};
      const unreadMap = match?.chatUnreadByUid && typeof match.chatUnreadByUid === 'object' ? match.chatUnreadByUid : {};
      const unreadCount = cleanUid && typeof unreadMap?.[cleanUid] === 'number' ? unreadMap[cleanUid] : 0;
      const updatedAtMs = getMatchUpdatedAtMs(match);
      const preview = safeStr(match?.chatLastMessagePreview);
      const hasConversation = !!preview || (Number.isFinite(unreadCount) && unreadCount > 0) || ((typeof match?.chatLastMessageAtMsAny === 'number' && Number.isFinite(match.chatLastMessageAtMsAny) ? match.chatLastMessageAtMsAny : 0) > 0);
      if (!matchId || !targetUid || !hasConversation) return;

      mergedByUid.set(targetUid, {
        key: `match:${matchId}`,
        kind: 'match',
        matchId,
        targetUid,
        displayName: safeStr(profile?.username),
        photoUrl: safeStr(profile?.photoUrl || (Array.isArray(profile?.photoUrls) ? profile.photoUrls[0] : '')),
        preview,
        updatedAtMs,
        unreadCount: Number.isFinite(unreadCount) && unreadCount > 0 ? unreadCount : 0,
        unreadMessageIds: [],
      });
    });

    const directGroups = new Map();
    (Array.isArray(inboxMessages) ? inboxMessages : []).forEach((item) => {
      const targetUid = safeStr(item?.fromUid);
      if (!targetUid) return;
      const current = directGroups.get(targetUid) || {
        key: `direct:${targetUid}`,
        kind: 'direct',
        matchId: '',
        targetUid,
        displayName: '',
        photoUrl: '',
        preview: '',
        updatedAtMs: 0,
        unreadCount: 0,
        unreadMessageIds: [],
      };

      const createdAtMs = typeof item?.createdAtMs === 'number' && Number.isFinite(item.createdAtMs) ? item.createdAtMs : 0;
      const readAtMs = typeof item?.readAtMs === 'number' && Number.isFinite(item.readAtMs) ? item.readAtMs : 0;
      const profile = item?.fromProfile && typeof item.fromProfile === 'object' ? item.fromProfile : {};

      if (createdAtMs >= current.updatedAtMs) {
        current.preview = safeStr(item?.text);
        current.updatedAtMs = createdAtMs;
        current.displayName = safeStr(profile?.username) || current.displayName;
        current.photoUrl = safeStr(profile?.photoUrl || current.photoUrl);
      }

      if (readAtMs <= 0 && safeStr(item?.id)) {
        current.unreadCount += 1;
        current.unreadMessageIds.push(safeStr(item?.id));
      }

      directGroups.set(targetUid, current);
    });

    directGroups.forEach((thread, targetUid) => {
      const existing = mergedByUid.get(targetUid);
      if (!existing) {
        mergedByUid.set(targetUid, thread);
        return;
      }

      const useDirectPreview = thread.updatedAtMs >= existing.updatedAtMs;
      mergedByUid.set(targetUid, {
        ...existing,
        preview: useDirectPreview ? thread.preview : existing.preview,
        updatedAtMs: Math.max(existing.updatedAtMs, thread.updatedAtMs),
        unreadCount: (existing.unreadCount || 0) + (thread.unreadCount || 0),
        unreadMessageIds: [...(existing.unreadMessageIds || []), ...(thread.unreadMessageIds || [])],
        displayName: existing.displayName || thread.displayName,
        photoUrl: existing.photoUrl || thread.photoUrl,
      });
    });

    return Array.from(mergedByUid.values()).sort((a, b) => {
      if (b.updatedAtMs !== a.updatedAtMs) return b.updatedAtMs - a.updatedAtMs;
      return safeStr(a?.displayName).localeCompare(safeStr(b?.displayName));
    });
  }, [cleanUid, inboxMessages, visibleMatches]);

  const messageHubCount = useMemo(() => {
    return unreadInboxMessagesCount + unreadMatchMessagesCount + inboxLikes.length + pendingRequests.length;
  }, [inboxLikes.length, pendingRequests.length, unreadInboxMessagesCount, unreadMatchMessagesCount]);

  return {
    inboxLikes,
    pendingRequests,
    inboxMessages,
    visibleMatches,
    messageThreads,
    pendingLikesCount: inboxLikes.length,
    pendingRequestsCount: pendingRequests.length,
    unreadInboxMessagesCount,
    unreadMatchMessagesCount,
    messageHubCount,
  };
}