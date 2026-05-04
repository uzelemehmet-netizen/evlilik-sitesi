import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function safeMs(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function parseDateYYYYMMDD(v) {
  const s = safeStr(v);
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return s;
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayStartEndUtcMsTR(dayKey) {
  const offsetMs = 180 * 60 * 1000;
  const [y, m, d] = String(dayKey || '').split('-').map((x) => Number(x));
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMs;
  return { startUtcMs, endUtcMs: startUtcMs + 24 * 60 * 60 * 1000 };
}

function dayKeysLastNDays(n, nowMs) {
  const out = [];
  const total = Math.max(1, safeInt(n, 30));
  for (let i = 0; i < total; i += 1) out.push(dayKeyTRFromMs(nowMs - i * 24 * 60 * 60 * 1000));
  return out;
}

function chunkArray(values, size = 200) {
  const list = Array.isArray(values) ? values : [];
  const out = [];
  const chunkSize = Math.max(1, safeInt(size, 200));
  for (let i = 0; i < list.length; i += chunkSize) out.push(list.slice(i, i + chunkSize));
  return out;
}

function uniqueStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((v) => safeStr(v)).filter(Boolean)));
}

function tsToMs(v) {
  try {
    if (!v) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v?.seconds === 'number') return Math.floor(v.seconds * 1000 + (typeof v?.nanoseconds === 'number' ? v.nanoseconds / 1e6 : 0));
    return 0;
  } catch {
    return 0;
  }
}

function shouldCountChatMessage(data) {
  const row = data && typeof data === 'object' ? data : {};
  const deliveryState = safeStr(row?.delivery?.state).toLowerCase();
  if (deliveryState === 'held') return false;
  if (safeStr(row?.type).toLowerCase() === 'system') return false;
  if (!safeStr(row?.userId)) return false;
  if (!safeStr(row?.text)) return false;
  return true;
}

const REFERRAL_SHARE_EVENT_PREFIX = 'studio_referral_share_';

function isReferralShareEventKey(raw) {
  return safeStr(raw).toLowerCase().startsWith(REFERRAL_SHARE_EVENT_PREFIX);
}

function parseReferralShareEventKey(raw) {
  const eventKey = safeStr(raw).toLowerCase();
  if (!isReferralShareEventKey(eventKey)) return { platform: '', action: '' };

  const tail = eventKey.slice(REFERRAL_SHARE_EVENT_PREFIX.length);
  for (const suffix of ['_native', '_fallback', '_open']) {
    if (tail.endsWith(suffix)) {
      return {
        platform: tail.slice(0, -suffix.length),
        action: suffix.slice(1),
      };
    }
  }

  return { platform: tail, action: '' };
}

function buildMessagerRows(matches) {
  const messagerByUid = new Map();

  for (const match of Array.isArray(matches) ? matches : []) {
    for (const uid of Array.isArray(match?.userIds) ? match.userIds : []) {
      const senderUid = safeStr(uid);
      if (!senderUid) continue;

      const sentCount = safeInt(match?.perUidCount?.[senderUid], 0) || 0;
      if (sentCount <= 0) continue;

      let row = messagerByUid.get(senderUid);
      if (!row) {
        row = { uid: senderUid, matchCount: 0, sentCount: 0, lastMessageAtMs: 0, targets: {} };
        messagerByUid.set(senderUid, row);
      }

      const targetUids = (Array.isArray(match?.userIds) ? match.userIds : []).filter((otherUid) => safeStr(otherUid) && safeStr(otherUid) !== senderUid);

      row.matchCount += 1;
      row.sentCount += sentCount;
      for (const targetUid of targetUids) {
        row.targets[targetUid] = safeInt(row.targets[targetUid], 0) + sentCount;
      }
      if (safeMs(match?.lastMessageAtMs) > row.lastMessageAtMs) row.lastMessageAtMs = match.lastMessageAtMs;
    }
  }

  return Array.from(messagerByUid.values()).sort((a, b) => {
    if (safeInt(b?.matchCount, 0) !== safeInt(a?.matchCount, 0)) {
      return safeInt(b?.matchCount, 0) - safeInt(a?.matchCount, 0);
    }
    return safeMs(b?.lastMessageAtMs) - safeMs(a?.lastMessageAtMs);
  });
}

