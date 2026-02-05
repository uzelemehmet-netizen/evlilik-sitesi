function safeStr(v) {
	return typeof v === 'string' ? v.trim() : '';
}

function clampText(v, maxLen) {
	const s = safeStr(v);
	if (!s) return '';
	if (typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen) return s.slice(0, maxLen);
	return s;
}

const KIND_FIELDS = {
	signup: 'signupEventAtMs',
	profile_completed: 'profileCompletedEventAtMs',
};

export async function emitMemberFeedEvent({ db, FieldValue, uid, kind, username = '', userCode = '', profileIncomplete = false }) {
	const u = safeStr(uid);
	const k = safeStr(kind);
	const field = KIND_FIELDS[k];
	if (!u || !field) return { ok: false, skipped: true, reason: 'bad_args' };

	const nowMs = Date.now();
	const userRef = db.collection('memberFeedUsers').doc(u);
	const eventRef = db.collection('memberFeedEvents').doc();

	const cleanUsername = clampText(username, 40);
	const cleanUserCode = clampText(userCode, 40);

	await db.runTransaction(async (tx) => {
		const snap = await tx.get(userRef);
		const cur = snap.exists ? (snap.data() || {}) : {};
		const already = typeof cur?.[field] === 'number' && Number.isFinite(cur[field]) && cur[field] > 0;
		if (already) return;

		tx.set(
			userRef,
			{
				[field]: nowMs,
				updatedAtMs: nowMs,
				updatedAt: FieldValue.serverTimestamp(),
			},
			{ merge: true }
		);

		tx.set(
			eventRef,
			{
				kind: k,
				createdAtMs: nowMs,
				createdAt: FieldValue.serverTimestamp(),
				profileIncomplete: !!profileIncomplete,
				username: cleanUsername,
				userCode: cleanUserCode,
			},
			{ merge: false }
		);
	});

	return { ok: true };
}

