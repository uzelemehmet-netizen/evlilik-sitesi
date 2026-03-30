import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Trace-only imports: Vercel'in dependency tracing'i, file:// ile dinamik import edilen
// modüllerin transitive deps'lerini (özellikle firebase-admin) pakete eklemeyebiliyor.
// Burada import ederek firebase-admin'in function bundle'a kesin dahil olmasını sağlıyoruz.
import 'firebase-admin/app';
import 'firebase-admin/auth';
import 'firebase-admin/firestore';
import 'firebase-admin/messaging';

function findApiRoutesRootDir() {
  const selfFile = fileURLToPath(import.meta.url);
  const selfDir = path.dirname(selfFile);

  const candidates = [
    // Local dev / Vercel runtimes usually have CWD at project/function root.
    process.cwd(),
    // Function bundle root often equals current module directory.
    selfDir,
    // Some builders keep the original folder structure.
    path.resolve(selfDir, '..'),
    path.resolve(selfDir, '../..'),
    path.resolve(selfDir, '../../..'),
  ];

  for (const candidate of candidates) {
    const dir = path.join(candidate, 'apiRoutes');
    if (existsSync(dir)) return candidate;
  }
  return null;
}

const apiRoutesRootDir = findApiRoutesRootDir();

function defaultLoader(fileName) {
  return async () => {
    if (!apiRoutesRootDir) {
      throw new Error('api_routes_root_not_found');
    }
    const fullPath = path.join(apiRoutesRootDir, 'apiRoutes', fileName);
    if (!existsSync(fullPath)) {
      throw new Error(`api_route_file_missing:${fileName}`);
    }
    const mod = await import(pathToFileURL(fullPath).href);
    return mod?.default;
  };
}

