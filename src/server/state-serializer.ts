/**
 * Handles serialization and network broadcast of server-authoritative MatchState.
 */

export interface UnitState {
  id: string;
  unitType: string;
  ownerId: string;
  hp: number;
  maxHp: number;
  position: { q: number; r: number };
  cooldown: number;
  isAlive: boolean;
}

export interface RoundResolvedPayload {
  type: 'ROUND_RESOLVED';
  matchId: string;
  round: number;
  units: UnitState[];
  winnerId: string | null;
  timestamp: number;
}

export class StateSerializer {
  /**
   * Serializes match state snapshot into a RoundResolvedPayload ready for broadcast.
   */
  public static serializeMatchState(
    matchId: string,
    round: number,
    units: UnitState[],
    winnerId: string | null = null
  ): RoundResolvedPayload {
    return {
      type: 'ROUND_RESOLVED',
      matchId,
      round,
      units: units.map((u) => ({
        id: u.id,
        unitType: u.unitType,
        ownerId: u.ownerId,
        hp: u.hp,
        maxHp: u.maxHp,
        position: { ...u.position },
        cooldown: u.cooldown,
        isAlive: u.hp > 0
      })),
      winnerId,
      timestamp: Date.now()
    };
  }

  /**
   * Broadcasts serialized RoundResolvedPayload to all connected player sockets.
   */
  public static broadcastRoundResolved(payload: RoundResolvedPayload, sockets: any[]): void {
    const jsonMessage = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket && typeof socket.send === 'function' && (socket.readyState === 1 || socket.readyState === undefined)) {
        socket.send(jsonMessage);
      }
    }
  }
}
