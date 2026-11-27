import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, Download, ImagePlus, Share2, Crop, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { validateImage } from '@/lib/media/images';
import { FILTER_LABEL, PHOTO_FILTERS, renderSocialPhoto, STYLE_LABEL, type CropArea, type PhotoFilter, type SocialStat, type SocialStyle } from '@/lib/media/social';
import { resolveLogo } from '@/lib/data/media';
import { cn } from '@/lib/utils';
type Section = { key: string; title: string; lines: string[] };
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" onClick={onClick} aria-pressed={on} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40 text-muted-foreground')}>{children}</button>;
export function SocialPhoto({ title, gym, activity, date, gymLogo, activityLogo, stats, sections }: { title: string; gym: string; activity: string; date: string; gymLogo: string | null | undefined; activityLogo?: string | null | undefined; stats: SocialStat[]; sections: Section[] }) {
  const [open, setOpen] = useState(false); const [photo, setPhoto] = useState(''); const [crop, setCrop] = useState({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1); const [area, setArea] = useState<CropArea | null>(null);
  const [cropping, setCropping] = useState(true); const [filter, setFilter] = useState<PhotoFilter>('original'); const [style, setStyle] = useState<SocialStyle>(sections.length ? 'board' : 'badge'); const [phase, setPhase] = useState('all');
  const [error, setError] = useState(''); const [offset, setOffset] = useState(0); const [actLogo, setActLogo] = useState<string | null>(null); const drag = useRef<number | null>(null); const [logo, setLogo] = useState<string | null>(null); const canvas = useRef<HTMLCanvasElement>(null); const file = useRef<HTMLInputElement>(null); const camera = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  useEffect(() => { if (location.hash === '#foto') setOpen(true); }, []);
  useEffect(() => { if (open) resolveLogo(activityLogo).then(l => setActLogo(l ?? null)).catch(() => setActLogo(null)); }, [open, activityLogo]);
  useEffect(() => { if (open) resolveLogo(gymLogo).then(l => setLogo(l ?? null)).catch(() => setLogo(null)); }, [open, gymLogo]);
  const pick = (image: File | undefined) => { if (!image) return; try { validateImage(image); setPhoto(URL.createObjectURL(image)); setCrop({ x: 0, y: 0 }); setZoom(1); setArea(null); setCropping(true); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Imagen no válida'); } };
  const opts = () => area && { photo, crop: area, filter, style, title, gym, activity, date, gymLogo: logo, activityLogo: actLogo, offset, stats, lines: sections.filter(s => phase === 'all' || s.key === phase).flatMap(s => [s.title.toUpperCase(), ...s.lines, '']).slice(0, -1) };
  useEffect(() => { const o = opts(); if (cropping || !o || !canvas.current) return; let live = true; renderSocialPhoto(canvas.current, o, false).then(() => live && setError('')).catch(e => live && setError(e instanceof Error ? e.message : 'No se pudo preparar la foto')); return () => { live = false; }; }, [cropping, area, filter, style, phase, logo, actLogo, offset, photo]);
  async function blob() { const o = opts(); if (!o) return null; return renderSocialPhoto(document.createElement('canvas'), o); }
  async function share() { const b = await blob(); if (!b) return; const f = new File([b], 'mi-entreno.jpg', { type: 'image/jpeg' }); if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title }); } catch { /* cancelado */ } } else download(b); }
  function download(b: Blob) { const url = URL.createObjectURL(b); const a = document.createElement('a'); a.href = url; a.download = 'mi-entreno.jpg'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  return <>
    <Button className="mt-4 w-full sm:w-auto" variant="outline" onClick={() => setOpen(true)}><Camera className="h-4 w-4"/>Compartir mi entreno</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="flex h-[100dvh] max-w-md flex-col gap-3 overflow-y-auto p-4 sm:h-auto sm:max-h-[94vh]">
      <DialogHeader><DialogTitle>Compartir mi entreno</DialogTitle></DialogHeader>
      <input ref={file} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" aria-label="Foto del entreno" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }}/>
      <input ref={camera} type="file" className="hidden" accept="image/*" capture="environment" aria-label="Hacer foto" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }}/>
      {!photo ? <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center"><p className="text-sm text-muted-foreground">Elige una foto de la clase. Se queda en tu móvil, no se sube.</p><div className="flex gap-2"><Button onClick={() => camera.current?.click()}><Camera/>Hacer foto</Button><Button variant="outline" onClick={() => file.current?.click()}><ImagePlus/>Galería</Button></div></div> : <>
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-xl bg-muted">
          {cropping ? <Cropper image={photo} crop={crop} zoom={zoom} aspect={9/16} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} style={{ mediaStyle: { filter: PHOTO_FILTERS[filter] } }}/> : <canvas ref={canvas} aria-label="Vista previa: arrastra para mover los datos" className="h-full w-full touch-none cursor-grab" onPointerDown={e => { drag.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (drag.current === null) return; const k = 1920 / e.currentTarget.clientHeight; const dy = (e.clientY - drag.current) * k; drag.current = e.clientY; setOffset(o => Math.max(-1400, Math.min(0, o + dy))); }} onPointerUp={() => { drag.current = null; }}/>}
        </div>
        {cropping ? <div className="space-y-3"><input aria-label="Zoom" type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-primary"/><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => file.current?.click()}><ImagePlus/>Otra foto</Button><Button className="flex-1" disabled={!area} onClick={() => setCropping(false)}><Check/>Listo</Button></div></div> : <div className="space-y-3">
          <div><p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Estilo</p><div className="flex gap-2 overflow-x-auto pb-1">{(Object.keys(STYLE_LABEL) as SocialStyle[]).filter(s => s !== 'board' || sections.length).map(s => <Chip key={s} on={style === s} onClick={() => setStyle(s)}>{STYLE_LABEL[s]}</Chip>)}</div></div>
          <div><p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Posición de los datos · o arrástralos</p><div className="flex gap-2"><Chip on={offset === 0} onClick={() => setOffset(0)}>Abajo</Chip><Chip on={offset === -450} onClick={() => setOffset(-450)}>Centro</Chip><Chip on={offset === -1400} onClick={() => setOffset(-1400)}>Arriba</Chip></div></div>
          <div><p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Filtro</p><div className="flex gap-2 overflow-x-auto pb-1">{(Object.keys(FILTER_LABEL) as PhotoFilter[]).map(f => <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>{FILTER_LABEL[f]}</Chip>)}</div></div>
          {style === 'board' && sections.length > 1 && <div><p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Contenido</p><div className="flex gap-2 overflow-x-auto pb-1"><Chip on={phase === 'all'} onClick={() => setPhase('all')}>Todo</Chip>{sections.map(s => <Chip key={s.key} on={phase === s.key} onClick={() => setPhase(s.key)}>{s.title}</Chip>)}</div></div>}
          <div className="flex gap-2 pt-1"><Button variant="outline" size="icon" aria-label="Reencuadrar" onClick={() => setCropping(true)}><Crop/></Button><Button variant="outline" size="icon" aria-label="Descargar" onClick={async () => { const b = await blob(); if (b) download(b); }}><Download/></Button><Button className="flex-1" onClick={share}><Share2/>Compartir</Button></div>
        </div>}
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </DialogContent></Dialog></>;
}
