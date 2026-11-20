export const LOGO_MAX_EDGE = 512;
export const SOCIAL_WIDTH = 1080;
export const SOCIAL_HEIGHT = 1920;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export function imageSize(width: number, height: number, edge = LOGO_MAX_EDGE) {
  if (width <= 0 || height <= 0) throw new Error("Imagen no válida");
  const scale = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
export function validateImage(file: Pick<File, 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Usa una imagen JPG, PNG o WebP');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('La imagen supera 20 MB');
}
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = () => reject(new Error('No se pudo abrir la imagen')); img.src = url; });
}
export function canvasBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo preparar la imagen')), type, quality));
}
export async function optimizeLogo(file: File): Promise<Blob> {
  validateImage(file); const url = URL.createObjectURL(file);
  try { const img = await loadImage(url); const size = imageSize(img.naturalWidth, img.naturalHeight); const canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('No se pudo preparar el logo'); ctx.drawImage(img, 0, 0, size.width, size.height); const blob = await canvasBlob(canvas, 'image/webp', 0.85); if (blob.size > 1024 * 1024) throw new Error('El logo optimizado supera 1 MB'); return blob; } finally { URL.revokeObjectURL(url); }
}
export function canShareClass(cls: { status: string; ends_at: string }, now = Date.now()) { return cls.status !== 'cancelled' && new Date(cls.ends_at).getTime() <= now; }
