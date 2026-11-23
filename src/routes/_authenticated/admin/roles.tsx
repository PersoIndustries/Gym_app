import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/lib/auth/session";
import { pageHead } from "@/lib/seo";
import { PERMISSIONS } from "@/lib/access/permissions";
import { customRolesQuery, deleteCustomRole, saveCustomRole, type CustomRole } from "@/lib/data/roles";

export const Route = createFileRoute("/_authenticated/admin/roles")({ head: pageHead("Roles y permisos", "Roles personalizados del equipo y sus permisos."), component: Roles });
const errText = (e: unknown) => (e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e));

function Roles() {
  const { tenantId } = useSession();
  const qc = useQueryClient();
  const { data: roles = [] } = useQuery(customRolesQuery(tenantId));
  const [edit, setEdit] = useState<{ id: string | null; name: string; description: string; permissions: string[] } | null>(null);
  const inv = () => qc.invalidateQueries({ queryKey: ["custom-roles"] });
  const save = useMutation({ mutationFn: async () => { if (!tenantId || !edit) return; await saveCustomRole(tenantId, edit.id, { name: edit.name.trim(), description: edit.description.trim() || null, permissions: edit.permissions }); }, onSuccess: () => { toast.success("Rol guardado"); setEdit(null); inv(); }, onError: (e) => toast.error(errText(e)) });
  const del = useMutation({ mutationFn: async (id: string) => { if (tenantId) await deleteCustomRole(tenantId, id); }, onSuccess: () => { toast.success("Rol eliminado"); inv(); qc.invalidateQueries({ queryKey: ["members"] }); }, onError: (e) => toast.error(errText(e)) });
  const open = (r?: CustomRole) => setEdit(r ? { id: r.id, name: r.name, description: r.description ?? "", permissions: r.permissions } : { id: null, name: "", description: "", permissions: [] });
  const toggle = (k: string) => edit && setEdit({ ...edit, permissions: edit.permissions.includes(k) ? edit.permissions.filter((p) => p !== k) : [...edit.permissions, k] });

  return (
    <AppShell title="Roles y permisos">
      <p className="mb-4 text-sm text-muted-foreground">Crea niveles de profesor (Head coach, Ayudante…) y asígnalos desde Socios. Un profesor sin rol tiene todos los permisos de profesor; el admin siempre lo puede todo.</p>
      <div className="mb-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="p-2 text-left">Permiso</th><th className="p-2">Admin</th><th className="p-2">Profesor</th>{roles.map((r) => <th key={r.id} className="p-2">{r.name}</th>)}</tr></thead>
          <tbody>{PERMISSIONS.map((p) => <tr key={p.key} className="border-t border-border"><td className="p-2"><span className="font-medium">{p.label}</span><span className="block text-xs text-muted-foreground">{p.help}</span></td><td className="p-2 text-center text-primary">✓</td><td className="p-2 text-center text-primary">✓</td>{roles.map((r) => <td key={r.id} className="p-2 text-center">{r.permissions.includes(p.key) ? <span className="text-primary">✓</span> : <span className="text-muted-foreground">—</span>}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="space-y-2">{roles.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <div className="min-w-0"><p className="font-medium">{r.name}</p><p className="truncate text-xs text-muted-foreground">{r.description || `${r.permissions.length} permisos`}</p></div>
          <span className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Editar ${r.name}`} onClick={() => open(r)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Eliminar ${r.name}`} onClick={() => confirm(`¿Eliminar el rol ${r.name}? Sus profesores volverán a los permisos por defecto.`) && del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></span>
        </div>))}</div>
      {edit ? (
        <form className="mt-4 space-y-3 rounded-lg border border-primary/50 bg-card p-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Input required maxLength={40} placeholder="Nombre del rol (p. ej. Ayudante)" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
          <Input maxLength={140} placeholder="Descripción (opcional)" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          <div className="space-y-2">{PERMISSIONS.map((p) => <label key={p.key} className="flex items-start gap-2 text-sm"><Checkbox checked={edit.permissions.includes(p.key)} onCheckedChange={() => toggle(p.key)} /><span><span className="font-medium">{p.label}</span><span className="block text-xs text-muted-foreground">{p.help}</span></span></label>)}</div>
          <div className="flex gap-2"><Button type="submit" disabled={save.isPending}>Guardar</Button><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Cancelar</Button></div>
        </form>
      ) : <Button className="mt-4" onClick={() => open()}><Plus className="h-4 w-4" />Nuevo rol</Button>}
    </AppShell>
  );
}