function buildSenderRecipientPairs(matches) {
  const pairMap = new Map();

  for (const match of Array.isArray(matches) ? matches : []) {
    const userIds = Array.isArray(match?.userIds) ? match.userIds.map((uid) => safeStr(uid)).filter(Boolean) : [];
    const perUidCount = match?.perUidCount && typeof match.perUidCount === 'object' ? match.perUidCount : {};

    for (const fromUid of userIds) {
      const sentCount = safeInt(perUidCount?.[fromUid], 0);
      if (sentCount <= 0) continue;

      for (const toUid of userIds) {
        const cleanToUid = safeStr(toUid);
        if (!cleanToUid || cleanToUid === fromUid) continue;

        const key = `${fromUid}__${cleanToUid}`;
        let row = pairMap.get(key);
        if (!row) {
          row = {
            fromUid,
            toUid: cleanToUid,
            sentCount: 0,
            matchCount: 0,
            lastMessageAtMs: 0,
            lastMessageMatchId: '',
            sameDayReciprocal: false,
          };
          pairMap.set(key, row);
        }

        row.sentCount += sentCount;
        row.matchCount += 1;
        if (safeMs(match?.lastMessageAtMs) > row.lastMessageAtMs) {
          row.lastMessageAtMs = safeMs(match?.lastMessageAtMs);
          row.lastMessageMatchId = safeStr(match?.id);
        }
      }
    }
  }

  for (const [key, row] of pairMap.entries()) {
    const reverseKey = `${row.toUid}__${row.fromUid}`;
    if (pairMap.has(reverseKey)) row.sameDayReciprocal = true;
  }

  return Array.from(pairMap.values()).sort((a, b) => {
    if (safeInt(b?.sentCount, 0) !== safeInt(a?.sentCount, 0)) {
      return safeInt(b?.sentCount, 0) - safeInt(a?.sentCount, 0);
    }
    if (safeInt(b?.matchCount, 0) !== safeInt(a?.matchCount, 0)) {
      return safeInt(b?.matchCount, 0) - safeInt(a?.matchCount, 0);
    }
    return safeMs(b?.lastMessageAtMs) - safeMs(a?.lastMessageAtMs);
  });
}

async function getHistoricallyReciprocalMatchIds(db, matchIds) {
  const ids = uniqueStrings(matchIds);
  const reciprocalIds = new Set();

  for (const chunk of chunkArray(ids, 20)) {
    const results = await Promise.all(
      chunk.map(async (matchId) => {
        try {
          const snap = await db.collection('matchmakingMatches').doc(matchId).collection('messages').get();
          const userIds = new Set();
          snap.forEach((doc) => {
            const data = doc.data() || {};
            if (!shouldCountChatMessage(data)) return;
            userIds.add(safeStr(data?.userId));
          });
          return userIds.size >= 2 ? matchId : '';
        } catch {
          return '';
        }
      })
    );

    for (const matchId of results) {
      if (matchId) reciprocalIds.add(matchId);
    }
  }

  return reciprocalIds;
}

function appendActiveMessage(map, { matchId, userId, createdAtMs } = {}) {
  const cleanMatchId = safeStr(matchId);
  const cleanUserId = safeStr(userId);
  const ts = safeMs(createdAtMs);
  if (!cleanMatchId || !cleanUserId || !ts) return;

  let entry = map.get(cleanMatchId);
  if (!entry) {
    entry = { userIds: new Set(), perUidCount: {}, lastMessageAtMs: 0, lastMessageSenderUid: '', totalMessages: 0 };
    map.set(cleanMatchId, entry);
  }

  entry.userIds.add(cleanUserId);
  entry.perUidCount[cleanUserId] = (entry.perUidCount[cleanUserId] || 0) + 1;
  entry.totalMessages += 1;
  if (ts > entry.lastMessageAtMs) {
    entry.lastMessageAtMs = ts;
    entry.lastMessageSenderUid = cleanUserId;
  }
}

