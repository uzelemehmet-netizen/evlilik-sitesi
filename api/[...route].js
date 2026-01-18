import adminMatchmakingUserStats from '../apiRoutes/admin-matchmaking-user-stats.js';
import clientIp from '../apiRoutes/client-ip.js';
import cloudinarySignature from '../apiRoutes/cloudinary-signature.js';
import identityKycWebhook from '../apiRoutes/identity-kyc-webhook.js';
import matchmakingAdminApprovePayment from '../apiRoutes/matchmaking-admin-approve-payment.js';
import matchmakingAdminCancel from '../apiRoutes/matchmaking-admin-cancel.js';
import matchmakingAdminConfirm from '../apiRoutes/matchmaking-admin-confirm.js';
import matchmakingAdminIdentityVerify from '../apiRoutes/matchmaking-admin-identity-verify.js';
import matchmakingAllocateProfileNo from '../apiRoutes/matchmaking-allocate-profile-no.js';
import matchmakingChatDecision from '../apiRoutes/matchmaking-chat-decision.js';
import matchmakingChatSend from '../apiRoutes/matchmaking-chat-send.js';
import matchmakingContact from '../apiRoutes/matchmaking-contact.js';
import matchmakingDecision from '../apiRoutes/matchmaking-decision.js';
import matchmakingDismiss from '../apiRoutes/matchmaking-dismiss.js';
import matchmakingFreeMembershipApply from '../apiRoutes/matchmaking-free-membership-apply.js';
import matchmakingHeartbeat from '../apiRoutes/matchmaking-heartbeat.js';
import matchmakingInteractionChoice from '../apiRoutes/matchmaking-interaction-choice.js';
import matchmakingProfile from '../apiRoutes/matchmaking-profile.js';
import matchmakingRejectAll from '../apiRoutes/matchmaking-reject-all.js';
import matchmakingRequestNew from '../apiRoutes/matchmaking-request-new.js';
import matchmakingRun from '../apiRoutes/matchmaking-run.js';
import matchmakingSubmitPayment from '../apiRoutes/matchmaking-submit-payment.js';
import matchmakingVerificationSelect from '../apiRoutes/matchmaking-verification-select.js';
import recaptchaAssess from '../apiRoutes/recaptcha-assess.js';

const handlers = {
  'admin-matchmaking-user-stats': adminMatchmakingUserStats,
  'client-ip': clientIp,
  'cloudinary-signature': cloudinarySignature,
  'identity-kyc-webhook': identityKycWebhook,
  'matchmaking-admin-approve-payment': matchmakingAdminApprovePayment,
  'matchmaking-admin-cancel': matchmakingAdminCancel,
  'matchmaking-admin-confirm': matchmakingAdminConfirm,
  'matchmaking-admin-identity-verify': matchmakingAdminIdentityVerify,
  'matchmaking-allocate-profile-no': matchmakingAllocateProfileNo,
  'matchmaking-chat-decision': matchmakingChatDecision,
  'matchmaking-chat-send': matchmakingChatSend,
  'matchmaking-contact': matchmakingContact,
  'matchmaking-decision': matchmakingDecision,
  'matchmaking-dismiss': matchmakingDismiss,
  'matchmaking-free-membership-apply': matchmakingFreeMembershipApply,
  'matchmaking-heartbeat': matchmakingHeartbeat,
  'matchmaking-interaction-choice': matchmakingInteractionChoice,
  'matchmaking-profile': matchmakingProfile,
  'matchmaking-reject-all': matchmakingRejectAll,
  'matchmaking-request-new': matchmakingRequestNew,
  'matchmaking-run': matchmakingRun,
  'matchmaking-submit-payment': matchmakingSubmitPayment,
  'matchmaking-verification-select': matchmakingVerificationSelect,
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
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
