/**
 * Represents a single 1v1 match room in HEX LEGION.
 */
export interface PlayerSession {
  id: string;
  socket: any;
  joinedAt: number;
  disconnectedTurns: number;
}

export class MatchRoom {
  public readonly id: string;
  public player1: PlayerSession | null = null;
  public player2: PlayerSession | null = null;
  public currentRound: number = 1;
  public state: 'WAITING' | 'PLANNING' | 'RESOLVING' | 'FINISHED' = 'WAITING';

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Adds a player session to the room.
   * Returns true if successfully added.
   */
  public addPlayer(session: PlayerSession): boolean {
    if (!this.player1) {
      this.player1 = session;
      return true;
    }
    if (!this.player2 && session.id !== this.player1.id) {
      this.player2 = session;
      this.state = 'PLANNING';
      return true;
    }
    return false;
  }

  /**
   * Checks if room is full (has 2 players).
   */
  public isFull(): boolean {
    return this.player1 !== null && this.player2 !== null;
  }

  /**
   * Increments disconnected turns for a player and checks if session should be cleaned up.
   * Cleans up room if a player has been disconnected for >= 2 turns.
   */
  public handlePlayerDisconnect(playerId: string): boolean {
    if (this.player1 && this.player1.id === playerId) {
      this.player1.disconnectedTurns += 1;
    } else if (this.player2 && this.player2.id === playerId) {
      this.player2.disconnectedTurns += 1;
    }

    if (
      (this.player1 && this.player1.disconnectedTurns >= 2) ||
      (this.player2 && this.player2.disconnectedTurns >= 2)
    ) {
      this.state = 'FINISHED';
      return true; // Room cleanup required
    }
    return false;
  }
}

/**
 * Manages active match rooms and player pairing.
 */
export class RoomManager {
  private rooms: Map<string, MatchRoom> = new Map();
  private waitingRoomId: string | null = null;

  /**
   * Joins or creates a match room for a player.
   */
  public joinMatch(player: PlayerSession): { room: MatchRoom; isMatched: boolean } {
    let room: MatchRoom;

    if (this.waitingRoomId && this.rooms.has(this.waitingRoomId)) {
      room = this.rooms.get(this.waitingRoomId)!;
      room.addPlayer(player);
      this.waitingRoomId = null;
      return { room, isMatched: true };
    } else {
      const newRoomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      room = new MatchRoom(newRoomId);
      room.addPlayer(player);
      this.rooms.set(newRoomId, room);
      this.waitingRoomId = newRoomId;
      return { room, isMatched: false };
    }
  }

  /**
   * Gets a room by ID.
   */
  public getRoom(roomId: string): MatchRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Removes a room from memory.
   */
  public removeRoom(roomId: string): void {
    if (this.waitingRoomId === roomId) {
      this.waitingRoomId = null;
    }
    this.rooms.delete(roomId);
  }

  /**
   * Returns active room count.
   */
  public getActiveRoomCount(): number {
    return this.rooms.size;
  }
}
