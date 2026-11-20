import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useSession } from '@/lib/auth/session';
import { activitiesQuery } from '@/lib/data/gym';
import { saveActivityLogo } from '@/lib/data/media';
import { supabase } from '@/integrations/supabase/client';
import { ACTIVITY_CATALOG, activityMode, MODE_HELP, MODE_LABEL, type ActivityMode } from '@/lib/brand/activities';
import { LogoUpload } from './LogoUpload';
import { ActivityMark } from './ActivityMark';
import { InfoHelp } from './InfoHelp';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
const msg = (e: unknown) => e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'No se pudo guardar';
export function ActivityLogos() {
  const { tenantId, role } = useSession(); const qc = useQueryClient(); const { data = [] } = useQuery(activitiesQuery(tenantId)); const [open, setOpen] = useState(false);
  if (!tenantId || role !== 'admin') return null;
  const reload = () => qc.invalidateQueries({ queryKey: ['activities', tenantId] });
  const run = async (p: PromiseLike<{ error: unknown }>) => { const { error } = await p; if (error) toast.error(msg(error)); else await reload(); };
  const save = async (id: string, url: string | null) => { await saveActivityLogo(tenantId, id, url); await reload(); };
  const available = ACTIVITY_CATALOG.filter(c => !data.some(a => a.name.toLowerCase() === c.name.toLowerCase()));
  return <section>
    <div className="mb-3 flex items-center justify-between gap-2"><h3 className="flex items-center gap-1 font-semibold">Actividades del gimnasio<InfoHelp label="Actividades">Elige qué actividades ofrece tu gimnasio. La modalidad define qué programa el profesor en cada clase: WOD con cargas, cardio con distancia, sesión dirigida o libre.</InfoHelp></h3><Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Añadir</Button></div>
    <div className="divide-y divide-border">{data.map(a => { const mode = activityMode(a.name, (a as { mode?: string }).mode); return <div key={a.id} className="flex flex-wrap items-center gap-3 py-3">
      <ActivityMark url={a.logo_url} name={a.name} className="h-10 w-10" /><span className="min-w-0 flex-1 break-words font-medium">{a.name}</span>
      <Select value={mode} onValueChange={v => run(supabase.from('activity_types').update({ mode: v } as never).eq('id', a.id))}><SelectTrigger className="h-8 w-44" aria-label={`Modalidad de ${a.name}`}><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(MODE_LABEL) as ActivityMode[]).map(m => <SelectItem key={m} value={m}>{MODE_LABEL[m]}</SelectItem>)}</SelectContent></Select>
      <LogoUpload tenant={tenantId} onUploaded={url => save(a.id, url)} />
      {a.logo_url && <Button variant="ghost" size="sm" onClick={() => save(a.id, null).catch(() => toast.error('No se pudo quitar el logo'))}>Restaurar</Button>}
      <Button variant="ghost" size="icon" aria-label={`Quitar ${a.name}`} title="Quitar actividad" onClick={() => confirm(`¿Quitar ${a.name} del gimnasio?`) && run(supabase.from('activity_types').delete().eq('id', a.id))}><Trash2 className="h-4 w-4" /></Button>
    </div>; })}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Añadir actividades</DialogTitle></DialogHeader>
      {(Object.keys(MODE_LABEL) as ActivityMode[]).map(m => { const list = available.filter(c => c.mode === m); return list.length > 0 && <div key={m}><p className="text-sm font-semibold">{MODE_LABEL[m]}</p><p className="mb-2 text-xs text-muted-foreground">{MODE_HELP[m]}</p><div className="grid grid-cols-2 gap-2">{list.map(c => <Button key={c.name} variant="outline" className="h-auto justify-start gap-2 py-2" onClick={() => run(supabase.from('activity_types').insert({ tenant_id: tenantId, name: c.name, mode: c.mode } as never))}><ActivityMark name={c.name} className="h-7 w-7" /><span className="truncate text-sm">{c.name}</span></Button>)}</div></div>; })}
      <p className="text-xs text-muted-foreground">El número de actividades depende de tu plan.</p>
    </DialogContent></Dialog>
  </section>;
}
