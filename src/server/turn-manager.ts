/**
 * Manages the 10-second planning timer and 10 AP budget validation for HEX LEGION.
 */

export interface UnitAction {
  unitId: string;
  type: 'MOVE' | 'ATTACK' | 'ABILITY' | 'DEFEND' | 'WAIT';
  actionCost: number;
  targetHex?: { q: number; r: number };
  targetUnitId?: string;
}

export interface PlayerTurnPayload {
  playerId: string;
  round: number;
  actions: UnitAction[];
}

export class TurnManager {
  public static readonly MAX_AP_BUDGET = 10;
  public static readonly PLANNING_TIME_SEC = 10;

  private timerSec: number = TurnManager.PLANNING_TIME_SEC;
  private timerInterval: any = null;
  private submittedPayloads: Map<string, PlayerTurnPayload> = new Map();

  /**
   * Validates AP cost sum for a submitted turn payload.
   */
  public validatePayload(payload: PlayerTurnPayload): { valid: boolean; totalAP: number; error?: string } {
    const totalAP = payload.actions.reduce((sum, action) => sum + (action.actionCost || 0), 0);

    if (totalAP > TurnManager.MAX_AP_BUDGET) {
      return {
        valid: false,
        totalAP,
        error: `INVALID_AP_BUDGET: Submitted AP sum (${totalAP}) exceeds max limit of ${TurnManager.MAX_AP_BUDGET} AP.`
      };
    }

    return { valid: true, totalAP };
  }

  /**
   * Submits a player turn payload after validation.
   */
  public submitPayload(payload: PlayerTurnPayload): { success: boolean; error?: string } {
    const validation = this.validatePayload(payload);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    this.submittedPayloads.set(payload.playerId, payload);
    return { success: true };
  }

  /**
   * Starts the 10-second planning timer with tick and expiration callbacks.
   */
  public startTimer(onTick?: (remainingSec: number) => void, onExpire?: () => void): void {
    this.timerSec = TurnManager.PLANNING_TIME_SEC;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.timerSec -= 1;
      if (onTick) onTick(this.timerSec);

      if (this.timerSec <= 0) {
        this.stopTimer();
        if (onExpire) onExpire();
      }
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getRemainingTime(): number {
    return this.timerSec;
  }

  public getSubmittedPayload(playerId: string): PlayerTurnPayload | undefined {
    return this.submittedPayloads.get(playerId);
  }

  public hasBothSubmitted(player1Id: string, player2Id: string): boolean {
    return this.submittedPayloads.has(player1Id) && this.submittedPayloads.has(player2Id);
  }

  public resetRound(): void {
    this.stopTimer();
    this.timerSec = TurnManager.PLANNING_TIME_SEC;
    this.submittedPayloads.clear();
  }
}
