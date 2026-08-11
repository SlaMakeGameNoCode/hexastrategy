import { HexMath, HexCoord } from '../core/hex-math.js';
import { TerrainType } from '../core/terrain-matrix.js';
import { VFXManager } from './vfx-manager.js';

export interface UnitStatusEffect {
  type: 'BURN' | 'SHIELD_WALL' | 'BRACE';
  duration: number;
  damagePerRound?: number;
}

export interface RenderableUnit {
  id: string;
  name: string;
  armyClass?: string;
  category: 'INFANTRY' | 'CAVALRY' | 'ARCHER';
  position: HexCoord;
  animPos?: { x: number; y: number };
  isMoving?: boolean;
  attackAnim?: {
    type: 'MELEE_SLASH' | 'SPEAR_THRUST' | 'ARROW_SHOOT';
    targetX: number;
    targetY: number;
    progress: number;
  };
  hp: number;
  maxHp: number;
  ownerColor: string;
  hasActedThisRound?: boolean;
  isStealthed?: boolean;
  statusEffects?: UnitStatusEffect[];
  assignedAction?: {
    type: 'MOVE' | 'ATTACK' | 'BRACE' | 'SKILL';
    targetHex?: HexCoord;
    targetUnitId?: string;
    skillType?: string;
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
  scale?: number;
}

export interface VFXParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private hexRadius: number = 28;
  private logicalWidth: number = 800;
  private logicalHeight: number = 600;
  private particles: VFXParticle[] = [];
  private cameraShakeMs: number = 0;
  private shakeIntensity: number = 0;
  private vfxManager: VFXManager;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not acquire Canvas 2D context');
    this.ctx = context;
    this.vfxManager = new VFXManager();

