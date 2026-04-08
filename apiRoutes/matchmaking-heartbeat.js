import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { computeFreeActiveMembershipState, isFreeActiveEnabled } from './_matchmakingEligibility.js';
import { getMinAgeFromEnv } from './_matchmakingAgePolicy.js';

async function loadMatchmakingRun() {
  const mod = await import('./matchmaking-run.js');
  return mod?.default;
}

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

function parseUcNo(v) {
  const s = safeStr(v).toUpperCase();
  const m = /^UC-(\d{3,})$/.exec(s);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function formatUcNo(n) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return '';
  return `UC-${Math.floor(v)}`;
}

function doesUserCodeMatchGender(no, gender) {
  const numeric = typeof no === 'number' ? no : Number(no);
  const genderNorm = normalizeGender(gender);
  if (!Number.isFinite(numeric) || numeric <= 0) return true;
  if (genderNorm === 'female') return numeric >= 1001 && numeric < 2000;
  if (genderNorm === 'male') return numeric >= 2001;
  return true;
}

function normalizeNat(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'turkey' || s === 'türkiye') return 'tr';
  if (s === 'id' || s === 'indonesia' || s === 'endonezya') return 'id';
  if (s === 'other') return 'other';
  if (/^[a-z]{2}$/.test(s)) return s;
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