async function loadActiveMessageMatchesRaw({ db, startUtcMs, endUtcMs, limit } = {}) {
  const activeMessageMatchesRaw = new Map();
  const scanLimit = Math.max(safeInt(limit, 100) * 20, 1000);

  try {
    const msgSnap = await db
      .collectionGroup('messages')
      .where('createdAtMs', '>=', startUtcMs)
      .where('createdAtMs', '<', endUtcMs)
      .limit(scanLimit)
      .get();

    msgSnap.forEach((doc) => {
      const data = doc.data() || {};
      if (!shouldCountChatMessage(data)) return;

      const matchId = safeStr(data?.matchId) || safeStr(doc.ref?.parent?.parent?.id);
      const userId = safeStr(data?.userId);
      const createdAtMs = safeMs(data?.createdAtMs) || tsToMs(data?.createdAt);
      appendActiveMessage(activeMessageMatchesRaw, { matchId, userId, createdAtMs });
    });

    return { activeMessageMatchesRaw, source: 'collection_group', fallbackReason: '' };
  } catch (error) {
    const fallbackReason = safeStr(error?.message) || safeStr(error?.code) || 'message_query_failed';
    let matchSnap = null;

    try {
      matchSnap = await db
        .collection('matchmakingMatches')
        .where('chatLastMessageAtMsAny', '>=', startUtcMs)
        .orderBy('chatLastMessageAtMsAny', 'desc')
        .limit(Math.max(safeInt(limit, 100) * 12, 240))
        .get();
    } catch {
      try {
        matchSnap = await db
          .collection('matchmakingMatches')
          .orderBy('chatLastMessageAtMsAny', 'desc')
          .limit(Math.max(safeInt(limit, 100) * 12, 240))
          .get();
      } catch {
        return { activeMessageMatchesRaw, source: 'unavailable', fallbackReason };
      }
    }

    for (const matchDoc of matchSnap.docs) {
      const matchData = matchDoc.data() || {};
      const lastAnyAtMs = safeMs(matchData?.chatLastMessageAtMsAny);
      if (lastAnyAtMs > 0 && lastAnyAtMs < startUtcMs) break;

      let msgSnap = null;
      try {
        msgSnap = await matchDoc.ref
          .collection('messages')
          .where('createdAt', '>=', new Date(startUtcMs))
          .where('createdAt', '<', new Date(endUtcMs))
          .limit(Math.max(safeInt(limit, 100) * 10, 120))
          .get();
      } catch {
        try {
          msgSnap = await matchDoc.ref.collection('messages').orderBy('createdAt', 'desc').limit(Math.max(safeInt(limit, 100) * 10, 120)).get();
        } catch {
          msgSnap = null;
        }
      }

      if (!msgSnap) continue;
      msgSnap.forEach((doc) => {
        const data = doc.data() || {};
        if (!shouldCountChatMessage(data)) return;

        const createdAtMs = safeMs(data?.createdAtMs) || tsToMs(data?.createdAt);
        if (createdAtMs < startUtcMs || createdAtMs >= endUtcMs) return;

        appendActiveMessage(activeMessageMatchesRaw, {
          matchId: safeStr(data?.matchId) || matchDoc.id,
          userId: safeStr(data?.userId),
          createdAtMs,
        });
      });
    }

    return { activeMessageMatchesRaw, source: 'match_fallback', fallbackReason };
  }
}

function isMembershipActive(userDoc, nowMs = Date.now()) {
  const membership = userDoc?.membership || null;
  if (!membership || membership.active !== true) return false;
  const untilMs = typeof membership.validUntilMs === 'number' ? membership.validUntilMs : 0;
  return untilMs > nowMs;
}

