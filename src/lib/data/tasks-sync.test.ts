import { expect, it } from 'vitest';
import { syncDeliveredTasks } from './tasks';
import type { RoadmapItem } from '@/lib/domain/types';
it('actualiza la tarea solicitada y su copia conservando notas y prioridades', () => {
  const base: RoadmapItem = { id: 'original', title: 'Clases · Logo por tipo de clase', description: 'Vieja', status: 'pending', priority: 'medium', notes: 'Mis notas', sort_order: 1 };
  const delivered = { ...base, status: 'done' as const, description: 'Implementado' };
  const result = syncDeliveredTasks([base, { ...base, id: 'copy', title: `${base.title} (copia)` }, { ...base, id: 'other', title: 'Otra tarea' }], [delivered]);
  expect(result[0]?.status).toBe('done'); expect(result[1]?.status).toBe('done'); expect(result[1]?.notes).toBe('Mis notas'); expect(result[2]?.status).toBe('pending');
});
