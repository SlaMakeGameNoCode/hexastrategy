export type ProjectileType =
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
  progress: number; // 0.0 to 1.0
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

  public spawnVolleyFireArrows(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onImpact?: () => void
  ): void {
    const arrowCount = 5;
    for (let i = 0; i < arrowCount; i++) {
      const offsetX = (Math.random() - 0.5) * 24;
      const offsetY = (Math.random() - 0.5) * 24;
      const isLast = i === arrowCount - 1;

      this.projectiles.push({
        id: `fa_${Date.now()}_${i}`,
        startX: startX + (Math.random() - 0.5) * 12,
        startY: startY + (Math.random() - 0.5) * 12,
        targetX: targetX + offsetX,
        targetY: targetY + offsetY,
        currentX: startX,
        currentY: startY,
        progress: 0,
        speed: 0.038 + Math.random() * 0.01,
        arcHeight: 40 + Math.random() * 20,
        type: 'FIRE_ARROW',
        color: i % 2 === 0 ? '#EF4444' : '#F97316',
        delayFrames: i * 4,
        onImpact: isLast ? () => {
          this.spawnBurningGround(targetX, targetY);
          if (onImpact) onImpact();
        } : undefined
      });
    }
  }

  public spawnProjectile(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    type: ProjectileType,
    onImpact?: () => void
  ): void {
    if (type === 'FIRE_ARROW') {
      this.spawnVolleyFireArrows(startX, startY, targetX, targetY, onImpact);
      return;
    }

    let speed = 0.04;
    let arcHeight = 0;
    let color = '#F59E0B';

    if (type === 'CROSSBOW_BOLT') {
      speed = 0.09;
      arcHeight = 0;
      color = '#38BDF8';
    } else if (type === 'CATAPULT_BOULDER') {
      speed = 0.025;
      arcHeight = 85;
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

  public spawnBurningGround(x: number, y: number): void {
    this.groundFlames.push({
      x,
      y,
      life: 0,
      maxLife: 90 // Flames burn for ~1.5s
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
    // Wind Cleaving Streak particles
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
    // 1. Render & Update Ground Flames (Fire Arrow impact site)
    for (let i = this.groundFlames.length - 1; i >= 0; i--) {
      const gf = this.groundFlames[i];
      gf.life += 1;

      if (gf.life >= gf.maxLife) {
        this.groundFlames.splice(i, 1);
        continue;
      }

      // Spawn active flickering flame particles
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

      // Draw charred ember patch underneath
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX + gf.x, centerY + gf.y, 16, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fill();
      ctx.restore();
    }

    // 2. Render & Update Rings / Phalanx Barriers
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += (r.maxRadius - r.radius) * 0.15;
      r.alpha -= 0.03;

      if (r.alpha <= 0 || r.radius >= r.maxRadius - 1) {
        this.rings.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.lineWidth = 3.5;

      if (r.shape === 'DIAMOND') {
        // Draw Solid Diamond/Triangle Phalanx Shield Barrier
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

    // 3. Render & Update Projectiles
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

      // Flame/Smoke Trail behind Fire Arrows
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
      } else {
        // Fire Arrow Streak
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(centerX + renderX - dx * 0.06, centerY + renderY - dy * 0.06 - 2);
        ctx.lineTo(centerX + renderX, centerY + renderY);
        ctx.stroke();

        // Glowing Arrow Tip
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(centerX + renderX, centerY + renderY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      if (p >= 1.0) {
        if (proj.onImpact) proj.onImpact();
        this.spawnExplosion(proj.targetX, proj.targetY, proj.color, 16);
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Render & Update Particles
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
    this.groundFlames = [];
  }
}
