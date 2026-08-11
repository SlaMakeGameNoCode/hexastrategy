import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Simple HTTP Server serving static files from ./dist
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Real-Time PvP & Lobby WebSocket Server
const wss = new WebSocketServer({ server });

// Map: uid -> { ws, user }
const connectedClients = new Map();
// Map: roomId -> { player1Uid, player2Uid, mapSeed }
const activeRooms = new Map();

function broadcastLobbyState() {
  const usersList = Array.from(connectedClients.values()).map(c => c.user);
  const payload = JSON.stringify({
    type: 'LOBBY_USERS',
    users: usersList
  });

  for (const client of connectedClients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  let clientUid = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'JOIN_LOBBY':
          if (data.user && data.user.uid) {
            clientUid = data.user.uid;
            connectedClients.set(clientUid, { ws, user: data.user });
            broadcastLobbyState();
          }
          break;

        case 'SEND_CHALLENGE':
          if (data.toUid && connectedClients.has(data.toUid)) {
            const targetClient = connectedClients.get(data.toUid);
            if (targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'CHALLENGE_REQUEST',
                fromUid: data.fromUid,
                fromName: data.fromName
              }));
            }
          }
          break;

        case 'RESPOND_CHALLENGE':
          if (data.toUid && connectedClients.has(data.toUid)) {
            const challengerClient = connectedClients.get(data.toUid);
            if (data.accepted) {
              const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              // Generate shared map seed for deterministic map on both clients
              const mapSeed = Math.floor(Math.random() * 9000000) + 1000000;
              activeRooms.set(roomId, {
                player1Uid: data.toUid,
                player2Uid: data.fromUid,
                mapSeed
              });

              const matchMsg = JSON.stringify({
                type: 'MATCH_START',
                roomId,
                fromUid: data.toUid,   // player1 = challenger (blue)
                firstTurnColor: '#3B82F6',
                mapSeed
              });

              if (challengerClient.ws.readyState === WebSocket.OPEN) {
                challengerClient.ws.send(matchMsg);
              }
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(matchMsg);
              }
            } else {
              if (challengerClient.ws.readyState === WebSocket.OPEN) {
                challengerClient.ws.send(JSON.stringify({
                  type: 'CHALLENGE_RESPONSE',
                  fromName: data.fromName,
                  accepted: false
                }));
              }
            }
          }
          break;

        // GAME_ACTION: relay game moves between 2 players in the same room
        case 'GAME_ACTION':
          if (data.roomId && activeRooms.has(data.roomId)) {
            const room = activeRooms.get(data.roomId);
            const opponentUid = room.player1Uid === data.fromUid ? room.player2Uid : room.player1Uid;
            const opponentClient = connectedClients.get(opponentUid);
            if (opponentClient && opponentClient.ws.readyState === WebSocket.OPEN) {
              opponentClient.ws.send(JSON.stringify(data));
            }
          }
          break;

        case 'SURRENDER_MATCH':
          if (data.roomId && activeRooms.has(data.roomId)) {
            const room = activeRooms.get(data.roomId);
            const opponentUid = room.player1Uid === data.fromUid ? room.player2Uid : room.player1Uid;
            const opponentClient = connectedClients.get(opponentUid);

            const surrenderMsg = JSON.stringify({
              type: 'SURRENDER_MATCH',
              fromUid: data.fromUid
            });

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(surrenderMsg);
            }
            if (opponentClient && opponentClient.ws.readyState === WebSocket.OPEN) {
              opponentClient.ws.send(surrenderMsg);
            }
            activeRooms.delete(data.roomId);
          }
          break;
      }
    } catch (e) {
      console.error('Server error processing message:', e);
    }
  });

  ws.on('close', () => {
    if (clientUid) {
      connectedClients.delete(clientUid);
      broadcastLobbyState();
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 HEX LEGION Real-Time PvP Server running on port ${PORT}`);
});
