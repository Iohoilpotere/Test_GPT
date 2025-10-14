/**
 * GameLoop orchestrates the RAF cycle for all update subscribers.
 */
export class GameLoop {
  constructor() {
    this.lastTime = performance.now();
    this.subscribers = new Set();
    this.running = false;
    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
  }

  subscribe(subscriber) {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  tick(currentTime) {
    if (!this.running) return;
    const delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.subscribers.forEach((subscriber) => subscriber.update?.(delta));
    requestAnimationFrame(this.tick);
  }
}
