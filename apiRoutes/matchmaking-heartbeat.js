import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { computeFreeActiveMembershipState, isFreeActiveEnabled } from './_matchmakingEligibility.js';
import matchmakingRun from './matchmaking-run.js';

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

function lastSeenMsFromUserDoc(userDoc) {
  const ms = typeof userDoc?.lastSeenAtMs === 'number' && Number.isFinite(userDoc.lastSeenAtMs) ? userDoc.lastSeenAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(userDoc?.lastSeenAt);
  return ts > 0 ? ts : 0;
}

function clearUserLockIfMatch(userDoc, matchId) {
  const lock = userDoc?.matchmakingLock || null;
  const choice = userDoc?.matchmakingChoice || null;

  const lockMatchId = safeStr(lock?.matchId);
  const choiceMatchId = safeStr(choice?.matchId);

  const patch = {};
  if (lockMatchId === matchId) patch.matchmakingLock = { active: false, matchId: '', matchCode: '' };
  if (choiceMatchId === matchId) patch.matchmakingChoice = { active: false, matchId: '', matchCode: '' };
  return patch;
}

function clearUserPendingIfMatch(userDoc, matchId) {
  const pending = userDoc?.matchmakingPendingContinue || null;
  const active = !!pending?.active;
  const pendingMatchId = safeStr(pending?.matchId);
  if (active && pendingMatchId === matchId) return { matchmakingPendingContinue: { active: false, matchId: '' } };
  return {};
}

function baseMsFromMatch(match) {
  const base =
    (typeof match?.chatEnabledAtMs === 'number' ? match.chatEnabledAtMs : 0) ||
    (typeof match?.mutualAcceptedAtMs === 'number' ? match.mutualAcceptedAtMs : 0) ||
    (typeof match?.createdAtMs === 'number' ? match.createdAtMs : 0) ||
    tsToMs(match?.chatEnabledAt) ||
    tsToMs(match?.mutualAcceptedAt) ||
    tsToMs(match?.createdAt) ||
    0;
  return typeof base === 'number' && Number.isFinite(base) ? base : 0;
}

function promoCutoffMsTR() {
  return new Date('2026-02-10T23:59:59.999+03:00').getTime();
}

function nextInactiveCount(prev) {
  const n = typeof prev === 'number' ? prev : Number(prev);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function normalizeNat(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'turkey' || s === 'türkiye') return 'tr';
  if (s === 'id' || s === 'indonesia' || s === 'endonezya') return 'id';
  if (s === 'other') return 'other';
  return '';
}

function oppositeGender(g) {
  if (g === 'male') return 'female';
  if (g === 'female') return 'male';
  return '';
}

function defaultLookingForNationality(nat) {
  if (nat === 'tr') return 'id';
  if (nat === 'id') return 'tr';
  return 'other';
}

async function ensureAutoStubApplicationIfMissing({ db, FieldValue, uid, userDoc, nowMs }) {
  try {
    const existing = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
    if (existing && !existing.empty) return { ensured: true, created: false, reason: 'already_exists' };

    const gender = normalizeGender(userDoc?.gender);
    const nationality = normalizeNat(userDoc?.nationality) || 'other';
    const nationalityOther = safeStr(userDoc?.nationalityOther);
    if (!gender) return { ensured: false, created: false, reason: 'missing_profile' };

    const lookingForGender = oppositeGender(gender);
    if (!lookingForGender) return { ensured: false, created: false, reason: 'bad_gender' };

    const lookingForNationality = 'other';
    const applicationId = `auto_${uid}`;
    const ref = db.collection('matchmakingApplications').doc(applicationId);
    const snap = await ref.get();
    if (snap.exists) return { ensured: true, created: false, reason: 'auto_doc_exists', applicationId };

    await ref.set(
      {
        userId: uid,
        source: 'auto_stub',
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: nowMs,
        updatedAt: FieldValue.serverTimestamp(),

        gender,
        lookingForGender,

        nationality,
        nationalityOther: nationality === 'other' ? nationalityOther : '',
        lookingForNationality,
        lookingForNationalityOther: '',

        details: {
          autoBootstrap: true,
        },

        // Firestore rules create'da bu alanlar zorunlu olabilir.
        consent18Plus: true,
        consentPrivacy: false,
        consentTerms: false,
        consentPhotoShare: false,
      },
      { merge: false }
    );

    return { ensured: true, created: true, reason: 'created', applicationId };
  } catch {
    return { ensured: false, created: false, reason: 'failed' };
  }
}

