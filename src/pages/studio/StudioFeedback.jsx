import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, MessageCircleWarning } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { authFetch } from '../../utils/authFetch';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { uploadImageToCloudinaryAuto } from '../../utils/cloudinaryUpload';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search || ''), [location.search]);
}

export default function StudioFeedback() {
  const { t, i18n } = useTranslation();
  const query = useQuery();

  const [kind, setKind] = useState(safeStr(query.get('kind')) || 'bug');
  const [matchId, setMatchId] = useState(safeStr(query.get('matchId')));
  const [step, setStep] = useState(safeStr(query.get('step')));
  const [message, setMessage] = useState('');

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotUpload, setScreenshotUpload] = useState({ loading: false, error: '', attachment: null });

  const [submitState, setSubmitState] = useState({ loading: false, ok: false, id: '', error: '' });

  const canSubmit = message.trim().length >= 10 && !submitState.loading;

  const canUploadScreenshot = !!(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

  const uploadScreenshotIfAny = async () => {
    if (!screenshotFile) return null;
    if (!canUploadScreenshot) {
      throw new Error('cloudinary_not_configured');
    }

    setScreenshotUpload({ loading: true, error: '', attachment: null });
    try {
      const uploaded = await uploadImageToCloudinaryAuto(screenshotFile, {
        folder: 'matchmaking-feedback',
        tags: ['feedback', kind, String(i18n?.language || 'tr')],
      });
      const attachment = {
        secureUrl: uploaded?.secureUrl || '',
        publicId: uploaded?.publicId || '',
        bytes: uploaded?.bytes ?? null,
        width: uploaded?.width ?? null,
        height: uploaded?.height ?? null,
        format: uploaded?.format || '',
        originalFilename: uploaded?.originalFilename || (screenshotFile?.name || ''),
      };
      setScreenshotUpload({ loading: false, error: '', attachment });
      return attachment;
    } catch (e) {
      setScreenshotUpload({ loading: false, error: String(e?.message || 'upload_failed'), attachment: null });
      throw e;
    }
  };

  const submit = async () => {
    if (!canSubmit) return;

    setSubmitState({ loading: true, ok: false, id: '', error: '' });
    try {
      const attachment = await uploadScreenshotIfAny();

      const payload = {
        kind,
        message: message.trim(),
        matchId: matchId.trim() || undefined,
        step: step.trim() || undefined,
        pagePath: window.location?.pathname || '',
        attachments: attachment ? [attachment] : [],
        context: {
          lang: String(i18n?.language || 'tr'),
          ua: navigator?.userAgent || '',
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          ref: document?.referrer || '',
          build: String(import.meta?.env?.VITE_GIT_SHA || ''),
        },
      };

      const res = await authFetch('/api/matchmaking-feedback-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(String(data?.error || 'submit_failed'));
      }

      setSubmitState({ loading: false, ok: true, id: String(data.id || ''), error: '' });
      setMessage('');
      setScreenshotFile(null);
    } catch (e) {
      setSubmitState({ loading: false, ok: false, id: '', error: String(e?.message || 'submit_failed') });
    }
  };

  const ticketWhatsAppMsg = useMemo(() => {
    const ticketId = safeStr(submitState.id);
    const mk = safeStr(matchId);
    const sk = safeStr(step);
    const k = safeStr(kind);
    const lang = String(i18n?.language || 'tr');

    const lines = [
      'Merhaba, sistemde bir bildirim oluşturdum.',
      `Ticket: ${ticketId || '-'}`,
      `Kategori: ${k || '-'}`,
      ...(mk ? [`matchId: ${mk}`] : []),
      ...(sk ? [`adım: ${sk}`] : []),
      `dil: ${lang}`,
    ];

    return lines.join('\n');
  }, [i18n?.language, kind, matchId, step, submitState.id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/profilim" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            {t('studio.feedback.backToProfile')}
          </Link>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                  <MessageCircleWarning className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('studio.feedback.title')}</h1>
                  <p className="mt-1 text-sm text-slate-600">{t('studio.feedback.subtitle')}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
                {t('studio.feedback.urgentNote')}{' '}
                <a
                  className="font-semibold text-amber-800 underline"
                  href={buildWhatsAppUrl(t('matchmakingHub.whatsappSupportMessage'))}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('studio.feedback.whatsappCta')}
                </a>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-800">{t('studio.feedback.kindLabel')}</span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="bug">{t('studio.feedback.kinds.bug')}</option>
                    <option value="suggestion">{t('studio.feedback.kinds.suggestion')}</option>
                    <option value="complaint">{t('studio.feedback.kinds.complaint')}</option>
                    <option value="other">{t('studio.feedback.kinds.other')}</option>
                  </select>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">{t('studio.feedback.matchIdLabel')}</span>
                    <input
                      value={matchId}
                      onChange={(e) => setMatchId(e.target.value)}
                      placeholder={t('studio.feedback.matchIdPlaceholder')}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">{t('studio.feedback.stepLabel')}</span>
                    <input
                      value={step}
                      onChange={(e) => setStep(e.target.value)}
                      placeholder={t('studio.feedback.stepPlaceholder')}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-800">{t('studio.feedback.messageLabel')}</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={7}
                    placeholder={t('studio.feedback.messagePlaceholder')}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{t('studio.feedback.privacyNote')}</span>
                    <span>{message.length}/2400</span>
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-800">{t('studio.feedback.screenshotLabel')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshotFile(e?.target?.files?.[0] || null)}
                    className="text-sm"
                    disabled={!canUploadScreenshot || submitState.loading || screenshotUpload.loading}
                  />
                  {!canUploadScreenshot ? (
                    <div className="text-xs text-slate-500">{t('studio.feedback.screenshotDisabled')}</div>
                  ) : null}
                  {screenshotFile ? (
                    <div className="text-xs text-slate-600">
                      {t('studio.feedback.selectedFile')}: {screenshotFile.name}
                    </div>
                  ) : null}
                  {screenshotUpload.loading ? (
                    <div className="text-xs text-slate-600">{t('studio.feedback.uploading')}</div>
                  ) : null}
                  {screenshotUpload.error ? (
                    <div className="text-xs text-rose-700">{t('studio.feedback.uploadFailed')}: {screenshotUpload.error}</div>
                  ) : null}
                </label>

                {submitState.error ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {t('studio.feedback.error')}: {submitState.error}
                  </div>
                ) : null}

                {submitState.ok ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle className="h-4 w-4" />
                      {t('studio.feedback.success')}
                    </div>
                    {submitState.id ? (
                      <div className="mt-1 text-xs text-emerald-900/80">
                        {t('studio.feedback.ticketId')}: {submitState.id}
                      </div>
                    ) : null}

                    {submitState.id ? (
                      <div className="mt-3">
                        <a
                          className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                          href={buildWhatsAppUrl(ticketWhatsAppMsg)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('studio.feedback.sendToWhatsApp')}
                        </a>
                        <div className="mt-1 text-xs text-emerald-900/70">{t('studio.feedback.sendToWhatsAppHint')}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitState.loading || screenshotUpload.loading ? t('studio.common.processing') : t('studio.feedback.submit')}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">{t('studio.feedback.footerNote')}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
