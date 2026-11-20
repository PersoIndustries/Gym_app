import { canvasBlob, loadImage, SOCIAL_WIDTH, SOCIAL_HEIGHT } from './images';
export const PHOTO_FILTERS = { original: 'none', contrast: 'contrast(1.25) saturate(0.85)', mono: 'grayscale(1)', warm: 'sepia(0.3) saturate(1.15)' };
export type PhotoFilter = keyof typeof PHOTO_FILTERS;
export interface CropArea { x: number; y: number; width: number; height: number }
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []; let line = '';
  for (const word of text.split(/\s+/)) {
    if (ctx.measureText(word).width > width) { if (line) { lines.push(line); line = ''; } let part = ''; for (const char of word) { if (ctx.measureText(part + char).width > width) { lines.push(part); part = ''; } part += char; } line = part; }
    else if (line && ctx.measureText(`${line} ${word}`).width > width) { lines.push(line); line = word; }
    else line += `${line ? ' ' : ''}${word}`;
  }
  if (line) lines.push(line); return lines;
}
export async function renderSocialPhoto(canvas: HTMLCanvasElement, opts: { photo: string; crop: CropArea; filter: PhotoFilter; title: string; gym: string; activity: string; gymLogo: string | null; classLogo: string | null; lines: string[] }) {
  canvas.width = SOCIAL_WIDTH; canvas.height = SOCIAL_HEIGHT;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No se pudo preparar la foto');
  const img = await loadImage(opts.photo); const { x, y, width, height } = opts.crop;
  ctx.filter = PHOTO_FILTERS[opts.filter]; ctx.drawImage(img, x, y, width, height, 0, 0, canvas.width, canvas.height); ctx.filter = 'none';
  const tokens = getComputedStyle(document.documentElement); const ink = tokens.getPropertyValue('--social-ink').trim(); const panel = tokens.getPropertyValue('--social-panel').trim(); const accent = tokens.getPropertyValue('--primary').trim();
  ctx.fillStyle = panel; ctx.fillRect(0, 0, 1080, 260); ctx.fillRect(0, 840, 1080, 1080);
  ctx.fillStyle = ink;
  const logo = async (url: string | null, label: string, right: boolean) => {
    if (url) { const image = await loadImage(url); const s = Math.min(180 / image.naturalWidth, 120 / image.naturalHeight); const w = image.naturalWidth * s; const h = image.naturalHeight * s; ctx.drawImage(image, right ? 1016 - w : 64, 48, w, h); }
    else { ctx.font = 'bold 28px sans-serif'; ctx.textAlign = right ? 'right' : 'left'; const words = wrap(ctx, label, 380).slice(0, 2); words.forEach((l, i) => ctx.fillText(l, right ? 1016 : 64, 80 + i * 36)); ctx.textAlign = 'left'; }
  };
  await logo(opts.gymLogo, opts.gym, false); await logo(opts.classLogo, opts.activity, true);
  let titleSize = 52; ctx.font = `bold ${titleSize}px sans-serif`; while (ctx.measureText(opts.title).width > 952 && titleSize > 18) { titleSize--; ctx.font = `bold ${titleSize}px sans-serif`; }
  ctx.fillStyle = ink; wrap(ctx, opts.title, 952).slice(0, 2).forEach((l, i) => ctx.fillText(l, 64, 210 + i * 30));
  let size = 36; let lines: string[] = [];
  while (size >= 16) { ctx.font = `${size}px sans-serif`; lines = opts.lines.flatMap(l => wrap(ctx, l, 952)); if (lines.length * size * 1.4 <= 920) break; size--; }
  if (size < 16) throw new Error('El WOD es muy largo para una imagen; selecciona una fase');
  ctx.fillStyle = accent; ctx.font = 'bold 36px sans-serif'; ctx.fillText('WOD', 64, 910);
  ctx.font = `${size}px sans-serif`; ctx.fillStyle = ink; lines.forEach((line, i) => ctx.fillText(line, 64, 976 + i * size * 1.4));
  return canvasBlob(canvas);
}
