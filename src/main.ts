import { Canvas2DRenderer, MapTileRenderData, RenderableUnit, FloatingText } from './ui/canvas-renderer.js';
import { HexMath, HexCoord } from './core/hex-math.js';
import { TerrainType } from './core/terrain-matrix.js';
import { HexPathfinder, MapHexTile } from './core/hex-pathfinder.js';
import { PathPreviewOverlay } from './ui/path-preview-overlay.js';
import { HUDOverlay } from './ui/hud-overlay.js';
import { ArmyRegistry } from './gameplay/army-registry.js';
import { TurnManager } from './server/turn-manager.js';
import { CombatResolver } from './gameplay/combat-resolver.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const renderer = new Canvas2DRenderer(canvas);
  const pathOverlay = new PathPreviewOverlay();
  const hud = new HUDOverlay();
  const turnManager = new TurnManager();

  // Floating text animations
  const floatingTexts: FloatingText[] = [];

  // Create Hex Map Grid (-4 to +4 radius)
  const mapTiles: MapTileRenderData[] = [];
  const tileMap = new Map<string, MapHexTile>();

  for (let q = -4; q <= 4; q++) {
    for (let r = -4; r <= 4; r++) {
      if (Math.abs(q + r) <= 4) {
        let terrain: TerrainType = 'GROUND';
        if (q === 0 && r === 0) terrain = 'HIGH_GROUND';
        else if (q === 1 && r === -2) terrain = 'FOREST';
        else if (q === -2 && r === 2) terrain = 'ROAD';
        else if (q === 2 && r === 1) terrain = 'MOUNTAIN';

        const tileData: MapTileRenderData = { coord: { q, r }, terrain };
        mapTiles.push(tileData);
        tileMap.set(HexPathfinder.hexKey({ q, r }), { coord: { q, r }, terrain });
      }
    }
  }

  // Active Game Units
  const units: RenderableUnit[] = [
    { id: 'u1', name: 'Player Spear', category: 'INFANTRY', position: { q: -2, r: 0 }, hp: 100, maxHp: 100, ownerColor: '#3B82F6' },
    { id: 'u2', name: 'Player Cavalry', category: 'CAVALRY', position: { q: -3, r: 2 }, hp: 150, maxHp: 150, ownerColor: '#3B82F6' },
    { id: 'u3', name: 'Enemy Cav', category: 'CAVALRY', position: { q: 2, r: -2 }, hp: 150, maxHp: 150, ownerColor: '#EF4444' },
    { id: 'u4', name: 'Enemy Longbow', category: 'ARCHER', position: { q: 3, r: -3 }, hp: 70, maxHp: 70, ownerColor: '#EF4444' }
  ];

  let selectedUnit: RenderableUnit | null = units[0];
  let hoveredHex: HexCoord | null = null;
  let isResolvingTurn = false;
  let currentRound = 1;

  // Initialize selection for Player Unit 1
  selectUnit(units[0]);

  function selectUnit(unit: RenderableUnit) {
    if (unit.ownerColor !== '#3B82F6' || isResolvingTurn) return; // Only select player units
    selectedUnit = unit;
    pathOverlay.selectUnit(
      unit.position,
      unit.category,
      5,
      (c) => tileMap.get(HexPathfinder.hexKey(c))
    );
  }

  // Recalculate remaining AP from assigned actions
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

  // Timer Tick & Auto-Resolution
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

  startPlanningTimer();

  // Execute Turn Resolution with Smooth Animations
  async function resolveRoundPhase() {
    if (isResolvingTurn) return;
    isResolvingTurn = true;
    turnManager.stopTimer();

    // AI Bot assigns actions for Enemy Units
    for (const u of units) {
      if (u.ownerColor === '#EF4444' && u.hp > 0) {
        // AI decides to move towards nearest player unit
        const pathRes = HexPathfinder.findPath(
          u.position,
          { q: -1, r: 0 },
          4,
          u.category,
          (c) => tileMap.get(HexPathfinder.hexKey(c))
        );
        if (pathRes && pathRes.path.length > 1) {
          u.assignedAction = {
            type: 'MOVE',
            targetHex: pathRes.path[pathRes.path.length - 1],
            cost: 2
          };
        }
      }
    }

    // Smooth Movement Animation Loop (60 FPS LERP along path)
    for (const u of units) {
      if (u.assignedAction && u.assignedAction.targetHex && u.hp > 0) {
        const startPos = { ...u.position };
        const endPos = { ...u.assignedAction.targetHex };

        const pathResult = HexPathfinder.findPath(
          startPos,
          endPos,
          6,
          u.category,
          (c) => tileMap.get(HexPathfinder.hexKey(c))
        );

        if (pathResult && pathResult.path.length > 1) {
          for (let step = 1; step < pathResult.path.length; step++) {
            const fromHex = pathResult.path[step - 1];
            const toHex = pathResult.path[step];
            const pFrom = HexMath.hexToPixel(fromHex, renderer.getHexRadius());
            const pTo = HexMath.hexToPixel(toHex, renderer.getHexRadius());

            // Animate 15 frames per hex step
            for (let f = 1; f <= 15; f++) {
              const t = f / 15;
              u.animPos = {
                x: pFrom.x + (pTo.x - pFrom.x) * t,
                y: pFrom.y + (pTo.y - pFrom.y) * t
              };
              await new Promise((r) => setTimeout(r, 16));
            }
            u.position = { ...toHex };
          }
          delete u.animPos;
        }
      }
    }

    // Resolve Combat Hits & Counter Attacks
    const pSpear = units.find(u => u.id === 'u1')!;
    const eCav = units.find(u => u.id === 'u3')!;

    if (pSpear && eCav && pSpear.hp > 0 && eCav.hp > 0) {
      const dist = HexMath.getDistance(pSpear.position, eCav.position);
      if (dist <= 1) {
        const isBrace = pSpear.assignedAction?.type === 'BRACE';
        const dmgResult = CombatResolver.calculateDamage('HEAVY_CAVALRY', 'SHORT_SPEAR', true, isBrace);

        if (dmgResult.isBraceCounterTriggered) {
          // Counter hits Enemy Cav first!
          eCav.hp = Math.max(0, eCav.hp - dmgResult.finalDamage);
          const pos = HexMath.hexToPixel(eCav.position, renderer.getHexRadius());
          floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${dmgResult.finalDamage} COUNTER!`, color: '#F59E0B', alpha: 1.0 });
        } else {
          // Cav hits Spear
          pSpear.hp = Math.max(0, pSpear.hp - dmgResult.finalDamage);
          const pos = HexMath.hexToPixel(pSpear.position, renderer.getHexRadius());
          floatingTexts.push({ x: pos.x, y: pos.y - 30, text: `-${dmgResult.finalDamage}`, color: '#EF4444', alpha: 1.0 });
        }
      }
    }

    await new Promise((r) => setTimeout(r, 800));

    // Reset Round for Next Turn
    for (const u of units) {
      delete u.assignedAction;
    }

    currentRound += 1;
    isResolvingTurn = false;
    updateAPBudget();
    startPlanningTimer();
  }

  // Canvas Coordinates Conversion
  function getCanvasHex(evt: MouseEvent): HexCoord {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (evt.clientX - rect.left - rect.width / 2);
    const py = (evt.clientY - rect.top - rect.height / 2);
    return HexMath.pixelToHex({ x: px, y: py }, renderer.getHexRadius());
  }

  // Mouse Move Preview
  canvas.addEventListener('mousemove', (evt) => {
    hoveredHex = getCanvasHex(evt);
  });

  // Mouse Click Action Assignment
  canvas.addEventListener('click', (evt) => {
    if (isResolvingTurn) return;
    const clickedHex = getCanvasHex(evt);

    // Check if clicking on an existing unit
    const clickedUnit = units.find(
      (u) => u.hp > 0 && u.position.q === clickedHex.q && u.position.r === clickedHex.r
    );

    if (clickedUnit && clickedUnit.ownerColor === '#3B82F6') {
      selectUnit(clickedUnit);
      return;
    }

    // Assign Move Action to Selected Unit
    if (selectedUnit && selectedUnit.ownerColor === '#3B82F6') {
      const pathRes = pathOverlay.getPathPreview(clickedHex, (c) => tileMap.get(HexPathfinder.hexKey(c)));
      if (pathRes && pathRes.path.length > 1) {
        const apCost = Math.min(3, Math.max(1, pathRes.path.length - 1));
        const currentAP = hud.getAPRemaining();

        if (currentAP >= apCost) {
          selectedUnit.assignedAction = {
            type: 'MOVE',
            targetHex: { ...clickedHex },
            cost: apCost
          };
          updateAPBudget();
        }
      }
    }
  });

  // UI Buttons
  document.getElementById('btn-end-turn')?.addEventListener('click', () => {
    resolveRoundPhase();
  });

  document.getElementById('btn-brace')?.addEventListener('click', () => {
    if (selectedUnit && selectedUnit.ownerColor === '#3B82F6' && !isResolvingTurn) {
      if (hud.getAPRemaining() >= 2) {
        selectedUnit.assignedAction = { type: 'BRACE', cost: 2 };
        updateAPBudget();
      }
    }
  });

  // 60 FPS Main Render Loop
  function loop() {
    let pathPreviewCoords: HexCoord[] | undefined = undefined;
    if (hoveredHex && selectedUnit && !isResolvingTurn) {
      const pathRes = pathOverlay.getPathPreview(hoveredHex, (c) => tileMap.get(HexPathfinder.hexKey(c)));
      if (pathRes) pathPreviewCoords = pathRes.path;
    }

    // Animate Floating Damage Text
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
      pathOverlay.getReachableHexes(),
      pathPreviewCoords,
      floatingTexts
    );

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
