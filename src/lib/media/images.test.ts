import { describe, expect, it } from 'vitest';
import { imageSize, validateImage, canShareClass, SOCIAL_WIDTH, SOCIAL_HEIGHT } from './images';
describe('Imágenes del gimnasio', () => {
  it('reduce logos a 512 píxeles conservando proporción', () => { expect(imageSize(2048, 1024)).toEqual({ width: 512, height: 256 }); expect(imageSize(100, 200)).toEqual({ width: 100, height: 200 }); });
  it('rechaza SVG y archivos excesivos', () => { expect(() => validateImage({ type: 'image/svg+xml', size: 100 })).toThrow(); expect(() => validateImage({ type: 'image/png', size: 21 * 1024 * 1024 })).toThrow(); });
  it('exporta vertical 9:16', () => { expect(SOCIAL_WIDTH).toBe(1080); expect(SOCIAL_HEIGHT).toBe(1920); expect(SOCIAL_WIDTH / SOCIAL_HEIGHT).toBe(9 / 16); });
  it('solo ofrece foto cuando termina la clase y no está cancelada', () => { const c = { status: 'scheduled', ends_at: '2026-11-20T10:00:00Z' }; expect(canShareClass(c, Date.parse('2026-11-20T09:59:00Z'))).toBe(false); expect(canShareClass(c, Date.parse('2026-11-20T10:00:00Z'))).toBe(true); expect(canShareClass({ ...c, status: 'cancelled' }, Date.parse('2026-11-20T11:00:00Z'))).toBe(false); });
});
