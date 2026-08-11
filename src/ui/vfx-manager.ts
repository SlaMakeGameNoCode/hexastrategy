export type ProjectileType =
  | 'FIRE_ARROW'
  | 'CROSSBOW_BOLT'
  | 'CATAPULT_BOULDER'
  | 'SLASH_WAVE'
  | 'WHIRLWIND_SWEEP'
  | 'SHIELD_AURA';

export interface VFXProjectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number; // 0.0 to 1.0
  speed: number; // Increment per frame
  arcHeight: number;
  type: ProjectileType;
  color: string;
  onImpact?: () => void;
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

export interface RingEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export class VFXManager {
  private projectiles: VFXProjectile[] = [];
  private particles: VFXParticle[] = [];
  private rings: RingEffect[] = [];

  public spawnProjectile(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    type: ProjectileType,
    onImpact?: () => void
  ): void {
    let speed = 0.04;
    let arcHeight = 0;
    let color = '#F59E0B';

    if (type === 'FIRE_ARROW') {
      speed = 0.035;
      arcHeight = 45;
      color = '#EF4444';
    } else if (type === 'CROSSBOW_BOLT') {
      speed = 0.08; // Ultra fast straight line
      arcHeight = 0;
      color = '#38BDF8';
    } else if (type === 'CATAPULT_BOULDER') {
      speed = 0.025; // Slow heavy arc
      arcHeight = 80;
      color = '#EA580C';
    } else if (type === 'SLASH_WAVE') {
      speed = 0.06;
      arcHeight = 10;
      color = '#E2E8F0';
    }

    this.projectiles.push({
      id: `p_${Date.now()}_${Math.random()}`,
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      progress: 0,
      speed,
      arcHeight,
      type,
      color,
      onImpact
    });
  }

  public spawnExplosion(x: number, y: number, color: string = '#EF4444', count: number = 24): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 18 + 12)
      });
    }

    this.rings.push({
      x,
      y,
      radius: 4,
      maxRadius: 36,
      color,
      alpha: 0.9
    });
  }

  public spawnShieldAura(x: number, y: number): void {
    this.rings.push({
      x,
      y,
      radius: 6,
      maxRadius: 30,
      color: '#38BDF8',
      alpha: 1.0
    });
  }

  public updateAndRender(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    // 1. Render & Update Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += (r.maxRadius - r.radius) * 0.15;
      r.alpha -= 0.03;

      if (r.alpha <= 0 || r.radius >= r.maxRadius - 1) {
        this.rings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX + r.x, centerY + r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render & Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.progress += proj.speed;

      const p = Math.min(1.0, proj.progress);
      const dx = proj.targetX - proj.startX;
      const dy = proj.targetY - proj.startY;

      // Linear Interpolation
      proj.currentX = proj.startX + dx * p;
      proj.currentY = proj.startY + dy * p;

      // Parabolic Arc Y-offset
      const arc = Math.sin(p * Math.PI) * proj.arcHeight;
      const renderY = proj.currentY - arc;
      const renderX = proj.currentX;

      ctx.save();

      // Smoke / Trail Effect behind projectile
      if (Math.random() < 0.6) {
        this.particles.push({
          x: proj.currentX,
          y: renderY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 3 + 2,
          color: proj.type === 'FIRE_ARROW' ? '#F97316' : '#64748B',
          alpha: 0.8,
          life: 0,
          maxLife: 10
        });
      }

      // Draw Projectile Graphic
      if (proj.type === 'CATAPULT_BOULDER') {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(centerX + renderX, centerY + renderY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (proj.type === 'CROSSBOW_BOLT') {
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(centerX + renderX - dx * 0.08, centerY + renderY - dy * 0.08);
        ctx.lineTo(centerX + renderX, centerY + renderY);
        ctx.stroke();
      } else {
        // Arrow
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX + renderX - dx * 0.06, centerY + renderY - dy * 0.06 - 2);
        ctx.lineTo(centerX + renderX, centerY + renderY);
        ctx.stroke();
      }

      ctx.restore();

      // Check Impact
      if (p >= 1.0) {
        if (proj.onImpact) proj.onImpact();
        this.spawnExplosion(proj.targetX, proj.targetY, proj.color, 16);
        this.projectiles.splice(i, 1);
      }
    }

    // 3. Render & Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life += 1;
      pt.alpha = 1.0 - (pt.life / pt.maxLife);

      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(centerX + pt.x, centerY + pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  public clearAll(): void {
    this.projectiles = [];
    this.particles = [];
    this.rings = [];
  }
}
