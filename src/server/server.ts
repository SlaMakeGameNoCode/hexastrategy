import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager, PlayerSession } from './room-manager.js';

export interface GameServerInstance {
  wss: WebSocketServer;
  roomManager: RoomManager;
  close: () => Promise<void>;
}

export function createGameServer(port: number): Promise<GameServerInstance> {
  return new Promise((resolve) => {
    const wss = new WebSocketServer({ port });
    const roomManager = new RoomManager();

    wss.on('connection', (ws: WebSocket) => {
      let playerId: string | null = null;
      let currentRoomId: string | null = null;

      ws.on('message', (message: string | Buffer) => {
        try {
          const payload = JSON.parse(message.toString());

          if (payload.type === 'JOIN_MATCH') {
            playerId = payload.playerId || `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const session: PlayerSession = {
              id: playerId,
              socket: ws,
              joinedAt: Date.now(),
              disconnectedTurns: 0
            };

            const { room, isMatched } = roomManager.joinMatch(session);
            currentRoomId = room.id;

            ws.send(JSON.stringify({
              type: 'MATCH_JOINED',
              roomId: room.id,
              playerId,
              state: room.state,
              isMatched
            }));

            if (isMatched && room.player1 && room.player2) {
              const startPayload = JSON.stringify({
                type: 'MATCH_START',
                roomId: room.id,
                player1: room.player1.id,
                player2: room.player2.id,
                round: 1,
                timerSec: 10,
                apBudget: 10
              });

              if (room.player1.socket.readyState === WebSocket.OPEN) {
                room.player1.socket.send(startPayload);
              }
              if (room.player2.socket.readyState === WebSocket.OPEN) {
                room.player2.socket.send(startPayload);
              }
            }
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON payload' }));
        }
      });

      ws.on('close', () => {
        if (currentRoomId && playerId) {
          const room = roomManager.getRoom(currentRoomId);
          if (room) {
            const shouldCleanup = room.handlePlayerDisconnect(playerId);
            if (shouldCleanup) {
              roomManager.removeRoom(currentRoomId);
            }
          }
        }
      });
    });

    wss.on('listening', () => {
      resolve({
        wss,
        roomManager,
        close: () => {
          return new Promise<void>((closeResolve) => {
            wss.close(() => closeResolve());
          });
        }
      });
    });
  });
}
