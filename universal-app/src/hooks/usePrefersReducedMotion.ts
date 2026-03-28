import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
  const defaultValue =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [reduceMotion, setReduceMotion] = useState(defaultValue);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    mql.addEventListener('change', handle);
    return () => mql.removeEventListener('change', handle);
  }, []);

  return reduceMotion;
}
