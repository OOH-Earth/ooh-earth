import { useEffect, useState } from 'react';

/** True once `active` has stayed true for `delayMs`. Informational only: it cancels nothing. */
export function useSlowAction(active, delayMs = 10000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return slow;
}
