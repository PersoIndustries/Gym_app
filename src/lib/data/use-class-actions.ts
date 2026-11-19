import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookClass, leaveClass } from "./box";
import type { Intent } from "@/lib/access/attendance";

export function useClassActions() {
  const qc = useQueryClient();
  const done = () => { qc.invalidateQueries({ queryKey: ["classes"] }); qc.invalidateQueries({ queryKey: ["class"] }); };
  const book = useMutation({ mutationFn: (v: { id: string; intent: Intent }) => bookClass(v.id, v.intent),
    onSuccess: (st) => { toast.success(st === "waitlist" ? "Clase llena: estás en lista de espera" : "Asistencia guardada"); done(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo reservar") });
  const leave = useMutation({ mutationFn: (id: string) => leaveClass(id), onSuccess: () => { toast.success("Reserva anulada"); done(); } });
  return { book, leave, busy: book.isPending || leave.isPending };
}