async function maybeRunMatchmakingFromHeartbeat({ db, FieldValue, uid }) {
  const secret = String(process.env.MATCHMAKING_CRON_SECRET || '').trim();
  if (!secret) return { attempted: false, reason: 'cron_secret_not_configured' };

  const intervalMs = 5 * 60 * 1000;
  const staleRunningMs = 10 * 60 * 1000;
  const nowMs = Date.now();

  const lockRef = db.collection('matchmakingAutomation').doc('heartbeat_run');
  let allowed = false;
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      const cur = snap.exists ? (snap.data() || {}) : {};
      const lastTriggeredAtMs = typeof cur?.lastTriggeredAtMs === 'number' ? cur.lastTriggeredAtMs : 0;
      const running = cur?.running === true;
      const startedAtMs = typeof cur?.startedAtMs === 'number' ? cur.startedAtMs : 0;

      const runningStale = running && startedAtMs > 0 && nowMs - startedAtMs > staleRunningMs;
      if (running && !runningStale) {
        allowed = false;
        return;
      }
      if (lastTriggeredAtMs > 0 && nowMs - lastTriggeredAtMs < intervalMs) {
        allowed = false;
        return;
      }

      allowed = true;
      tx.set(
        lockRef,
        {
          running: true,
          startedAtMs: nowMs,
          lastTriggeredAtMs: nowMs,
          triggeredByUid: uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch {
    return { attempted: false, reason: 'lock_failed' };
  }

  if (!allowed) return { attempted: false, reason: 'throttled' };

  const resCapture = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[String(k || '').toLowerCase()] = v;
    },
    end(payload) {
      this.body = payload;
    },
  };

  const reqSynthetic = {
    method: 'POST',
    headers: {
      'x-cron-secret': secret,
      'x-internal-heartbeat': '1',
      'user-agent': 'internal-heartbeat',
    },
    query: {},
    body: {},
    url: '/api/matchmaking-run',
  };

  let parsed = null;
  let ok = false;
  try {
    await matchmakingRun(reqSynthetic, resCapture);
    try {
      parsed = typeof resCapture.body === 'string' ? JSON.parse(resCapture.body) : null;
    } catch {
      parsed = null;
    }
    ok = !!parsed?.ok;
  } catch {
    ok = false;
  }

  try {
    await lockRef.set(
      {
        running: false,
        lastCompletedAtMs: Date.now(),
        lastOk: ok,
        lastCreated: typeof parsed?.created === 'number' ? parsed.created : 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // ignore
  }

  return {
    attempted: true,
    ok,
    statusCode: resCapture.statusCode,
    created: typeof parsed?.created === 'number' ? parsed.created : 0,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const freeActiveEnabled = isFreeActiveEnabled();

    // Üyelik ücretsiz aktivasyon promosyonu (Eco) - UI’nin butonu doğru gösterebilmesi için heartbeat ile aktar.
    const promoFlag = String(process.env.MATCHMAKING_FREE_PROMO_ENABLED || '').toLowerCase().trim();
    const promoDisabled = ['0', 'false', 'no', 'off', 'disabled'].includes(promoFlag);

    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    const now = Date.now();
    const promoCutoffMs = promoCutoffMsTR();
    const promo = {
      freeActivationEnabled: !promoDisabled,
      cutoffMs: promoCutoffMs,
      active: !promoDisabled && now <= promoCutoffMs,
    };

    const seenPatch = {
      lastSeenAt: FieldValue.serverTimestamp(),
      lastSeenAtMs: now,
    };

    let result = { status: 'noop', blocked: false, windowHours: 0 };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const user = snap.exists ? (snap.data() || {}) : {};

      // Promo ücretsiz üyelik süresi normalize:
      // Daha önce 30 gün olarak yazılmış olanları da cutoff'a sabitle.
      const promoType = 'free_activation_until_2026_02_10';
      const expectedCutoffMs = promoCutoffMsTR();
      const membership = user?.membership || null;
      const translationPack = user?.translationPack || null;

      const membershipPromo = membership?.lastPromo || null;
      const translationPromo = translationPack?.lastPromo || null;

      const isPromoMarker = (p) => {
        if (!p || typeof p !== 'object') return false;
        const type = typeof p.type === 'string' ? p.type.trim() : '';
        const cutoff = typeof p.cutoffMs === 'number' ? p.cutoffMs : 0;
        // Tip birebir eşleşebileceği gibi, bazı eski kayıtlar sadece cutoffMs taşıyabilir.
        return type === promoType || (Number.isFinite(cutoff) && cutoff > 0 && cutoff === expectedCutoffMs);
      };

      const promoRelevant = isPromoMarker(membershipPromo) || isPromoMarker(translationPromo);

      const inferredCutoffMs =
        (typeof membershipPromo?.cutoffMs === 'number' && Number.isFinite(membershipPromo.cutoffMs) && membershipPromo.cutoffMs === expectedCutoffMs
          ? membershipPromo.cutoffMs
          : (typeof translationPromo?.cutoffMs === 'number' && Number.isFinite(translationPromo.cutoffMs) && translationPromo.cutoffMs === expectedCutoffMs
              ? translationPromo.cutoffMs
              : 0)) || 0;

      const cutoffMs = inferredCutoffMs || expectedCutoffMs;

      const needsMembershipFix =
        !!membership?.active &&
        promoRelevant &&
        typeof cutoffMs === 'number' &&
        Number.isFinite(cutoffMs) &&
        cutoffMs > 0 &&
        membership?.validUntilMs !== cutoffMs;

      const needsTranslationFix =
        !!translationPack?.active &&
        promoRelevant &&
        typeof cutoffMs === 'number' &&
        Number.isFinite(cutoffMs) &&
        cutoffMs > 0 &&
        translationPack?.validUntilMs !== cutoffMs;

      const basePatch = {};
      if (needsMembershipFix) {
        basePatch.membership = {
          ...(typeof membership === 'object' && membership ? membership : {}),
          validUntilMs: cutoffMs,
        };
      }
      if (needsTranslationFix) {
        basePatch.translationPack = {
          ...(typeof translationPack === 'object' && translationPack ? translationPack : {}),
          validUntilMs: cutoffMs,
        };
      }

      if (!freeActiveEnabled) {
        tx.set(
          ref,
          {
            ...basePatch,
            ...seenPatch,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        result = { status: Object.keys(basePatch).length ? 'promo_normalized' : 'disabled', blocked: false, windowHours: 0 };
        return;
      }

      const fam = user?.freeActiveMembership || null;
      const state = computeFreeActiveMembershipState(user, now);

      if (!state.active) {
        tx.set(
          ref,
          {
            ...basePatch,
            ...seenPatch,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        result = { status: Object.keys(basePatch).length ? 'promo_normalized' : 'noop', blocked: !!state.blocked, windowHours: state.windowHours || 0 };
        return;
      }

      // Aktif ama süre dolmuşsa: üyeliği iptal et.
      if (!state.eligible) {
        const prevInactive = nextInactiveCount(fam?.inactiveCount);
        const inactiveCount = prevInactive + 1;
        const blocked = inactiveCount >= 2;

        tx.set(
          ref,
          {
            ...basePatch,
            ...seenPatch,
            freeActiveMembership: {
              ...(typeof fam === 'object' && fam ? fam : {}),
              active: false,
              inactiveCount,
              blocked,
              blockedReason: blocked ? 'inactive_twice' : '',
              cancelledAt: FieldValue.serverTimestamp(),
              cancelledAtMs: now,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        result = { status: blocked ? 'blocked' : 'expired', blocked, windowHours: state.windowHours || 0 };
        return;
      }

      // Aktif ve geçerliyse: lastActive'i güncelle.
      tx.set(
        ref,
        {
          ...basePatch,
          ...seenPatch,
          freeActiveMembership: {
            ...(typeof fam === 'object' && fam ? fam : {}),
            active: true,
            blocked: false,
            lastActiveAt: FieldValue.serverTimestamp(),
            lastActiveAtMs: now,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      result = { status: 'refreshed', blocked: false, windowHours: state.windowHours || 0 };
    });

    // 24 saat pasiflik kuralı: aktif kullanıcı kilitte kaldıysa ve karşı taraf 24+ saattir yoksa,
    // aktif kullanıcıyı bloklamamak için match'i iptal et ve lock'u aç.
    try {
      const INACTIVE_TTL_MS = 24 * 60 * 60 * 1000;
      const cutoffMs = now - INACTIVE_TTL_MS;

      const meSnap = await ref.get();
      const me = meSnap.exists ? (meSnap.data() || {}) : {};

      // Otomatik havuza alma: kullanıcı matchmakingApplications'a düşmemişse (edge-case),
      // profil bilgisi varsa auto_stub başvurusu oluştur.
      // Not: Bu, cron/manual akıştan bağımsız şekilde "yeni kullanıcı havuza girmiyor" problemini kapatır.
      const bootstrap = await ensureAutoStubApplicationIfMissing({ db, FieldValue, uid, userDoc: me, nowMs: now });
      const lock = me?.matchmakingLock || null;
      const matchId = safeStr(lock?.matchId);
      const lockActive = !!lock?.active && !!matchId;

      if (lockActive) {
        const matchRef = db.collection('matchmakingMatches').doc(matchId);
        const matchSnap = await matchRef.get();
        if (matchSnap.exists) {
          const match = matchSnap.data() || {};
          const status = safeStr(match?.status);
          const confirmedAtMs = typeof match?.confirmedAtMs === 'number' ? match.confirmedAtMs : 0;

          if (status === 'mutual_accepted' && !(confirmedAtMs > 0)) {
            const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
            if (userIds.length === 2 && userIds.includes(uid)) {
              const otherUid = userIds.find((x) => x && x !== uid) || '';
              const baseMs = baseMsFromMatch(match);

              if (otherUid) {
                const otherRef = db.collection('matchmakingUsers').doc(otherUid);
                const otherSnap = await otherRef.get();
                const other = otherSnap.exists ? (otherSnap.data() || {}) : {};
                const otherSeen = lastSeenMsFromUserDoc(other);

                const otherInactive = otherSeen > 0 ? otherSeen <= cutoffMs : baseMs > 0 && baseMs <= cutoffMs;

                if (otherInactive) {
                  await db.runTransaction(async (tx) => {
                    const mSnap = await tx.get(matchRef);
                    if (!mSnap.exists) return;
                    const m = mSnap.data() || {};
                    if (safeStr(m?.status) !== 'mutual_accepted') return;
                    if (typeof m?.confirmedAtMs === 'number' && m.confirmedAtMs > 0) return;

                    const meSnap2 = await tx.get(ref);
                    const otherSnap2 = await tx.get(otherRef);
                    const me2 = meSnap2.exists ? (meSnap2.data() || {}) : {};
                    const other2 = otherSnap2.exists ? (otherSnap2.data() || {}) : {};

                    const mePatch = clearUserLockIfMatch(me2, matchId);
                    const otherPatch = clearUserLockIfMatch(other2, matchId);

                    // Aktif kullanıcı mağdur olmasın: 1 telafi kredisi.
                    mePatch.newMatchReplacementCredits = FieldValue.increment(1);

                    tx.set(
                      matchRef,
                      {
                        status: 'cancelled',
                        cancelledAt: FieldValue.serverTimestamp(),
                        cancelledAtMs: now,
                        cancelledByUserId: 'system',
                        cancelledReason: 'inactive_24h',
                        inactiveCutoffMs: cutoffMs,
                        updatedAt: FieldValue.serverTimestamp(),
                      },
                      { merge: true }
                    );

                    if (Object.keys(mePatch).length) tx.set(ref, { ...mePatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                    if (Object.keys(otherPatch).length) tx.set(otherRef, { ...otherPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                  });
                }
              }
            }
          }
        }

        // Bir eşleşme aktif olunca diğer proposed eşleşmeleri "beklemede"ye al:
        // - Diğer taraf incinmesin (iptal/ret gibi görünmesin)
        // - Suistimal kapansın (aktif eşleşmedeki kişi bu sohbetleri görmesin)
        try {
          const othersSnap = await db
            .collection('matchmakingMatches')
            .where('userIds', 'array-contains', uid)
            .limit(25)
            .get();

          const now2 = Date.now();

          for (const doc of othersSnap.docs) {
            const otherMatchId = doc.id;
            if (!otherMatchId || otherMatchId === matchId) continue;

            const m = doc.data() || {};
            if (safeStr(m?.status) !== 'proposed') continue;

            const pause = m?.proposedChatPause && typeof m.proposedChatPause === 'object' ? m.proposedChatPause : null;
            const already = !!pause?.active && safeStr(pause?.focusUid) === uid && safeStr(pause?.focusMatchId) === matchId;
            if (already) continue;

            await db.runTransaction(async (tx) => {
              const mRef = db.collection('matchmakingMatches').doc(otherMatchId);
              const mSnap = await tx.get(mRef);
              if (!mSnap.exists) return;
              const cur = mSnap.data() || {};
              if (safeStr(cur?.status) !== 'proposed') return;

              tx.set(
                mRef,
                {
                  proposedChatPause: {
                    active: true,
                    reason: 'focus_active',
                    focusUid: uid,
                    focusMatchId: matchId,
                    startedAtMs: now2,
                    startedAt: FieldValue.serverTimestamp(),
                  },
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            });
          }
        } catch {
          // Sessiz geç
        }
      }

      // Kilit yoksa: daha önce beklemeye alınan sohbetleri otomatik aç.
      if (!lockActive) {
        try {
          const snap = await db
            .collection('matchmakingMatches')
            .where('userIds', 'array-contains', uid)
            .limit(25)
            .get();

          const now2 = Date.now();

          for (const doc of snap.docs) {
            const mid = doc.id;
            if (!mid) continue;
            const m = doc.data() || {};
            if (safeStr(m?.status) !== 'proposed') continue;
            const pause = m?.proposedChatPause && typeof m.proposedChatPause === 'object' ? m.proposedChatPause : null;
            if (!pause?.active) continue;
            if (safeStr(pause?.focusUid) !== uid) continue;

            await db.runTransaction(async (tx) => {
              const mRef = db.collection('matchmakingMatches').doc(mid);
              const mSnap = await tx.get(mRef);
              if (!mSnap.exists) return;
              const cur = mSnap.data() || {};
              const curPause = cur?.proposedChatPause && typeof cur.proposedChatPause === 'object' ? cur.proposedChatPause : null;
              if (!(curPause?.active && safeStr(curPause?.focusUid) === uid)) return;

              tx.set(
                mRef,
                {
                  proposedChatPause: {
                    ...(curPause || {}),
                    active: false,
                    endedAtMs: now2,
                    endedAt: FieldValue.serverTimestamp(),
                  },
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            });
          }
        } catch {
          // Sessiz geç
        }
      }

      // İç otomasyon: trafik oldukça 5 dakikada bir matchmaking-run tetikle.
      // Böylece dış cron sağlayıcıya bağımlılık azalır; sistem "kendi kendine" eşleşme üretir.
      const automation = await maybeRunMatchmakingFromHeartbeat({ db, FieldValue, uid });

      // Heartbeat cevabına debug amaçlı ek alanlar.
      result = { ...result, bootstrap, automation };
    } catch {
      // Sessiz geç: heartbeat hiçbir zaman hata fırlatıp kullanıcı deneyimini bozmasın.
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, ...result, promo }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
