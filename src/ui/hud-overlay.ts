export interface UnitCardData {
  name: string;
  armyClass: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  range: number;
  movementPoints: number;
  actionCost: number;
  skillName: string;
  skillApCost: number;
  hasActed: boolean;
}

export class HUDOverlay {
  private apRemaining: number = 10;
  private maxAP: number = 10;
  private timerSec: number = 10;
  private selectedUnitData: UnitCardData | null = null;
  private apCostPreview: number = 0;

  public setAPRemaining(ap: number): void {
    this.apRemaining = Math.max(0, Math.min(this.maxAP, ap));
  }

  public getAPRemaining(): number {
    return this.apRemaining;
  }

  public setTimer(sec: number): void {
    this.timerSec = Math.max(0, sec);
  }

  public getTimer(): number {
    return this.timerSec;
  }

  /**
   * Calculates AP bar fill percentage for UI rendering.
   */
  public getAPPercentage(): number {
    return (this.apRemaining / this.maxAP) * 100;
  }

  /**
   * Sets AP cost preview when hovering or staging an action.
   */
  public setAPCostPreview(cost: number): void {
    this.apCostPreview = Math.max(0, cost);
  }

  public getAPCostPreview(): number {
    return this.apCostPreview;
  }

  /**
   * Determines if timer is in critical warning zone (< 3s).
   */
  public isTimerCritical(): boolean {
    return this.timerSec <= 3 && this.timerSec > 0;
  }

  /**
   * Returns current timer ring background color style based on time remaining.
   */
  public getTimerRingColor(): string {
    if (this.isTimerCritical()) {
      return '#EF4444'; // Red alert
    }
    return '#F59E0B'; // Gold normal
  }

  /**
   * Sets selected unit data for Unit Card UI.
   */
  public setSelectedUnit(data: UnitCardData | null): void {
    this.selectedUnitData = data;
  }

  public getSelectedUnit(): UnitCardData | null {
    return this.selectedUnitData;
  }
}
