import { Canvas2DRenderer, MapTileRenderData, RenderableUnit, FloatingText } from './ui/canvas-renderer.js';
import { HexMath, HexCoord } from './core/hex-math.js';
import { TerrainType } from './core/terrain-matrix.js';
import { HexPathfinder, MapHexTile } from './core/hex-pathfinder.js';
import { PathPreviewOverlay } from './ui/path-preview-overlay.js';
import { HUDOverlay } from './ui/hud-overlay.js';
import { ArmyRegistry, ArmyClassId } from './gameplay/army-registry.js';
import { TurnManager } from './server/turn-manager.js';
import { CombatResolver } from './gameplay/combat-resolver.js';
import { SkillResolver, SkillType } from './gameplay/skill-resolver.js';
import { ProjectileType } from './ui/vfx-manager.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const renderer = new Canvas2DRenderer(canvas);
  const pathOverlay = new PathPreviewOverlay();
  const hud = new HUDOverlay();
  const turnManager = new TurnManager();

  const floatingTexts: FloatingText[] = [];

  // Fixed Hex Map Grid (-6 to +6 radius = 127 Hexes)
  const mapTiles: MapTileRenderData[] = [];
  const tileMap = new Map<string, MapHexTile>();

  for (let q = -6; q <= 6; q++) {
    for (let r = -6; r <= 6; r++) {
      if (Math.abs(q + r) <= 6) {
        let terrain: TerrainType = 'GROUND';

        if ((q === 0 && r === 0) || (q === -3 && r === 0) || (q === 3 && r === 0)) terrain = 'HIGH_GROUND';
        else if ((q === 2 && r === -4) || (q === 1 && r === -3) || (q === -2 && r === 3) || (q === -1 && r === 3) || (q === 4 && r === -2)) terrain = 'FOREST';
        else if (q === 0 || r === 0 || q + r === 0) terrain = 'ROAD';
        else if ((q === -4 && r === 2) || (q === 4 && r === -5) || (q === -3 && r === 5)) terrain = 'RUINS';
        else if ((q === 3 && r === 2) || (q === -3 && r === -2) || (q === 5 && r === -3) || (q === -5 && r === 3)) terrain = 'MOUNTAIN';

        const tileData: MapTileRenderData = { coord: { q, r }, terrain };
        mapTiles.push(tileData);
        tileMap.set(HexPathfinder.hexKey({ q, r }), { coord: { q, r }, terrain, blockedByUnit: false });
      }
    }
  }

  // Initial Player Deployment Zone (Player rows: r = 5, 6)
  const deployZoneHexes: HexCoord[] = [];
  for (let q = -6; q <= 6; q++) {
    for (let r = 5; r <= 6; r++) {
      if (Math.abs(q + r) <= 6) {
        deployZoneHexes.push({ q, r });
      }
    }
  }

  // Active Game Units
  let selectedDeckClass: ArmyClassId = 'SHORT_SPEAR';
  const units: RenderableUnit[] = [
    { id: 'u_enemy_1', name: 'Enemy Cav', armyClass: 'HEAVY_CAVALRY', category: 'CAVALRY', position: { q: 2, r: -6 }, hp: 150, maxHp: 150, ownerColor: '#EF4444', hasActedThisRound: false },
    { id: 'u_enemy_2', name: 'Enemy Archer', armyClass: 'LONGBOW', category: 'ARCHER', position: { q: 4, r: -6 }, hp: 70, maxHp: 70, ownerColor: '#EF4444', hasActedThisRound: false },
    { id: 'u_enemy_3', name: 'Enemy Spear', armyClass: 'SHORT_SPEAR', category: 'INFANTRY', position: { q: 0, r: -5 }, hp: 100, maxHp: 100, ownerColor: '#EF4444', hasActedThisRound: false }
  ];

  function updateInspectorPanel(armyClass: ArmyClassId) {
    const stats = ArmyRegistry.getStats(armyClass);
    const iconEl = document.getElementById('info-unit-icon');
    const nameEl = document.getElementById('info-unit-name');
    const catEl = document.getElementById('info-unit-category');
    const hpEl = document.getElementById('info-hp');
    const atkEl = document.getElementById('info-atk');
    const defEl = document.getElementById('info-def');
    const mpEl = document.getElementById('info-mp');
    const rangeEl = document.getElementById('info-range');
    const initEl = document.getElementById('info-init');
    const counterDescEl = document.getElementById('info-counter-desc');

    const iconsMap: Record<string, string> = {
      SHORT_SPEAR: '🗡️', LONG_SPEAR: '🔱', SWORD_SHIELD: '🛡️', GREATSWORD: '⚔️',
      LIGHT_CAVALRY: '🏇', HEAVY_CAVALRY: '🐎', HORSE_ARCHER: '🏹',
      SHORT_BOW: '🎯', LONGBOW: '🏹', CROSSBOW: '⚡', HEAVY_CROSSBOW: '💥', CATAPULT: '💣'
    };

    const counterMap: Record<string, string> = {
      SHORT_SPEAR: '🗡️ Gây 150% DMG kỵ nhẹ. Khắc chế kỵ binh xé rào.',
      LONG_SPEAR: '🔱 Thủ giáo (Brace) phản 200% DMG khi Kỵ binh xông vào.',
      SWORD_SHIELD: '🛡️ Phòng thủ cao, giảm 25% DMG nhận từ cung thủ.',
      GREATSWORD: '⚔️ Sát thương cận chiến cực đại, xé rách hàng rào giáp.',
      LIGHT_CAVALRY: '🏇 Tốc độ 4 MP, khắc chế Cung thủ và Khí tài công thành.',
      HEAVY_CAVALRY: '🐎 Đột kích (Charge) gây 180% DMG lên bộ binh không thủ giáo.',
      HORSE_ARCHER: '🏹 Vừa chạy vừa thả diều, tỉa máu kỵ binh và bộ binh chậm.',
      SHORT_BOW: '🎯 Tốc độ bắn nhanh 1 AP, dỉa máu từ xa.',
      LONGBOW: '🏹 Tầm bắn xa 4 ô, khắc chế bộ binh và kỵ binh từ khoảng cách an toàn.',
      CROSSBOW: '⚡ Bắn xuyên giáp 130% DMG chống lại Binh chủng phòng thủ cao.',
      HEAVY_CROSSBOW: '💥 Đạn đơn sát thương bùng nổ, hạ gục mục tiêu nhanh.',
      CATAPULT: '💣 Tầm xa 5 ô, sát thương diện rộng và hủy diệt công trình.'
    };

    if (iconEl) iconEl.innerText = iconsMap[armyClass] || '🗡️';
    if (nameEl) nameEl.innerText = stats.name;
    if (catEl) catEl.innerText = `${stats.category} (${stats.category})`;
    if (hpEl) hpEl.innerText = stats.hp.toString();
    if (atkEl) atkEl.innerText = stats.attack.toString();
    if (defEl) defEl.innerText = stats.defense.toString();
    if (mpEl) mpEl.innerText = stats.movementPoints.toString();
    if (rangeEl) rangeEl.innerText = stats.range.toString();
    if (initEl) initEl.innerText = stats.initiative.toString();
    if (counterDescEl) counterDescEl.innerText = counterMap[armyClass] || 'Binh chủng chuẩn.';
  }

  // Wire Deck Picker UI buttons
  const deckButtons = document.querySelectorAll('.deck-card-btn');
  deckButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      deckButtons.forEach(b => b.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      selectedDeckClass = target.dataset.class as ArmyClassId;
      updateInspectorPanel(selectedDeckClass);
    });
  });

  let selectedUnit: RenderableUnit | null = null;
  let hoveredHex: HexCoord | null = null;
  let currentRound = 1;

  function updateTileOccupancy() {
    for (const tile of tileMap.values()) {
      tile.blockedByUnit = false;
    }
    for (const u of units) {
      if (u.hp > 0) {
        const key = HexPathfinder.hexKey(u.position);
        const tile = tileMap.get(key);
        if (tile) tile.blockedByUnit = true;
      }
    }
  }

  updateTileOccupancy();

  function getTileForPathfinding(c: HexCoord): MapHexTile | undefined {
    const tile = tileMap.get(HexPathfinder.hexKey(c));
    if (!tile) return undefined;
    if (selectedUnit && c.q === selectedUnit.position.q && c.r === selectedUnit.position.r) {
      return { ...tile, blockedByUnit: false };
    }
    return tile;
  }

  function updateSkillButtonUI(unit: RenderableUnit | null) {
    const btnSkill = document.getElementById('btn-skill');
    if (!btnSkill) return;

    if (unit && unit.ownerColor === '#3B82F6') {
      const armyClass = (unit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
      const skillType = SkillResolver.getSkillForClass(armyClass);
      const skillDef = SkillResolver.getSkillDefinition(skillType);
      btnSkill.innerText = `${skillDef.name} (${skillDef.apCost} AP)`;
      btnSkill.style.display = 'flex';
    } else {
      btnSkill.innerText = '🔥 Kỹ Năng Đặc Biệt';
    }
  }

  function selectUnit(unit: RenderableUnit | null) {
    if (turnManager.getPhase() !== 'PLANNING') {
      selectedUnit = unit;
      pathOverlay.clearSelection();
      updateSkillButtonUI(null);
      return;
    }
    if (unit && (unit.ownerColor !== '#3B82F6' || unit.hasActedThisRound)) return;

    selectedUnit = unit;
    updateTileOccupancy();
    updateSkillButtonUI(unit);

    if (unit) {
      const armyClassId = (unit.armyClass || (unit.category === 'INFANTRY' ? 'SHORT_SPEAR' : unit.category === 'CAVALRY' ? 'HEAVY_CAVALRY' : 'LONGBOW')) as ArmyClassId;
      const stats = ArmyRegistry.getStats(armyClassId);
      updateInspectorPanel(armyClassId);

      pathOverlay.selectUnit(
        unit.position,
        unit.category,
        stats.movementPoints,
        getTileForPathfinding
      );
    } else {
      pathOverlay.clearSelection();
    }
  }

  function updateAPBudget() {
    let usedAP = 0;
    for (const u of units) {
      if (u.ownerColor === '#3B82F6' && u.assignedAction) {
        usedAP += u.assignedAction.cost;
      }
    }
    const remaining = Math.max(0, 10 - usedAP);
    hud.setAPRemaining(remaining);

    const apText = document.getElementById('ap-text');
    const apFill = document.getElementById('ap-fill');
    if (apText) apText.innerText = `${remaining} / 10 AP`;
    if (apFill) apFill.style.width = `${(remaining / 10) * 100}%`;
  }

  function startPlanningTimer() {
    turnManager.startTimer((remSec) => {
      hud.setTimer(remSec);
      const timerText = document.getElementById('timer-text');
      const timerRing = document.getElementById('timer-ring');
      if (timerText) timerText.innerText = remSec.toString();
      if (timerRing) {
        const pct = (remSec / 10) * 100;
        timerRing.style.background = `conic-gradient(#F59E0B ${pct}%, rgba(255,255,255,0.1) 0%)`;
      }
    }, () => {
      resolveRoundPhase();
    });
  }

  // Execute Turn Resolution Phase (Smooth Animations & Flying Projectile VFX)
  async function resolveRoundPhase() {
    if (turnManager.getPhase() === 'RESOLUTION') return;
    turnManager.setPhase('RESOLUTION');
    turnManager.stopTimer();
    selectUnit(null);

    const phaseTitle = document.getElementById('phase-title');
    if (phaseTitle) phaseTitle.innerText = 'Phase Xử Lý Hoạt Cảnh & VFX...';

    // AI Bot assigns actions for Enemy Units
    for (const u of units) {
      if (u.ownerColor === '#EF4444' && u.hp > 0 && !u.hasActedThisRound) {
        let closestTarget: RenderableUnit | null = null;
        let minDistance = Infinity;

        for (const p of units) {
          if (p.ownerColor === '#3B82F6' && p.hp > 0) {
            const d = HexMath.getDistance(u.position, p.position);
            if (d < minDistance) {
              minDistance = d;
              closestTarget = p;
            }
          }
        }

        if (closestTarget) {
          const stats = ArmyRegistry.getStats((u.armyClass || (u.category === 'INFANTRY' ? 'SHORT_SPEAR' : u.category === 'CAVALRY' ? 'HEAVY_CAVALRY' : 'LONGBOW')) as ArmyClassId);

          if (minDistance <= stats.range) {
            u.assignedAction = {
              type: 'ATTACK',
              targetHex: { ...closestTarget.position },
              targetUnitId: closestTarget.id,
              cost: stats.actionCost
            };
            u.hasActedThisRound = true;
          } else {
            const fullPathRes = HexPathfinder.findPath(u.position, closestTarget.position, 99, u.category, getTileForPathfinding);
            if (fullPathRes && fullPathRes.path.length > 1) {
              const maxSteps = Math.min(stats.movementPoints, fullPathRes.path.length - 1);
              const targetHex = fullPathRes.path[maxSteps];
              if (targetHex) {
                u.assignedAction = {
                  type: 'MOVE',
                  targetHex: { ...targetHex },
                  cost: stats.actionCost
                };
                u.hasActedThisRound = true;
              }
            }
          }
        }
      }
    }

    const playerUnits = units.filter(u => u.ownerColor === '#3B82F6' && u.hp > 0 && u.assignedAction);
    const botUnits = units.filter(u => u.ownerColor === '#EF4444' && u.hp > 0 && u.assignedAction);

    const claimedDestinations = new Set<string>();
    for (const u of units) {
      if (u.hp > 0 && (!u.assignedAction || !u.assignedAction.targetHex)) {
        claimedDestinations.add(HexPathfinder.hexKey(u.position));
      }
    }

    // Helper function to execute team turn (Movement then Combat & Skill VFX)
    const executeTeamTurn = async (teamUnits: RenderableUnit[]) => {
      // 1. Movement Phase
      for (const u of teamUnits) {
        if (u.hp <= 0) continue;
        const action = u.assignedAction;
        if (!action || !action.targetHex) continue;

        const startPos = { ...u.position };
        let endPos = { ...action.targetHex };

        const targetKey = HexPathfinder.hexKey(endPos);
        if (!claimedDestinations.has(targetKey)) {
          const stats = ArmyRegistry.getStats((u.armyClass || 'SHORT_SPEAR') as ArmyClassId);
          const pathResult = HexPathfinder.findPath(
            startPos,
            endPos,
            stats.movementPoints,
            u.category,
            getTileForPathfinding
          );

          if (pathResult && pathResult.path.length > 1) {
            const finalHex = pathResult.path[pathResult.path.length - 1];
            claimedDestinations.add(HexPathfinder.hexKey(finalHex));

            u.isMoving = true;
            for (let step = 1; step < pathResult.path.length; step++) {
              const fromHex = pathResult.path[step - 1];
              const toHex = pathResult.path[step];

              const currentTile = tileMap.get(HexPathfinder.hexKey(toHex));
              if (currentTile && currentTile.blockedByUnit) break;

              const pFrom = HexMath.hexToPixel(fromHex, renderer.getHexRadius());
              const pTo = HexMath.hexToPixel(toHex, renderer.getHexRadius());

              for (let f = 1; f <= 15; f++) {
                const t = f / 15;
                u.animPos = {
                  x: pFrom.x + (pTo.x - pFrom.x) * t,
                  y: pFrom.y + (pTo.y - pFrom.y) * t
                };
                await new Promise((r) => setTimeout(r, 16));
              }
              u.position = { ...toHex };
              updateTileOccupancy();
            }
            delete u.animPos;
            u.isMoving = false;
            await new Promise((r) => setTimeout(r, 150));
          }
        }
      }

      await new Promise((r) => setTimeout(r, 200));

      // 2. Combat & Active Skill Phase with Animated Flying VFX Projectiles
      for (const u of teamUnits) {
        if (u.hp <= 0) continue;
        const action = u.assignedAction;
        if (!action || (action.type !== 'ATTACK' && action.type !== 'SKILL')) continue;

        let targetUnit: RenderableUnit | undefined;
        if (action.targetUnitId) {
          targetUnit = units.find(t => t.id === action.targetUnitId && t.hp > 0);
        } else if (action.targetHex) {
          targetUnit = units.find(t => t.hp > 0 && t.position.q === action.targetHex!.q && t.position.r === action.targetHex!.r);
        }

        const attackerClass = (u.armyClass || 'SHORT_SPEAR') as ArmyClassId;

        // EXECUTE SKILL ACTION
        if (action.type === 'SKILL' && action.skillType) {
          const sType = action.skillType as SkillType;
          const startPx = HexMath.hexToPixel(u.position, renderer.getHexRadius());
          const targetPx = action.targetHex ? HexMath.hexToPixel(action.targetHex, renderer.getHexRadius()) : startPx;

          let projType: ProjectileType = 'FIRE_ARROW';
          if (attackerClass.includes('CROSSBOW')) projType = 'CROSSBOW_BOLT';
          else if (attackerClass === 'CATAPULT') projType = 'CATAPULT_BOULDER';
          else if (attackerClass.includes('SPEAR')) projType = 'SLASH_WAVE';
          else if (attackerClass === 'GREATSWORD') projType = 'WHIRLWIND_SWEEP';

          // Self Buff Aura Skills (Shield Wall / Spear Wall)
          if (sType === 'SHIELD_WALL_DEFENSE' || sType === 'SPEAR_WALL') {
            renderer.getVFXManager().spawnShieldAura(startPx.x, startPx.y);
            const pos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
            floatingTexts.push({ x: pos.x, y: pos.y - 30, text: sType === 'SHIELD_WALL_DEFENSE' ? '+80% DEF!' : 'SPEAR WALL!', color: '#38BDF8', alpha: 1.0 });
            await new Promise((r) => setTimeout(r, 400));
          } else {
            // Ranged / Area Skill Flying Projectile VFX
            let projFinished = false;
            renderer.getVFXManager().spawnProjectile(startPx.x, startPx.y, targetPx.x, targetPx.y, projType, () => {
              projFinished = true;
            });

            while (!projFinished) {
              await new Promise((r) => setTimeout(r, 16));
            }

            const skillRes = SkillResolver.executeSkill(attackerClass, sType, u.position, action.targetHex || u.position, targetUnit ? ArmyRegistry.getStats((targetUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId).defense : 20);

            if (targetUnit) {
              targetUnit.hp = Math.max(0, targetUnit.hp - skillRes.primaryDamage);
              const pos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());
              floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${skillRes.primaryDamage} ${skillRes.appliedStatus || 'SKILL!'}`, color: '#F59E0B', alpha: 1.0 });
            }

            renderer.triggerScreenShake(12, 350);
            await new Promise((r) => setTimeout(r, 300));
          }
        }
        // REGULAR ATTACK ACTION
        else if (action.type === 'ATTACK' && targetUnit && targetUnit.hp > 0) {
          const dist = HexMath.getDistance(u.position, targetUnit.position);
          const stats = ArmyRegistry.getStats(attackerClass);

          if (dist <= stats.range) {
            const attackerPos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
            const targetPos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());

            // Spawn Flying Projectile VFX originating from attacker to target
            let projType: ProjectileType = u.category === 'ARCHER' ? 'FIRE_ARROW' : 'SLASH_WAVE';
            if (attackerClass.includes('CROSSBOW')) projType = 'CROSSBOW_BOLT';
            else if (attackerClass === 'CATAPULT') projType = 'CATAPULT_BOULDER';

            let attackFinished = false;
            renderer.getVFXManager().spawnProjectile(attackerPos.x, attackerPos.y, targetPos.x, targetPos.y, projType, () => {
              attackFinished = true;
            });

            while (!attackFinished) {
              await new Promise((r) => setTimeout(r, 16));
            }

            const defenderClass = (targetUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
            const isBrace = targetUnit.assignedAction?.type === 'BRACE';
            const isCharge = u.category === 'CAVALRY';
            const dmgResult = CombatResolver.calculateDamage(attackerClass, defenderClass, isCharge, isBrace);

            if (dmgResult.isBraceCounterTriggered) {
              u.hp = Math.max(0, u.hp - dmgResult.finalDamage);
              const pos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
              floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${dmgResult.finalDamage} COUNTER!`, color: '#F59E0B', alpha: 1.0 });
              renderer.triggerScreenShake(10, 300);
            } else {
              targetUnit.hp = Math.max(0, targetUnit.hp - dmgResult.finalDamage);
              const pos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());
              floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${dmgResult.finalDamage}`, color: u.ownerColor === '#3B82F6' ? '#10B981' : '#EF4444', alpha: 1.0 });
              renderer.triggerScreenShake(8, 250);
            }
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }
    };

    // EXECUTE FULL PLAYER A TURN FIRST
    await executeTeamTurn(playerUnits);
    await new Promise((r) => setTimeout(r, 400));

    // EXECUTE FULL PLAYER B / BOT TURN SECOND
    await executeTeamTurn(botUnits);
    await new Promise((r) => setTimeout(r, 400));

    // CHECK VICTORY / DEFEAT CONDITIONS
    const playerAlive = units.some(u => u.ownerColor === '#3B82F6' && u.hp > 0);
    const enemyAlive = units.some(u => u.ownerColor === '#EF4444' && u.hp > 0);

    if (!enemyAlive || !playerAlive) {
      turnManager.stopTimer();
      const resultModal = document.getElementById('result-modal');
      const resultTitle = document.getElementById('result-title');
      const resultDesc = document.getElementById('result-desc');

      if (resultModal && resultTitle && resultDesc) {
        if (!enemyAlive && playerAlive) {
          resultTitle.innerText = 'VICTORY!';
          resultTitle.style.color = '#10B981';
          resultDesc.innerText = 'Bạn đã tiêu diệt toàn bộ lực lượng địch!';
        } else if (!playerAlive && enemyAlive) {
          resultTitle.innerText = 'DEFEAT!';
          resultTitle.style.color = '#EF4444';
          resultDesc.innerText = 'Lực lượng của bạn đã bị tiêu diệt hoàn toàn!';
        } else {
          resultTitle.innerText = 'DRAW!';
          resultTitle.style.color = '#F59E0B';
          resultDesc.innerText = 'Cả hai bên đều đã bị tiêu diệt!';
        }
        resultModal.style.display = 'flex';
      }
      return;
    }

    for (const u of units) {
      delete u.assignedAction;
      u.hasActedThisRound = false;
    }

    updateTileOccupancy();
    currentRound += 1;
    turnManager.setPhase('PLANNING');

    if (phaseTitle) phaseTitle.innerText = `Round ${currentRound} - Lập Kế Hoạch`;
    updateAPBudget();
    startPlanningTimer();
  }

  function getCanvasHex(evt: MouseEvent): HexCoord {
    const rect = canvas.getBoundingClientRect();
    const px = (evt.clientX - rect.left - rect.width / 2);
    const py = (evt.clientY - rect.top - (rect.height / 2 - 40));
    return HexMath.pixelToHex({ x: px, y: py }, renderer.getHexRadius());
  }

  canvas.addEventListener('mousemove', (evt) => {
    hoveredHex = getCanvasHex(evt);
  });

  canvas.addEventListener('click', (evt) => {
    const clickedHex = getCanvasHex(evt);

    // DEPLOYMENT PHASE
    if (turnManager.getPhase() === 'DEPLOYMENT') {
      const existingPlayerUnitIndex = units.findIndex(u => u.hp > 0 && u.ownerColor === '#3B82F6' && u.position.q === clickedHex.q && u.position.r === clickedHex.r);

      if (existingPlayerUnitIndex !== -1) {
        units.splice(existingPlayerUnitIndex, 1);
        updateTileOccupancy();
        return;
      }

      const inZone = deployZoneHexes.some(h => h.q === clickedHex.q && h.r === clickedHex.r);
      const occupied = units.some(u => u.hp > 0 && u.position.q === clickedHex.q && u.position.r === clickedHex.r);
      const playerUnitCount = units.filter(u => u.ownerColor === '#3B82F6').length;

      if (inZone && !occupied && playerUnitCount < 5) {
        const stats = ArmyRegistry.getStats(selectedDeckClass);
        units.push({
          id: `player_u_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: stats.name,
          armyClass: stats.id,
          category: stats.category,
          position: { ...clickedHex },
          hp: stats.hp,
          maxHp: stats.hp,
          ownerColor: '#3B82F6',
          hasActedThisRound: false
        });
        updateTileOccupancy();
      }
      return;
    }

    // PLANNING PHASE
    if (turnManager.getPhase() !== 'PLANNING') return;

    const clickedUnit = units.find(
      (u) => u.hp > 0 && u.position.q === clickedHex.q && u.position.r === clickedHex.r
    );

    // 1. Click on Unacted Player Unit -> Select it
    if (clickedUnit && clickedUnit.ownerColor === '#3B82F6') {
      if (!clickedUnit.hasActedThisRound) {
        selectUnit(clickedUnit);
      }
      return;
    }

    // 2. Click on Enemy Unit -> Assign Attack Action
    if (clickedUnit && clickedUnit.ownerColor === '#EF4444' && selectedUnit && !selectedUnit.hasActedThisRound) {
      const stats = ArmyRegistry.getStats((selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId);
      const attackPosRes = HexPathfinder.findAttackPosition(
        selectedUnit.position,
        clickedUnit.position,
        stats.range,
        stats.movementPoints,
        selectedUnit.category,
        getTileForPathfinding
      );

      if (attackPosRes && attackPosRes.path.length > 0) {
        const targetHex = attackPosRes.path[attackPosRes.path.length - 1];
        if (hud.getAPRemaining() >= stats.actionCost) {
          selectedUnit.assignedAction = { type: 'ATTACK', targetHex, targetUnitId: clickedUnit.id, cost: stats.actionCost };
          selectedUnit.hasActedThisRound = true;
          selectUnit(null);
          updateAPBudget();
        }
      }
      return;
    }

    // 3. Click on Empty Reachable Hex -> Assign Move Action
    if (selectedUnit && selectedUnit.ownerColor === '#3B82F6' && !selectedUnit.hasActedThisRound) {
      const tile = tileMap.get(HexPathfinder.hexKey(clickedHex));
      if (tile && tile.blockedByUnit) return;

      const pathRes = pathOverlay.getPathPreview(clickedHex, getTileForPathfinding);
      if (pathRes && pathRes.path.length > 1) {
        const stats = ArmyRegistry.getStats((selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId);
        const currentAP = hud.getAPRemaining();

        if (currentAP >= stats.actionCost) {
          selectedUnit.assignedAction = { type: 'MOVE', targetHex: { ...clickedHex }, cost: stats.actionCost };
          selectedUnit.hasActedThisRound = true;
          selectUnit(null);
          updateAPBudget();
        }
      }
    }
  });

  // UI Skill Button Event Listener
  document.getElementById('btn-skill')?.addEventListener('click', () => {
    if (selectedUnit && selectedUnit.ownerColor === '#3B82F6' && !selectedUnit.hasActedThisRound && turnManager.getPhase() === 'PLANNING') {
      const armyClass = (selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
      const skillType = SkillResolver.getSkillForClass(armyClass);
      const skillDef = SkillResolver.getSkillDefinition(skillType);

      if (hud.getAPRemaining() >= skillDef.apCost) {
        // Find closest enemy target if target required
        const enemyTarget = units.find(u => u.ownerColor === '#EF4444' && u.hp > 0);
        selectedUnit.assignedAction = {
          type: 'SKILL',
          skillType,
          targetHex: enemyTarget ? { ...enemyTarget.position } : { ...selectedUnit.position },
          targetUnitId: enemyTarget?.id,
          cost: skillDef.apCost
        };
        selectedUnit.hasActedThisRound = true;
        selectUnit(null);
        updateAPBudget();
      }
    }
  });

  // Procedural Map & Battle Reset Function
  function generateNewBattlefield() {
    mapTiles.length = 0;
    tileMap.clear();

    for (let q = -6; q <= 6; q++) {
      for (let r = -6; r <= 6; r++) {
        if (Math.abs(q + r) <= 6) {
          let terrain: TerrainType = 'GROUND';

          if (r > -5 && r < 5) {
            const rand = Math.random();
            if (rand < 0.15) terrain = 'FOREST';
            else if (rand < 0.23) terrain = 'HIGH_GROUND';
            else if (rand < 0.30) terrain = 'RUINS';
            else if (rand < 0.35) terrain = 'MOUNTAIN';
            else if (rand < 0.45 && (q === 0 || r === 0 || q + r === 0)) terrain = 'ROAD';
          }

          const tileData: MapTileRenderData = { coord: { q, r }, terrain };
          mapTiles.push(tileData);
          tileMap.set(HexPathfinder.hexKey({ q, r }), { coord: { q, r }, terrain, blockedByUnit: false });
        }
      }
    }

    units.length = 0;
    const enemyClassesPool: ArmyClassId[] = [
      'SHORT_SPEAR', 'LONG_SPEAR', 'SWORD_SHIELD', 'GREATSWORD',
      'LIGHT_CAVALRY', 'HEAVY_CAVALRY', 'HORSE_ARCHER',
      'SHORT_BOW', 'LONGBOW', 'CROSSBOW', 'HEAVY_CROSSBOW', 'CATAPULT'
    ];

    const numEnemies = Math.floor(Math.random() * 3) + 3;
    const enemyPositions: HexCoord[] = [
      { q: 2, r: -6 }, { q: 4, r: -6 }, { q: 0, r: -5 }, { q: -2, r: -4 }, { q: -4, r: -2 }
    ];

    for (let i = 0; i < numEnemies; i++) {
      const randClass = enemyClassesPool[Math.floor(Math.random() * enemyClassesPool.length)];
      const stats = ArmyRegistry.getStats(randClass);
      units.push({
        id: `u_enemy_${i}_${Date.now()}`,
        name: stats.name,
        armyClass: stats.id,
        category: stats.category,
        position: { ...enemyPositions[i] },
        hp: stats.hp,
        maxHp: stats.hp,
        ownerColor: '#EF4444',
        hasActedThisRound: false
      });
    }

    renderer.cacheTerrain(mapTiles);
    updateTileOccupancy();

    turnManager.setPhase('DEPLOYMENT');
    currentRound = 1;

    const resultModal = document.getElementById('result-modal');
    const deckDrawer = document.getElementById('deck-drawer');
    const planControls = document.getElementById('planning-controls');
    const phaseTitle = document.getElementById('phase-title');

    if (resultModal) resultModal.style.display = 'none';
    if (deckDrawer) deckDrawer.style.display = 'flex';
    if (planControls) planControls.style.display = 'none';
    if (phaseTitle) phaseTitle.innerText = 'Phase Chuẩn Bị Xếp Quân';

    selectUnit(null);
  }

  document.getElementById('btn-start-battle')?.addEventListener('click', () => {
    turnManager.setPhase('PLANNING');
    const deckDrawer = document.getElementById('deck-drawer');
    const planControls = document.getElementById('planning-controls');
    const phaseTitle = document.getElementById('phase-title');

    if (deckDrawer) deckDrawer.style.display = 'none';
    if (planControls) planControls.style.display = 'flex';
    if (phaseTitle) phaseTitle.innerText = 'Round 1 - Lập Kế Hoạch';

    selectUnit(null);
    startPlanningTimer();
  });

  document.getElementById('btn-next-battle')?.addEventListener('click', () => {
    generateNewBattlefield();
  });

  document.getElementById('btn-end-turn')?.addEventListener('click', () => {
    resolveRoundPhase();
  });

  document.getElementById('btn-brace')?.addEventListener('click', () => {
    if (selectedUnit && selectedUnit.ownerColor === '#3B82F6' && !selectedUnit.hasActedThisRound && turnManager.getPhase() === 'PLANNING') {
      if (hud.getAPRemaining() >= 2) {
        selectedUnit.assignedAction = { type: 'BRACE', cost: 2 };
        selectedUnit.hasActedThisRound = true;
        selectUnit(null);
        updateAPBudget();
      }
    }
  });

  // 60 FPS Render Loop
  function loop() {
    let pathPreviewCoords: HexCoord[] | undefined = undefined;
    if (hoveredHex && selectedUnit && !selectedUnit.hasActedThisRound && turnManager.getPhase() === 'PLANNING') {
      const pathRes = pathOverlay.getPathPreview(hoveredHex, getTileForPathfinding);
      if (pathRes) pathPreviewCoords = pathRes.path;
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 0.5;
      ft.alpha -= 0.015;
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    renderer.renderFrame(
      mapTiles,
      units,
      selectedUnit?.id,
      turnManager.getPhase() === 'PLANNING' ? pathOverlay.getReachableHexes() : undefined,
      pathPreviewCoords,
      floatingTexts,
      turnManager.getPhase() === 'DEPLOYMENT' ? deployZoneHexes : undefined
    );

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
