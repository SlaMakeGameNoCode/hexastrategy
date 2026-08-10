import { describe, it, expect } from 'vitest';
import { HexMath, HexCoord } from '../../../src/core/hex-math.js';

describe('HexMath Unit Tests', () => {
  it('test_hex_distance_calculation', () => {
    const a: HexCoord = { q: 0, r: 0 };
    const b: HexCoord = { q: 2, r: -1 };
    expect(HexMath.getDistance(a, b)).toBe(2);

    const c: HexCoord = { q: -3, r: 5 };
    expect(HexMath.getDistance(a, c)).toBe(5);
  });

  it('test_hex_neighbors_count_and_positions', () => {
    const center: HexCoord = { q: 0, r: 0 };
    const neighbors = HexMath.getNeighbors(center);

    expect(neighbors.length).toBe(6);
    expect(neighbors).toContainEqual({ q: 1, r: 0 });
    expect(neighbors).toContainEqual({ q: 0, r: 1 });
    expect(neighbors).toContainEqual({ q: -1, r: 1 });
  });

  it('test_hex_to_pixel_and_pixel_to_hex_roundtrip', () => {
    const radius = 30;
    const originHex: HexCoord = { q: 3, r: -2 };

    const pixel = HexMath.hexToPixel(originHex, radius);
    const convertedHex = HexMath.pixelToHex(pixel, radius);

    expect(convertedHex.q).toBe(originHex.q);
    expect(convertedHex.r).toBe(originHex.r);
  });
});
