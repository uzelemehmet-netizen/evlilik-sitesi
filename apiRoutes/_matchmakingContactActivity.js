function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function tsToMs(v) {
  if (!v) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
  const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

function dayKeyUtc(ms) {
  if (!ms || !Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export const CONTACT_SHARE_MIN_MESSAGES_PER_USER = 5;
export const CONTACT_SHARE_MIN_ACTIVE_DAYS = 2;

export async function getContactShareActivityStatus({ tx, matchRef, userIds }) {
  const participants = Array.isArray(userIds) ? userIds.map((x) => safeStr(x)).filter(Boolean).slice(0, 2) : [];
  const perUserMessageCount = Object.fromEntries(participants.map((id) => [id, 0]));
  const perDayByUid = {};

  if (participants.length !== 2) {
    return {
      eligible: false,
      participantDayCount: 0,
      minParticipantDays: CONTACT_SHARE_MIN_ACTIVE_DAYS,
      minMessagesPerUser: CONTACT_SHARE_MIN_MESSAGES_PER_USER,
      perUserMessageCount,
    };
  }

  const snap = await tx.get(matchRef.collection('messages').orderBy('createdAt', 'asc'));
  snap.forEach((doc) => {
    const data = doc.data() || {};
    if (safeStr(data?.type) === 'system') return;

    const senderUid = safeStr(data?.userId);
    if (!participants.includes(senderUid)) return;

    const text = safeStr(data?.text);
    if (!text) return;

    const ms =
      (typeof data?.createdAtMs === 'number' && Number.isFinite(data.createdAtMs) ? data.createdAtMs : 0) ||
      tsToMs(data?.createdAt) ||
      0;
    if (!ms) return;

    perUserMessageCount[senderUid] = (typeof perUserMessageCount[senderUid] === 'number' ? perUserMessageCount[senderUid] : 0) + 1;

    const key = dayKeyUtc(ms);
    if (!key) return;
    if (!perDayByUid[key]) {
      perDayByUid[key] = Object.fromEntries(participants.map((id) => [id, 0]));
    }
    perDayByUid[key][senderUid] += 1;
  });

  const participantDayCount = Object.values(perDayByUid).filter((dayCounts) => participants.every((id) => (dayCounts?.[id] || 0) > 0)).length;
  const enoughMessages = participants.every((id) => (perUserMessageCount?.[id] || 0) >= CONTACT_SHARE_MIN_MESSAGES_PER_USER);
  const enoughDays = participantDayCount >= CONTACT_SHARE_MIN_ACTIVE_DAYS;

  return {
    eligible: enoughMessages && enoughDays,
    participantDayCount,
    minParticipantDays: CONTACT_SHARE_MIN_ACTIVE_DAYS,
    minMessagesPerUser: CONTACT_SHARE_MIN_MESSAGES_PER_USER,
    perUserMessageCount,
  };
}