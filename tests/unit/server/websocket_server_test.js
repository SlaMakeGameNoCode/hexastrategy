import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { createGameServer } from '../../../src/server/server.js';
import { RoomManager } from '../../../src/server/room-manager.js';
describe('WebSocket Server & Room Manager Unit Tests', () => {
    let serverInstance;
    const TEST_PORT = 8089;
    beforeEach(async () => {
        serverInstance = await createGameServer(TEST_PORT);
    });
    afterEach(async () => {
        await serverInstance.close();
    });
    it('test_room_manager_pairs_two_players_into_match', () => {
        const roomManager = new RoomManager();
        const player1 = { id: 'p1', socket: {}, joinedAt: Date.now(), disconnectedTurns: 0 };
        const player2 = { id: 'p2', socket: {}, joinedAt: Date.now(), disconnectedTurns: 0 };
        const res1 = roomManager.joinMatch(player1);
        expect(res1.isMatched).toBe(false);
        expect(res1.room.state).toBe('WAITING');
        const res2 = roomManager.joinMatch(player2);
        expect(res2.isMatched).toBe(true);
        expect(res2.room.state).toBe('PLANNING');
        expect(res2.room.isFull()).toBe(true);
    });
    it('test_room_manager_cleans_up_on_two_disconnected_turns', () => {
        const roomManager = new RoomManager();
        const player1 = { id: 'p1', socket: {}, joinedAt: Date.now(), disconnectedTurns: 0 };
        const player2 = { id: 'p2', socket: {}, joinedAt: Date.now(), disconnectedTurns: 0 };
        const { room } = roomManager.joinMatch(player1);
        roomManager.joinMatch(player2);
        expect(roomManager.getActiveRoomCount()).toBe(1);
        // First turn disconnect
        const cleanupTurn1 = room.handlePlayerDisconnect('p1');
        expect(cleanupTurn1).toBe(false);
        // Second turn disconnect triggers cleanup
        const cleanupTurn2 = room.handlePlayerDisconnect('p1');
        expect(cleanupTurn2).toBe(true);
        expect(room.state).toBe('FINISHED');
    });
    it('test_websocket_server_accepts_connection_and_joins_room', async () => {
        const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
        const responsePromise = new Promise((resolve) => {
            ws.on('message', (data) => {
                resolve(JSON.parse(data.toString()));
            });
        });
        await new Promise((resolve) => ws.on('open', resolve));
        ws.send(JSON.stringify({ type: 'JOIN_MATCH', playerId: 'test_player_1' }));
        const response = await responsePromise;
        expect(response.type).toBe('MATCH_JOINED');
        expect(response.playerId).toBe('test_player_1');
        expect(response.roomId).toBeDefined();
        ws.close();
    });
});
