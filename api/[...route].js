import adminMatchmakingUserStats from '../apiRoutes/admin-matchmaking-user-stats.js';
import clientIp from '../apiRoutes/client-ip.js';
import cloudinarySignature from '../apiRoutes/cloudinary-signature.js';
import identityKycWebhook from '../apiRoutes/identity-kyc-webhook.js';
import matchmakingVerificationManualSubmit from '../apiRoutes/matchmaking-verification-manual-submit.js';
import matchmakingAdminApprovePayment from '../apiRoutes/matchmaking-admin-approve-payment.js';
import matchmakingAdminPhotoUpdateDecide from '../apiRoutes/matchmaking-admin-photo-update-decide.js';
import matchmakingAdminCancel from '../apiRoutes/matchmaking-admin-cancel.js';
import matchmakingAdminConfirm from '../apiRoutes/matchmaking-admin-confirm.js';
import matchmakingConfirm from '../apiRoutes/matchmaking-confirm.js';
import matchmakingAdminCreateMatch from '../apiRoutes/matchmaking-admin-create-match.js';
import matchmakingAdminIdentityVerify from '../apiRoutes/matchmaking-admin-identity-verify.js';
import matchmakingAllocateProfileNo from '../apiRoutes/matchmaking-allocate-profile-no.js';
import matchmakingApplicationEditOnce from '../apiRoutes/matchmaking-application-edit-once.js';
import matchmakingPhotoUpdateRequest from '../apiRoutes/matchmaking-photo-update-request.js';
import matchmakingChatDecision from '../apiRoutes/matchmaking-chat-decision.js';
import matchmakingChatMarkRead from '../apiRoutes/matchmaking-chat-mark-read.js';
import matchmakingChatSend from '../apiRoutes/matchmaking-chat-send.js';
import matchmakingChatReleaseHeld from '../apiRoutes/matchmaking-chat-release-held.js';
import matchmakingChatTranslate from '../apiRoutes/matchmaking-chat-translate.js';
import matchmakingChatTranslationRevoke from '../apiRoutes/matchmaking-chat-translation-revoke.js';
import matchmakingMatchCancel from '../apiRoutes/matchmaking-match-cancel.js';
import matchmakingContact from '../apiRoutes/matchmaking-contact.js';
import matchmakingContactRequest from '../apiRoutes/matchmaking-contact-request.js';
import matchmakingContactApprove from '../apiRoutes/matchmaking-contact-approve.js';
import matchmakingDecision from '../apiRoutes/matchmaking-decision.js';
import matchmakingDismiss from '../apiRoutes/matchmaking-dismiss.js';
import matchmakingFreeMembershipApply from '../apiRoutes/matchmaking-free-membership-apply.js';
import matchmakingHeartbeat from '../apiRoutes/matchmaking-heartbeat.js';
import matchmakingInteractionChoice from '../apiRoutes/matchmaking-interaction-choice.js';
import matchmakingMembershipActivateFree from '../apiRoutes/matchmaking-membership-activate-free.js';
import matchmakingMembershipCancel from '../apiRoutes/matchmaking-membership-cancel.js';
import matchmakingAccountDelete from '../apiRoutes/matchmaking-account-delete.js';
import matchmakingProfile from '../apiRoutes/matchmaking-profile.js';
import matchmakingProfileTextUpdate from '../apiRoutes/matchmaking-profile-text-update.js';
import matchmakingRejectAll from '../apiRoutes/matchmaking-reject-all.js';
import matchmakingRequestNew from '../apiRoutes/matchmaking-request-new.js';
import matchmakingRun from '../apiRoutes/matchmaking-run.js';
import matchmakingSubmitPayment from '../apiRoutes/matchmaking-submit-payment.js';
import matchmakingVerificationSelect from '../apiRoutes/matchmaking-verification-select.js';
import recaptchaAssess from '../apiRoutes/recaptcha-assess.js';
import matchmakingQuickQuestions from '../apiRoutes/matchmaking-quick-questions.js';
import matchmakingAdminDebugByEmail from '../apiRoutes/matchmaking-admin-debug-by-email.js';
import adminMatchmakingPool from '../apiRoutes/admin-matchmaking-pool.js';
import adminMatchmakingRunNow from '../apiRoutes/admin-matchmaking-run-now.js';
import adminMatchmakingRollbackLastRun from '../apiRoutes/admin-matchmaking-rollback-last-run.js';
import matchmakingApplicationBootstrap from '../apiRoutes/matchmaking-application-bootstrap.js';
import matchmakingBrowse from '../apiRoutes/matchmaking-browse.js';
import matchmakingProfileAccessRequest from '../apiRoutes/matchmaking-profile-access-request.js';
import matchmakingProfileAccessRespond from '../apiRoutes/matchmaking-profile-access-respond.js';
import matchmakingProfileView from '../apiRoutes/matchmaking-profile-view.js';
import matchmakingPreMatchRequest from '../apiRoutes/matchmaking-pre-match-request.js';
import matchmakingPreMatchRespond from '../apiRoutes/matchmaking-pre-match-respond.js';
import matchmakingActiveStart from '../apiRoutes/matchmaking-active-start.js';
import matchmakingActiveCancel from '../apiRoutes/matchmaking-active-cancel.js';
import matchmakingMaintenanceRun from '../apiRoutes/matchmaking-maintenance-run.js';
import matchmakingInboxMarkRead from '../apiRoutes/matchmaking-inbox-mark-read.js';
import matchmakingInboxMessageSend from '../apiRoutes/matchmaking-inbox-message-send.js';
import matchmakingInboxMessageMarkRead from '../apiRoutes/matchmaking-inbox-message-mark-read.js';
import matchmakingInboxSummary from '../apiRoutes/matchmaking-inbox-summary.js';
import matchmakingFeedbackSubmit from '../apiRoutes/matchmaking-feedback-submit.js';
import adminFeedbackList from '../apiRoutes/admin-feedback-list.js';
import adminFeedbackUpdate from '../apiRoutes/admin-feedback-update.js';
import publicJoinPing from '../apiRoutes/public-join-ping.js';

