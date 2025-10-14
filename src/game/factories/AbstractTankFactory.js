export class AbstractTankFactory {
  createHull() {
    throw new Error('createHull() must be implemented.');
  }

  createTurret() {
    throw new Error('createTurret() must be implemented.');
  }

  createWeapon() {
    throw new Error('createWeapon() must be implemented.');
  }

  createMovementStrategy() {
    throw new Error('createMovementStrategy() must be implemented.');
  }

  createTank(options) {
    throw new Error('createTank() must be implemented.');
  }
}
