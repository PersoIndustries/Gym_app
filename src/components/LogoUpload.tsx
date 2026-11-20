import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadLogo } from '@/lib/data/media';
export function LogoUpload({ tenant, onUploaded, disabled = false }: { tenant: string | null; onUploaded: (url: string) => void | Promise<void>; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false);
  return <><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Archivo del logo" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { await onUploaded(await uploadLogo(file, tenant)); toast.success('Logo subido'); } catch (err) { toast.error(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'No se pudo subir el logo'); } finally { setBusy(false); e.target.value = ''; } }} /><Button type="button" variant="outline" disabled={disabled || busy} onClick={() => input.current?.click()}><Upload className="h-4 w-4"/>{busy ? 'Subiendo…' : 'Subir logo'}</Button></>;
}
