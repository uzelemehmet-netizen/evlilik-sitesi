import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function GeminiFAQ({ title, subtitle, sideNote, items, defaultOpenIndex = 0, variant = 'light' }) {
  const list = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const safeDefault = Number.isFinite(defaultOpenIndex) ? defaultOpenIndex : 0;

  const [openIndex, setOpenIndex] = useState(list.length ? Math.min(Math.max(0, safeDefault), list.length - 1) : -1);

  if (!list.length) return null;

  const isDark = variant === 'dark';
  const cardClass = isDark
    ? 'rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.35)]'
    : 'rounded-[28px] border border-slate-200 bg-white p-6 md:p-10';
  const subtitleClass = isDark ? 'text-white/70' : 'text-slate-600';
  const sideNoteClass = isDark ? 'text-white/55' : 'text-slate-500';
  const itemWrapClass = isDark
    ? 'rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02]'
    : 'rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50';
  const qClass = isDark ? 'text-white' : 'text-slate-900';
  const aClass = isDark ? 'text-white/70' : 'text-slate-600';
  const chevronClass = isDark ? 'text-white/70' : 'text-slate-500';

  return (
    <section className="relative max-w-7xl mx-auto px-4 pb-14 md:pb-16">
      <div className={cardClass}>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
            {subtitle ? (
              <p className={`mt-2 text-sm max-w-3xl leading-relaxed ${subtitleClass}`}>{subtitle}</p>
            ) : null}
          </div>
          {sideNote ? <div className={`hidden md:block text-xs ${sideNoteClass}`}>{sideNote}</div> : null}
        </div>

        <div className="mt-6 space-y-3">
          {list.map((it, idx) => {
            const q = String(it?.q || '').trim();
            const a = String(it?.a || '').trim();
            if (!q || !a) return null;

            const isOpen = idx === openIndex;
            const buttonId = `gemini-faq-btn-${idx}`;
            const panelId = `gemini-faq-panel-${idx}`;

            return (
              <div key={idx} className={itemWrapClass}>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen ? 'true' : 'false'}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex((p) => (p === idx ? -1 : idx))}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className={`font-semibold ${qClass}`}>{q}</span>
                  <ChevronDown
                    size={18}
                    className={
                      isOpen
                        ? `${chevronClass} transition-transform rotate-180`
                        : `${chevronClass} transition-transform`
                    }
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={isOpen ? 'px-5 pb-4' : 'hidden'}
                >
                  <p className={`text-sm leading-relaxed ${aClass}`}>{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