// Lazy-load: cold start sırasında tüm route dosyalarını import etmeyelim.
// Bu, Vercel'de FUNCTION_INVOCATION_FAILED (özellikle cold-start / timeout) riskini ciddi azaltır.
const handlers = {
  'admin-push-incomplete-application-once': defaultLoader('admin-push-incomplete-application-once.js'),
  'admin-lead-delete': defaultLoader('admin-lead-delete.js'),
  'admin-leads-list': defaultLoader('admin-leads-list.js'),
  'admin-leads-update': defaultLoader('admin-leads-update.js'),
  'admin-translate-text': defaultLoader('admin-translate-text.js'),
  'admin-invite-codes-list': defaultLoader('admin-invite-codes-list.js'),
  'admin-user-action': defaultLoader('admin-user-action.js'),
  'admin-users-list': defaultLoader('admin-users-list.js'),
  'admin-user-application-get': defaultLoader('admin-user-application-get.js'),
  'admin-matchmaking-application-delete': defaultLoader('admin-matchmaking-application-delete.js'),
  'admin-users-mark-system': defaultLoader('admin-users-mark-system.js'),
  'admin-payments-list': defaultLoader('admin-payments-list.js'),
  'admin-audit-logs-list': defaultLoader('admin-audit-logs-list.js'),
  'admin-click-stats': defaultLoader('admin-click-stats.js'),
  'admin-click-trace-list': defaultLoader('admin-click-trace-list.js'),
  'admin-signups-count': defaultLoader('admin-signups-count.js'),
  'admin-match-activity-list': defaultLoader('admin-match-activity-list.js'),
  'admin-user-matches-list': defaultLoader('admin-user-matches-list.js'),
  'admin-matchmaking-user-stats': defaultLoader('admin-matchmaking-user-stats.js'),
  'admin-matchmaking-pool': defaultLoader('admin-matchmaking-pool.js'),
  'admin-matchmaking-run-now': defaultLoader('admin-matchmaking-run-now.js'),
  'admin-matchmaking-rollback-last-run': defaultLoader('admin-matchmaking-rollback-last-run.js'),
  'admin-new-users-whatsapp-notify': defaultLoader('admin-new-users-whatsapp-notify.js'),
  'admin-new-signups-whatsapp-notify': defaultLoader('admin-new-signups-whatsapp-notify.js'),
  'client-ip': defaultLoader('client-ip.js'),
  'cloudinary-signature': defaultLoader('cloudinary-signature.js'),
  'google-ads-lead-webhook': defaultLoader('google-ads-lead-webhook.js'),
  'identity-kyc-webhook': defaultLoader('identity-kyc-webhook.js'),
  'matchmaking-admin-approve-payment': defaultLoader('matchmaking-admin-approve-payment.js'),
  'matchmaking-admin-photo-update-decide': defaultLoader('matchmaking-admin-photo-update-decide.js'),
  'matchmaking-admin-cancel': defaultLoader('matchmaking-admin-cancel.js'),
  'matchmaking-admin-confirm': defaultLoader('matchmaking-admin-confirm.js'),
  'matchmaking-confirm': defaultLoader('matchmaking-confirm.js'),
  'matchmaking-admin-create-match': defaultLoader('matchmaking-admin-create-match.js'),
  'matchmaking-admin-identity-verify': defaultLoader('matchmaking-admin-identity-verify.js'),
  'matchmaking-admin-debug-by-email': defaultLoader('matchmaking-admin-debug-by-email.js'),
  'matchmaking-allocate-profile-no': defaultLoader('matchmaking-allocate-profile-no.js'),
  'matchmaking-application-submit': defaultLoader('matchmaking-application-submit.js'),
  'matchmaking-application-normalize': defaultLoader('matchmaking-application-normalize.js'),
  'matchmaking-application-edit-once': defaultLoader('matchmaking-application-edit-once.js'),
  'matchmaking-partner-preferences-update': defaultLoader('matchmaking-partner-preferences-update.js'),
  'matchmaking-application-bootstrap': defaultLoader('matchmaking-application-bootstrap.js'),
  'matchmaking-user-ensure': defaultLoader('matchmaking-user-ensure.js'),
  'matchmaking-quick-profile-save': defaultLoader('matchmaking-quick-profile-save.js'),
  'matchmaking-photo-update-request': defaultLoader('matchmaking-photo-update-request.js'),
  'matchmaking-chat-decision': defaultLoader('matchmaking-chat-decision.js'),
  'matchmaking-chat-mark-read': defaultLoader('matchmaking-chat-mark-read.js'),
  'matchmaking-chat-send': defaultLoader('matchmaking-chat-send.js'),
  'matchmaking-chat-release-held': defaultLoader('matchmaking-chat-release-held.js'),
  'matchmaking-chat-translate': defaultLoader('matchmaking-chat-translate.js'),
  'matchmaking-chat-translation-revoke': defaultLoader('matchmaking-chat-translation-revoke.js'),
  'matchmaking-match-cancel': defaultLoader('matchmaking-match-cancel.js'),
  'matchmaking-contact': defaultLoader('matchmaking-contact.js'),
  'matchmaking-contact-request': defaultLoader('matchmaking-contact-request.js'),
  'matchmaking-contact-approve': defaultLoader('matchmaking-contact-approve.js'),
  'matchmaking-decision': defaultLoader('matchmaking-decision.js'),
  'matchmaking-dismiss': defaultLoader('matchmaking-dismiss.js'),
  'matchmaking-free-membership-apply': defaultLoader('matchmaking-free-membership-apply.js'),
  'matchmaking-heartbeat': defaultLoader('matchmaking-heartbeat.js'),
  'matchmaking-interaction-choice': defaultLoader('matchmaking-interaction-choice.js'),
  'matchmaking-membership-activate-free': defaultLoader('matchmaking-membership-activate-free.js'),
  'matchmaking-membership-cancel': defaultLoader('matchmaking-membership-cancel.js'),
  'matchmaking-invite-code-generate': defaultLoader('matchmaking-invite-code-generate.js'),
  'matchmaking-invite-code-redeem': defaultLoader('matchmaking-invite-code-redeem.js'),
  'matchmaking-referral-code': defaultLoader('matchmaking-referral-code.js'),
  'matchmaking-referral-accept': defaultLoader('matchmaking-referral-accept.js'),
  'matchmaking-referral-claim': defaultLoader('matchmaking-referral-claim.js'),
  'matchmaking-account-delete': defaultLoader('matchmaking-account-delete.js'),
  'matchmaking-browse': defaultLoader('matchmaking-browse.js'),
  'matchmaking-profile-access-request': defaultLoader('matchmaking-profile-access-request.js'),
  'matchmaking-profile-access-respond': defaultLoader('matchmaking-profile-access-respond.js'),
  'matchmaking-pre-match-request': defaultLoader('matchmaking-pre-match-request.js'),
  'matchmaking-pre-match-respond': defaultLoader('matchmaking-pre-match-respond.js'),
  'matchmaking-active-start': defaultLoader('matchmaking-active-start.js'),
  'matchmaking-active-cancel': defaultLoader('matchmaking-active-cancel.js'),
  'matchmaking-presence-batch': defaultLoader('matchmaking-presence-batch.js'),
  'matchmaking-inbox-mark-read': defaultLoader('matchmaking-inbox-mark-read.js'),
  'matchmaking-inbox-message-send': defaultLoader('matchmaking-inbox-message-send.js'),
  'matchmaking-inbox-message-mark-read': defaultLoader('matchmaking-inbox-message-mark-read.js'),
  'matchmaking-inbox-summary': defaultLoader('matchmaking-inbox-summary.js'),
  'matchmaking-feedback-submit': defaultLoader('matchmaking-feedback-submit.js'),
  'admin-feedback-list': defaultLoader('admin-feedback-list.js'),
  'admin-feedback-update': defaultLoader('admin-feedback-update.js'),
  'public-join-ping': defaultLoader('public-join-ping.js'),
  'public-error-report': defaultLoader('public-error-report.js'),
  'public-feedback-submit': defaultLoader('public-feedback-submit.js'),
  'public-lead-submit': defaultLoader('public-lead-submit.js'),
  'public-signal': defaultLoader('public-signal.js'),
  'public-track-click': defaultLoader('public-track-click.js'),
  'pwa-installed-upsert': defaultLoader('pwa-installed-upsert.js'),
  'push-token-upsert': defaultLoader('push-token-upsert.js'),
  'push-send-test': defaultLoader('push-send-test.js'),
  'matchmaking-profile': defaultLoader('matchmaking-profile.js'),
  'matchmaking-profile-text-update': defaultLoader('matchmaking-profile-text-update.js'),
  'matchmaking-profile-view': defaultLoader('matchmaking-profile-view.js'),
  'matchmaking-photo-blur-set': defaultLoader('matchmaking-photo-blur-set.js'),
  'matchmaking-photo-access-set': defaultLoader('matchmaking-photo-access-set.js'),
  'matchmaking-photo-access-request': defaultLoader('matchmaking-photo-access-request.js'),
  'matchmaking-photo-access-respond': defaultLoader('matchmaking-photo-access-respond.js'),
  'matchmaking-maintenance-run': defaultLoader('matchmaking-maintenance-run.js'),
  'matchmaking-reject-all': defaultLoader('matchmaking-reject-all.js'),
  'matchmaking-request-new': defaultLoader('matchmaking-request-new.js'),
  'matchmaking-run': defaultLoader('matchmaking-run.js'),
  'matchmaking-submit-payment': defaultLoader('matchmaking-submit-payment.js'),
  'matchmaking-quick-questions': defaultLoader('matchmaking-quick-questions.js'),
  'matchmaking-verification-select': defaultLoader('matchmaking-verification-select.js'),
  'matchmaking-verification-manual-submit': defaultLoader('matchmaking-verification-manual-submit.js'),
};


