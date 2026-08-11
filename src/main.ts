import { Canvas2DRenderer, MapTileRenderData, RenderableUnit, FloatingText } from './ui/canvas-renderer.js';
import { HexMath, HexCoord } from './core/hex-math.js';
import { TerrainType, TerrainMatrix } from './core/terrain-matrix.js';
import { HexPathfinder, MapHexTile } from './core/hex-pathfinder.js';
import { PathPreviewOverlay } from './ui/path-preview-overlay.js';
import { HUDOverlay } from './ui/hud-overlay.js';
import { ArmyRegistry, ArmyClassId } from './gameplay/army-registry.js';
import { TurnManager } from './server/turn-manager.js';
import { CombatResolver } from './gameplay/combat-resolver.js';
import { SkillResolver, SkillType } from './gameplay/skill-resolver.js';
import { ProjectileType } from './ui/vfx-manager.js';
import { FogOfWar } from './core/fog-of-war.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const renderer = new Canvas2DRenderer(canvas);
  const pathOverlay = new PathPreviewOverlay();
  const hud = new HUDOverlay();
  const turnManager = new TurnManager();

  const floatingTexts: FloatingText[] = [];

  // Rectangular Hex Map Grid (15 Columns Wide x 13 Rows Tall)
  const mapTiles: MapTileRenderData[] = [];
  const tileMap = new Map<string, MapHexTile>();

  /**
   * Procedurally generates a randomized terrain map following strict Game Design Rules:
   * - Forest: Clusters of >= 3 adjacent tiles (Capped <= 40% area)
   * - Mountains: Capped <= 25% area, guaranteed open solvability path from Player to Enemy
   * - High Ground, Ruins, Water, & Winding Road Highways
   */
  function generateProceduralMap() {
    mapTiles.length = 0;
    tileMap.clear();

    const totalHexes = 15 * 13;
    const maxForest = Math.floor(totalHexes * 0.38);
    const maxMountain = Math.floor(totalHexes * 0.22);

    let forestCount = 0;
    let mountainCount = 0;

    // 1. Initialize Base Ground Grid
    for (let r = -6; r <= 6; r++) {
      for (let col = -7; col <= 7; col++) {
        const q = col - Math.floor(r / 2);
        const coord: HexCoord = { q, r };
        const tileData: MapTileRenderData = { coord, terrain: 'GROUND' };
        mapTiles.push(tileData);
        tileMap.set(HexPathfinder.hexKey(coord), { coord, terrain: 'GROUND', blockedByUnit: false });
      }
    }

    // 2. Randomized Biome Archetype Selection (0: Forest Heavy, 1: Mountain Pass, 2: Highland, 3: Ruins Citadel)
    const biomeType = Math.floor(Math.random() * 4);

    // 3. Generate Forest Clusters (Min 3 adjacent tiles per cluster)
    const numForestSeeds = biomeType === 0 ? 6 : Math.floor(Math.random() * 3) + 4;
    for (let s = 0; s < numForestSeeds; s++) {
      if (forestCount >= maxForest) break;
      const randCol = Math.floor(Math.random() * 10) - 5; // col from -5 to 4
      const randR = Math.floor(Math.random() * 8) - 4;   // r from -4 to 3
      const randQ = randCol - Math.floor(randR / 2);
      const seedHex: HexCoord = { q: randQ, r: randR };

      // Forest cluster (seed + adjacent neighbors = >= 3 tiles)
      const cluster = [seedHex, ...HexMath.getNeighbors(seedHex)];
      for (const hex of cluster) {
        if (forestCount >= maxForest) break;
        const key = HexPathfinder.hexKey(hex);
        const tile = tileMap.get(key);
        if (tile && tile.terrain === 'GROUND') {
          tile.terrain = 'FOREST';
          forestCount++;
        }
      }
    }

    // 4. Generate High Ground Plateaus
    const numHighSeeds = biomeType === 2 ? 5 : Math.floor(Math.random() * 3) + 2;
    for (let s = 0; s < numHighSeeds; s++) {
      const randCol = Math.floor(Math.random() * 8) - 4;
      const randR = Math.floor(Math.random() * 6) - 3;
      const randQ = randCol - Math.floor(randR / 2);
      const seedHex: HexCoord = { q: randQ, r: randR };
      const cluster = [seedHex, ...HexMath.getNeighbors(seedHex).slice(0, 3)];

      for (const hex of cluster) {
        const key = HexPathfinder.hexKey(hex);
        const tile = tileMap.get(key);
        if (tile && tile.terrain === 'GROUND') {
          tile.terrain = 'HIGH_GROUND';
        }
      }
    }

    // 5. Generate Ancient Ruins
    const numRuinsSeeds = biomeType === 3 ? 5 : Math.floor(Math.random() * 3) + 2;
    for (let s = 0; s < numRuinsSeeds; s++) {
      const randCol = Math.floor(Math.random() * 8) - 4;
      const randR = Math.floor(Math.random() * 6) - 3;
      const randQ = randCol - Math.floor(randR / 2);
      const seedHex: HexCoord = { q: randQ, r: randR };

      const key = HexPathfinder.hexKey(seedHex);
      const tile = tileMap.get(key);
      if (tile && tile.terrain === 'GROUND') {
        tile.terrain = 'RUINS';
      }
    }

    // 6. Generate Water Streams
    const numWaterSeeds = Math.floor(Math.random() * 2) + 1;
    for (let s = 0; s < numWaterSeeds; s++) {
      const randCol = Math.floor(Math.random() * 8) - 4;
      const randR = Math.floor(Math.random() * 6) - 3;
      const randQ = randCol - Math.floor(randR / 2);
      const seedHex: HexCoord = { q: randQ, r: randR };
      const cluster = [seedHex, ...HexMath.getNeighbors(seedHex).slice(0, 2)];

      for (const hex of cluster) {
        const key = HexPathfinder.hexKey(hex);
        const tile = tileMap.get(key);
        if (tile && tile.terrain === 'GROUND') {
          tile.terrain = 'WATER';
        }
      }
    }

    // 7. Generate Winding Road Highway
    const roadSinePhase = Math.random() * Math.PI * 2;
    for (let r = -6; r <= 6; r++) {
      const col = Math.round(Math.sin(r * 0.5 + roadSinePhase) * 3);
      const q = col - Math.floor(r / 2);
      const key = `${q},${r}`;
      const tile = tileMap.get(key);
      if (tile && tile.terrain !== 'HIGH_GROUND') {
        tile.terrain = 'ROAD';
      }
    }

    // 8. Generate Mountain Barriers (Capped <= 22%)
    for (let r = -6; r <= 6; r++) {
      if (mountainCount >= maxMountain) break;

      // Flank Mountain Boundaries
      const leftQ = -7 - Math.floor(r / 2);
      const rightQ = 7 - Math.floor(r / 2);

      const leftTile = tileMap.get(`${leftQ},${r}`);
      if (leftTile) { leftTile.terrain = 'MOUNTAIN'; mountainCount++; }

      const rightTile = tileMap.get(`${rightQ},${r}`);
      if (rightTile) { rightTile.terrain = 'MOUNTAIN'; mountainCount++; }

      if (biomeType === 1 && (r === -2 || r === 2)) {
        const midCol = Math.floor(Math.random() * 4) - 2;
        const midQ = midCol - Math.floor(r / 2);
        const midTile = tileMap.get(`${midQ},${r}`);
        if (midTile && midTile.terrain === 'GROUND') {
          midTile.terrain = 'MOUNTAIN';
          mountainCount++;
        }
      }
    }

    // 9. Solvability Verification (A* Path from Player team to Enemy team)
    const playerStart: HexCoord = { q: -1 - Math.floor(5 / 2), r: 5 };
    const enemyStart: HexCoord = { q: -1 - Math.floor(-5 / 2), r: -5 };

    let testPath = HexPathfinder.findPath(playerStart, enemyStart, 999, 'INFANTRY', (coord) => tileMap.get(HexPathfinder.hexKey(coord)));

    if (!testPath) {
      // Break mountain obstacles along central corridor to open a Mountain Pass path!
      for (let r = 5; r >= -5; r--) {
        const col = 0;
        const q = col - Math.floor(r / 2);
        const tile = tileMap.get(`${q},${r}`);
        if (tile && tile.terrain === 'MOUNTAIN') {
          tile.terrain = 'ROAD';
        }
      }
    }

    // Sync mapTiles array with tileMap state
    for (let i = 0; i < mapTiles.length; i++) {
      const key = HexPathfinder.hexKey(mapTiles[i].coord);
      const tile = tileMap.get(key);
      if (tile) mapTiles[i].terrain = tile.terrain;
    }
  }

  generateProceduralMap();

  // Create 8 Pre-deployed units for Player & Enemy
  function createDefaultUnits(): RenderableUnit[] {
    const playerRoster: { classId: ArmyClassId; pos: HexCoord }[] = [
      { classId: 'SHORT_SPEAR', pos: { q: -4 - Math.floor(5 / 2), r: 5 } },
      { classId: 'SWORD_SHIELD', pos: { q: -1 - Math.floor(5 / 2), r: 5 } },
      { classId: 'LONG_SPEAR', pos: { q: 1 - Math.floor(5 / 2), r: 5 } },
      { classId: 'SHORT_SPEAR', pos: { q: 4 - Math.floor(5 / 2), r: 5 } },
      { classId: 'CROSSBOW', pos: { q: -5 - Math.floor(6 / 2), r: 6 } },
      { classId: 'SHORT_BOW', pos: { q: -2 - Math.floor(6 / 2), r: 6 } },
      { classId: 'SHORT_BOW', pos: { q: 2 - Math.floor(6 / 2), r: 6 } },
      { classId: 'CROSSBOW', pos: { q: 5 - Math.floor(6 / 2), r: 6 } }
    ];

    const enemyMeleePool: ArmyClassId[] = ['SHORT_SPEAR', 'LONG_SPEAR', 'SWORD_SHIELD', 'GREATSWORD', 'LIGHT_CAVALRY', 'HEAVY_CAVALRY'];
    const enemyRangedPool: ArmyClassId[] = ['SHORT_BOW', 'LONGBOW', 'CROSSBOW', 'HEAVY_CROSSBOW', 'HORSE_ARCHER', 'CATAPULT'];

    const enemyRosterPositions: HexCoord[] = [
      { q: -4 - Math.floor(-5 / 2), r: -5 },
      { q: -1 - Math.floor(-5 / 2), r: -5 },
      { q: 1 - Math.floor(-5 / 2), r: -5 },
      { q: 4 - Math.floor(-5 / 2), r: -5 },
      { q: -5 - Math.floor(-6 / 2), r: -6 },
      { q: -2 - Math.floor(-6 / 2), r: -6 },
      { q: 2 - Math.floor(-6 / 2), r: -6 },
      { q: 5 - Math.floor(-6 / 2), r: -6 }
    ];

    const result: RenderableUnit[] = [];

    // Player Units
    playerRoster.forEach((item, idx) => {
      const stats = ArmyRegistry.getStats(item.classId);
      result.push({
        id: `u_player_${idx}_${Date.now()}`,
        name: stats.name,
        armyClass: stats.id,
        category: stats.category,
        position: { ...item.pos },
        hp: stats.hp,
        maxHp: stats.hp,
        ownerColor: '#3B82F6',
        hasActedThisRound: false
      });
    });

    // Enemy Units (Randomized 4 Melee, 4 Ranged)
    enemyRosterPositions.forEach((pos, idx) => {
      const isMelee = idx < 4;
      const pool = isMelee ? enemyMeleePool : enemyRangedPool;
      const randClass = pool[Math.floor(Math.random() * pool.length)];
      const stats = ArmyRegistry.getStats(randClass);

      result.push({
        id: `u_enemy_${idx}_${Date.now()}`,
        name: stats.name,
        armyClass: stats.id,
        category: stats.category,
        position: { ...pos },
        hp: stats.hp,
        maxHp: stats.hp,
        ownerColor: '#EF4444',
        hasActedThisRound: false
      });
    });

    return result;
  }

  const units: RenderableUnit[] = createDefaultUnits();
  let selectedUnit: RenderableUnit | null = null;
  let hoveredHex: HexCoord | null = null;
  let currentRound = 1;
  let isTargetingSkillMode = false;
  let firstTurnOwnerColor: string = '#3B82F6';

  function isUnitBracingOrSpearWall(unit: RenderableUnit): boolean {
    if (!unit.assignedAction) return false;
    if (unit.assignedAction.type === 'BRACE') return true;
    if (unit.assignedAction.type === 'SKILL' && unit.assignedAction.skillType === 'SPEAR_WALL') return true;
    return false;
  }

  function getTileTerrain(coord: HexCoord): TerrainType {
    const tile = tileMap.get(HexPathfinder.hexKey(coord));
    return tile ? tile.terrain : 'GROUND';
  }

  function calculateSquadTotalAP(ownerColor: string): number {
    let totalAP = 0;
    for (const u of units) {
      if (u.ownerColor === ownerColor && u.hp > 0 && u.armyClass) {
        const stats = ArmyRegistry.getStats(u.armyClass as ArmyClassId);
        totalAP += stats.actionCost;
      }
    }
    return totalAP;
  }

  function updateInspectorPanel(armyClass: ArmyClassId, unitPosition?: HexCoord) {
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

    const terrain = unitPosition ? getTileTerrain(unitPosition) : 'GROUND';
    const effectiveRange = TerrainMatrix.getEffectiveRange(stats.range, stats.category, terrain);

    const iconsMap: Record<string, string> = {
      SHORT_SPEAR: '🗡️', LONG_SPEAR: '🔱', SWORD_SHIELD: '🛡️', GREATSWORD: '⚔️',
      LIGHT_CAVALRY: '🏇', HEAVY_CAVALRY: '🐎', HORSE_ARCHER: '🏹',
      SHORT_BOW: '🎯', LONGBOW: '🏹', CROSSBOW: '⚡', HEAVY_CROSSBOW: '💥', CATAPULT: '💣'
    };

    if (iconEl) iconEl.innerText = iconsMap[armyClass] || '🗡️';
    if (nameEl) nameEl.innerText = stats.name;
    if (catEl) catEl.innerText = `${stats.category} (Cost: ${stats.actionCost} AP)`;
    if (hpEl) hpEl.innerText = stats.hp.toString();
    if (atkEl) atkEl.innerText = stats.attack.toString();
    if (defEl) defEl.innerText = stats.defense.toString();
    if (mpEl) mpEl.innerText = stats.movementPoints.toString();
    if (rangeEl) rangeEl.innerText = `${effectiveRange}${effectiveRange < stats.range ? ' (🌳 Rừng -1)' : ''}`;
    if (initEl) initEl.innerText = stats.initiative.toString();
    if (counterDescEl) counterDescEl.innerText = `Chi phí: ${stats.actionCost} AP / lượt. Tốc độ di chuyển: ${stats.movementPoints} MP.`;
  }

  function filterDeckButtonsForUnit(unit: RenderableUnit | null) {
    const deckButtons = document.querySelectorAll('.deck-card-btn');
    if (!unit || turnManager.getPhase() !== 'DEPLOYMENT') {
      deckButtons.forEach(btn => {
        const el = btn as HTMLElement;
        el.style.opacity = '1.0';
        el.style.pointerEvents = 'auto';
      });
      return;
    }

    const isUnitMelee = unit.category === 'INFANTRY' || (unit.category === 'CAVALRY' && unit.armyClass !== 'HORSE_ARCHER');

    deckButtons.forEach(btn => {
      const el = btn as HTMLElement;
      const classId = el.dataset.class as ArmyClassId;
      const cardStats = ArmyRegistry.getStats(classId);
      const isCardMelee = cardStats.category === 'INFANTRY' || (cardStats.category === 'CAVALRY' && classId !== 'HORSE_ARCHER');

      if (isUnitMelee === isCardMelee) {
        el.style.opacity = '1.0';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0.25';
        el.style.pointerEvents = 'none';
      }
    });
  }

  const deckButtons = document.querySelectorAll('.deck-card-btn');
  deckButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const targetClass = target.dataset.class as ArmyClassId;

      if (selectedUnit && turnManager.getPhase() === 'DEPLOYMENT') {
        const stats = ArmyRegistry.getStats(targetClass);

        const isUnitMelee = selectedUnit.category === 'INFANTRY' || (selectedUnit.category === 'CAVALRY' && selectedUnit.armyClass !== 'HORSE_ARCHER');
        const isCardMelee = stats.category === 'INFANTRY' || (stats.category === 'CAVALRY' && targetClass !== 'HORSE_ARCHER');

        if (isUnitMelee === isCardMelee) {
          deckButtons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');

          selectedUnit.armyClass = stats.id;
          selectedUnit.name = stats.name;
          selectedUnit.category = stats.category;
          selectedUnit.hp = stats.hp;
          selectedUnit.maxHp = stats.hp;

          updateInspectorPanel(targetClass, selectedUnit.position);
          const px = HexMath.hexToPixel(selectedUnit.position, renderer.getHexRadius());
          floatingTexts.push({ x: px.x, y: px.y - 30, text: `🔄 ĐỔI SANG ${stats.name}!`, color: '#3B82F6', alpha: 1.0 });
        }
      }
    });
  });

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

  function updateActionButtonsUI(unit: RenderableUnit | null) {
    const btnSkill = document.getElementById('btn-skill');
    const planControls = document.getElementById('planning-controls');

    if (unit && unit.ownerColor === '#3B82F6') {
      const armyClass = (unit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
      const skillType = SkillResolver.getSkillForClass(armyClass);
      const skillDef = SkillResolver.getSkillDefinition(skillType);

      if (planControls) planControls.style.display = 'flex';

      if (btnSkill) {
        if (unit.hasActedThisRound && unit.assignedAction) {
          const actName = unit.assignedAction.type === 'SKILL' ? skillDef.name : unit.assignedAction.type;
          btnSkill.innerText = `✖️ Hủy Lệnh ${actName} (Hoàn +${unit.assignedAction.cost} AP)`;
          btnSkill.style.display = 'flex';
          btnSkill.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.5) 0%, rgba(185, 28, 28, 0.7) 100%)';
        } else {
          btnSkill.innerText = `${isTargetingSkillMode ? '🎯 Click Trong Vùng Bắn (Hủy ✖️)' : skillDef.name + ' (' + skillDef.apCost + ' AP)'}`;
          btnSkill.style.display = 'flex';
          btnSkill.style.background = isTargetingSkillMode
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)';
        }
      }
    } else {
      if (planControls) planControls.style.display = 'none';
    }
  }

  function selectUnit(unit: RenderableUnit | null) {
    isTargetingSkillMode = false;
    selectedUnit = unit;
    filterDeckButtonsForUnit(unit);

    if (turnManager.getPhase() !== 'PLANNING') {
      pathOverlay.clearSelection();
      updateActionButtonsUI(null);
      return;
    }
    if (unit && unit.ownerColor !== '#3B82F6') return;

    updateTileOccupancy();
    updateActionButtonsUI(unit);

    if (unit) {
      const armyClassId = (unit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
      const stats = ArmyRegistry.getStats(armyClassId);
      updateInspectorPanel(armyClassId, unit.position);

      if (!unit.hasActedThisRound) {
        pathOverlay.selectUnit(
          unit.position,
          unit.category,
          stats.movementPoints,
          getTileForPathfinding
        );
      } else {
        pathOverlay.clearSelection();
      }
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

  // Execute Turn Resolution Phase
  async function resolveRoundPhase() {
    if (turnManager.getPhase() === 'RESOLUTION') return;
    turnManager.setPhase('RESOLUTION');
    turnManager.stopTimer();
    selectUnit(null);

    const globalTurnContainer = document.getElementById('global-turn-container');
    if (globalTurnContainer) globalTurnContainer.style.display = 'none';

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
          const stats = ArmyRegistry.getStats((u.armyClass || 'SHORT_SPEAR') as ArmyClassId);
          const effectiveRange = TerrainMatrix.getEffectiveRange(stats.range, u.category, getTileTerrain(u.position));

          if (minDistance <= effectiveRange) {
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

    // TICK BURN STATUS DAMAGE AT THE START OF RESOLUTION PHASE
    let hasBurnTicked = false;
    for (const u of units) {
      if (u.hp > 0 && u.statusEffects && u.statusEffects.length > 0) {
        for (let i = u.statusEffects.length - 1; i >= 0; i--) {
          const st = u.statusEffects[i];
          if (st.type === 'BURN') {
            const burnDmg = st.damagePerRound || 15;
            u.hp = Math.max(0, u.hp - burnDmg);
            const pos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
            floatingTexts.push({ x: pos.x, y: pos.y - 35, text: `🔥 -${burnDmg} THIÊU ĐỐT!`, color: '#F97316', alpha: 1.0 });
            renderer.getVFXManager().spawnExplosion(pos.x, pos.y, '#F97316', 12);
            hasBurnTicked = true;

            st.duration -= 1;
            if (st.duration <= 0) {
              u.statusEffects.splice(i, 1);
            }
          }
        }
      }
    }
    if (hasBurnTicked) {
      await new Promise((r) => setTimeout(r, 450));
    }

    const playerUnits = units.filter(u => u.ownerColor === '#3B82F6' && u.hp > 0 && u.assignedAction);
    const botUnits = units.filter(u => u.ownerColor === '#EF4444' && u.hp > 0 && u.assignedAction);

    const claimedDestinations = new Set<string>();
    for (const u of units) {
      if (u.hp > 0 && (!u.assignedAction || !u.assignedAction.targetHex)) {
        claimedDestinations.add(HexPathfinder.hexKey(u.position));
      }
    }

    const executeTeamTurn = async (teamUnits: RenderableUnit[]) => {
      // 1. Movement Phase
      for (const u of teamUnits) {
        if (u.hp <= 0) continue;
        const action = u.assignedAction;
        if (!action || !action.targetHex) continue;

        if (action.type !== 'MOVE' && action.type !== 'ATTACK' && action.type !== 'SKILL') continue;
        if (HexMath.getDistance(u.position, action.targetHex) === 0) continue;

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

            const newTerrain = getTileTerrain(u.position);
            if (newTerrain !== 'FOREST' && u.isStealthed) {
              u.isStealthed = false;
            }

            await new Promise((r) => setTimeout(r, 150));
          }
        }
      }

      await new Promise((r) => setTimeout(r, 200));

      // 2. Combat & Skill Execution Phase
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
        const attackerTerrain = getTileTerrain(u.position);
        const defenderTerrain = targetUnit ? getTileTerrain(targetUnit.position) : (action.targetHex ? getTileTerrain(action.targetHex) : 'GROUND');

        const isAmbush = !!u.isStealthed;
        if (u.isStealthed) {
          u.isStealthed = false;
        }

        if (action.type === 'SKILL' && action.skillType) {
          const sType = action.skillType as SkillType;
          const startPx = HexMath.hexToPixel(u.position, renderer.getHexRadius());
          const targetPx = action.targetHex ? HexMath.hexToPixel(action.targetHex, renderer.getHexRadius()) : startPx;

          if (sType === 'CAVALRY_CHARGE' && action.targetHex) {
            const attackPosRes = HexPathfinder.findAttackPosition(
              u.position,
              action.targetHex,
              1,
              4,
              u.category,
              getTileForPathfinding
            );

            const stopHex = (attackPosRes && attackPosRes.path.length > 0)
              ? attackPosRes.path[attackPosRes.path.length - 1]
              : u.position;

            u.isMoving = true;
            const pFrom = HexMath.hexToPixel(u.position, renderer.getHexRadius());
            const pTo = HexMath.hexToPixel(stopHex, renderer.getHexRadius());
            const dx = pTo.x - pFrom.x;
            const dy = pTo.y - pFrom.y;
            const angle = Math.atan2(dy, dx);

            for (let f = 1; f <= 16; f++) {
              const t = f / 16;
              u.animPos = {
                x: pFrom.x + dx * t,
                y: pFrom.y + dy * t
              };
              renderer.getVFXManager().spawnCavalryWindTrail(u.animPos.x, u.animPos.y, angle);
              await new Promise((r) => setTimeout(r, 14));
            }

            u.position = { ...stopHex };
            delete u.animPos;
            u.isMoving = false;
            updateTileOccupancy();

            const isTargetBracing = targetUnit ? isUnitBracingOrSpearWall(targetUnit) : false;

            if (targetUnit && isTargetBracing) {
              const defenderClass = (targetUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
              const dmgResult = CombatResolver.calculateDamage(attackerClass, defenderClass, true, true, attackerTerrain, defenderTerrain, sType);

              u.hp = Math.max(0, u.hp - dmgResult.finalDamage);
              const cavPos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
              floatingTexts.push({ x: cavPos.x, y: cavPos.y - 30, text: `-${dmgResult.finalDamage} SPEAR WALL COUNTER!`, color: '#F59E0B', alpha: 1.0 });

              const spearPos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());
              renderer.getVFXManager().spawnDiamondPhalanxBarrier(spearPos.x, spearPos.y);
              renderer.getVFXManager().spawnExplosion(cavPos.x, cavPos.y, '#F59E0B', 30);
              renderer.triggerScreenShake(14, 400);
            } else if (targetUnit && targetUnit.id !== u.id) {
              const defenderClass = (targetUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
              const skillRes = SkillResolver.executeSkill(
                attackerClass,
                sType,
                u.position,
                action.targetHex,
                defenderClass,
                attackerTerrain,
                defenderTerrain,
                isAmbush
              );
              targetUnit.hp = Math.max(0, targetUnit.hp - skillRes.primaryDamage);
              const pos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());
              floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${skillRes.primaryDamage} CHARGE!`, color: '#EF4444', alpha: 1.0 });
              renderer.triggerScreenShake(14, 400);
              renderer.getVFXManager().spawnExplosion(pos.x, pos.y, '#EF4444', 30);
            }
            await new Promise((r) => setTimeout(r, 300));
          }
          else if (sType === 'SPEAR_WALL' || sType === 'SHIELD_WALL_DEFENSE') {
            const pos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
            renderer.getVFXManager().spawnDiamondPhalanxBarrier(pos.x, pos.y);
            floatingTexts.push({ x: pos.x, y: pos.y - 30, text: sType === 'SPEAR_WALL' ? 'SPEAR PHALANX!' : '+80% DEF!', color: '#F59E0B', alpha: 1.0 });
            await new Promise((r) => setTimeout(r, 400));
          }
          else {
            let projType: ProjectileType = sType === 'FIRE_ARROW' ? 'FIRE_ARROW' : (attackerClass.includes('CROSSBOW') ? 'CROSSBOW_BOLT' : 'CATAPULT_BOULDER');
            let projFinished = false;

            renderer.getVFXManager().spawnProjectile(startPx.x, startPx.y, targetPx.x, targetPx.y, projType, () => {
              projFinished = true;
            });

            while (!projFinished) {
              await new Promise((r) => setTimeout(r, 16));
            }

            const defenderClass = targetUnit ? (targetUnit.armyClass as ArmyClassId) : undefined;
            const skillRes = SkillResolver.executeSkill(
              attackerClass,
              sType,
              u.position,
              action.targetHex || u.position,
              defenderClass,
              attackerTerrain,
              defenderTerrain,
              isAmbush
            );

            if (targetUnit && targetUnit.id !== u.id) {
              const bonusDmg = skillRes.primaryDamage;

              targetUnit.hp = Math.max(0, targetUnit.hp - bonusDmg);
              const pos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());
              const labelText = sType === 'FIRE_ARROW' && defenderTerrain === 'FOREST' ? `-${bonusDmg} 🔥 CHÁY RỪNG!` : `-${bonusDmg} ${skillRes.appliedStatus || 'SKILL!'}`;
              floatingTexts.push({ x: pos.x, y: pos.y - 30, text: labelText, color: '#F97316', alpha: 1.0 });

              if (sType === 'FIRE_ARROW') {
                if (!targetUnit.statusEffects) targetUnit.statusEffects = [];
                targetUnit.statusEffects.push({ type: 'BURN', duration: 2, damagePerRound: 15 });
                renderer.getVFXManager().spawnGroundFlame(pos.x, pos.y);
              }
            }

            renderer.triggerScreenShake(10, 300);
            await new Promise((r) => setTimeout(r, 300));
          }
        }
        else if (action.type === 'ATTACK' && targetUnit && targetUnit.hp > 0 && targetUnit.id !== u.id) {
          const stats = ArmyRegistry.getStats(attackerClass);
          const effectiveRange = TerrainMatrix.getEffectiveRange(stats.range, stats.category, attackerTerrain);
          const dist = HexMath.getDistance(u.position, targetUnit.position);

          if (dist <= effectiveRange) {
            const attackerPos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
            const targetPos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());

            let projType: ProjectileType = u.category === 'ARCHER' ? 'REGULAR_ARROW' : 'SLASH_WAVE';
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
            const isBrace = isUnitBracingOrSpearWall(targetUnit);
            const isCharge = u.category === 'CAVALRY';
            const dmgResult = CombatResolver.calculateDamage(attackerClass, defenderClass, isCharge, isBrace, attackerTerrain, defenderTerrain, undefined, isAmbush);

            if (dmgResult.isBraceCounterTriggered) {
              u.hp = Math.max(0, u.hp - dmgResult.finalDamage);
              const pos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
              floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${dmgResult.finalDamage} SPEAR WALL COUNTER!`, color: '#F59E0B', alpha: 1.0 });
              const spearPos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());
              renderer.getVFXManager().spawnDiamondPhalanxBarrier(spearPos.x, spearPos.y);
              renderer.triggerScreenShake(12, 350);
            } else {
              targetUnit.hp = Math.max(0, targetUnit.hp - dmgResult.finalDamage);
              const pos = HexMath.hexToPixel(targetUnit.position, renderer.getHexRadius());
              const ambushText = isAmbush ? ` 🥷 AMBUSH!` : '';
              floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${dmgResult.finalDamage}${ambushText}`, color: u.ownerColor === '#3B82F6' ? '#10B981' : '#EF4444', alpha: 1.0 });
              renderer.triggerScreenShake(8, 250);
            }
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      }
    };

    if (firstTurnOwnerColor === '#3B82F6') {
      await executeTeamTurn(playerUnits);
      await new Promise((r) => setTimeout(r, 400));
      await executeTeamTurn(botUnits);
      await new Promise((r) => setTimeout(r, 400));
    } else {
      await executeTeamTurn(botUnits);
      await new Promise((r) => setTimeout(r, 400));
      await executeTeamTurn(playerUnits);
      await new Promise((r) => setTimeout(r, 400));
    }

    // FOREST STEALTH ENTRY CHECK
    for (const u of units) {
      if (u.hp > 0) {
        const terr = getTileTerrain(u.position);
        if (terr === 'FOREST' && !u.hasActedThisRound) {
          if (!u.isStealthed) {
            u.isStealthed = true;
            const pos = HexMath.hexToPixel(u.position, renderer.getHexRadius());
            floatingTexts.push({ x: pos.x, y: pos.y - 30, text: '🥷 TÀNG HÌNH NÚP RỪNG!', color: '#10B981', alpha: 1.0 });
          }
        }
      }
    }

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
    if (globalTurnContainer) globalTurnContainer.style.display = 'block';

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

  // RIGHT-CLICK CANCELS SELECTION & SKILL TARGETING MODE IMMEDIATELY
  canvas.addEventListener('contextmenu', (evt) => {
    evt.preventDefault();
    isTargetingSkillMode = false;
    selectUnit(null);
  });

  // LEFT-CLICK EVENT HANDLER
  canvas.addEventListener('click', (evt) => {
    const clickedHex = getCanvasHex(evt);

    if (turnManager.getPhase() === 'DEPLOYMENT') {
      const clickedPlayerUnit = units.find(u => u.hp > 0 && u.ownerColor === '#3B82F6' && u.position.q === clickedHex.q && u.position.r === clickedHex.r);
      if (clickedPlayerUnit) {
        selectUnit(clickedPlayerUnit);
      }
      return;
    }

    if (turnManager.getPhase() !== 'PLANNING') return;

    const visibleHexes = FogOfWar.calculateVisibleHexes(units, '#3B82F6');

    const clickedUnit = units.find(
      (u) => u.hp > 0 && u.position.q === clickedHex.q && u.position.r === clickedHex.r &&
        FogOfWar.isEnemyUnitVisible(u, visibleHexes, '#3B82F6')
    );

    if (clickedUnit && clickedUnit.ownerColor === '#3B82F6') {
      isTargetingSkillMode = false;
      selectUnit(clickedUnit);
      return;
    }

    if (isTargetingSkillMode && selectedUnit && !selectedUnit.hasActedThisRound) {
      const armyClass = (selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
      const stats = ArmyRegistry.getStats(armyClass);
      const skillType = SkillResolver.getSkillForClass(armyClass);
      const skillDef = SkillResolver.getSkillDefinition(skillType);

      const attackerTerrain = getTileTerrain(selectedUnit.position);
      const effectiveRange = TerrainMatrix.getEffectiveRange(stats.range, selectedUnit.category, attackerTerrain);
      const distToTarget = HexMath.getDistance(selectedUnit.position, clickedHex);

      if (distToTarget > effectiveRange) {
        const px = HexMath.hexToPixel(clickedHex, renderer.getHexRadius());
        floatingTexts.push({ x: px.x, y: px.y - 30, text: `🎯 NGOÀI TẦM BẮN SKILL (${effectiveRange} Ô)!`, color: '#EF4444', alpha: 1.0 });
        return;
      }

      if (hud.getAPRemaining() >= skillDef.apCost) {
        selectedUnit.assignedAction = {
          type: 'SKILL',
          skillType,
          targetHex: { ...clickedHex },
          targetUnitId: clickedUnit?.id,
          cost: skillDef.apCost
        };
        selectedUnit.hasActedThisRound = true;
        selectUnit(null);
        updateAPBudget();
      }
      isTargetingSkillMode = false;
      return;
    }

    if (clickedUnit && clickedUnit.ownerColor === '#EF4444' && selectedUnit && !selectedUnit.hasActedThisRound) {
      const stats = ArmyRegistry.getStats((selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId);
      const attackerTerrain = getTileTerrain(selectedUnit.position);
      const effectiveRange = TerrainMatrix.getEffectiveRange(stats.range, selectedUnit.category, attackerTerrain);

      const attackPosRes = HexPathfinder.findAttackPosition(
        selectedUnit.position,
        clickedUnit.position,
        effectiveRange,
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

  document.getElementById('btn-skill')?.addEventListener('click', () => {
    if (selectedUnit && selectedUnit.ownerColor === '#3B82F6' && turnManager.getPhase() === 'PLANNING') {
      if (selectedUnit.hasActedThisRound) {
        delete selectedUnit.assignedAction;
        selectedUnit.hasActedThisRound = false;
        selectUnit(selectedUnit);
        updateAPBudget();
        return;
      }

      const armyClass = (selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId;
      const skillType = SkillResolver.getSkillForClass(armyClass);
      const skillDef = SkillResolver.getSkillDefinition(skillType);

      if (hud.getAPRemaining() >= skillDef.apCost) {
        if (skillType === 'SPEAR_WALL' || skillType === 'SHIELD_WALL_DEFENSE') {
          selectedUnit.assignedAction = {
            type: 'SKILL',
            skillType,
            targetHex: { ...selectedUnit.position },
            cost: skillDef.apCost
          };
          selectedUnit.hasActedThisRound = true;
          selectUnit(selectedUnit);
          updateAPBudget();
        } else {
          isTargetingSkillMode = !isTargetingSkillMode;
          updateActionButtonsUI(selectedUnit);
        }
      }
    }
  });

  // Random Map Generator Button Listener
  document.getElementById('btn-random-map')?.addEventListener('click', () => {
    if (turnManager.getPhase() === 'DEPLOYMENT') {
      generateProceduralMap();
      renderer.cacheTerrain(mapTiles);
      floatingTexts.push({ x: 0, y: -40, text: '🎲 ĐÃ SINH BẢN ĐỒ MỚI!', color: '#10B981', alpha: 1.0 });
    }
  });

  // Start Battle Button Listener -> Triggers Matchup Showcase Modal (3s Countdown + AP Priority)
  document.getElementById('btn-start-battle')?.addEventListener('click', () => {
    const matchupModal = document.getElementById('matchup-modal');
    const playerApEl = document.getElementById('matchup-player-ap');
    const enemyApEl = document.getElementById('matchup-enemy-ap');
    const playerListEl = document.getElementById('matchup-player-list');
    const enemyListEl = document.getElementById('matchup-enemy-list');
    const bannerEl = document.getElementById('matchup-initiative-banner');
    const countdownEl = document.getElementById('matchup-countdown');

    const playerTotalAP = calculateSquadTotalAP('#3B82F6');
    const enemyTotalAP = calculateSquadTotalAP('#EF4444');

    if (playerTotalAP <= enemyTotalAP) {
      firstTurnOwnerColor = '#3B82F6';
      if (bannerEl) {
        bannerEl.innerText = `👑 ĐỘI TA (Total AP: ${playerTotalAP}) NHẸ HƠN ĐỊCH (${enemyTotalAP} AP) -> BẠN ĐƯỢC ĐI TRƯỚC!`;
        bannerEl.style.borderColor = '#3B82F6';
        bannerEl.style.color = '#60A5FA';
      }
    } else {
      firstTurnOwnerColor = '#EF4444';
      if (bannerEl) {
        bannerEl.innerText = `⚡ ĐỘI ĐỊCH (Total AP: ${enemyTotalAP}) NHẸ HƠN BẠN (${playerTotalAP} AP) -> ĐỊCH ĐƯỢC ĐI TRƯỚC!`;
        bannerEl.style.borderColor = '#EF4444';
        bannerEl.style.color = '#F87171';
      }
    }

    if (playerApEl) playerApEl.innerText = `Tổng AP: ${playerTotalAP}`;
    if (enemyApEl) enemyApEl.innerText = `Tổng AP: ${enemyTotalAP}`;

    // Populate Squad Lists
    if (playerListEl) {
      playerListEl.innerHTML = units
        .filter(u => u.ownerColor === '#3B82F6')
        .map(u => {
          const stats = ArmyRegistry.getStats(u.armyClass as ArmyClassId);
          return `<div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px;"><span>${u.name}</span><span style="color: #F59E0B;">${stats.actionCost} AP</span></div>`;
        }).join('');
    }

    if (enemyListEl) {
      enemyListEl.innerHTML = units
        .filter(u => u.ownerColor === '#EF4444')
        .map(u => {
          const stats = ArmyRegistry.getStats(u.armyClass as ArmyClassId);
          return `<div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px;"><span>${u.name}</span><span style="color: #F59E0B;">${stats.actionCost} AP</span></div>`;
        }).join('');
    }

    if (matchupModal) matchupModal.style.display = 'flex';

    // 3-Second Countdown
    let countdown = 3;
    if (countdownEl) countdownEl.innerText = '3';

    const timerInterval = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.innerText = countdown.toString();

      if (countdown <= 0) {
        clearInterval(timerInterval);
        if (matchupModal) matchupModal.style.display = 'none';

        turnManager.setPhase('PLANNING');
        const deckDrawer = document.getElementById('deck-drawer');
        const globalTurnContainer = document.getElementById('global-turn-container');
        const phaseTitle = document.getElementById('phase-title');

        if (deckDrawer) deckDrawer.style.display = 'none';
        if (globalTurnContainer) globalTurnContainer.style.display = 'block';
        if (phaseTitle) phaseTitle.innerText = `Round 1 - Lập Kế Hoạch (${firstTurnOwnerColor === '#3B82F6' ? 'Bạn đi trước' : 'Địch đi trước'})`;

        selectUnit(null);
        startPlanningTimer();
      }
    }, 1000);
  });

  document.getElementById('btn-next-battle')?.addEventListener('click', () => {
    generateProceduralMap();
    units.length = 0;
    units.push(...createDefaultUnits());
    renderer.cacheTerrain(mapTiles);
    updateTileOccupancy();

    turnManager.setPhase('DEPLOYMENT');
    currentRound = 1;

    const resultModal = document.getElementById('result-modal');
    const deckDrawer = document.getElementById('deck-drawer');
    const globalTurnContainer = document.getElementById('global-turn-container');
    const phaseTitle = document.getElementById('phase-title');

    if (resultModal) resultModal.style.display = 'none';
    if (deckDrawer) deckDrawer.style.display = 'flex';
    if (globalTurnContainer) globalTurnContainer.style.display = 'none';
    if (phaseTitle) phaseTitle.innerText = 'Phase Chuẩn Bị Xếp Quân';

    selectUnit(null);
  });

  document.getElementById('btn-end-turn')?.addEventListener('click', () => {
    resolveRoundPhase();
  });

  // 60 FPS Render Loop
  function loop() {
    let pathPreviewCoords: HexCoord[] | undefined = undefined;
    let skillHighlightMap: Map<string, number> | undefined = undefined;

    if (selectedUnit && !selectedUnit.hasActedThisRound && turnManager.getPhase() === 'PLANNING') {
      if (isTargetingSkillMode) {
        const stats = ArmyRegistry.getStats((selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId);
        const effectiveRange = TerrainMatrix.getEffectiveRange(stats.range, selectedUnit.category, getTileTerrain(selectedUnit.position));

        skillHighlightMap = new Map();
        for (let r = -6; r <= 6; r++) {
          for (let col = -7; col <= 7; col++) {
            const q = col - Math.floor(r / 2);
            const hex: HexCoord = { q, r };
            if (HexMath.getDistance(selectedUnit.position, hex) <= effectiveRange) {
              skillHighlightMap.set(`${q},${r}`, 1);
            }
          }
        }
      } else if (hoveredHex) {
        const hoveredUnit = units.find(u => u.hp > 0 && u.position.q === hoveredHex!.q && u.position.r === hoveredHex!.r);
        if (hoveredUnit && hoveredUnit.ownerColor === '#EF4444') {
          const stats = ArmyRegistry.getStats((selectedUnit.armyClass || 'SHORT_SPEAR') as ArmyClassId);
          const effectiveRange = TerrainMatrix.getEffectiveRange(stats.range, selectedUnit.category, getTileTerrain(selectedUnit.position));
          const attackPosRes = HexPathfinder.findAttackPosition(
            selectedUnit.position,
            hoveredHex,
            effectiveRange,
            stats.movementPoints,
            selectedUnit.category,
            getTileForPathfinding
          );
          if (attackPosRes) pathPreviewCoords = attackPosRes.path;
        } else {
          const pathRes = pathOverlay.getPathPreview(hoveredHex, getTileForPathfinding);
          if (pathRes) pathPreviewCoords = pathRes.path;
        }
      }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 0.5;
      ft.alpha -= 0.015;
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    const visibleHexes = FogOfWar.calculateVisibleHexes(units, '#3B82F6');

    renderer.renderFrame(
      mapTiles,
      units,
      selectedUnit?.id,
      turnManager.getPhase() === 'PLANNING' ? (skillHighlightMap || pathOverlay.getReachableHexes()) : undefined,
      pathPreviewCoords,
      floatingTexts,
      undefined,
      turnManager.getPhase() !== 'DEPLOYMENT' ? visibleHexes : undefined,
      turnManager.getPhase() === 'DEPLOYMENT'
    );

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
