import { useEffect, useState } from "react";

/** Estado persistido en el navegador (provisional hasta usar tablas de Supabase). Hidratación segura para SSR. */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setValue(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(value)); }, [key, value, ready]);
  return [value, setValue] as const;
}
