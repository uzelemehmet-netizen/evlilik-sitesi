import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function safeInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const next = safeStr(value);
    if (next) return next;
  }
  return '';
}

function pickPrimaryPhotoUrl(...sources) {
  for (const source of sources) {
    const list = safeArr(source)
      .map((item) => safeStr(item))
      .filter(Boolean);
    if (list.length > 0) return list[0];
  }
  return '';
}

function buildPublicDisplayName(rawFullName, rawUsername, fallbackName) {
  const fullName = safeStr(rawFullName);
  if (fullName) {
    const firstName = safeStr(fullName.split(/\s+/)[0]);
    if (firstName) return firstName;
  }

  const username = safeStr(rawUsername).replace(/^@+/, '');
  if (username) return username;
  return safeStr(fallbackName) || 'Anonim';
}

function toMillis(tsLike) {
  try {
    if (!tsLike) return 0;
    if (typeof tsLike?.toMillis === 'function') return tsLike.toMillis() || 0;
    const s = tsLike?._seconds ?? tsLike?.seconds;
    const ns = tsLike?._nanoseconds ?? tsLike?.nanoseconds;
    if (typeof s === 'number' && Number.isFinite(s)) {
      const n = typeof ns === 'number' && Number.isFinite(ns) ? ns : 0;
      return Math.floor(s * 1000 + n / 1e6);
    }
    if (typeof tsLike === 'number' && Number.isFinite(tsLike)) return Math.floor(tsLike);
    return 0;
  } catch {
    return 0;
  }
}

function reviewOf(item) {
  return safeObj(item?.review) || {};
}

async function resolvePublicReviewerProfile(db, userId, review) {
  const fallback = {
    displayName: firstNonEmpty(review?.reviewerDisplayName, review?.reviewerName, 'Anonim'),
    city: firstNonEmpty(review?.reviewerCity),
    country: firstNonEmpty(review?.reviewerCountry),
    userCode: firstNonEmpty(review?.reviewerUserCode),
    photoUrl: firstNonEmpty(review?.reviewerPhotoUrl),
  };

  const uid = safeStr(userId);
  if (!uid) return fallback;

  try {
    const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
    const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
    const publicProfile = safeObj(userDoc?.publicProfile) || {};
    const applicationCache = safeObj(userDoc?.application) || {};
    const details = safeObj(userDoc?.details) || {};

    const applicationId = firstNonEmpty(userDoc?.applicationId, applicationCache?.applicationId, applicationCache?.id);
    let applicationDoc = {};
    if (applicationId) {
      const appSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
      applicationDoc = appSnap.exists ? (appSnap.data() || {}) : {};
    }

    const fullName = firstNonEmpty(
      userDoc?.fullName,
      publicProfile?.fullName,
      applicationCache?.fullName,
      applicationDoc?.fullName
    );
    const username = firstNonEmpty(
      userDoc?.username,
      publicProfile?.username,
      applicationCache?.username,
      applicationDoc?.username
    );

    return {
      displayName: buildPublicDisplayName(fullName, username, fallback.displayName),
      city: firstNonEmpty(
        userDoc?.city,
        publicProfile?.city,
        applicationCache?.city,
        details?.city,
        applicationDoc?.city,
        fallback.city
      ),
      country: firstNonEmpty(
        userDoc?.country,
        publicProfile?.country,
        applicationCache?.country,
        details?.country,
        applicationDoc?.country,
        fallback.country
      ),
      userCode: firstNonEmpty(userDoc?.userCode, publicProfile?.userCode, applicationCache?.userCode, applicationDoc?.userCode, fallback.userCode),
      photoUrl: firstNonEmpty(
        pickPrimaryPhotoUrl(applicationCache?.photoUrls, publicProfile?.photoUrls, userDoc?.photoUrls, applicationDoc?.photoUrls),
        fallback.photoUrl
      ),
    };
  } catch {
    return fallback;
  }
}

export default async function publicReviewsList(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const body = req.method === 'POST' ? normalizeBody(req) : {};
  const url = new URL(req.url || '', 'http://localhost');
  const limit = Math.min(200, Math.max(1, safeInt(body?.limit || url.searchParams.get('limit'), 6)));

  const { db } = getAdmin();
  const baseLimit = Math.max(40, limit * 8);
  const snap = await db.collection('matchmakingFeedback').orderBy('createdAt', 'desc').limit(baseLimit).get();

  const allReviewItems = snap.docs
    .map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        kind: safeStr(data?.kind),
        status: safeStr(data?.status),
        userId: safeStr(data?.userId),
        message: safeStr(data?.message || data?.text),
        createdAt: toMillis(data?.createdAt),
        updatedAt: toMillis(data?.updatedAt),
        review: reviewOf(data),
      };
    })
    .filter((item) => safeStr(item?.kind).toLowerCase() === 'review');

  const ratedPublicItems = allReviewItems
    .filter((item) => {
      const review = reviewOf(item);
      if (!review?.publicVisible) return false;
      if (review?.skipped) return false;
      const rating = safeInt(review?.rating, 0);
      return rating >= 1 && rating <= 5;
    });

  const rankedItems = ratedPublicItems
    .sort((a, b) => {
      const reviewA = reviewOf(a);
      const reviewB = reviewOf(b);
      const featuredDelta = Number(!!reviewB?.featured) - Number(!!reviewA?.featured);
      if (featuredDelta !== 0) return featuredDelta;
      const ratingDelta = safeInt(reviewB?.rating, 0) - safeInt(reviewA?.rating, 0);
      if (ratingDelta !== 0) return ratingDelta;
      const freshnessDelta = Math.max(safeInt(b?.updatedAt, 0), safeInt(b?.createdAt, 0)) - Math.max(safeInt(a?.updatedAt, 0), safeInt(a?.createdAt, 0));
      if (freshnessDelta !== 0) return freshnessDelta;
      return safeInt(b?.createdAt, 0) - safeInt(a?.createdAt, 0);
    })
    .slice(0, limit);

  const ratedCount = ratedPublicItems.length;
  const averageRating = ratedCount > 0
    ? Number((ratedPublicItems.reduce((sum, item) => sum + safeInt(reviewOf(item)?.rating, 0), 0) / ratedCount).toFixed(2))
    : 0;
  const commentedCount = ratedPublicItems.filter((item) => safeStr(item?.message).length > 0).length;
  const starOnlyCount = Math.max(0, ratedCount - commentedCount);

  const items = await Promise.all(rankedItems.map(async (item) => {
      const review = reviewOf(item);
      const reviewer = await resolvePublicReviewerProfile(db, item?.userId, review);
      return {
        id: item.id,
        rating: safeInt(review?.rating, 0),
        reviewerName: reviewer.displayName || 'Anonim',
        reviewerCity: reviewer.city,
        reviewerCountry: reviewer.country,
        reviewerUserCode: reviewer.userCode,
        reviewerPhotoUrl: reviewer.photoUrl,
        featured: !!review?.featured,
        message: safeStr(item?.message),
        adminReply: safeStr(review?.adminReply),
        createdAt: safeInt(item?.createdAt, 0),
      };
    }));

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
  res.end(JSON.stringify({
    ok: true,
    items,
    stats: {
      ratedCount,
      averageRating,
      commentedCount,
      starOnlyCount,
    },
  }));
}