function pickUserSummary(userDoc, uid, nowMs) {
  const d = userDoc && typeof userDoc === 'object' ? userDoc : {};
  const app = d?.application && typeof d.application === 'object' ? d.application : null;
  const profile = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile : null;
  const details = d?.details && typeof d.details === 'object' ? d.details : null;
  return {
    uid: safeStr(uid) || null,
    userCode: safeStr(d?.userCode) || safeStr(profile?.userCode) || null,
    username: safeStr(d?.username) || safeStr(profile?.username) || safeStr(app?.username) || null,
    fullName: safeStr(d?.fullName) || safeStr(profile?.fullName) || safeStr(app?.fullName) || null,
    gender: safeStr(d?.gender) || safeStr(profile?.gender) || safeStr(app?.gender) || null,
    city: safeStr(d?.city) || safeStr(profile?.city) || safeStr(app?.city) || safeStr(details?.city) || null,
    country: safeStr(d?.country) || safeStr(profile?.country) || safeStr(app?.country) || safeStr(details?.country) || null,
    lastSeenAtMs: safeMs(d?.lastSeenAtMs) || tsToMs(d?.lastSeenAt) || null,
    membershipActive: isMembershipActive(d, nowMs),
  };
}

async function getDocsById(db, collectionName, ids) {
  const result = new Map();
  const chunks = chunkArray(ids, 200);
  for (const chunk of chunks) {
    const refs = chunk.map((id) => db.collection(collectionName).doc(id));
    let snaps = [];
    try {
      snaps = refs.length ? await db.getAll(...refs) : [];
    } catch {
      snaps = await Promise.all(refs.map((ref) => ref.get()));
    }
    for (let i = 0; i < chunk.length; i += 1) {
      const snap = snaps[i];
      result.set(chunk[i], snap && snap.exists ? { id: snap.id, ...(snap.data() || {}) } : null);
    }
  }
  return result;
}

