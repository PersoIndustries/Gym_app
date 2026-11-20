import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth/session';
import { activitiesQuery } from '@/lib/data/gym';
import { saveActivityLogo } from '@/lib/data/media';
import { LogoUpload } from './LogoUpload';
import { BrandImage } from './BrandImage';
import { Button } from './ui/button';
export function ActivityLogos() {
  const { tenantId, role } = useSession(); const qc = useQueryClient(); const { data = [] } = useQuery(activitiesQuery(tenantId));
  if (!tenantId || role !== 'admin') return null;
  const save = async (id: string, url: string | null) => { await saveActivityLogo(tenantId, id, url); await qc.invalidateQueries({ queryKey: ['activities', tenantId] }); };
  return <section><h3 className="mb-3 font-semibold">Logos por tipo de clase</h3><div className="divide-y divide-border">{data.map(a => <div key={a.id} className="flex flex-wrap items-center gap-3 py-3"><BrandImage url={a.logo_url} alt={a.name} className="h-10 w-10 object-contain"/><span className="min-w-0 flex-1 break-words font-medium">{a.name}</span><LogoUpload tenant={tenantId} onUploaded={url => save(a.id, url)}/>{a.logo_url && <Button variant="ghost" size="sm" onClick={() => save(a.id, null).catch(() => toast.error('No se pudo quitar el logo'))}>Quitar</Button>}</div>)}</div></section>;
}
