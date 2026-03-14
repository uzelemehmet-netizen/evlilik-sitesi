import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onPreviewGate } from '../utils/previewGate';
import { tiktokTrack } from '../utils/tiktokPixel';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default function PreviewGateGlobal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [modal, setModal] = useState({ open: false, reason: '' });

  useEffect(() => {
    return onPreviewGate((detail) => {
      const reason = safeStr(detail?.reason);
      setModal({ open: true, reason });
    });
  }, []);

  const fromPath = useMemo(() => {
    const p = safeStr(location?.pathname);
    const s = safeStr(location?.search);
    return `${p}${s}`;
  }, [location?.pathname, location?.search]);

  if (!modal.open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 p-4 pt-6 overflow-y-auto">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm max-h-[85vh] flex flex-col">
        <div className="p-5 overflow-y-auto flex-1">
          <div className="text-base font-bold text-slate-900">{t('previewGate.title')}</div>
          <div className="mt-2 text-sm text-slate-700">{t('previewGate.body')}</div>
          {modal.reason ? <div className="mt-2 text-xs text-slate-500">{modal.reason}</div> : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModal({ open: false, reason: '' })}
              className="app-btn app-btn-outline"
            >
              {t('previewGate.dismiss')}
            </button>
            <button
              type="button"
              onClick={() => {
                setModal({ open: false, reason: '' });
                tiktokTrack('SignupRedirect', {
                  source: 'preview_gate',
                  from: fromPath || '/',
                  to: '/login?mode=signup',
                });
                navigate('/login?mode=signup', {
                  state: {
                    // Kullanıcının hedefi: kayıt ol + form doldur
                    from: '/evlilik/eslestirme-basvuru?w=1',
                    fromState: { previewFrom: fromPath || '/' },
                  },
                });
              }}
              className="app-btn app-btn-primary"
            >
              {t('previewGate.signup')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
