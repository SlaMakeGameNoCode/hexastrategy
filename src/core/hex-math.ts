/**
 * Hexagonal Grid Mathematics module using Axial (q, r) and Cube (q, r, s) coordinates.
 */

export interface HexCoord {
  q: number;
  r: number;
}

export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export class HexMath {
  /**
   * Converts Axial (q, r) to Cube (q, r, s) coordinates.
   */
  public static toCube(hex: HexCoord): CubeCoord {
    return {
      q: hex.q,
      r: hex.r,
      s: -hex.q - hex.r
    };
  }

  /**
   * Computes exact distance in hex steps between two hex cells.
   */
  public static getDistance(a: HexCoord, b: HexCoord): number {
    const cubeA = HexMath.toCube(a);
    const cubeB = HexMath.toCube(b);
    return Math.max(
      Math.abs(cubeA.q - cubeB.q),
      Math.abs(cubeA.r - cubeB.r),
      Math.abs(cubeA.s - cubeB.s)
    );
  }

  /**
   * Returns all 6 immediate neighbor direction vectors on a pointy-topped hex grid.
   */
  public static readonly DIRECTIONS: HexCoord[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
  ];

  /**
   * Returns array of 6 neighboring hex coordinates.
   */
  public static getNeighbors(hex: HexCoord): HexCoord[] {
    return HexMath.DIRECTIONS.map((dir) => ({
      q: hex.q + dir.q,
      r: hex.r + dir.r
    }));
  }

  /**
   * Converts Axial Hex coordinate to 2D Screen Pixel position (pointy-topped hex).
   */
  public static hexToPixel(hex: HexCoord, radius: number): Point2D {
    const x = radius * Math.sqrt(3) * (hex.q + hex.r / 2);
    const y = radius * (3 / 2) * hex.r;
    return { x, y };
  }

  /**
   * Converts 2D Screen Pixel position back to nearest Axial Hex coordinate.
   */
  public static pixelToHex(point: Point2D, radius: number): HexCoord {
    const q = ((Math.sqrt(3) / 3) * point.x - (1 / 3) * point.y) / radius;
    const r = ((2 / 3) * point.y) / radius;
    return HexMath.roundHex({ q, r });
  }

  /**
   * Rounds floating point axial coordinate to nearest integer hex cell.
   */
  public static roundHex(hex: { q: number; r: number }): HexCoord {
    let q = Math.round(hex.q);
    let r = Math.round(hex.r);
    let s = Math.round(-hex.q - hex.r);

    const qDiff = Math.abs(q - hex.q);
    const rDiff = Math.abs(r - hex.r);
    const sDiff = Math.abs(s - (-hex.q - hex.r));

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    }

    return { q, r };
  }
}
