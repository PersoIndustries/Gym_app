import { canvasBlob, loadImage, SOCIAL_WIDTH as W, SOCIAL_HEIGHT as H } from './images';
export const PHOTO_FILTERS = { original: 'none', contrast: 'contrast(1.25) saturate(0.9)', mono: 'grayscale(1) contrast(1.2)', vivid: 'saturate(1.35) contrast(1.08)', warm: 'sepia(0.3) saturate(1.15)' };
export type PhotoFilter = keyof typeof PHOTO_FILTERS;
export const FILTER_LABEL: Record<PhotoFilter, string> = { original: 'Original', contrast: 'Contraste', mono: 'B/N', vivid: 'Vivo', warm: 'Cálido' };
export type SocialStyle = 'badge' | 'board' | 'minimal';
export const STYLE_LABEL: Record<SocialStyle, string> = { badge: 'Insignia', board: 'Pizarra', minimal: 'Sello' };
export interface CropArea { x: number; y: number; width: number; height: number }
export interface SocialStat { label: string; value: string }
export interface SocialOpts { photo: string; crop: CropArea; filter: PhotoFilter; style: SocialStyle; title: string; gym: string; activity: string; date: string; gymLogo: string | null; stats: SocialStat[]; lines: string[] }
const FONT = '"Space Grotesk", "IBM Plex Sans", Arial, sans-serif';
const M = 72;
export function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []; let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (ctx.measureText(word).width > width) { if (line) { lines.push(line); line = ''; } let part = ''; for (const ch of word) { if (ctx.measureText(part + ch).width > width) { lines.push(part); part = ''; } part += ch; } line = part; }
    else if (line && ctx.measureText(`${line} ${word}`).width > width) { lines.push(line); line = word; }
    else line += `${line ? ' ' : ''}${word}`;
  }
  if (line) lines.push(line); return lines;
}
function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function glass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 36) {
  ctx.save(); round(ctx, x, y, w, h, r); ctx.fillStyle = 'rgba(10,12,16,0.42)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.stroke(); ctx.restore();
}
async function whiteLogo(url: string, maxW: number, maxH: number) {
  const img = await loadImage(url); const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
  const x = c.getContext('2d')!; x.drawImage(img, 0, 0, c.width, c.height); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return c;
}
function fit(ctx: CanvasRenderingContext2D, text: string, max: number, size: number, weight = 800) { let s = size; ctx.font = `${weight} ${s}px ${FONT}`; while (ctx.measureText(text).width > max && s > 24) { s -= 2; ctx.font = `${weight} ${s}px ${FONT}`; } return s; }
export async function renderSocialPhoto(canvas: HTMLCanvasElement, o: SocialOpts, encode = true) {
  canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No se pudo preparar la foto');
  const img = await loadImage(o.photo); const { x, y, width, height } = o.crop;
  ctx.filter = PHOTO_FILTERS[o.filter]; ctx.drawImage(img, x, y, width, height, 0, 0, W, H); ctx.filter = 'none';
  // Viñetas suaves
  let g = ctx.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 420);
  const bottom = o.style === 'minimal' ? 620 : 1100; g = ctx.createLinearGradient(0, H - bottom, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.62)'); ctx.fillStyle = g; ctx.fillRect(0, H - bottom, W, bottom);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18;
  // Cabecera: logo blanco + box
  let headX = M; const logo = o.gymLogo ? await whiteLogo(o.gymLogo, 200, 96).catch(() => null) : null;
  ctx.globalAlpha = 0.9; if (logo) { ctx.drawImage(logo, M, 84 + (96 - logo.height) / 2); headX = M + logo.width + 26; } ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; fit(ctx, o.gym.toUpperCase(), W - headX - M, 34, 800); ctx.fillText(o.gym.toUpperCase(), headX, 126);
  ctx.fillStyle = 'rgba(255,255,255,0.62)'; ctx.font = `500 26px ${FONT}`; ctx.fillText(o.date, headX, 164);
  const stats = o.stats.slice(0, 3);
  const drawStats = (top: number, left: number, w: number) => { if (!stats.length) return 0; const cw = w / stats.length; stats.forEach((s, i) => { const cx = left + i * cw; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `700 22px ${FONT}`; ctx.fillText(s.label.toUpperCase(), cx, top); ctx.fillStyle = '#fff'; fit(ctx, s.value, cw - 20, 64, 800); ctx.fillText(s.value, cx, top + 66); }); return 96; };
  const pill = (text: string, px: number, py: number) => { ctx.font = `700 24px ${FONT}`; const w = ctx.measureText(text.toUpperCase()).width + 40; ctx.save(); ctx.shadowBlur = 0; round(ctx, px, py, w, 46, 23); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(text.toUpperCase(), px + 20, py + 32); ctx.restore(); };
  if (o.style === 'minimal') {
    ctx.fillStyle = '#fff'; const s = fit(ctx, o.title.toUpperCase(), W - 2 * M, 92, 900); ctx.fillText(o.title.toUpperCase(), M, H - 150);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = `600 28px ${FONT}`; ctx.fillText([o.activity, ...stats.map(s2 => s2.value)].join('  ·  '), M, H - 150 + 56 + (92 - s) * 0);
  } else if (o.style === 'badge') {
    const bw = W - 2 * M; const bh = stats.length ? 400 : 290; const by = H - bh - 110; glass(ctx, M, by, bw, bh);
    ctx.shadowBlur = 0; pill(o.activity, M + 44, by + 44);
    ctx.fillStyle = '#fff'; fit(ctx, o.title.toUpperCase(), bw - 88, 76, 900); ctx.fillText(o.title.toUpperCase(), M + 44, by + 180);
    if (stats.length) drawStats(by + 262, M + 44, bw - 88);
    else { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = `500 30px ${FONT}`; ctx.fillText(o.lines.filter(Boolean)[0]?.slice(0, 60) ?? 'Sesión completada', M + 44, by + 236); }
  } else {
    const bw = W - 2 * M; const maxH = 1080; ctx.shadowBlur = 0;
    let size = 34; let lines: string[] = []; ctx.font = `500 ${size}px ${FONT}`;
    while (size >= 20) { ctx.font = `500 ${size}px ${FONT}`; lines = o.lines.flatMap(l => l ? wrap(ctx, l, bw - 88) : ['']); if (lines.length * size * 1.45 <= maxH - 330) break; size -= 2; }
    if (size < 20) throw new Error('El entreno es muy largo; elige una fase');
    const statH = stats.length ? 130 : 0; const bh = 250 + statH + lines.length * size * 1.45; const by = H - bh - 100; glass(ctx, M, by, bw, bh);
    pill(o.activity, M + 44, by + 44); ctx.fillStyle = '#fff'; fit(ctx, o.title.toUpperCase(), bw - 88, 62, 900); ctx.fillText(o.title.toUpperCase(), M + 44, by + 168);
    if (stats.length) drawStats(by + 236, M + 44, bw - 88);
    let ly = by + 230 + statH + size; const heads = new Set(o.lines.filter(l => l && l === l.toUpperCase() && /[A-ZÁÉÍÓÚ]/.test(l)));
    for (const l of lines) { const head = heads.has(l); ctx.fillStyle = head ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.95)'; ctx.font = `${head ? 800 : 500} ${head ? size * 0.75 : size}px ${FONT}`; ctx.fillText(l, M + 44, ly); ly += size * 1.45; }
  }
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = `600 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('POWERED BY BOXFLOW', W / 2, H - 44); ctx.textAlign = 'left';
  return encode ? canvasBlob(canvas, 'image/jpeg', 0.92) : null;
}
