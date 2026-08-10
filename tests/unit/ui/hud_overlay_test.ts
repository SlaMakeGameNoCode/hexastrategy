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

  it('test_timer_setting', () => {
    const hud = new HUDOverlay();
    hud.setTimer(7);
    expect(hud.getTimer()).toBe(7);
  });
});
