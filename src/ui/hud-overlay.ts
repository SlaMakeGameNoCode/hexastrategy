export class HUDOverlay {
  private apRemaining: number = 10;
  private maxAP: number = 10;
  private timerSec: number = 10;

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
}