const handlers = {
  'admin-matchmaking-user-stats': adminMatchmakingUserStats,
  'admin-matchmaking-pool': adminMatchmakingPool,
  'admin-matchmaking-run-now': adminMatchmakingRunNow,
  'admin-matchmaking-rollback-last-run': adminMatchmakingRollbackLastRun,
  'client-ip': clientIp,
  'cloudinary-signature': cloudinarySignature,
  'identity-kyc-webhook': identityKycWebhook,
  'matchmaking-admin-approve-payment': matchmakingAdminApprovePayment,
  'matchmaking-admin-photo-update-decide': matchmakingAdminPhotoUpdateDecide,
  'matchmaking-admin-cancel': matchmakingAdminCancel,
  'matchmaking-admin-confirm': matchmakingAdminConfirm,
  'matchmaking-confirm': matchmakingConfirm,
  'matchmaking-admin-create-match': matchmakingAdminCreateMatch,
  'matchmaking-admin-identity-verify': matchmakingAdminIdentityVerify,
  'matchmaking-admin-debug-by-email': matchmakingAdminDebugByEmail,
  'matchmaking-allocate-profile-no': matchmakingAllocateProfileNo,
  'matchmaking-application-edit-once': matchmakingApplicationEditOnce,
  'matchmaking-photo-update-request': matchmakingPhotoUpdateRequest,
  'matchmaking-chat-decision': matchmakingChatDecision,
  'matchmaking-chat-mark-read': matchmakingChatMarkRead,
  'matchmaking-chat-send': matchmakingChatSend,
  'matchmaking-chat-release-held': matchmakingChatReleaseHeld,
  'matchmaking-chat-translate': matchmakingChatTranslate,
  'matchmaking-chat-translation-revoke': matchmakingChatTranslationRevoke,
  'matchmaking-match-cancel': matchmakingMatchCancel,
  'matchmaking-contact': matchmakingContact,
  'matchmaking-contact-request': matchmakingContactRequest,
  'matchmaking-contact-approve': matchmakingContactApprove,
  'matchmaking-decision': matchmakingDecision,
  'matchmaking-dismiss': matchmakingDismiss,
  'matchmaking-free-membership-apply': matchmakingFreeMembershipApply,
  'matchmaking-heartbeat': matchmakingHeartbeat,
  'matchmaking-interaction-choice': matchmakingInteractionChoice,
  'matchmaking-membership-activate-free': matchmakingMembershipActivateFree,
  'matchmaking-membership-cancel': matchmakingMembershipCancel,
  'matchmaking-account-delete': matchmakingAccountDelete,
  'matchmaking-application-bootstrap': matchmakingApplicationBootstrap,
  'matchmaking-browse': matchmakingBrowse,
  'matchmaking-profile-access-request': matchmakingProfileAccessRequest,
  'matchmaking-profile-access-respond': matchmakingProfileAccessRespond,
  'matchmaking-pre-match-request': matchmakingPreMatchRequest,
  'matchmaking-pre-match-respond': matchmakingPreMatchRespond,
  'matchmaking-active-start': matchmakingActiveStart,
  'matchmaking-active-cancel': matchmakingActiveCancel,
  'matchmaking-inbox-mark-read': matchmakingInboxMarkRead,
  'matchmaking-inbox-message-send': matchmakingInboxMessageSend,
  'matchmaking-inbox-message-mark-read': matchmakingInboxMessageMarkRead,
  'matchmaking-inbox-summary': matchmakingInboxSummary,
  'matchmaking-feedback-submit': matchmakingFeedbackSubmit,
  'admin-feedback-list': adminFeedbackList,
  'admin-feedback-update': adminFeedbackUpdate,
  'public-join-ping': publicJoinPing,
  'matchmaking-profile': matchmakingProfile,
  'matchmaking-profile-text-update': matchmakingProfileTextUpdate,
  'matchmaking-profile-view': matchmakingProfileView,
  'matchmaking-maintenance-run': matchmakingMaintenanceRun,
  'matchmaking-reject-all': matchmakingRejectAll,
  'matchmaking-request-new': matchmakingRequestNew,
  'matchmaking-run': matchmakingRun,
  'matchmaking-submit-payment': matchmakingSubmitPayment,
  'matchmaking-quick-questions': matchmakingQuickQuestions,
  'matchmaking-verification-select': matchmakingVerificationSelect,
  'matchmaking-verification-manual-submit': matchmakingVerificationManualSubmit,
  'recaptcha-assess': recaptchaAssess,
};

function getRouteName(req) {
  const url = new URL(req.url || '', 'http://localhost');
  const pathname = url.pathname || '';
  const rest = pathname.replace(/^\/api\/?/, '');
  const [first] = rest.split('/');
  return first || '';
}

export default async function handler(req, res) {
  const route = getRouteName(req);

  const fn = handlers[route];
  if (!fn) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'not_found', route }));
    return;
  }

  try {
    await fn(req, res);
  } catch (e) {
    if (!res.headersSent) {
      res.statusCode = e?.statusCode || 500;
      res.setHeader('content-type', 'application/json');
    }
    const isProd = String(process.env.NODE_ENV || '').toLowerCase().trim() === 'production';
    res.end(
      JSON.stringify({
        ok: false,
        error: String(e?.message || 'server_error'),
        ...(!isProd && e?.stack ? { stack: String(e.stack) } : {}),
      })
    );
  }
}
