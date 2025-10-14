export class MovementStrategy {
  constructor() {
    if (new.target === MovementStrategy) {
      throw new Error('MovementStrategy is abstract.');
    }
  }

  move(entity, inputManager, delta) {
    throw new Error('move() must be implemented.');
  }
}
