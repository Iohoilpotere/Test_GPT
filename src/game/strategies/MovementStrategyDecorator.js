import { MovementStrategy } from './MovementStrategy.js';

export class MovementStrategyDecorator extends MovementStrategy {
  constructor(strategy) {
    super();
    if (!strategy) {
      throw new Error('MovementStrategyDecorator requires a strategy instance.');
    }
    this.strategy = strategy;
  }

  move(tank, inputManager, delta) {
    this.strategy.move(tank, inputManager, delta);
  }

  getSpeed() {
    return this.strategy.getSpeed?.() ?? 0;
  }

  reset() {
    this.strategy.reset?.();
  }

  resolveCollision(normal) {
    this.strategy.resolveCollision?.(normal);
  }
}
