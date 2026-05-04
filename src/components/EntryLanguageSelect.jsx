import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function normalizeLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function persistManualLanguageChoice(lang) {
  const normalized = normalizeLang(lang);

  try {
    localStorage.setItem('preferred_lang', normalized);
    localStorage.setItem('preferred_lang_source', 'selector');
  } catch {
    // ignore
  }

  try {
    sessionStorage.setItem('preferred_lang', normalized);
    sessionStorage.setItem('preferred_lang_source', 'selector');
  } catch {
    // ignore
  }
}

export default function EntryLanguageSelect({ className = '', tone = 'light' }) {
  const { t, i18n } = useTranslation();
  const currentLang = useMemo(() => normalizeLang(i18n?.language), [i18n?.language]);

  const wrapperClassName = tone === 'dark'
    ? 'border-white/15 bg-white/10 text-white shadow-[0_18px_40px_rgba(2,6,23,0.16)] backdrop-blur'
    : 'border-slate-200 bg-white/88 text-slate-900 shadow-sm backdrop-blur';
  const labelClassName = tone === 'dark' ? 'text-white/72' : 'text-slate-600';
  const selectClassName = tone === 'dark'
    ? 'border-white/15 bg-slate-950/30 text-white'
    : 'border-slate-200 bg-white text-slate-900';

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 ${wrapperClassName} ${className}`.trim()}>
      <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${labelClassName}`.trim()}>
        {t('navigation.language')}
      </span>
      <select
        value={currentLang}
        onChange={(event) => {
          const nextLang = normalizeLang(event?.target?.value);
          persistManualLanguageChoice(nextLang);
          void i18n.changeLanguage(nextLang);
        }}
        className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition ${selectClassName}`.trim()}
        aria-label={t('navigation.language')}
      >
        <option value="tr">TR</option>
        <option value="en">EN</option>
        <option value="id">ID</option>
      </select>
    </div>
  );
}