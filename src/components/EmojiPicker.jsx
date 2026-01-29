import { useEffect, useRef, useState } from 'react';

const DEFAULT_EMOJIS = ['😀', '😊', '😂', '😍', '😘', '😉', '😎', '🥰', '😢', '😡', '🙏', '👍', '👎', '👏', '💪', '❤️', '💔', '🔥', '🎉', '✅'];

export default function EmojiPicker({
  disabled = false,
  onSelect,
  emojis = DEFAULT_EMOJIS,
  buttonClassName = '',
  panelClassName = '',
  ariaLabel = 'Emoji',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onDocDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('touchstart', onDocDown, true);
    return () => {
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('touchstart', onDocDown, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={
          'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-50 disabled:opacity-60 ' +
          buttonClassName
        }
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        😊
      </button>

      {open ? (
        <div
          className={
            'absolute bottom-12 right-0 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ' +
            panelClassName
          }
          role="dialog"
          aria-label={ariaLabel}
        >
          <div className="grid grid-cols-7 gap-1">
            {(Array.isArray(emojis) ? emojis : DEFAULT_EMOJIS).map((e) => (
              <button
                key={e}
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-slate-100"
                onClick={() => {
                  if (typeof onSelect === 'function') onSelect(e);
                  setOpen(false);
                }}
                aria-label={e}
                title={e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
