import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function GeminiFAQ({ title, subtitle, sideNote, items, defaultOpenIndex = 0 }) {
  const list = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const safeDefault = Number.isFinite(defaultOpenIndex) ? defaultOpenIndex : 0;

  const [openIndex, setOpenIndex] = useState(list.length ? Math.min(Math.max(0, safeDefault), list.length - 1) : -1);

  if (!list.length) return null;

  return (
    <section className="relative max-w-7xl mx-auto px-4 pb-14 md:pb-16">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
            {subtitle ? (
              <p className="mt-2 text-sm text-white/70 max-w-3xl leading-relaxed">{subtitle}</p>
            ) : null}
          </div>
          {sideNote ? <div className="hidden md:block text-xs text-white/55">{sideNote}</div> : null}
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
              <div key={idx} className="rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02]">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen ? 'true' : 'false'}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex((p) => (p === idx ? -1 : idx))}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-white">{q}</span>
                  <ChevronDown
                    size={18}
                    className={
                      isOpen
                        ? 'text-white/70 transition-transform rotate-180'
                        : 'text-white/70 transition-transform'
                    }
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={isOpen ? 'px-5 pb-4' : 'hidden'}
                >
                  <p className="text-sm text-white/70 leading-relaxed">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
