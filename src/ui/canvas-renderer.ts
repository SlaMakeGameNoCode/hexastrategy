import { HexMath, HexCoord } from '../core/hex-math.js';
import { TerrainType } from '../core/terrain-matrix.js';
import { VFXManager } from './vfx-manager.js';

export interface RenderableUnit {
  id: string;
  name: string;
  armyClass?: string;
  category: 'INFANTRY' | 'CAVALRY' | 'ARCHER';
  position: HexCoord;
  animPos?: { x: number; y: number }; // Smooth interpolated pixel position
  isMoving?: boolean;
  attackAnim?: {
    type: 'MELEE_SLASH' | 'SPEAR_THRUST' | 'ARROW_SHOOT';
    targetX: number;
    targetY: number;
    progress: number; // 0.0 to 1.0
  };
  hp: number;
  maxHp: number;
  ownerColor: string;
  hasActedThisRound?: boolean;
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
          this.offscreenCanvas = null; // Re-cache on size change
        }
      }
    }
  }

  public cacheTerrain(tiles: MapTileRenderData[]): void {
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
      const pos = HexMath.hexToPixel(tile.coord, this.hexRadius);
      this.drawHexagon(
        offCtx,
        centerX + pos.x,
        centerY + pos.y,
        this.hexRadius,
        this.getTerrainColor(tile.terrain),
        '#1E293B'
      );
    }
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
    deployZoneHexes?: HexCoord[]
  ): void {
    this.setupDPI();

    const width = this.logicalWidth;
    const height = this.logicalHeight;

    // Apply Screen Shake offset if active
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

    // Static Background Terrain Cache
    if (!this.offscreenCanvas) {
      this.cacheTerrain(tiles);
    }
    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, shakeX, shakeY, width, height);
    }

    // Highlight Deployment Zone (Pre-Battle Deployment Phase)
    if (deployZoneHexes && deployZoneHexes.length > 0) {
      for (const hex of deployZoneHexes) {
        const pos = HexMath.hexToPixel(hex, this.hexRadius);
        this.drawHexagon(this.ctx, centerX + pos.x, centerY + pos.y, this.hexRadius - 2, 'rgba(16, 185, 129, 0.25)', '#10B981');
      }
    }

    // Highlight Reachable Hexes
    if (highlightHexes) {
      for (const [key] of highlightHexes.entries()) {
        const [q, r] = key.split(',').map(Number);
        const pos = HexMath.hexToPixel({ q, r }, this.hexRadius);
        this.drawHexagon(this.ctx, centerX + pos.x, centerY + pos.y, this.hexRadius - 2, 'rgba(59, 130, 246, 0.35)', '#3B82F6');
      }
    }

    // Draw Path Preview Line
    if (pathPreview && pathPreview.length > 1) {
      this.ctx.beginPath();
      for (let i = 0; i < pathPreview.length; i++) {
        const pos = HexMath.hexToPixel(pathPreview[i], this.hexRadius);
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

      // Destination Marker
      const destPos = HexMath.hexToPixel(pathPreview[pathPreview.length - 1], this.hexRadius);
      this.drawHexagon(this.ctx, centerX + destPos.x, centerY + destPos.y, this.hexRadius - 2, 'rgba(245, 158, 11, 0.4)', '#F59E0B');
    }

    // Render Units
    for (const unit of units) {
      if (unit.hp <= 0) continue; // Hide dead units

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

    // Render Flying VFX Projectiles & Particle Effects Layer
    this.vfxManager.updateAndRender(this.ctx, centerX, centerY);

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
    let drawX = x;
    let drawY = y;

    // 1. Walk Cycle Animation (Bobbing / Hopping when moving)
    if (unit.isMoving) {
      const bob = Math.abs(Math.sin(Date.now() / 80)) * 6;
      drawY -= bob;
    }

    // 2. Attack Lunge Animation & Projectile Effects
    if (unit.attackAnim) {
      const p = unit.attackAnim.progress;
      const dx = unit.attackAnim.targetX - x;
      const dy = unit.attackAnim.targetY - y;

      if (unit.attackAnim.type === 'ARROW_SHOOT') {
        // Draw Flying Arrow Projectile from Unit to Target
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
        // Melee Thrust / Charge Lunge forward & back
        const lunge = Math.sin(p * Math.PI) * 16;
        const dist = Math.hypot(dx, dy) || 1;
        drawX += (dx / dist) * lunge;
        drawY += (dy / dist) * lunge;
      }
    }

    // Selection Ring Glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(drawX, drawY, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Detailed HD 2D Character Sprite & Weapon Rendering (High Visual Polish)
    const isActed = unit.hasActedThisRound;
    const isBlue = unit.ownerColor === '#3B82F6';
    const tunicColor = isActed ? '#64748B' : (isBlue ? '#2563EB' : '#DC2626');
    const skinColor = '#FDBA74';
    const armorColor = isActed ? '#475569' : '#CBD5E1';
    const weaponColor = '#E2E8F0';

    ctx.save();

    // 1. Base Ground Shadow
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 12, 14, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    const cls = unit.armyClass || unit.category;

    if (cls.includes('CAVALRY') || cls === 'HORSE_ARCHER') {
      // --- HD 2D MOUNTED CAVALRY SPRITE ---
      // Horse Body & Legs
      ctx.fillStyle = cls === 'HEAVY_CAVALRY' ? '#334155' : '#78350F';
      ctx.beginPath();
      ctx.ellipse(drawX, drawY + 4, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Horse Head & Neck
      ctx.beginPath();
      ctx.ellipse(drawX - 10, drawY - 4, 7, 10, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Rider Torso & Head
      ctx.beginPath();
      ctx.arc(drawX + 2, drawY - 6, 8, 0, Math.PI * 2);
      ctx.fillStyle = tunicColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(drawX + 2, drawY - 15, 5, 0, Math.PI * 2);
      ctx.fillStyle = skinColor;
      ctx.fill();

      // Helmet
      ctx.beginPath();
      ctx.arc(drawX + 2, drawY - 17, 5, Math.PI, Math.PI * 2);
      ctx.fillStyle = isBlue ? '#1E40AF' : '#991B1B';
      ctx.fill();

      // Mounted Bow for Horse Archer
      if (cls === 'HORSE_ARCHER') {
        const bx = drawX + 8;
        const by = drawY - 12;
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(bx, by, 9, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(bx + 9 * Math.cos(-Math.PI * 0.45), by + 9 * Math.sin(-Math.PI * 0.45));
        ctx.lineTo(bx + 9 * Math.cos(Math.PI * 0.45), by + 9 * Math.sin(Math.PI * 0.45));
        ctx.stroke();

        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by);
        ctx.lineTo(bx + 12, by);
        ctx.stroke();
      } else {
        ctx.moveTo(drawX - 6, drawY - 10);
        ctx.lineTo(drawX - 22, drawY - 16);
        ctx.stroke();
      }
    } else if (cls === 'CATAPULT') {
      // --- HD 2D SIEGE CATAPULT SPRITE ---
      ctx.fillStyle = '#92400E';
      ctx.fillRect(drawX - 16, drawY - 2, 32, 12);
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.arc(drawX - 10, drawY + 10, 5, 0, Math.PI * 2);
      ctx.arc(drawX + 10, drawY + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      // Arm
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(drawX - 8, drawY + 4);
      ctx.lineTo(drawX + 12, drawY - 16);
      ctx.stroke();
    } else {
      // --- HD 2D FOOT SOLDIER SPRITE ---
      // Legs / Lower body
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(drawX - 6, drawY + 4, 4, 10);
      ctx.fillRect(drawX + 2, drawY + 4, 4, 10);

      // Torso & Tunic Armor
      ctx.beginPath();
      ctx.arc(drawX, drawY - 2, 9, 0, Math.PI * 2);
      ctx.fillStyle = tunicColor;
      ctx.fill();

      // Head & Skin
      ctx.beginPath();
      ctx.arc(drawX, drawY - 14, 6, 0, Math.PI * 2);
      ctx.fillStyle = skinColor;
      ctx.fill();

      // Helmet / Crest
      ctx.beginPath();
      ctx.arc(drawX, drawY - 16, 6, Math.PI, Math.PI * 2);
      ctx.fillStyle = isBlue ? '#1E40AF' : '#991B1B';
      ctx.fill();

      // --- UNIQUE HD WEAPONS ---
      ctx.strokeStyle = weaponColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      if (cls === 'LONG_SPEAR') {
        // Ultra-Long Pike (Brown Wooden Shaft starting from ground up past head + Silver Spearhead)
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(drawX + 8, drawY + 12);
        ctx.lineTo(drawX + 8, drawY - 36);
        ctx.stroke();

        // Metallic Spearhead Tip
        ctx.fillStyle = '#E2E8F0';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(drawX + 8, drawY - 42);
        ctx.lineTo(drawX + 12, drawY - 35);
        ctx.lineTo(drawX + 4, drawY - 35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (cls === 'SHORT_SPEAR') {
        // Short Spear (Brown Wooden Shaft + Triangular Spearhead)
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(drawX + 8, drawY + 10);
        ctx.lineTo(drawX + 8, drawY - 22);
        ctx.stroke();

        // Distinct Triangular Spearhead Tip (Not a Sword)
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.moveTo(drawX + 8, drawY - 27);
        ctx.lineTo(drawX + 11, drawY - 21);
        ctx.lineTo(drawX + 5, drawY - 21);
        ctx.closePath();
        ctx.fill();
      } else if (cls === 'SWORD_SHIELD') {
        // Heavy Metal Round Shield
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.arc(drawX - 7, drawY - 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Short Sword Blade + Crossguard
        ctx.strokeStyle = weaponColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(drawX + 8, drawY + 6);
        ctx.lineTo(drawX + 8, drawY - 14);
        ctx.moveTo(drawX + 5, drawY - 4);
        ctx.lineTo(drawX + 11, drawY - 4);
        ctx.stroke();
      } else if (cls === 'GREATSWORD') {
        // Massive Two-Handed Greatsword
        ctx.strokeStyle = weaponColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(drawX + 7, drawY + 8);
        ctx.lineTo(drawX + 7, drawY - 26);
        ctx.moveTo(drawX + 3, drawY - 6);
        ctx.lineTo(drawX + 11, drawY - 6);
        ctx.stroke();
      } else if (cls.includes('CROSSBOW')) {
        // --- HD PIXEL-EXACT CROSSBOW SPRITE (Matching User Reference Image) ---
        const isHeavy = cls === 'HEAVY_CROSSBOW';
        const cx = drawX + 4;
        const cy = drawY - 6;

        // 1. Curved Wooden Stock & Pistol Grip (Matching Ref Image Brown Wood Stock)
        ctx.fillStyle = '#78350F';
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        // Main Stock Body & Stock Tail Curve Down
        ctx.moveTo(cx - 14, cy + 8);
        ctx.quadraticCurveTo(cx - 10, cy, cx - 2, cy - 2);
        ctx.lineTo(cx + 10, cy - 2);
        ctx.lineTo(cx + 12, cy + 3);
        ctx.lineTo(cx - 2, cy + 3);
        ctx.quadraticCurveTo(cx - 8, cy + 5, cx - 12, cy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Large Vertical Metal Bow Limbs (Front Curved Steel Prod - Light Blue Metal)
        ctx.strokeStyle = '#93C5FD';
        ctx.lineWidth = isHeavy ? 3.5 : 2.5;
        ctx.beginPath();
        const frontX = cx + 8;
        // Top Limb curving backward
        ctx.moveTo(frontX, cy);
        ctx.quadraticCurveTo(frontX + 6, cy - 10, frontX - 2, cy - 16);
        // Bottom Limb curving backward
        ctx.moveTo(frontX, cy);
        ctx.quadraticCurveTo(frontX + 6, cy + 10, frontX - 2, cy + 16);
        ctx.stroke();

        // Limb Reinforcement Caps
        ctx.fillStyle = '#1E3A8A';
        ctx.fillRect(frontX - 4, cy - 18, 4, 4);
        ctx.fillRect(frontX - 4, cy + 14, 4, 4);

        // 3. Taut Black/Dark Steel Bowstring (Pulled back to trigger)
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(frontX - 2, cy - 16);
        ctx.lineTo(cx - 2, cy);
        ctx.lineTo(frontX - 2, cy + 16);
        ctx.stroke();

        // 4. Short Heavy Steel Bolt Quarrel (With Steel Arrowhead)
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy);
        ctx.lineTo(frontX + 6, cy);
        ctx.stroke();

        // Triangular Steel Bolt Tip
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.moveTo(frontX + 10, cy);
        ctx.lineTo(frontX + 5, cy - 3);
        ctx.lineTo(frontX + 5, cy + 3);
        ctx.closePath();
        ctx.fill();
      } else if (cls.includes('BOW')) {
        // --- REALISTIC HD BOW & ARROW DRAWING ---
        const isLong = cls === 'LONGBOW';
        const bowRadius = isLong ? 13 : 9; // Longbow staff is larger
        const bx = drawX + 6;
        const by = drawY - 8;

        // 1. Curved Wooden Bow Staff (Brown Wood)
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = isLong ? 3.0 : 2.2;
        ctx.beginPath();
        ctx.arc(bx, by, bowRadius, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // 2. Taut Bowstring (Fine White Line)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(bx + bowRadius * Math.cos(-Math.PI * 0.45), by + bowRadius * Math.sin(-Math.PI * 0.45));
        ctx.lineTo(bx + bowRadius * Math.cos(Math.PI * 0.45), by + bowRadius * Math.sin(Math.PI * 0.45));
        ctx.stroke();

        // 3. Nocked Arrow (Wood Shaft + Arrowhead)
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(bx - 8, by);
        ctx.lineTo(bx + bowRadius + 4, by);
        ctx.stroke();

        // Metallic Arrowhead Tip
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.moveTo(bx + bowRadius + 8, by);
        ctx.lineTo(bx + bowRadius + 3, by - 3);
        ctx.lineTo(bx + bowRadius + 3, by + 3);
        ctx.fill();

        // Quiver Arrow Pouch on Back
        ctx.fillStyle = '#78350F';
        ctx.fillRect(drawX - 8, drawY - 14, 4, 12);
      } else {
        ctx.moveTo(drawX + 7, drawY + 8);
        ctx.lineTo(drawX + 7, drawY - 16);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 2. Floating Circular Unit Icon Badge above Squad (Civ VI Style Flag - Positioned drawY - 48)
    const flagY = drawY - 48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(drawX, flagY, 12, 0, Math.PI * 2);
    ctx.fillStyle = isActed ? '#475569' : (isBlue ? '#1E3A8A' : '#7F1D1D');
    ctx.fill();
    ctx.strokeStyle = isActed ? '#94A3B8' : (isBlue ? '#60A5FA' : '#F87171');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Icon Inside Floating Badge
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = this.getArmyIcon(unit.armyClass || unit.category);
    ctx.fillText(icon, drawX, flagY);
    ctx.restore();

    // 3. Health Bar Positioned Cleanly ABOVE Flag Badge (drawY - 68)
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

    // Action Badge / Done Badge
    if (unit.hasActedThisRound) {
      ctx.beginPath();
      ctx.arc(drawX + 15, flagY - 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#64748B';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px Outfit, sans-serif';
      ctx.fillText('✓', drawX + 15, flagY - 2);
    } else if (unit.assignedAction) {
      ctx.beginPath();
      ctx.arc(drawX + 15, flagY - 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 8px Outfit, sans-serif';
      ctx.fillText(unit.assignedAction.cost.toString(), drawX + 15, flagY - 2);
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
