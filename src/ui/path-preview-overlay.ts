import { HexCoord } from '../core/hex-math.js';
import { HexPathfinder, MapHexTile, PathResult } from '../core/hex-pathfinder.js';
import { UnitCategory } from '../core/terrain-matrix.js';

export class PathPreviewOverlay {
  private selectedUnitCoord: HexCoord | null = null;
  private selectedUnitCategory: UnitCategory = 'INFANTRY';
  private selectedUnitMP: number = 0;
  private reachableHexes: Map<string, number> = new Map();

  public selectUnit(coord: HexCoord, category: UnitCategory, mp: number, tileLookup: (c: HexCoord) => MapHexTile | undefined): Map<string, number> {
    this.selectedUnitCoord = coord;
    this.selectedUnitCategory = category;
    this.selectedUnitMP = mp;

    this.reachableHexes = HexPathfinder.getReachableHexes(coord, mp, category, tileLookup);
    return this.reachableHexes;
  }

  public getPathPreview(hoverCoord: HexCoord, tileLookup: (c: HexCoord) => MapHexTile | undefined): PathResult | null {
    if (!this.selectedUnitCoord) return null;

    const hoverKey = HexPathfinder.hexKey(hoverCoord);
    if (!this.reachableHexes.has(hoverKey)) return null;

    return HexPathfinder.findPath(
      this.selectedUnitCoord,
      hoverCoord,
      this.selectedUnitMP,
      this.selectedUnitCategory,
      tileLookup
    );
  }

  public clearSelection(): void {
    this.selectedUnitCoord = null;
    this.reachableHexes.clear();
  }

  public getReachableHexes(): Map<string, number> {
    return this.reachableHexes;
  }
}
