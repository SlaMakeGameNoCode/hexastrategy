import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TurnManager } from '../../../src/server/turn-manager.js';
describe('TurnManager Unit Tests', () => {
    let turnManager;
    beforeEach(() => {
        turnManager = new TurnManager();
        vi.useFakeTimers();
    });
    afterEach(() => {
        turnManager.stopTimer();
        vi.useRealTimers();
    });
    it('test_valid_ap_payload_is_accepted', () => {
        const payload = {
            playerId: 'player1',
            round: 1,
            actions: [
                { unitId: 'u1', type: 'MOVE', actionCost: 3 },
                { unitId: 'u2', type: 'ATTACK', actionCost: 2 },
                { unitId: 'u3', type: 'DEFEND', actionCost: 2 }
            ] // Total 7 AP <= 10 AP
        };
        const res = turnManager.submitPayload(payload);
        expect(res.success).toBe(true);
        expect(turnManager.getSubmittedPayload('player1')).toEqual(payload);
    });
    it('test_exceeding_10_ap_payload_is_rejected', () => {
        const invalidPayload = {
            playerId: 'player1',
            round: 1,
            actions: [
                { unitId: 'u1', type: 'MOVE', actionCost: 3 },
                { unitId: 'u2', type: 'ATTACK', actionCost: 3 },
                { unitId: 'u3', type: 'ABILITY', actionCost: 3 },
                { unitId: 'u4', type: 'ATTACK', actionCost: 3 }
            ] // Total 12 AP > 10 AP
        };
        const res = turnManager.submitPayload(invalidPayload);
        expect(res.success).toBe(false);
        expect(res.error).toContain('INVALID_AP_BUDGET');
    });
    it('test_10s_timer_countdown_and_expiration', () => {
        let expired = false;
        let tickCount = 0;
        turnManager.startTimer(() => { tickCount++; }, () => { expired = true; });
        expect(turnManager.getRemainingTime()).toBe(10);
        // Fast-forward 5 seconds
        vi.advanceTimersByTime(5000);
        expect(turnManager.getRemainingTime()).toBe(5);
        // Fast-forward another 5 seconds to expire
        vi.advanceTimersByTime(5000);
        expect(turnManager.getRemainingTime()).toBe(0);
        expect(expired).toBe(true);
    });
    it('test_has_both_submitted_returns_true_when_p1_and_p2_submit', () => {
        const p1Payload = {
            playerId: 'p1',
            round: 1,
            actions: [{ unitId: 'u1', type: 'MOVE', actionCost: 2 }]
        };
        const p2Payload = {
            playerId: 'p2',
            round: 1,
            actions: [{ unitId: 'u2', type: 'MOVE', actionCost: 3 }]
        };
        turnManager.submitPayload(p1Payload);
        expect(turnManager.hasBothSubmitted('p1', 'p2')).toBe(false);
        turnManager.submitPayload(p2Payload);
        expect(turnManager.hasBothSubmitted('p1', 'p2')).toBe(true);
    });
});