export default async function adminDailyActivitySummary(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const days = Math.min(Math.max(safeInt(body?.days, 30), 1), 31);
    const limit = Math.min(Math.max(safeInt(body?.limit, 200), 20), 500);
    const nowMs = Date.now();
    const dayKeys = dayKeysLastNDays(days, nowMs);
    const dayKey = parseDateYYYYMMDD(body?.dayKey) || dayKeys[0];
    const { startUtcMs, endUtcMs } = dayStartEndUtcMsTR(dayKey);

    const { db } = getAdmin();

    const likeMatchesById = new Map();
    const addLikeMatch = (doc) => {
      if (!doc?.exists) return;
      const data = doc.data() || {};
      const id = safeStr(doc.id);
      if (!id) return;
      if (likeMatchesById.has(id)) return;
      const userIds = uniqueStrings(data?.userIds);
      likeMatchesById.set(id, {
        id,
        matchCode: safeStr(data?.matchCode) || null,
        matchNo: typeof data?.matchNo === 'number' && Number.isFinite(data.matchNo) ? data.matchNo : null,
        status: safeStr(data?.status) || null,
        userIds,
        eventAtMs: safeMs(data?.mutualInterestAtMs) || safeMs(data?.mutualAcceptedAtMs) || tsToMs(data?.updatedAt) || null,
      });
    };

    try {
      const snap = await db
        .collection('matchmakingMatches')
        .where('mutualInterestAtMs', '>=', startUtcMs)
        .where('mutualInterestAtMs', '<', endUtcMs)
        .limit(limit)
        .get();
      snap.forEach(addLikeMatch);
    } catch {
      // ignore
    }

    try {
      const snap = await db
        .collection('matchmakingMatches')
        .where('mutualAcceptedAtMs', '>=', startUtcMs)
        .where('mutualAcceptedAtMs', '<', endUtcMs)
        .limit(limit)
        .get();
      snap.forEach(addLikeMatch);
    } catch {
      // ignore
    }

    const {
      activeMessageMatchesRaw,
      source: activeMessageSource,
      fallbackReason: activeMessageFallbackReason,
    } = await loadActiveMessageMatchesRaw({ db, startUtcMs, endUtcMs, limit });

    const sameDayReciprocalMatchIds = Array.from(activeMessageMatchesRaw.entries())
      .filter(([, value]) => value?.userIds && value.userIds.size >= 2)
      .map(([matchId]) => matchId);

    const activeMatchIds = Array.from(activeMessageMatchesRaw.keys())
      .sort((a, b) => safeMs(activeMessageMatchesRaw.get(b)?.lastMessageAtMs) - safeMs(activeMessageMatchesRaw.get(a)?.lastMessageAtMs))
      .slice(0, limit);

    const activeMatchDocs = activeMatchIds.length ? await getDocsById(db, 'matchmakingMatches', activeMatchIds) : new Map();

    const activeMessageMatches = activeMatchIds.map((matchId) => {
      const raw = activeMessageMatchesRaw.get(matchId) || null;
      const doc = activeMatchDocs.get(matchId) || null;
      const userIds = uniqueStrings(doc?.userIds || Array.from(raw?.userIds || []));
      const activeSenderCount = raw?.userIds instanceof Set ? raw.userIds.size : Array.isArray(raw?.userIds) ? raw.userIds.length : 0;
      return {
        id: matchId,
        matchCode: safeStr(doc?.matchCode) || null,
        matchNo: typeof doc?.matchNo === 'number' && Number.isFinite(doc.matchNo) ? doc.matchNo : null,
        status: safeStr(doc?.status) || null,
        userIds,
        totalMessages: raw?.totalMessages || 0,
        lastMessageAtMs: raw?.lastMessageAtMs || null,
        lastMessageSenderUid: safeStr(raw?.lastMessageSenderUid) || null,
        perUidCount: raw?.perUidCount || {},
        activeSenderCount,
        sameDayReciprocal: activeSenderCount >= 2,
      };
    });

    const historicalReciprocalMatchIds = await getHistoricallyReciprocalMatchIds(db, Array.from(activeMessageMatchesRaw.keys()));
    const reciprocalMatchIds = activeMatchIds
      .filter((matchId) => historicalReciprocalMatchIds.has(matchId))
      .slice(0, limit);

    const reciprocalMatches = reciprocalMatchIds
      .map((matchId) => {
        const item = activeMessageMatches.find((entry) => entry.id === matchId);
        return item || null;
      })
      .filter(Boolean)
      .sort((a, b) => safeMs(b?.lastMessageAtMs) - safeMs(a?.lastMessageAtMs));

    const sameDayReciprocalUserIds = new Set();
    let sameDayReciprocalMessageTotal = 0;
    for (const matchId of sameDayReciprocalMatchIds) {
      const raw = activeMessageMatchesRaw.get(matchId) || null;
      for (const uid of Array.from(raw?.userIds || [])) sameDayReciprocalUserIds.add(uid);
      sameDayReciprocalMessageTotal += safeInt(raw?.totalMessages, 0);
    }

    let onlineDocs = [];
    try {
      const snap = await db
        .collection('matchmakingUsers')
        .where('lastSeenAtMs', '>=', startUtcMs)
        .where('lastSeenAtMs', '<', endUtcMs)
        .orderBy('lastSeenAtMs', 'desc')
        .limit(limit)
        .get();
      onlineDocs = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));
    } catch {
      onlineDocs = [];
    }

    const uidSet = new Set();
    for (const item of likeMatchesById.values()) for (const uid of item.userIds || []) uidSet.add(uid);
    for (const item of activeMessageMatches) for (const uid of item.userIds || []) uidSet.add(uid);
    for (const item of reciprocalMatches) for (const uid of item.userIds || []) uidSet.add(uid);
    for (const item of onlineDocs) uidSet.add(String(item.id || ''));

    const uidList = Array.from(uidSet).filter(Boolean);
    const userDocs = uidList.length ? await getDocsById(db, 'matchmakingUsers', uidList) : new Map();

    const userByUid = {};
    for (const uid of uidList) {
      const userDoc = userDocs.get(uid) || null;
      if (!userDoc) continue;
      userByUid[uid] = pickUserSummary(userDoc, uid, nowMs);
    }

    const activeMessageSenders = buildMessagerRows(activeMessageMatches).map((row) => ({
      uid: row.uid,
      messageMatchCount: row.matchCount,
      sentCount: row.sentCount,
      lastMessageAtMs: row.lastMessageAtMs,
      targets: row.targets,
    }));

    const reciprocalMessagers = buildMessagerRows(reciprocalMatches).map((row) => ({
      uid: row.uid,
      reciprocalMatchCount: row.matchCount,
      sentCount: row.sentCount,
      lastMessageAtMs: row.lastMessageAtMs,
      targets: row.targets,
    }));

    const senderRecipientPairs = buildSenderRecipientPairs(activeMessageMatches).map((row) => ({
      fromUid: row.fromUid,
      toUid: row.toUid,
      sentCount: row.sentCount,
      matchCount: row.matchCount,
      lastMessageAtMs: row.lastMessageAtMs,
      lastMessageMatchId: row.lastMessageMatchId || null,
      sameDayReciprocal: row.sameDayReciprocal === true,
    }));

    const onlineUsers = onlineDocs
      .map((doc) => ({ uid: String(doc.id || ''), lastSeenAtMs: safeMs(doc.lastSeenAtMs) || tsToMs(doc.lastSeenAt) || null }))
      .filter((row) => row.uid)
      .sort((a, b) => safeMs(b?.lastSeenAtMs) - safeMs(a?.lastSeenAtMs));

    let referralShareClicks = [];
    try {
      const snap = await db
        .collection('clickEvents')
        .where('dayKey', '==', dayKey)
        .limit(Math.min(Math.max(limit * 4, 400), 1000))
        .get();

      referralShareClicks = snap.docs
        .map((doc) => {
          const data = doc.data() || {};
          const eventKey = safeStr(data?.eventKey);
          if (!isReferralShareEventKey(eventKey)) return null;
          const parsed = parseReferralShareEventKey(eventKey);
          return {
            id: doc.id,
            eventKey,
            platform: parsed.platform,
            action: parsed.action,
            page: safeStr(data?.page) || null,
            createdAtMs: safeMs(data?.createdAtMs) || tsToMs(data?.createdAt) || null,
            anonId: safeStr(data?.anonId) || null,
          };
        })
        .filter(Boolean)
        .sort((a, b) => safeMs(b?.createdAtMs) - safeMs(a?.createdAtMs));
    } catch {
      referralShareClicks = [];
    }

    const mutualLikeUsers = new Set();
    for (const match of likeMatchesById.values()) for (const uid of match.userIds || []) mutualLikeUsers.add(uid);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(
      JSON.stringify({
        ok: true,
        dayKey,
        dayKeys,
        range: { startUtcMs, endUtcMs },
        summary: {
          mutualLikeMatches: likeMatchesById.size,
          mutualLikeUsers: mutualLikeUsers.size,
          activeMessageMatches: activeMessageMatches.length,
          activeMessageUsers: activeMessageSenders.length,
          activeMessageTotal: activeMessageMatches.reduce((sum, item) => sum + safeInt(item?.totalMessages, 0), 0),
          reciprocalMessageMatches: reciprocalMatches.length,
          reciprocalMessageUsers: reciprocalMessagers.length,
          reciprocalMessageTotal: reciprocalMatches.reduce((sum, item) => sum + safeInt(item?.totalMessages, 0), 0),
          sameDayReciprocalMessageMatches: sameDayReciprocalMatchIds.length,
          sameDayReciprocalMessageUsers: sameDayReciprocalUserIds.size,
          sameDayReciprocalMessageTotal,
          onlineUsers: onlineUsers.length,
          referralShareClicks: referralShareClicks.length,
        },
        mutualLikes: Array.from(likeMatchesById.values()).sort((a, b) => safeMs(b?.eventAtMs) - safeMs(a?.eventAtMs)),
        activeMessageMatches,
        activeMessageSenders,
        senderRecipientPairs,
        reciprocalMatches,
        reciprocalMessagers,
        onlineUsers,
        referralShareClicks,
        activeMessageSource,
        activeMessageFallbackReason: activeMessageSource === 'collection_group' ? '' : activeMessageFallbackReason,
        userByUid,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}