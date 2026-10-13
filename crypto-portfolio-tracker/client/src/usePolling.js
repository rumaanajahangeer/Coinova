import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Calls `fn` immediately and then every `intervalMs` while the tab is visible.
 * Re-runs when any value in `deps` changes. Keeps the last good data on error.
 */
export function usePolling(fn, intervalMs, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await fnRef.current();
      if (alive.current) setState({ data, error: null, loading: false, updatedAt: new Date() });
    } catch (e) {
      if (alive.current) setState((s) => ({ ...s, error: e.message, loading: false }));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    setState((s) => ({ ...s, loading: true }));
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, intervalMs);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive.current = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, intervalMs, ...deps]);

  return { ...state, reload: load };
}
