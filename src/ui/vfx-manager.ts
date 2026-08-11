export type ProjectileType =
  | 'REGULAR_ARROW'
  | 'FIRE_ARROW'
  | 'CROSSBOW_BOLT'
  | 'CATAPULT_BOULDER'
  | 'SLASH_WAVE'
  | 'WHIRLWIND_SWEEP'
  | 'SHIELD_AURA'
  | 'DIAMOND_PHALANX';

export interface VFXProjectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number;
  speed: number;
  arcHeight: number;
  type: ProjectileType;
  color: string;
  delayFrames?: number;
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
  shape?: 'CIRCLE' | 'DIAMOND';
}

export interface GroundFlame {
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export class VFXManager {
  private projectiles: VFXProjectile[] = [];
  private particles: VFXParticle[] = [];
  private rings: RingEffect[] = [];
  private groundFlames: GroundFlame[] = [];

  public spawnProjectile(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    type: ProjectileType,
    onImpact?: () => void,
    delayFrames: number = 0
  ): void {
    let color = '#F59E0B';
    let speed = 0.045;
    let arcHeight = 35;

    if (type === 'REGULAR_ARROW') {
      color = '#CBD5E1';
      speed = 0.05;
      arcHeight = 25;
    } else if (type === 'FIRE_ARROW') {
      color = '#F97316';
      speed = 0.04;
      arcHeight = 35;
    } else if (type === 'CROSSBOW_BOLT') {
      color = '#E2E8F0';
      speed = 0.08;
      arcHeight = 8;
    } else if (type === 'CATAPULT_BOULDER') {
      color = '#78350F';
      speed = 0.025;
      arcHeight = 70;
    }

    this.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      progress: 0.0,
      speed,
      arcHeight,
      type,
      color,
      delayFrames,
      onImpact
    });
  }

  public spawnGroundFlame(x: number, y: number): void {
    this.groundFlames.push({
      x,
      y,
      life: 0,
      maxLife: 90
    });
  }

  public spawnDiamondPhalanxBarrier(x: number, y: number): void {
    this.rings.push({
      x,
      y,
      radius: 8,
      maxRadius: 28,
      color: '#F59E0B',
      alpha: 1.0,
      shape: 'DIAMOND'
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
      alpha: 0.9,
      shape: 'CIRCLE'
    });
  }

  public spawnShieldAura(x: number, y: number): void {
    this.rings.push({
      x,
      y,
      radius: 6,
      maxRadius: 30,
      color: '#38BDF8',
      alpha: 1.0,
      shape: 'CIRCLE'
    });
  }

  public spawnCavalryWindTrail(x: number, y: number, angle: number): void {
    for (let i = 0; i < 4; i++) {
      const spd = Math.random() * 4 + 2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: -Math.cos(angle) * spd,
        vy: -Math.sin(angle) * spd,
        size: Math.random() * 4 + 2,
        color: '#E0F2FE',
        alpha: 0.9,
        life: 0,
        maxLife: 15
      });
    }
  }

  public updateAndRender(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    // 1. Render Ground Flames
    for (let i = this.groundFlames.length - 1; i >= 0; i--) {
      const gf = this.groundFlames[i];
      gf.life += 1;

      if (gf.life >= gf.maxLife) {
        this.groundFlames.splice(i, 1);
        continue;
      }

      if (Math.random() < 0.7) {
        const fx = gf.x + (Math.random() - 0.5) * 22;
        const fy = gf.y + (Math.random() - 0.5) * 22;
        this.particles.push({
          x: fx,
          y: fy,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1.5 - 0.5,
          size: Math.random() * 4 + 2,
          color: Math.random() < 0.6 ? '#F97316' : '#EF4444',
          alpha: 0.9,
          life: 0,
          maxLife: 16
        });
      }
    }

    // 2. Render Expand Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += (r.maxRadius - r.radius) * 0.15;
      r.alpha -= 0.04;

      if (r.alpha <= 0 || r.radius >= r.maxRadius - 1) {
        this.rings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.lineWidth = 3.5;

      if (r.shape === 'DIAMOND') {
        const rad = r.radius;
        const px = centerX + r.x;
        const py = centerY + r.y;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.moveTo(px, py - rad);
        ctx.lineTo(px + rad, py);
        ctx.lineTo(px, py + rad);
        ctx.lineTo(px - rad, py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(centerX + r.x, centerY + r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Render Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      if (proj.delayFrames && proj.delayFrames > 0) {
        proj.delayFrames -= 1;
        continue;
      }

      proj.progress += proj.speed;

      const p = Math.min(1.0, proj.progress);
      const dx = proj.targetX - proj.startX;
      const dy = proj.targetY - proj.startY;

      proj.currentX = proj.startX + dx * p;
      proj.currentY = proj.startY + dy * p;

      const arc = Math.sin(p * Math.PI) * proj.arcHeight;
      const renderY = proj.currentY - arc;
      const renderX = proj.currentX;

      ctx.save();

      // Flame/Smoke Trail ONLY behind FIRE_ARROW
      if (proj.type === 'FIRE_ARROW' && Math.random() < 0.8) {
        this.particles.push({
          x: proj.currentX,
          y: renderY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.0,
          size: Math.random() * 3 + 2,
          color: '#F97316',
          alpha: 0.9,
          life: 0,
          maxLife: 12
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
      } else if (proj.type === 'REGULAR_ARROW') {
        // Standard Wooden Arrow (Steel Tip + White Fletching)
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(centerX + renderX - dx * 0.06, centerY + renderY - dy * 0.06 - 2);
        ctx.lineTo(centerX + renderX, centerY + renderY);
        ctx.stroke();

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(centerX + renderX, centerY + renderY, 2.0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Fire Arrow Streak
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(centerX + renderX - dx * 0.06, centerY + renderY - dy * 0.06 - 2);
        ctx.lineTo(centerX + renderX, centerY + renderY);
        ctx.stroke();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(centerX + renderX, centerY + renderY, 3.0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      if (p >= 1.0) {
        if (proj.onImpact) proj.onImpact();
        if (proj.type === 'FIRE_ARROW' || proj.type === 'CATAPULT_BOULDER') {
          this.spawnExplosion(proj.targetX, proj.targetY, proj.color, 18);
        } else {
          this.spawnExplosion(proj.targetX, proj.targetY, '#94A3B8', 6);
        }
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Render & Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life += 1;
      pt.alpha -= 0.03;

      if (pt.life >= pt.maxLife || pt.alpha <= 0) {
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
}
