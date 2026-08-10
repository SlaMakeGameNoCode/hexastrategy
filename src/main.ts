import { Canvas2DRenderer, MapTileRenderData, RenderableUnit } from './ui/canvas-renderer.js';
import { HexMath, HexCoord } from './core/hex-math.js';
import { TerrainMatrix, TerrainType } from './core/terrain-matrix.js';
import { HexPathfinder, MapHexTile } from './core/hex-pathfinder.js';
import { PathPreviewOverlay } from './ui/path-preview-overlay.js';
import { HUDOverlay } from './ui/hud-overlay.js';
import { ArmyRegistry } from './gameplay/army-registry.js';
import { TurnManager } from './server/turn-manager.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const renderer = new Canvas2DRenderer(canvas);
  const pathOverlay = new PathPreviewOverlay();
  const hud = new HUDOverlay();
  const turnManager = new TurnManager();

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

  // Sample Units
  const units: RenderableUnit[] = [
    { id: 'u1', name: 'Player Spear', category: 'INFANTRY', position: { q: -2, r: 0 }, hp: 100, maxHp: 100, ownerColor: '#3B82F6' },
    { id: 'u2', name: 'Player Cavalry', category: 'CAVALRY', position: { q: -3, r: 2 }, hp: 150, maxHp: 150, ownerColor: '#3B82F6' },
    { id: 'u3', name: 'Enemy Cav', category: 'CAVALRY', position: { q: 2, r: -2 }, hp: 150, maxHp: 150, ownerColor: '#EF4444' },
    { id: 'u4', name: 'Enemy Longbow', category: 'ARCHER', position: { q: 3, r: -3 }, hp: 70, maxHp: 70, ownerColor: '#EF4444' }
  ];

  let selectedUnit: RenderableUnit | null = units[0];
  let hoveredHex: HexCoord | null = null;

  // Initialize Selection for Unit 0
  pathOverlay.selectUnit(
    selectedUnit.position,
    selectedUnit.category,
    5,
    (c) => tileMap.get(HexPathfinder.hexKey(c))
  );

  // Setup 10s Timer Loop
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
    console.log('Turn Locked!');
  });

  // Event Listeners for Hover and Click
  canvas.addEventListener('mousemove', (evt) => {
    const rect = canvas.getBoundingClientRect();
    const px = evt.clientX - rect.left - rect.width / 2;
    const py = evt.clientY - rect.top - rect.height / 2;
    hoveredHex = HexMath.pixelToHex({ x: px, y: py }, renderer.getHexRadius());
  });

  canvas.addEventListener('click', () => {
    if (hoveredHex && selectedUnit) {
      const pathResult = pathOverlay.getPathPreview(hoveredHex, (c) => tileMap.get(HexPathfinder.hexKey(c)));
      if (pathResult && pathResult.path.length > 1) {
        selectedUnit.position = { ...hoveredHex };
        pathOverlay.selectUnit(
          selectedUnit.position,
          selectedUnit.category,
          5,
          (c) => tileMap.get(HexPathfinder.hexKey(c))
        );
      }
    }
  });

  // Render Loop 60 FPS
  function loop() {
    let pathPreviewCoords: HexCoord[] | undefined = undefined;
    if (hoveredHex && selectedUnit) {
      const pathRes = pathOverlay.getPathPreview(hoveredHex, (c) => tileMap.get(HexPathfinder.hexKey(c)));
      if (pathRes) pathPreviewCoords = pathRes.path;
    }

    renderer.renderFrame(
      mapTiles,
      units,
      pathOverlay.getReachableHexes(),
      pathPreviewCoords
    );

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
