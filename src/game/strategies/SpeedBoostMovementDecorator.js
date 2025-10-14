import { MovementStrategyDecorator } from './MovementStrategyDecorator.js';

export class SpeedBoostMovementDecorator extends MovementStrategyDecorator {
  constructor(strategy, { speedMultiplier = 1.2, turnMultiplier = 1.1 } = {}) {
    super(strategy);
    this.speedMultiplier = speedMultiplier;
    this.turnMultiplier = turnMultiplier;
  }

  move(tank, inputManager, delta) {
    const originalMaxSpeed = this.strategy.maxSpeed;
    const originalAcceleration = this.strategy.acceleration;
    const originalRotation = this.strategy.rotationSpeed;

    if (typeof originalMaxSpeed === 'number') {
      this.strategy.maxSpeed = originalMaxSpeed * this.speedMultiplier;
    }
    if (typeof originalAcceleration === 'number') {
      this.strategy.acceleration = originalAcceleration * this.speedMultiplier;
    }
    if (typeof originalRotation === 'number') {
      this.strategy.rotationSpeed = originalRotation * this.turnMultiplier;
    }

    super.move(tank, inputManager, delta);

    if (typeof originalMaxSpeed === 'number') {
      this.strategy.maxSpeed = originalMaxSpeed;
    }
    if (typeof originalAcceleration === 'number') {
      this.strategy.acceleration = originalAcceleration;
    }
    if (typeof originalRotation === 'number') {
      this.strategy.rotationSpeed = originalRotation;
    }
  }
}
