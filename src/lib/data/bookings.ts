import { useLocalState } from "./local-store";
/** Inscripciones del usuario (provisional, sustituir por class_enrollments). */
export function useBookings() {
  const [ids, setIds] = useLocalState<string[]>("bf.bookings", []);
  const toggle = (id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return { ids, toggle };
}
