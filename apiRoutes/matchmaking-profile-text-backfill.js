import { FieldPath } from 'firebase-admin/firestore';
import { getAdmin, normalizeBody, requireAdmin, requireCronSecret } from './_firebaseAdmin.js';
import { buildBilingualProfileText, detectForbiddenContactPII, inferProfileTextLang, normalizeProfileLang } from './_matchmakingProfileText.js';

const MAX_TEXT_LEN = 1800;
const DEFAULT_BATCH_SIZE = 8;
const MAX_BATCH_SIZE = 30;
const LOCK_MS = 10 * 60 * 1000;
const DEFAULT_PHASE = 'female';
const MAX_SCAN_DOCS_PER_RUN = 240;

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
}

function asMs(v) {
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

function clampInt(value, min, max, fallback) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeGenderValue(value) {
  const raw = safeStr(value).toLowerCase();
  if (!raw) return '';
  if (raw === 'female' || raw === 'f' || raw === 'woman' || raw === 'kadin' || raw === 'kadın' || raw === 'bayan') return 'female';
  if (raw === 'male' || raw === 'm' || raw === 'man' || raw === 'erkek' || raw === 'bay') return 'male';
  return '';
}

function normalizePhase(value) {
  return normalizeGenderValue(value) || DEFAULT_PHASE;
}

function nextPhase(value) {
  return normalizePhase(value) === 'female' ? 'male' : 'female';
}

function hasTranslateableText(app) {
  const about = safeStr(app?.about, MAX_TEXT_LEN);
  const expectations = safeStr(app?.expectations, MAX_TEXT_LEN);
  return !!(about || expectations);
}

function needsBackfill(app) {
  const about = safeStr(app?.about, MAX_TEXT_LEN);
  const expectations = safeStr(app?.expectations, MAX_TEXT_LEN);
  const profileTextLang = normalizeProfileLang(app?.profileTextLang) || normalizeProfileLang(app?.details?.profileTextLang);
  const translatedAtMs = asMs(app?.profileTextTranslatedAtMs) || 0;
  const updatedAtMs =
    (typeof app?.updatedAtMs === 'number' && Number.isFinite(app.updatedAtMs) ? app.updatedAtMs : 0) ||
    asMs(app?.updatedAt) ||
    (typeof app?.userTextsUpdatedAtMs === 'number' && Number.isFinite(app.userTextsUpdatedAtMs) ? app.userTextsUpdatedAtMs : 0) ||
    asMs(app?.userTextsUpdatedAt);

  const aboutMissing = !!about && (!safeStr(app?.aboutTr) || !safeStr(app?.aboutId));
  const expectationsMissing = !!expectations && (!safeStr(app?.expectationsTr) || !safeStr(app?.expectationsId));
  const langMissing = (!!about || !!expectations) && !profileTextLang;
  const stale = translatedAtMs > 0 && updatedAtMs > translatedAtMs;
  const neverTranslated = (!!about || !!expectations) && translatedAtMs <= 0;

  return aboutMissing || expectationsMissing || langMissing || stale || neverTranslated;
}

function buildFieldPatch({ field, original, currentTr, currentId, sourceLang, nowMs }) {
  const text = safeStr(original, MAX_TEXT_LEN);
  if (!text) return null;

  const pii = detectForbiddenContactPII(text);
  if (pii.hasForbidden) {
    return {
      skipped: true,
      reason: 'pii_blocked',
      reasons: pii.reasons,
      patch: null,
    };
  }

  return buildBilingualProfileText(text, sourceLang, {
    trValue: safeStr(currentTr, MAX_TEXT_LEN),
    idValue: safeStr(currentId, MAX_TEXT_LEN),
    fallbackSourceLang: 'tr',
    maxLen: MAX_TEXT_LEN,
  }).then((result) => {
    const inferredLang = normalizeProfileLang(result?.sourceLang) || normalizeProfileLang(sourceLang) || 'tr';
    return {
      skipped: false,
      reason: safeStr(result?.skipReason, 120),
      patch: {
        [`${field}`]: text,
        [`${field}Tr`]: safeStr(result?.tr, MAX_TEXT_LEN),
        [`${field}Id`]: safeStr(result?.id, MAX_TEXT_LEN),
        [`${field}TranslationMeta`]: {
          sourceLang: inferredLang,
          targetLang: safeStr(result?.targetLang),
          translated: !!result?.translated,
          skipped: !!result?.skipped,
          truncated: !!result?.truncated,
          translateConfigured: !!result?.translateConfigured,
          skipReason: safeStr(result?.skipReason, 120),
          updatedAtMs: nowMs,
        },
        sourceLang: inferredLang,
      },
    };
  });
}

async function buildApplicationBackfill(app, nowMs) {
  const sourceLang =
    normalizeProfileLang(app?.profileTextLang) ||
    normalizeProfileLang(app?.details?.profileTextLang) ||
    inferProfileTextLang({
      sourceLang: app?.profileTextLang || app?.details?.profileTextLang,
      original: safeStr(app?.about, MAX_TEXT_LEN) || safeStr(app?.expectations, MAX_TEXT_LEN),
      trValue: safeStr(app?.aboutTr, MAX_TEXT_LEN) || safeStr(app?.expectationsTr, MAX_TEXT_LEN),
      idValue: safeStr(app?.aboutId, MAX_TEXT_LEN) || safeStr(app?.expectationsId, MAX_TEXT_LEN),
    }) ||
    'tr';

  const [aboutRes, expectationsRes] = await Promise.all([
    buildFieldPatch({
      field: 'about',
      original: app?.about,
      currentTr: app?.aboutTr,
      currentId: app?.aboutId,
      sourceLang,
      nowMs,
    }),
    buildFieldPatch({
      field: 'expectations',
      original: app?.expectations,
      currentTr: app?.expectationsTr,
      currentId: app?.expectationsId,
      sourceLang,
      nowMs,
    }),
  ]);

  const patch = {
    profileTextLang: safeStr(aboutRes?.patch?.sourceLang || expectationsRes?.patch?.sourceLang || sourceLang),
    profileTextTranslatedAtMs: nowMs,
    profileTextBackfilledAtMs: nowMs,
    profileTextBackfillVersion: 1,
  };

  if (aboutRes?.patch) {
    patch.about = safeStr(aboutRes.patch.about, MAX_TEXT_LEN);
    patch.aboutTr = safeStr(aboutRes.patch.aboutTr, MAX_TEXT_LEN);
    patch.aboutId = safeStr(aboutRes.patch.aboutId, MAX_TEXT_LEN);
    patch.profileTextTranslateAbout = aboutRes.patch.aboutTranslationMeta;
  }
  if (expectationsRes?.patch) {
    patch.expectations = safeStr(expectationsRes.patch.expectations, MAX_TEXT_LEN);
    patch.expectationsTr = safeStr(expectationsRes.patch.expectationsTr, MAX_TEXT_LEN);
    patch.expectationsId = safeStr(expectationsRes.patch.expectationsId, MAX_TEXT_LEN);
    patch.profileTextTranslateExpectations = expectationsRes.patch.expectationsTranslationMeta;
  }

  return {
    patch,
    sourceLang: patch.profileTextLang,
    skippedReasons: [aboutRes?.reason, expectationsRes?.reason].filter(Boolean),
    piiBlocked: !!aboutRes?.skipped || !!expectationsRes?.skipped,
  };
}

async function readPhaseBatch({ db, phase, cursorDocId, batchSize }) {
  const wantedPhase = normalizePhase(phase);
  const picked = [];
  let lastDocId = safeStr(cursorDocId);
  let exhausted = false;
  let scannedDocs = 0;
  const chunkSize = Math.max(batchSize * 4, batchSize);

  while (picked.length < batchSize && scannedDocs < MAX_SCAN_DOCS_PER_RUN) {
    let q = db.collection('matchmakingApplications').orderBy(FieldPath.documentId()).limit(chunkSize);
    if (lastDocId) q = q.startAfter(lastDocId);
    const snap = await q.get();
    if (snap.empty) {
      exhausted = true;
      break;
    }

    scannedDocs += snap.size;
    for (const docSnap of snap.docs) {
      lastDocId = safeStr(docSnap.id);
      const app = docSnap.data() || {};
      if (normalizeGenderValue(app?.gender) !== wantedPhase) continue;
      picked.push(docSnap);
      if (picked.length >= batchSize) break;
    }

    if (snap.size < chunkSize) {
      exhausted = true;
      break;
    }
  }

  return {
    docs: picked,
    cursorDocId: lastDocId,
    exhausted,
    scannedDocs,
    phase: wantedPhase,
  };
}

export default async function handler(req, res) {
  if (!['POST', 'GET'].includes(String(req?.method || '').toUpperCase())) {
    res.statusCode = 405;
    res.setHeader('allow', 'GET, POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const method = String(req?.method || '').toUpperCase();
    if (method === 'GET') {
      requireCronSecret(req);
    } else {
      try {
        await requireAdmin(req);
      } catch {
        requireCronSecret(req);
      }
    }

    const body = normalizeBody(req);
    const dryRun = body?.dryRun === true;
    const batchSize = clampInt(body?.batchSize, 1, MAX_BATCH_SIZE, DEFAULT_BATCH_SIZE);
    const forceRestart = body?.restart === true;

    const { db, FieldValue } = getAdmin();
    const stateRef = db.collection('matchmakingAutomation').doc('profile_text_backfill');
    const nowMs = Date.now();

    let state = {};
    let locked = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(stateRef);
      state = snap.exists ? (snap.data() || {}) : {};

      const lockUntilMs = typeof state?.lockUntilMs === 'number' && Number.isFinite(state.lockUntilMs) ? state.lockUntilMs : 0;
      if (lockUntilMs > nowMs) {
        locked = true;
        return;
      }

      tx.set(
        stateRef,
        {
          lockUntilMs: nowMs + LOCK_MS,
          lockAtMs: nowMs,
          lastRunStartedAtMs: nowMs,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true }
      );
    });

    if (locked) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'locked', state }));
      return;
    }

    let currentPhase = forceRestart ? DEFAULT_PHASE : normalizePhase(state?.phase);
    let femaleCursorDocId = forceRestart ? '' : safeStr(state?.femaleCursorDocId);
    let maleCursorDocId = forceRestart ? '' : safeStr(state?.maleCursorDocId);
    let startCursor = currentPhase === 'female' ? femaleCursorDocId : maleCursorDocId;

    let phaseResult = await readPhaseBatch({ db, phase: currentPhase, cursorDocId: startCursor, batchSize });
    let docs = phaseResult.docs;
    let wrapped = false;
    let effectiveCursor = startCursor;
    let processedPhase = currentPhase;

    if (!docs.length && phaseResult.exhausted) {
      if (currentPhase === 'female') {
        femaleCursorDocId = '';
      } else {
        maleCursorDocId = '';
      }

      currentPhase = nextPhase(currentPhase);
      processedPhase = currentPhase;
      startCursor = currentPhase === 'female' ? femaleCursorDocId : maleCursorDocId;
      effectiveCursor = startCursor;
      wrapped = true;
      phaseResult = await readPhaseBatch({ db, phase: currentPhase, cursorDocId: startCursor, batchSize });
      docs = phaseResult.docs;
    }

    const out = {
      ok: true,
      dryRun,
      batchSize,
      wrapped,
      phaseProcessed: processedPhase,
      nextPhase: currentPhase,
      scanned: 0,
      scannedDocs: phaseResult?.scannedDocs || 0,
      eligible: 0,
      updated: 0,
      skipped: 0,
      noop: 0,
      errors: [],
      cursorDocId: '',
      femaleCursorDocId,
      maleCursorDocId,
      processedDocIds: [],
    };

    if (!docs.length) {
      await stateRef.set(
        {
          lockUntilMs: 0,
          cursorDocId: '',
          phase: currentPhase,
          femaleCursorDocId,
          maleCursorDocId,
          lastRunCompletedAtMs: nowMs,
          lastRunSummary: out,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true }
      );

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ...out, status: 'noop' }));
      return;
    }

    const batch = db.batch();

    for (const docSnap of docs) {
      const app = docSnap.data() || {};
      const docId = safeStr(docSnap.id);
      out.scanned += 1;
      out.cursorDocId = docId;
      out.processedDocIds.push(docId);

      if (!hasTranslateableText(app)) {
        out.noop += 1;
        continue;
      }

      const source = safeStr(app?.source).toLowerCase();
      if (source === 'auto_stub') {
        out.skipped += 1;
        continue;
      }

      if (!needsBackfill(app)) {
        out.noop += 1;
        continue;
      }

      out.eligible += 1;

      try {
        const backfill = await buildApplicationBackfill(app, nowMs);
        const patch = backfill?.patch && typeof backfill.patch === 'object' ? backfill.patch : null;
        if (!patch) {
          out.skipped += 1;
          continue;
        }

        patch.updatedAt = FieldValue.serverTimestamp();
        patch.updatedAtMs = nowMs;

        const userId = safeStr(app?.userId);
        if (!dryRun) {
          batch.set(docSnap.ref, patch, { merge: true });

          if (userId) {
            const userRef = db.collection('matchmakingUsers').doc(userId);
            batch.set(
              userRef,
              {
                profileTextLang: safeStr(backfill?.sourceLang || patch.profileTextLang),
                profileTextsUpdatedAt: FieldValue.serverTimestamp(),
                profileTextsUpdatedAtMs: nowMs,
                details: {
                  ...(safeStr(patch.about, MAX_TEXT_LEN) ? { about: safeStr(patch.about, MAX_TEXT_LEN), bio: safeStr(patch.about, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.aboutTr, MAX_TEXT_LEN) ? { aboutTr: safeStr(patch.aboutTr, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.aboutId, MAX_TEXT_LEN) ? { aboutId: safeStr(patch.aboutId, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.expectations, MAX_TEXT_LEN) ? { expectations: safeStr(patch.expectations, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.expectationsTr, MAX_TEXT_LEN) ? { expectationsTr: safeStr(patch.expectationsTr, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.expectationsId, MAX_TEXT_LEN) ? { expectationsId: safeStr(patch.expectationsId, MAX_TEXT_LEN) } : {}),
                },
                publicProfile: {
                  ...(safeStr(patch.about, MAX_TEXT_LEN) ? { about: safeStr(patch.about, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.aboutTr, MAX_TEXT_LEN) ? { aboutTr: safeStr(patch.aboutTr, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.aboutId, MAX_TEXT_LEN) ? { aboutId: safeStr(patch.aboutId, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.expectations, MAX_TEXT_LEN) ? { expectations: safeStr(patch.expectations, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.expectationsTr, MAX_TEXT_LEN) ? { expectationsTr: safeStr(patch.expectationsTr, MAX_TEXT_LEN) } : {}),
                  ...(safeStr(patch.expectationsId, MAX_TEXT_LEN) ? { expectationsId: safeStr(patch.expectationsId, MAX_TEXT_LEN) } : {}),
                },
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }

        out.updated += 1;
      } catch (error) {
        out.errors.push({ docId, error: safeStr(error?.message, 200) || 'backfill_failed' });
      }
    }

    if (!dryRun) {
      await batch.commit();
    }

    if (phaseResult.exhausted) {
      if (processedPhase === 'female') {
        femaleCursorDocId = '';
      } else {
        maleCursorDocId = '';
      }
      currentPhase = nextPhase(processedPhase);
    } else if (processedPhase === 'female') {
      femaleCursorDocId = out.cursorDocId || femaleCursorDocId;
      currentPhase = 'female';
    } else {
      maleCursorDocId = out.cursorDocId || maleCursorDocId;
      currentPhase = 'male';
    }

    out.nextPhase = currentPhase;
    out.femaleCursorDocId = femaleCursorDocId;
    out.maleCursorDocId = maleCursorDocId;

    await stateRef.set(
      {
        lockUntilMs: 0,
        cursorDocId: out.cursorDocId || effectiveCursor || '',
        phase: currentPhase,
        femaleCursorDocId,
        maleCursorDocId,
        lastRunCompletedAtMs: Date.now(),
        lastRunSummary: {
          phaseProcessed: processedPhase,
          nextPhase: currentPhase,
          scanned: out.scanned,
          scannedDocs: out.scannedDocs,
          eligible: out.eligible,
          updated: out.updated,
          skipped: out.skipped,
          noop: out.noop,
          errors: out.errors.length,
          wrapped,
          batchSize,
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: Date.now(),
      },
      { merge: true }
    );

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: safeStr(e?.message, 200) || 'server_error' }));
  }
}