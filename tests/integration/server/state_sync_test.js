import { describe, it, expect, vi } from 'vitest';
import { StateSerializer } from '../../../src/server/state-serializer.js';
describe('StateSerializer Integration Tests', () => {
    it('test_serialize_match_state_correctly_formats_units_and_payload', () => {
        const mockUnits = [
            { id: 'u1', unitType: 'SHORT_SPEAR', ownerId: 'p1', hp: 100, maxHp: 100, position: { q: 0, r: 0 }, cooldown: 0, isAlive: true },
            { id: 'u2', unitType: 'HEAVY_CAVALRY', ownerId: 'p2', hp: 150, maxHp: 150, position: { q: 3, r: -3 }, cooldown: 1, isAlive: true }
        ];
        const payload = StateSerializer.serializeMatchState('match_1001', 2, mockUnits, null);
        expect(payload.type).toBe('ROUND_RESOLVED');
        expect(payload.matchId).toBe('match_1001');
        expect(payload.round).toBe(2);
        expect(payload.units.length).toBe(2);
        expect(payload.units[0].id).toBe('u1');
        expect(payload.units[1].cooldown).toBe(1);
        expect(payload.winnerId).toBeNull();
    });
    it('test_broadcast_round_resolved_sends_json_to_all_sockets', () => {
        const mockSocket1 = { send: vi.fn(), readyState: 1 };
        const mockSocket2 = { send: vi.fn(), readyState: 1 };
        const mockUnits = [
            { id: 'u1', unitType: 'SHORT_SPEAR', ownerId: 'p1', hp: 0, maxHp: 100, position: { q: 0, r: 0 }, cooldown: 0, isAlive: false }
        ];
        const payload = StateSerializer.serializeMatchState('match_1001', 3, mockUnits, 'p2');
        StateSerializer.broadcastRoundResolved(payload, [mockSocket1, mockSocket2]);
        expect(mockSocket1.send).toHaveBeenCalledTimes(1);
        expect(mockSocket2.send).toHaveBeenCalledTimes(1);
        const sentJson = mockSocket1.send.mock.calls[0][0];
        const parsed = JSON.parse(sentJson);
        expect(parsed.type).toBe('ROUND_RESOLVED');
        expect(parsed.winnerId).toBe('p2');
        expect(parsed.units[0].isAlive).toBe(false);
    });
});
