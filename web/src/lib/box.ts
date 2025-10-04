import type { Performance, Potential, BoxDefinition } from '@/types';

export function computeBoxKey(performance: Performance, potential: Potential): string {
  return `${performance}_${potential}`;
}

export function gridToRatings(gridX: 1 | 2 | 3, gridY: 1 | 2 | 3): { performance: Performance; potential: Potential } {
  const performance = gridX === 1 ? 'low' : gridX === 2 ? 'medium' : 'high';
  const potential = gridY === 1 ? 'low' : gridY === 2 ? 'medium' : 'high';
  return { performance, potential } as const;
}

export function ratingsToGrid(performance: Performance, potential: Potential): { x: 1 | 2 | 3; y: 1 | 2 | 3 } {
  const x = performance === 'low' ? 1 : performance === 'medium' ? 2 : 3;
  const y = potential === 'low' ? 1 : potential === 'medium' ? 2 : 3;
  return { x, y } as const;
}

export function buildBoxByPositionMap(defs: BoxDefinition[]): Record<string, BoxDefinition> {
  const map: Record<string, BoxDefinition> = {};
  for (const def of defs) {
    map[`${def.grid_x}-${def.grid_y}`] = def;
  }
  return map;
}

export function findDefinitionForRatings(
  defs: BoxDefinition[],
  performance: Performance,
  potential: Potential
): BoxDefinition | undefined {
  const { x, y } = ratingsToGrid(performance, potential);
  const key = `${x}-${y}`;
  const byPos = buildBoxByPositionMap(defs);
  return byPos[key];
}

