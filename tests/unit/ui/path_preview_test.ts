import { describe, it, expect } from 'vitest';
import { PathPreviewOverlay } from '../../../src/ui/path-preview-overlay.js';
import { HexPathfinder, MapHexTile } from '../../../src/core/hex-pathfinder.js';

describe('PathPreviewOverlay Unit Tests', () => {
  it('test_select_unit_calculates_reachable_hexes', () => {
    const grid = new Map<string, MapHexTile>();
    for (let q = -3; q <= 3; q++) {
      for (let r = -3; r <= 3; r++) {
        grid.set(`${q},${r}`, { coord: { q, r }, terrain: 'GROUND' });
      }
    }

    const overlay = new PathPreviewOverlay();
    const reachable = overlay.selectUnit(
      { q: 0, r: 0 },
      'INFANTRY',
      2,
      (c) => grid.get(HexPathfinder.hexKey(c))
    );

    expect(reachable.size).toBe(19);

    const path = overlay.getPathPreview({ q: 2, r: 0 }, (c) => grid.get(HexPathfinder.hexKey(c)));
    expect(path).not.toBeNull();
    expect(path!.path.length).toBe(3);
  });
});