    this.setupDPI();
  }

  public getVFXManager(): VFXManager {
    return this.vfxManager;
  }

  public setupDPI(): void {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    if (this.canvas && typeof this.canvas.getBoundingClientRect === 'function') {
      const rect = this.canvas.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        if (Math.abs(this.logicalWidth - rect.width) > 1 || Math.abs(this.logicalHeight - rect.height) > 1) {
          this.logicalWidth = rect.width;
          this.logicalHeight = rect.height;
          this.canvas.width = rect.width * dpr;
          this.canvas.height = rect.height * dpr;
          this.ctx.scale(dpr, dpr);
          this.offscreenCanvas = null;
        }
      }
    }
  }

  public cacheTerrain(tiles: MapTileRenderData[], isFlipped?: boolean): void {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const width = this.logicalWidth;
    const height = this.logicalHeight;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width * dpr;
    this.offscreenCanvas.height = height * dpr;
    const offCtx = this.offscreenCanvas.getContext('2d')!;
    offCtx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2 - 40;

    offCtx.clearRect(0, 0, width, height);

    for (const tile of tiles) {
      const coord = isFlipped ? { q: -tile.coord.q, r: -tile.coord.r } : tile.coord;
      const pos = HexMath.hexToPixel(coord, this.hexRadius);
      const cx = centerX + pos.x;
      const cy = centerY + pos.y;

      this.drawHexagon(
        offCtx,
        cx,
        cy,
        this.hexRadius,
        this.getTerrainBaseColor(tile.terrain),
        'rgba(30, 41, 59, 0.85)'
      );

      switch (tile.terrain) {
        case 'FOREST':
          this.drawForestTile(offCtx, cx, cy);
          break;
        case 'MOUNTAIN':
          this.drawMountainTile(offCtx, cx, cy);
          break;
        case 'HIGH_GROUND':
          this.drawHighGroundTile(offCtx, cx, cy);
          break;
        case 'RUINS':
          this.drawRuinsTile(offCtx, cx, cy);
          break;
        case 'WATER':
          this.drawWaterTile(offCtx, cx, cy);
          break;
        case 'ROAD':
          this.drawRoadTile(offCtx, cx, cy);
          break;
        case 'GROUND':
          this.drawGroundTile(offCtx, cx, cy);
          break;
      }
    }
  }

  private drawForestTile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const treeOffsets = [
      { x: -8, y: -6, scale: 0.9 },
      { x: 7, y: -8, scale: 1.0 },
      { x: -10, y: 6, scale: 1.05 },
      { x: 4, y: 7, scale: 1.1 },
      { x: 0, y: -1, scale: 1.2 }
    ];

    for (const tree of treeOffsets) {
      const tx = cx + tree.x;
      const ty = cy + tree.y;
      const s = tree.scale;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(tx, ty + 10 * s, 7 * s, 3 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fill();

      ctx.fillStyle = '#4A2E19';
      ctx.fillRect(tx - 1.5 * s, ty + 2 * s, 3 * s, 8 * s);

      ctx.beginPath();
      ctx.moveTo(tx, ty - 6 * s);
      ctx.lineTo(tx + 9 * s, ty + 4 * s);
      ctx.lineTo(tx - 9 * s, ty + 4 * s);
      ctx.closePath();
      ctx.fillStyle = '#2E6930';
      ctx.fill();
      ctx.strokeStyle = '#153E17';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tx, ty - 11 * s);
      ctx.lineTo(tx + 7 * s, ty - 1 * s);
      ctx.lineTo(tx - 7 * s, ty - 1 * s);
      ctx.closePath();
      ctx.fillStyle = '#388E3C';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tx, ty - 16 * s);
      ctx.lineTo(tx + 5 * s, ty - 6 * s);
      ctx.lineTo(tx - 5 * s, ty - 6 * s);
      ctx.closePath();
      ctx.fillStyle = '#4CAF50';
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawMountainTile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const peaks = [
      { x: -7, y: 3, w: 18, h: 20 },
      { x: 8, y: 4, w: 16, h: 18 },
      { x: 0, y: -4, w: 22, h: 26 }
    ];

    for (const peak of peaks) {
      const px = cx + peak.x;
      const py = cy + peak.y;
      const hw = peak.w / 2;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(px, py + 4, hw + 2, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px, py - peak.h);
      ctx.lineTo(px - hw, py + 4);
      ctx.lineTo(px, py + 4);
      ctx.closePath();
      ctx.fillStyle = '#5D4037';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px, py - peak.h);
      ctx.lineTo(px + hw, py + 4);
      ctx.lineTo(px, py + 4);
      ctx.closePath();
      ctx.fillStyle = '#A1887F';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px - hw, py + 4);
      ctx.lineTo(px, py - peak.h);
      ctx.lineTo(px + hw, py + 4);
      ctx.strokeStyle = '#2C1A04';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px, py - peak.h);
      ctx.lineTo(px - 1, py + 4);
      ctx.strokeStyle = '#2C1A04';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px, py - peak.h);
      ctx.lineTo(px + 4, py - peak.h + 7);
      ctx.lineTo(px - 4, py - peak.h + 7);
      ctx.closePath();
      ctx.fillStyle = '#ECEFF1';
      ctx.fill();

      ctx.restore();
    }
  }

  private drawHighGroundTile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    const hills = [
      { x: -6, y: -4, r: 12 },
      { x: 7, y: -2, r: 10 },
      { x: 0, y: 5, r: 14 }
    ];

    for (const h of hills) {
      const hx = cx + h.x;
      const hy = cy + h.y;

      ctx.beginPath();
      ctx.arc(hx, hy, h.r, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fillStyle = '#D9A74A';
      ctx.fill();

      ctx.strokeStyle = '#8C671D';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRuinsTile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.fillStyle = '#78909C';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.4;

    ctx.fillRect(cx - 12, cy - 8, 6, 16);
    ctx.strokeRect(cx - 12, cy - 8, 6, 16);

    ctx.fillRect(cx + 6, cy - 14, 6, 22);
    ctx.strokeRect(cx + 6, cy - 14, 6, 22);

    ctx.fillRect(cx - 14, cy - 14, 14, 4);
    ctx.strokeRect(cx - 14, cy - 14, 14, 4);

    ctx.fillRect(cx - 2, cy + 6, 7, 5);
    ctx.strokeRect(cx - 2, cy + 6, 7, 5);
    ctx.fillRect(cx + 10, cy + 5, 5, 4);
    ctx.strokeRect(cx + 10, cy + 5, 5, 4);

    ctx.restore();
  }

  private drawWaterTile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.3;

    const waves = [
      { x: cx - 10, y: cy - 6, w: 12 },
      { x: cx + 2, y: cy + 2, w: 14 },
      { x: cx - 8, y: cy + 10, w: 10 }
    ];

    for (const w of waves) {
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.w, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRoadTile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#D4B86A';
    ctx.fill();
    ctx.strokeStyle = '#A68A38';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#8C6F2D';
    const stones = [
      { x: -5, y: -4 }, { x: 4, y: -5 }, { x: -2, y: 3 }, { x: 5, y: 4 }
    ];
    for (const s of stones) {
      ctx.fillRect(cx + s.x, cy + s.y, 3, 2);
    }
    ctx.restore();
  }

  private drawGroundTile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.strokeStyle = '#558B2F';
    ctx.lineWidth = 1.2;

    const tufts = [
      { x: cx - 8, y: cy - 4 },
      { x: cx + 6, y: cy + 5 }
    ];

    for (const t of tufts) {
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x - 2, t.y - 5);
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + 2, t.y - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  public triggerScreenShake(intensity: number = 8, durationMs: number = 250): void {
    this.shakeIntensity = intensity;
    this.cameraShakeMs = durationMs;
  }

  public spawnHitVFX(x: number, y: number, color: string = '#EF4444', count: number = 18): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 15 + 15)
      });
    }
  }

  public renderFrame(
    tiles: MapTileRenderData[],
    units: RenderableUnit[],
    selectedUnitId?: string | null,
    highlightHexes?: Map<string, number>,
    pathPreview?: HexCoord[],
    floatingTexts?: FloatingText[],
    deployZoneHexes?: HexCoord[],
    visibleHexes?: Set<string>,
    isDeploymentPhase?: boolean,
    isFlipped?: boolean,
    playerColor?: string
  ): void {
    this.setupDPI();

    const width = this.logicalWidth;
    const height = this.logicalHeight;

    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeMs > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.cameraShakeMs -= 16;
    }

    const centerX = width / 2 + shakeX;
    const centerY = height / 2 - 40 + shakeY;

    this.ctx.clearRect(0, 0, width, height);

    if (!this.offscreenCanvas) {
      this.cacheTerrain(tiles, isFlipped);
    }
    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, shakeX, shakeY, width, height);
    }

    if (visibleHexes) {
      for (const tile of tiles) {
        const hexKey = `${tile.coord.q},${tile.coord.r}`;
        if (!visibleHexes.has(hexKey)) {
          const coord = isFlipped ? { q: -tile.coord.q, r: -tile.coord.r } : tile.coord;
          const pos = HexMath.hexToPixel(coord, this.hexRadius);
          this.drawHexagon(
            this.ctx,
            centerX + pos.x,
            centerY + pos.y,
            this.hexRadius,
            'rgba(9, 13, 22, 0.72)',
            '#0F172A'
          );
        }
      }
    }

    if (deployZoneHexes && deployZoneHexes.length > 0) {
      for (const hex of deployZoneHexes) {
        const coord = isFlipped ? { q: -hex.q, r: -hex.r } : hex;
        const pos = HexMath.hexToPixel(coord, this.hexRadius);
        this.drawHexagon(this.ctx, centerX + pos.x, centerY + pos.y, this.hexRadius - 2, 'rgba(16, 185, 129, 0.25)', '#10B981');
      }
    }

    if (highlightHexes) {
      for (const [key] of highlightHexes.entries()) {
        const [q, r] = key.split(',').map(Number);
        const coord = isFlipped ? { q: -q, r: -r } : { q, r };
        const pos = HexMath.hexToPixel(coord, this.hexRadius);
        this.drawHexagon(this.ctx, centerX + pos.x, centerY + pos.y, this.hexRadius - 2, 'rgba(59, 130, 246, 0.35)', '#3B82F6');
      }
    }

    if (pathPreview && pathPreview.length > 1) {
      this.ctx.beginPath();
      for (let i = 0; i < pathPreview.length; i++) {
        const hex = pathPreview[i];
        const coord = isFlipped ? { q: -hex.q, r: -hex.r } : hex;
        const pos = HexMath.hexToPixel(coord, this.hexRadius);
        const px = centerX + pos.x;
        const py = centerY + pos.y;
        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.strokeStyle = '#F59E0B';
      this.ctx.lineWidth = 3.5;
      this.ctx.setLineDash([6, 6]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      const destPos = HexMath.hexToPixel(pathPreview[pathPreview.length - 1], this.hexRadius);
      this.drawHexagon(this.ctx, centerX + destPos.x, centerY + destPos.y, this.hexRadius - 2, 'rgba(245, 158, 11, 0.4)', '#F59E0B');
    }

    // Render Units
    const myColor = playerColor || '#3B82F6';
    for (const unit of units) {
      if (unit.hp <= 0) continue;

      const isMyUnit = unit.ownerColor === myColor;
      const hexKey = `${unit.position.q},${unit.position.r}`;

      if (!isMyUnit && !isDeploymentPhase) {
        if (visibleHexes && !visibleHexes.has(hexKey)) continue;
        if (unit.isStealthed) continue;
      }

      let px = centerX;
      let py = centerY;

      if (unit.animPos) {
        px += isFlipped ? -unit.animPos.x : unit.animPos.x;
        py += isFlipped ? -unit.animPos.y : unit.animPos.y;
      } else {
        const coord = isFlipped ? { q: -unit.position.q, r: -unit.position.r } : unit.position;
        const pos = HexMath.hexToPixel(coord, this.hexRadius);
        px += pos.x;
        py += pos.y;
      }

      const isSelected = selectedUnitId === unit.id;

      this.ctx.save();
      if (isMyUnit && unit.isStealthed) {
        this.ctx.globalAlpha = 0.45;
      }

      const isHiddenEnemyInDeployment = !isMyUnit && isDeploymentPhase;
      this.drawUnit(this.ctx, px, py, unit, isSelected, isHiddenEnemyInDeployment);

      this.ctx.restore();

      if (unit.assignedAction && unit.assignedAction.targetHex) {
        const tCoord = isFlipped ? { q: -unit.assignedAction.targetHex.q, r: -unit.assignedAction.targetHex.r } : unit.assignedAction.targetHex;
        const tPos = HexMath.hexToPixel(tCoord, this.hexRadius);
        this.drawTargetFlag(this.ctx, centerX + tPos.x, centerY + tPos.y);
      }
    }

    this.vfxManager.updateAndRender(this.ctx, centerX, centerY);

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

  private drawUnit(ctx: CanvasRenderingContext2D, x: number, y: number, unit: RenderableUnit, isSelected: boolean, isHiddenEnemy?: boolean): void {
    let drawX = x;
    let drawY = y;

    if (unit.isMoving) {
      const bob = Math.abs(Math.sin(Date.now() / 80)) * 6;
      drawY -= bob;
    }

    if (unit.attackAnim) {
      const p = unit.attackAnim.progress;
      const dx = unit.attackAnim.targetX - x;
      const dy = unit.attackAnim.targetY - y;

      if (unit.attackAnim.type === 'ARROW_SHOOT') {
        const arrowX = x + dx * p;
        const arrowY = y + dy * p;
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(arrowX - dx * 0.1, arrowY - dy * 0.1);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();
        ctx.restore();
      } else {
        const lunge = Math.sin(p * Math.PI) * 16;
        const dist = Math.hypot(dx, dy) || 1;
        drawX += (dx / dist) * lunge;
        drawY += (dy / dist) * lunge;
      }
    }

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(drawX, drawY, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const isActed = unit.hasActedThisRound;
    const isBlue = unit.ownerColor === '#3B82F6';
    const tunicColor = isHiddenEnemy ? '#1E293B' : (isActed ? '#64748B' : (isBlue ? '#2563EB' : '#DC2626'));
    const skinColor = isHiddenEnemy ? '#334155' : '#FDBA74';

    ctx.save();

    // Unit Ground Shadow
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 12, 14, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    const cls = isHiddenEnemy ? 'HIDDEN' : (unit.armyClass || unit.category);

    if (cls.includes('CAVALRY') || cls === 'HORSE_ARCHER') {
      // FULL HORSE BODY SPRITE WITH RIDER
      ctx.fillStyle = cls === 'HEAVY_CAVALRY' ? '#334155' : '#78350F';
      ctx.beginPath();
      ctx.ellipse(drawX, drawY + 4, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Horse Head & Neck
      ctx.beginPath();
      ctx.ellipse(drawX - 10, drawY - 4, 7, 10, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Mounted Rider Body & Head
      ctx.beginPath();
      ctx.arc(drawX + 2, drawY - 6, 8, 0, Math.PI * 2);
      ctx.fillStyle = tunicColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(drawX + 2, drawY - 15, 5, 0, Math.PI * 2);
      ctx.fillStyle = skinColor;
      ctx.fill();

      // Mounted Weapon
      if (cls === 'HORSE_ARCHER') {
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(drawX + 8, drawY - 12, 9, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(drawX + 4, drawY - 6);
        ctx.lineTo(drawX + 18, drawY - 18);
        ctx.stroke();
      }
    } else if (cls === 'CATAPULT') {
      // HEAVY SIEGE CATAPULT ENGINE SPRITE
      ctx.fillStyle = '#78350F';
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 1.5;
      ctx.fillRect(drawX - 14, drawY - 4, 28, 12);
      ctx.strokeRect(drawX - 14, drawY - 4, 28, 12);

      // Wheels
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(drawX - 10, drawY + 8, 5, 0, Math.PI * 2);
      ctx.arc(drawX + 10, drawY + 8, 5, 0, Math.PI * 2);
      ctx.fill();

      // Throwing Arm & Boulder
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(drawX - 8, drawY - 2);
      ctx.lineTo(drawX + 12, drawY - 14);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.arc(drawX + 14, drawY - 16, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // INFANTRY CHARACTER SPRITE (Legs, Tunic Body, Head, Helmet)
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(drawX - 6, drawY + 4, 4, 10);
      ctx.fillRect(drawX + 2, drawY + 4, 4, 10);

      ctx.beginPath();
      ctx.arc(drawX, drawY - 2, 9, 0, Math.PI * 2);
      ctx.fillStyle = tunicColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(drawX, drawY - 14, 6, 0, Math.PI * 2);
      ctx.fillStyle = skinColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(drawX, drawY - 16, 6, Math.PI, Math.PI * 2);
      ctx.fillStyle = isHiddenEnemy ? '#475569' : (isBlue ? '#1E40AF' : '#991B1B');
      ctx.fill();

      // SPECIFIC DETAILED WEAPONS FOR INFANTRY CLASSES
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2.0;

      if (cls.includes('SPEAR')) {
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(drawX + 4, drawY + 8);
        ctx.lineTo(drawX + 14, drawY - 24);
        ctx.stroke();

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(drawX + 14, drawY - 24);
        ctx.lineTo(drawX + 12, drawY - 18);
        ctx.lineTo(drawX + 16, drawY - 18);
        ctx.closePath();
        ctx.fill();
      } else if (cls === 'SWORD_SHIELD') {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(drawX - 8, drawY - 4, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(drawX - 8, drawY - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(drawX + 6, drawY + 4);
        ctx.lineTo(drawX + 14, drawY - 14);
        ctx.stroke();
      } else if (cls === 'GREATSWORD') {
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(drawX + 4, drawY + 8);
        ctx.lineTo(drawX + 12, drawY - 24);
        ctx.stroke();

        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(drawX + 6, drawY - 4);
        ctx.lineTo(drawX + 14, drawY - 8);
        ctx.stroke();
      } else if (cls.includes('CROSSBOW')) {
        const isHeavy = cls === 'HEAVY_CROSSBOW';
        const cx = drawX + 4;
        const cy = drawY - 6;

        ctx.fillStyle = '#78350F';
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy + 8);
        ctx.quadraticCurveTo(cx - 8, cy, cx - 2, cy - 2);
        ctx.lineTo(cx + 8, cy - 2);
        ctx.lineTo(cx + 10, cy + 3);
        ctx.lineTo(cx - 2, cy + 3);
        ctx.quadraticCurveTo(cx - 6, cy + 5, cx - 10, cy + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#93C5FD';
        ctx.lineWidth = isHeavy ? 3.5 : 2.5;
        ctx.beginPath();
        const frontX = cx + 6;
        ctx.moveTo(frontX, cy);
        ctx.quadraticCurveTo(frontX + 5, cy - 8, frontX - 2, cy - 14);
        ctx.moveTo(frontX, cy);
        ctx.quadraticCurveTo(frontX + 5, cy + 8, frontX - 2, cy + 14);
        ctx.stroke();

        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(frontX - 2, cy - 14);
        ctx.lineTo(cx - 2, cy);
        ctx.lineTo(frontX - 2, cy + 14);
        ctx.stroke();

        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy);
        ctx.lineTo(frontX + 6, cy);
        ctx.stroke();
      } else if (cls.includes('BOW')) {
        const isLong = cls === 'LONGBOW';
        const bowRadius = isLong ? 13 : 9;
        const bx = drawX + 6;
        const by = drawY - 8;

        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = isLong ? 3.0 : 2.2;
        ctx.beginPath();
        ctx.arc(bx, by, bowRadius, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(bx + bowRadius * Math.cos(-Math.PI * 0.45), by + bowRadius * Math.sin(-Math.PI * 0.45));
        ctx.lineTo(bx + bowRadius * Math.cos(Math.PI * 0.45), by + bowRadius * Math.sin(Math.PI * 0.45));
        ctx.stroke();

        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by);
        ctx.lineTo(bx + bowRadius + 4, by);
        ctx.stroke();

        ctx.fillStyle = '#78350F';
        ctx.fillRect(drawX - 8, drawY - 14, 4, 12);
      }
    }
    ctx.restore();

    // Floating Circular Badge (Hidden Enemy gets '❓')
    const flagY = drawY - 48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(drawX, flagY, 12, 0, Math.PI * 2);
    ctx.fillStyle = isHiddenEnemy ? '#334155' : (isActed ? '#475569' : (isBlue ? '#1E3A8A' : '#7F1D1D'));
    ctx.fill();
    ctx.strokeStyle = isHiddenEnemy ? '#64748B' : (isActed ? '#94A3B8' : (isBlue ? '#60A5FA' : '#F87171'));
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icon = isHiddenEnemy ? '❓' : (unit.isStealthed ? '🥷' : this.getArmyIcon(unit.armyClass || unit.category));
    ctx.fillText(icon, drawX, flagY);
    ctx.restore();

    if (!isHiddenEnemy) {
      const barW = 34;
      const barH = 5;
      const hpRatio = Math.max(0, unit.hp / unit.maxHp);
      const barY = drawY - 68;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(drawX - barW / 2, barY, barW, barH);
      ctx.fillStyle = hpRatio > 0.5 ? '#10B981' : hpRatio > 0.25 ? '#F59E0B' : '#EF4444';
      ctx.fillRect(drawX - barW / 2, barY, barW * hpRatio, barH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX - barW / 2, barY, barW, barH);

      // Render Active Status Badges (e.g. Flame icon 🔥 for BURN status)
      if (unit.statusEffects && unit.statusEffects.length > 0) {
        const hasBurn = unit.statusEffects.some(s => s.type === 'BURN');
        if (hasBurn) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Outfit, sans-serif';
          ctx.fillText('🔥', drawX + 22, barY - 2);
        }
      }
    }
  }

  private getArmyIcon(armyClassOrCategory?: string): string {
    switch (armyClassOrCategory) {
      case 'SHORT_SPEAR': return '🗡️';
      case 'LONG_SPEAR': return '🔱';
      case 'SWORD_SHIELD': return '🛡️';
      case 'GREATSWORD': return '⚔️';
      case 'LIGHT_CAVALRY': return '🏇';
      case 'HEAVY_CAVALRY': return '🐎';
      case 'HORSE_ARCHER': return '🏹';
      case 'SHORT_BOW': return '🎯';
      case 'LONGBOW': return '🏹';
      case 'CROSSBOW': return '⚡';
      case 'HEAVY_CROSSBOW': return '💥';
      case 'CATAPULT': return '💣';
      case 'CAVALRY': return '🐎';
      case 'ARCHER': return '🏹';
      default: return '🗡️';
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

  private getTerrainBaseColor(terrain: TerrainType): string {
    switch (terrain) {
      case 'ROAD': return '#C8B273';
      case 'GROUND': return '#7FAF42';
      case 'HIGH_GROUND': return '#A8C64F';
      case 'FOREST': return '#437322';
      case 'RUINS': return '#8D6E63';
      case 'MOUNTAIN': return '#B17A3E';
      case 'WATER': return '#1976D2';
      default: return '#7FAF42';
    }
  }

  public getHexRadius(): number {
    return this.hexRadius;
  }
}
