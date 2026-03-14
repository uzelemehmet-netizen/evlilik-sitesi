# Google Flirt Certificate – How the System Works (End-to-End)

This document explains the Uniqah matchmaking experience (web application) end-to-end—starting from sign-up/login; covering application/profile creation, matching, chat, contact sharing, reporting/moderation, security/privacy controls, and account deletion—in a format suitable for a Google submission.

## 0) 1000-character version (paste into Google form)

Uniqah is a marriage-oriented matchmaking web app. Users sign up (email/password or Google) and submit a structured profile/application. Server-side rules enforce minimum age and required profile completeness; free-text fields are checked to block contact, banking, and identity data. Eligible users browse suggested profiles and can send/receive requests; the recipient approves or rejects. A match becomes active only after both sides accept/start; each user can have only one active match (lock) at a time. Messaging happens in-app; messages are filtered to prevent phone/email/URL/social handles. Contact sharing is gated by a 48-hour time lock after activation plus a mutual request/approval step; only then can contact details be retrieved. Users can report profiles/messages; admins review tickets and can take action. Users can delete their account using an explicit confirmation phrase; data is deleted where possible and matches are marked deleted_user.

## 1) Product overview

Uniqah is a matchmaking platform designed for users looking for a marriage-oriented relationship. Users create a profile/application and interact through controlled in-app flows.

- Main website: `https://uniqah.com/`
- Matchmaking landing page: `https://uniqah.com/eslestirme`
- Profile / user panel (requires login): `https://uniqah.com/profilim`

## 2) Sign-up and login (Authentication)

Users can create an account and log in using:

- Email/password
- Google sign-in

Authentication is handled via Firebase Authentication. The app listens to auth state changes and routes the user into the profile/panel area when signed in.

## 3) Matchmaking application (profile form)

### 3.1 Application form

To participate in matchmaking, a user submits a structured application/profile. This includes basic profile attributes (e.g., age, city, gender, marital status, etc.) and free-text fields—especially “About” and “Expectations”.

The application flow is handled via server endpoints:

- Allocate a profile/application number: `/api/matchmaking-allocate-profile-no`
- One-time edit (if available): `/api/matchmaking-application-edit-once`
- Submit application: `/api/matchmaking-application-submit`

### 3.2 Consents and legal documents

During the application flow, users are shown and can access legal/policy documents (privacy, information notice/KVKK, site rules, etc.).

Relevant pages:

- Privacy (SPA): `https://uniqah.com/privacy`
- Documents hub (legal document index): `https://uniqah.com/documents`
- KVKK Information Notice (TR): `https://uniqah.com/docs/kvkk-aydinlatma-metni.html`
- KVKK Information Notice (EN): `https://uniqah.com/docs/kvkk-information-notice-en.html`

### 3.3 PII and contact-data blocking in profile texts

The platform blocks users from putting contact details and other sensitive personal data into profile text fields.

- Server-side PII detection is applied (e.g., email/phone/URL/social handles/IBAN/identity-related data). If forbidden content is detected, the submission is rejected.

This reduces early off-platform contact sharing via profile fields.

### 3.4 Localized storage for profile texts (optional)

If translation is configured, the server may store a translated variant of “About” and “Expectations” between supported languages so that cross-language matches can better understand each other.

Note: chat translation is a separate flow (see 6.4).

## 4) Eligibility and baseline restrictions

The platform enforces server-side eligibility checks for certain actions:

- Minimum age policy (environment-configured; an enforced minimum age exists)
- Profile completeness gating: users cannot interact (request/message) until required profile elements are complete
- Membership gating: certain interactions may require an active membership; a “free active” rule may apply for specific cases (e.g., based on gender)

These checks are enforced both in the UI and at API level.

## 5) Discovery and matching (Pool + Matches)

Uniqah provides two primary discovery/matching surfaces:

### 5.1 Pool (browse candidates)

Users can browse candidates in the pool UI (`/app/pool`):

- Fetch pool items: `/api/matchmaking-browse`
- Send a pre-match / access request to a candidate: `/api/matchmaking-pre-match-request`
- The recipient can approve or reject: `/api/matchmaking-pre-match-respond`

Requests and their states are stored in Firestore user subcollections:

- Sent requests: `matchmakingUsers/{uid}/outboxPreMatchRequests`
- Received requests: `matchmakingUsers/{uid}/inboxPreMatchRequests`

Approved requests typically route users into the related match card.

### 5.2 System-created match cards

The system can also create match documents server-side via a matchmaking run. Admin users can trigger the process:

- Admin trigger: `/api/admin-matchmaking-run-now` (requires admin)
- Matching engine: `/api/matchmaking-run` (protected by a cron/shared secret)

User-side match cards are stored in Firestore:

- Matches collection: `matchmakingMatches`

## 6) Match lifecycle: decisions, chat, and stages

Match documents follow a status-based lifecycle (e.g., `proposed`, `mutual_interest`, `mutual_accepted`, `contact_unlocked`).

