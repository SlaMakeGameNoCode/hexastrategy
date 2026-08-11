import { describe, it, expect } from 'vitest';
import { HUDOverlay } from '../../../src/ui/hud-overlay.js';

describe('HUDOverlay Unit Tests', () => {
  it('test_ap_percentage_calculation', () => {
    const hud = new HUDOverlay();
    expect(hud.getAPRemaining()).toBe(10);
    expect(hud.getAPPercentage()).toBe(100);

    hud.setAPRemaining(6);
    expect(hud.getAPPercentage()).toBe(60);

    hud.setAPRemaining(12); // Clamped to 10
    expect(hud.getAPRemaining()).toBe(10);
  });

  it('test_timer_setting_and_critical_warning', () => {
    const hud = new HUDOverlay();
    hud.setTimer(7);
    expect(hud.getTimer()).toBe(7);
    expect(hud.isTimerCritical()).toBe(false);
    expect(hud.getTimerRingColor()).toBe('#F59E0B');

    hud.setTimer(2);
    expect(hud.isTimerCritical()).toBe(true);
    expect(hud.getTimerRingColor()).toBe('#EF4444');
  });

  it('test_ap_cost_preview', () => {
    const hud = new HUDOverlay();
    hud.setAPCostPreview(3);
    expect(hud.getAPCostPreview()).toBe(3);
  });

  it('test_selected_unit_data_binding', () => {
    const hud = new HUDOverlay();
    expect(hud.getSelectedUnit()).toBeNull();

    hud.setSelectedUnit({
      name: 'Giáo Ngắn',
      armyClass: 'SHORT_SPEAR',
      hp: 100,
      maxHp: 100,
      attack: 20,
      defense: 10,
      range: 1,
      movementPoints: 3,
      actionCost: 2,
      skillName: 'Thế Trận Giáo',
      skillApCost: 3,
      hasActed: false
    });

    expect(hud.getSelectedUnit()?.name).toBe('Giáo Ngắn');
    expect(hud.getSelectedUnit()?.skillApCost).toBe(3);
  });
});