function getRouteName(req) {
  const url = new URL(req.url || '', 'http://localhost');

  // vercel.json rewrites /api/(.*) -> /api/[...route]?route=$1
  // Vercel Node req çoğu zaman req.query sağlamaz; bu yüzden URL searchParams ile oku.
  const viaQuery = String(url.searchParams.get('route') || '').trim();
  if (viaQuery) {
    const cleaned = viaQuery.replace(/^\//, '').split('/')[0] || '';
    if (cleaned) return cleaned;
  }

  const pathname = url.pathname || '';
  const rest = pathname.replace(/^\/api\/?/, '');
  const [first] = rest.split('/');
  return first || '';
}

export default async function handler(req, res) {
  const route = getRouteName(req);

  const loader = handlers[route];
  let fn = null;
  try {
    fn = typeof loader === 'function' ? await loader() : null;
  } catch (e) {
    // Import-time errors shouldn't crash the function; surface as JSON.
    // eslint-disable-next-line no-console
    console.error('[api] loader_failed', {
      route,
      message: String(e?.message || e),
      hasApiRoutesRoot: Boolean(apiRoutesRootDir),
    });
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
    }
    const isProd = String(process.env.NODE_ENV || '').toLowerCase().trim() === 'production';
    res.end(
      JSON.stringify({
        ok: false,
        error: 'route_loader_failed',
        route,
        loaderMessage: String(e?.message || e || ''),
        hasApiRoutesRoot: Boolean(apiRoutesRootDir),
        ...(!isProd && e?.stack ? { stack: String(e.stack) } : {}),
      })
    );
    return;
  }
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
        ...(!isProd && e && typeof e === 'object' && e.debug ? { debug: e.debug } : {}),
        ...(!isProd && e?.stack ? { stack: String(e.stack) } : {}),
      })
    );
  }
}
