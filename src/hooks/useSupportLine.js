import { useEffect, useState } from 'react';
import { getSupportLineFallback, resolveSupportLine } from '../utils/supportLine';

export function useSupportLine(lang) {
  const [line, setLine] = useState(() => getSupportLineFallback({ lang }));

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const resolved = await resolveSupportLine({ lang });
      if (cancelled) return;
      setLine(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return line;
}
