import { HexMath, HexCoord } from '../core/hex-math.js';
import { TerrainType } from '../core/terrain-matrix.js';

export interface RenderableUnit {
  id: string;
  name: string;
  category: 'INFANTRY' | 'CAVALRY' | 'ARCHER';
  position: HexCoord;
  hp: number;
  maxHp: number;
  ownerColor: string;
}

export interface MapTileRenderData {
  coord: HexCoord;
  terrain: TerrainType;
}

export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private hexRadius: number = 36;
  private isOffscreenDirty: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not acquire Canvas 2D context');
    this.ctx = context;

    this.setupDPI();
  }

  public setupDPI(): void {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    if (this.canvas && typeof this.canvas.getBoundingClientRect === 'function') {
      const rect = this.canvas.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
      }
    }
  }


  /**
   * Caches static terrain tiles onto offscreen canvas for high-performance rendering (<30 draw calls).
   */
  public cacheTerrain(tiles: MapTileRenderData[], width: number, height: number): void {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    const centerX = width / 2;
    const centerY = height / 2;

    this.offscreenCtx.clearRect(0, 0, width, height);

    for (const tile of tiles) {
      const pos = HexMath.hexToPixel(tile.coord, this.hexRadius);
      this.drawHexagon(
        this.offscreenCtx,
        centerX + pos.x,
        centerY + pos.y,
        this.hexRadius,
        this.getTerrainColor(tile.terrain),
        '#1E293B'
      );
    }
    this.isOffscreenDirty = false;
  }

  /**
   * Renders the complete frame: background cache + units + UI overlays.
   */
  public renderFrame(
    tiles: MapTileRenderData[],
    units: RenderableUnit[],
    highlightHexes?: Map<string, number>,
    pathPreview?: HexCoord[]
  ): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear main canvas
    this.ctx.clearRect(0, 0, width, height);

    // Render static background
    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    } else {
      this.cacheTerrain(tiles, width, height);
      if (this.offscreenCanvas) this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    // Render Reachable Hex Highlights
    if (highlightHexes) {
      for (const [key] of highlightHexes.entries()) {
        const [q, r] = key.split(',').map(Number);
        const pos = HexMath.hexToPixel({ q, r }, this.hexRadius);
        this.drawHexagon(this.ctx, centerX + pos.x, centerY + pos.y, this.hexRadius - 2, 'rgba(59, 130, 246, 0.35)', '#3B82F6');
      }
    }

    // Render Path Preview Overlay Line
    if (pathPreview && pathPreview.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#F59E0B';
      this.ctx.lineWidth = 4;

      for (let i = 0; i < pathPreview.length; i++) {
        const pos = HexMath.hexToPixel(pathPreview[i], this.hexRadius);
        const px = centerX + pos.x;
        const py = centerY + pos.y;
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.stroke();
    }

    // Render Dynamic Units
    for (const unit of units) {
      const pos = HexMath.hexToPixel(unit.position, this.hexRadius);
      this.drawUnit(this.ctx, centerX + pos.x, centerY + pos.y, unit);
    }
  }

  private drawUnit(ctx: CanvasRenderingContext2D, x: number, y: number, unit: RenderableUnit): void {
    // Circle Unit Body
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = unit.ownerColor;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Unit Category Emblem Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.category.substring(0, 3), x, y);

    // Health Bar Background & Fill
    const barW = 28;
    const barH = 5;
    const hpRatio = Math.max(0, unit.hp / unit.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(x - barW / 2, y - 26, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#22C55E' : hpRatio > 0.25 ? '#EAB308' : '#EF4444';
    ctx.fillRect(x - barW / 2, y - 26, barW * hpRatio, barH);
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string, stroke: string): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private getTerrainColor(terrain: TerrainType): string {
    switch (terrain) {
      case 'ROAD': return '#64748B';
      case 'GROUND': return '#1E293B';
      case 'HIGH_GROUND': return '#D97706';
      case 'FOREST': return '#15803D';
      case 'RUINS': return '#78350F';
      case 'MOUNTAIN': return '#334155';
      case 'WATER': return '#0284C7';
      default: return '#1E293B';
    }
  }

  public getHexRadius(): number {
    return this.hexRadius;
  }
}
