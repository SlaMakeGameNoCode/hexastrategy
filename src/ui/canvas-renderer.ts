import { HexMath, HexCoord } from '../core/hex-math.js';
import { TerrainType } from '../core/terrain-matrix.js';

export interface RenderableUnit {
  id: string;
  name: string;
  category: 'INFANTRY' | 'CAVALRY' | 'ARCHER';
  position: HexCoord;
  animPos?: { x: number; y: number }; // Smooth interpolated pixel position
  hp: number;
  maxHp: number;
  ownerColor: string;
  assignedAction?: {
    type: 'MOVE' | 'ATTACK' | 'BRACE';
    targetHex?: HexCoord;
    cost: number;
  };
}

export interface MapTileRenderData {
  coord: HexCoord;
  terrain: TerrainType;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private hexRadius: number = 36;

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
  }

  public renderFrame(
    tiles: MapTileRenderData[],
    units: RenderableUnit[],
    selectedUnitId?: string | null,
    highlightHexes?: Map<string, number>,
    pathPreview?: HexCoord[],
    floatingTexts?: FloatingText[]
  ): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    this.ctx.clearRect(0, 0, width, height);

    // Static Background Terrain
    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    } else {
      this.cacheTerrain(tiles, width, height);
      if (this.offscreenCanvas) this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    // Highlight Reachable Hexes
    if (highlightHexes) {
      for (const [key] of highlightHexes.entries()) {
        const [q, r] = key.split(',').map(Number);
        const pos = HexMath.hexToPixel({ q, r }, this.hexRadius);
        this.drawHexagon(this.ctx, centerX + pos.x, centerY + pos.y, this.hexRadius - 2, 'rgba(59, 130, 246, 0.35)', '#3B82F6');
      }
    }

    // Path Preview Line & Destination Marker
    if (pathPreview && pathPreview.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#F59E0B';
      this.ctx.lineWidth = 4;
      this.ctx.setLineDash([8, 4]);

      for (let i = 0; i < pathPreview.length; i++) {
        const pos = HexMath.hexToPixel(pathPreview[i], this.hexRadius);
        const px = centerX + pos.x;
        const py = centerY + pos.y;
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Destination Marker
      const destPos = HexMath.hexToPixel(pathPreview[pathPreview.length - 1], this.hexRadius);
      this.drawHexagon(this.ctx, centerX + destPos.x, centerY + destPos.y, this.hexRadius - 2, 'rgba(245, 158, 11, 0.4)', '#F59E0B');
    }

    // Render Units
    for (const unit of units) {
      if (unit.hp <= 0) continue; // Dead units hidden

      let px = centerX;
      let py = centerY;

      if (unit.animPos) {
        px += unit.animPos.x;
        py += unit.animPos.y;
      } else {
        const pos = HexMath.hexToPixel(unit.position, this.hexRadius);
        px += pos.x;
        py += pos.y;
      }

      const isSelected = selectedUnitId === unit.id;
      this.drawUnit(this.ctx, px, py, unit, isSelected);

      // Render Planned Action Target Indicator
      if (unit.assignedAction && unit.assignedAction.targetHex) {
        const tPos = HexMath.hexToPixel(unit.assignedAction.targetHex, this.hexRadius);
        this.drawTargetFlag(this.ctx, centerX + tPos.x, centerY + tPos.y);
      }
    }

    // Floating Text Popups
    if (floatingTexts) {
      for (const ft of floatingTexts) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, ft.alpha);
        this.ctx.fillStyle = ft.color;
        this.ctx.font = 'bold 16px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(ft.text, centerX + ft.x, centerY + ft.y);
        this.ctx.restore();
      }
    }
  }

  private drawUnit(ctx: CanvasRenderingContext2D, x: number, y: number, unit: RenderableUnit, isSelected: boolean): void {
    // Selection Ring Glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Circle Unit Body
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = unit.ownerColor;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Unit Category Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.category.substring(0, 3), x, y);

    // Health Bar
    const barW = 32;
    const barH = 5;
    const hpRatio = Math.max(0, unit.hp / unit.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x - barW / 2, y - 28, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#10B981' : hpRatio > 0.25 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(x - barW / 2, y - 28, barW * hpRatio, barH);

    // Action Badge
    if (unit.assignedAction) {
      ctx.beginPath();
      ctx.arc(x + 14, y - 14, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.fillText(unit.assignedAction.cost.toString(), x + 14, y - 14);
    }
  }

  private drawTargetFlag(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
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
      case 'ROAD': return '#475569';
      case 'GROUND': return '#1E293B';
      case 'HIGH_GROUND': return '#D97706';
      case 'FOREST': return '#166534';
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