### 6.1 Decisions / like-reject

Users respond to a match using:

- Decision endpoint (accept/reject/revoke, etc.): `/api/matchmaking-decision`

If both sides show mutual interest, the match can move into `mutual_interest`.

### 6.2 Two-step activation + “single active match” lock

When mutual interest exists, activation is a two-step flow:

- Activate/start request: `/api/matchmaking-active-start`

Rules:

- The match becomes `mutual_accepted` only when both users start/activate.
- The system enforces a “single active match” lock per user (`matchmakingLock`).
- When a user has an active lock, interactions with other profiles/matches are restricted.

### 6.3 Chat (short vs long)

Messaging is performed through server APIs:

- Send message: `/api/matchmaking-chat-send`
- Mark read: `/api/matchmaking-chat-mark-read`

Chat modes:

- Short chat: applies when the match is not the user’s active locked match (limited count and shorter max length)
- Long chat: opens only for the user’s active locked match, and only when status is `mutual_accepted` or `contact_unlocked`

To reduce off-platform contact sharing, messages are filtered for contact-like content (links, social handles, phone-like patterns, etc.). If detected, the API returns a `filtered` error.

### 6.4 Chat translation

Users may manually translate a received message:

- Translate message: `/api/matchmaking-chat-translate`

Translation is user-triggered for readability; it is not a forced “send to the other user in a different language” mechanism.

### 6.5 Cancel / end an active match

Active match cancellation:

- Active cancel request: `/api/matchmaking-active-cancel`

This flow manages the active lock and allows users to return to the pool/matching flow.

## 7) Contact sharing (contact details) – 48-hour rule + request/approval

Uniqah controls contact information sharing through a time lock and mutual approval.

### 7.1 48-hour lock (in-app communication first)

In the current model, the first 48 hours are intended for in-app interaction. Contact sharing cannot be completed until the lock period has elapsed.

The time lock is enforced server-side.

### 7.2 Match confirmation

After the lock period, users can confirm the match:

- Confirm: `/api/matchmaking-confirm`

Once both sides confirm, the match stores confirmation timestamps/fields (e.g., `confirmedAtMs`).

### 7.3 Contact request and approval

Contact sharing is a two-step process:

1) Request contact sharing:
- `/api/matchmaking-contact-request`

2) Approve contact sharing (by the other party):
- `/api/matchmaking-contact-approve`

Upon approval, the system writes a system message (e.g., `contact_shared`) and stores a controlled record of the approval in the match document.

### 7.4 Retrieve contact info

Contact retrieval endpoint:

- `/api/matchmaking-contact`

Requirements:

- 48-hour lock must have elapsed
- Contact request must be approved (or legacy compatibility for older matches marked `contact_unlocked`)

This reduces early off-platform migration and enforces mutual consent.

## 8) Reporting/feedback and moderation

Users can submit a report/feedback ticket:

- Submit ticket: `/api/matchmaking-feedback-submit`
- Optional: upload a screenshot (Cloudinary integration can be used)

Admins can list and update these tickets:

- List tickets: `/api/admin-feedback-list`
- Update ticket: `/api/admin-feedback-update`

This supports moderation for safety, abuse prevention, and policy enforcement.

## 9) Identity verification (optional)

The user panel may provide optional identity verification flows, such as:

- Document upload (ID/selfie)
- Messaging-app-based verification (if configured)

The goal is to increase trust and reduce fake accounts.

## 10) Privacy, security, and KVKK

### 10.1 Public legal pages

Users can always access:

- Privacy: `https://uniqah.com/privacy`
- Documents hub: `https://uniqah.com/documents`
- KVKK notice (TR): `https://uniqah.com/docs/kvkk-aydinlatma-metni.html`

### 10.2 Data minimization and PII controls

- Profile texts block contact/banking/identity information.
- Chat blocks contact-like messages (URLs/social handles/phone-like strings).
- Contact sharing requires both: elapsed time lock + mutual request/approval.

## 11) Account deletion and data deletion

Users can delete their account:

- Endpoint: `/api/matchmaking-account-delete`

Safeguards:

- User must type a specific confirmation phrase (supported in TR/EN/ID)
- Final confirmation flag is required

Deletion behavior:

- Attempts to delete user-owned documents (applications/payments/reservations) on a best-effort basis
- Matches are not hard-deleted to avoid breaking the other user’s view; instead they are marked (e.g., `deleted_user`)
- Firebase Auth user account is deleted

## 12) Reference URLs for Google submission

- Product home: `https://uniqah.com/`
- Matchmaking landing: `https://uniqah.com/eslestirme`
- Profile/panel (login required): `https://uniqah.com/profilim`
- Privacy: `https://uniqah.com/privacy`
- Documents hub: `https://uniqah.com/documents`
- KVKK (TR): `https://uniqah.com/docs/kvkk-aydinlatma-metni.html`

For copy-paste URL mapping (privacy/terms/rules/etc.), see `GOOGLE-FLIRT-SERTIFIKA_URL_LISTESI.md`.
