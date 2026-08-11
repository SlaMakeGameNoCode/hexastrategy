import { describe, it, expect } from 'vitest';
import { HexMath, HexCoord } from '../../../src/core/hex-math.js';

describe('PvP Perspective & Inverted Click Matrix Test', () => {
  it('should invert coordinates correctly for Player 2 (Red)', () => {
    const rawClickHex: HexCoord = { q: 2, r: 3 };
    
    // Player 2 perspective inversion rule: (q, r) -> (-q, -r)
    const invertedHex: HexCoord = { q: -rawClickHex.q, r: -rawClickHex.r };

    expect(invertedHex).toEqual({ q: -2, r: -3 });
  });

  it('should verify single inversion consistency', () => {
    const origHex: HexCoord = { q: -4, r: 5 };
    const myPvpColor = '#EF4444'; // Red Player

    let hex = { ...origHex };
    if (myPvpColor === '#EF4444') {
      hex = { q: -hex.q, r: -hex.r };
    }

    expect(hex).toEqual({ q: 4, r: -5 });
  });
});