async function ensureAutoStubApplicationIfMissing({ db, FieldValue, uid, userDoc, nowMs, authEmail = '', displayName = '', authProvider = '' }) {
  try {
    const existing = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
    if (existing && !existing.empty) {
      try {
        const firstDoc = existing.docs?.[0];
        if (firstDoc?.ref && (authEmail || displayName || authProvider)) {
          await firstDoc.ref.set(
            {
              ...(authEmail ? { authEmail, email: authEmail } : {}),
              ...(displayName ? { displayName } : {}),
              ...(authProvider ? { authProvider } : {}),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch {
        // ignore
      }
      return { ensured: true, created: false, reason: 'already_exists' };
    }

    const gender = normalizeGender(userDoc?.gender);
    const nationality = normalizeNat(userDoc?.nationality) || 'other';
    const nationalityOther = safeStr(userDoc?.nationalityOther);
    const age = typeof userDoc?.age === 'number' ? userDoc.age : null;
    const lookingForGender = oppositeGender(gender);
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
        ...(authEmail ? { authEmail, email: authEmail } : {}),
        ...(displayName ? { displayName } : {}),
        ...(authProvider ? { authProvider } : {}),

        ...(gender ? { gender } : {}),
        ...(lookingForGender ? { lookingForGender } : {}),

        ...(nationality ? {
          nationality,
          nationalityOther: nationality === 'other' ? nationalityOther : '',
          lookingForNationality,
          lookingForNationalityOther: '',
        } : {}),

        ...(typeof age === 'number' ? { age } : {}),

        details: {
          autoBootstrap: true,
          missingProfile: !gender,
        },

        // Firestore rules create'da bu alanlar zorunlu olabilir.
        consent18Plus: typeof age === 'number' ? age >= getMinAgeFromEnv() : true,
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
  let disabled = false;
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      const cur = snap.exists ? (snap.data() || {}) : {};

      // Kill-switch: allow turning off automatic matchmaking run from heartbeat.
      // Default is enabled unless explicitly set to false.
      if (cur?.enabled === false) {
        disabled = true;
        allowed = false;
        return;
      }

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

  if (disabled) return { attempted: false, reason: 'disabled' };

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
    const matchmakingRun = await loadMatchmakingRun();
    if (typeof matchmakingRun !== 'function') {
      throw new Error('matchmaking_run_handler_not_found');
    }
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
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('allow', 'POST, OPTIONS');
    res.end('');
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed', allowed: ['POST'] }));
    return;
  }

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
    const authEmail = safeStr(decoded?.email).toLowerCase();
    const displayName = safeStr(decoded?.name);
    const authProvider = safeStr(decoded?.firebase?.sign_in_provider).toLowerCase();

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
      ...(authEmail ? { authEmail, authEmailLower: authEmail } : {}),
      ...(displayName ? { displayName } : {}),
      ...(authProvider ? { authProvider } : {}),
    };

    let result = { status: 'noop', blocked: false, windowHours: 0 };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const user = snap.exists ? (snap.data() || {}) : {};

      // Kullanıcı kodu (UC-1000/2000 serisi): gender'a göre otomatik atama.
      // Not: Transaction içinde monotonic sayaç kullanıyoruz.
      const existingUserCode = safeStr(user?.userCode) || safeStr(user?.publicProfile?.userCode);
      const existingUserCodeNo =
        (typeof user?.userCodeNo === 'number' ? user.userCodeNo : 0) ||
        (typeof user?.publicProfile?.userCodeNo === 'number' ? user.publicProfile.userCodeNo : 0) ||
        parseUcNo(existingUserCode);
      const genderNorm = normalizeGender(user?.gender);
      const storedUserCodeGender = normalizeGender(user?.userCodeGender);
      const hasBandMismatch =
        !!existingUserCode &&
        existingUserCodeNo > 0 &&
        (genderNorm === 'female' || genderNorm === 'male') &&
        !doesUserCodeMatchGender(existingUserCodeNo, genderNorm);
      let userCodePatch = {};

      if ((genderNorm === 'female' || genderNorm === 'male') && (hasBandMismatch || (!existingUserCode && !(existingUserCodeNo > 0)))) {
        const countersRef = db.collection('matchmakingMeta').doc('userCodeCounters');
        const countersSnap = await tx.get(countersRef);
        const counters = countersSnap.exists ? (countersSnap.data() || {}) : {};

        const baseFemale = 1001;
        const baseMale = 2001;

        const nextFemaleRaw = typeof counters?.nextFemale === 'number' ? counters.nextFemale : parseUcNo(counters?.nextFemaleCode);
        const nextMaleRaw = typeof counters?.nextMale === 'number' ? counters.nextMale : parseUcNo(counters?.nextMaleCode);

        const nextFemale = Number.isFinite(nextFemaleRaw) && nextFemaleRaw >= baseFemale ? Math.floor(nextFemaleRaw) : baseFemale;
        const nextMale = Number.isFinite(nextMaleRaw) && nextMaleRaw >= baseMale ? Math.floor(nextMaleRaw) : baseMale;

        const assignedNo = genderNorm === 'female' ? nextFemale : nextMale;
        const assignedCode = formatUcNo(assignedNo);

        if (assignedCode) {
          userCodePatch = {
            userCode: assignedCode,
            userCodeNo: assignedNo,
            'publicProfile.userCode': assignedCode,
            'publicProfile.userCodeNo': assignedNo,
            userCodeGender: genderNorm,
            userCodeAssignedAtMs: now,
            ...(hasBandMismatch && existingUserCode ? { previousUserCode: existingUserCode } : {}),
            ...(hasBandMismatch && existingUserCodeNo > 0 ? { previousUserCodeNo: existingUserCodeNo } : {}),
            ...(hasBandMismatch ? { userCodeReassignedAtMs: now } : {}),
          };

          tx.set(
            countersRef,
            {
              nextFemale: genderNorm === 'female' ? assignedNo + 1 : nextFemale,
              nextMale: genderNorm === 'male' ? assignedNo + 1 : nextMale,
              updatedAt: FieldValue.serverTimestamp(),
              updatedAtMs: now,
            },
            { merge: true }
          );
        }
      } else if (existingUserCode || existingUserCodeNo > 0) {
        userCodePatch = {
          ...(existingUserCode && safeStr(user?.publicProfile?.userCode) !== existingUserCode ? { 'publicProfile.userCode': existingUserCode } : {}),
          ...(existingUserCodeNo > 0 && user?.publicProfile?.userCodeNo !== existingUserCodeNo ? { 'publicProfile.userCodeNo': existingUserCodeNo } : {}),
          ...((genderNorm === 'female' || genderNorm === 'male') && storedUserCodeGender !== genderNorm ? { userCodeGender: genderNorm } : {}),
        };
      }

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
            ...userCodePatch,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        result = { status: Object.keys(basePatch).length ? 'promo_normalized' : 'disabled', blocked: false, windowHours: 0 };
        return;
      }

      const fam = user?.freeActiveMembership || null;

      // Ürün kararı (2026-02): Kadın kullanıcılar için ücretsiz aktif üyelik otomatik.
      // Süreyi pratikte “süresiz” yapmak için çok uzun bir pencere kullanıyoruz.
      const genderNormForFree = normalizeGender(user?.gender);
      if (genderNormForFree === 'female') {
        const windowHours = 24 * 365 * 10; // ~10 yıl
        tx.set(
          ref,
          {
            ...basePatch,
            ...seenPatch,
            ...userCodePatch,
            freeActiveMembership: {
              ...(typeof fam === 'object' && fam ? fam : {}),
              active: true,
              blocked: false,
              blockedReason: '',
              windowHours,
              inactiveCount: 0,
              reapplyCount: 0,
              lastActiveAt: FieldValue.serverTimestamp(),
              lastActiveAtMs: now,
              activatedAt: (fam && fam.activatedAt) || FieldValue.serverTimestamp(),
              activatedAtMs: typeof fam?.activatedAtMs === 'number' && fam.activatedAtMs > 0 ? fam.activatedAtMs : now,
              autoReason: 'auto_female_free',
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        result = { status: 'auto_female_free', blocked: false, windowHours };
        return;
      }

      const state = computeFreeActiveMembershipState(user, now);

      if (!state.active) {
        tx.set(
          ref,
          {
            ...basePatch,
            ...seenPatch,
            ...userCodePatch,
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
            ...userCodePatch,
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
          ...userCodePatch,
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
      const bootstrap = await ensureAutoStubApplicationIfMissing({
        db,
        FieldValue,
        uid,
        userDoc: me,
        nowMs: now,
        authEmail,
        displayName,
        authProvider,
      });
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
    const status = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    if (status >= 500) {
      // Heartbeat kullanıcı deneyimini bozmamalı; iç hata olsa da fail-open dön.
      // eslint-disable-next-line no-console
      console.error('[matchmaking-heartbeat] suppressed error:', e);
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'noop', suppressedError: String(e?.message || 'server_error') }));
      return;
    }

    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
