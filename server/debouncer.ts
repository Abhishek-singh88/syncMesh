// Manages sliding-window timers for document persistence
export class Debouncer {
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly delayMs: number;

  constructor(delayMs: number = 2500) {
    this.delayMs = delayMs;
  }

  /**
   * Registers activity for a specific document.
   * Resets the sliding window timer. If the timer naturally expires,
   * it triggers the provided callback.
   */
  registerActivity(documentId: string, flushCallback: () => Promise<void>) {
    // Clear existing timer if it exists
    if (this.timers.has(documentId)) {
      clearTimeout(this.timers.get(documentId)!);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      this.timers.delete(documentId);
      try {
        await flushCallback();
      } catch (err) {
        console.error(`[Debouncer] Error flushing document ${documentId}:`, err);
      }
    }, this.delayMs);

    this.timers.set(documentId, timer);
  }

  /**
   * Force flush a document immediately (useful for shutdown sequences)
   */
  forceFlush(documentId: string, flushCallback: () => Promise<void>) {
    if (this.timers.has(documentId)) {
      clearTimeout(this.timers.get(documentId)!);
      this.timers.delete(documentId);
      flushCallback().catch(err => console.error(`[Debouncer] Error force-flushing document ${documentId}:`, err));
    }
  }
}
