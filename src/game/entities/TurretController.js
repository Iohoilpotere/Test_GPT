const LEFT_KEYS = ['ArrowLeft'];
const RIGHT_KEYS = ['ArrowRight'];
const UP_KEYS = ['ArrowUp'];
const DOWN_KEYS = ['ArrowDown'];

export class TurretController {
  constructor(turretMesh, {
    rotationSpeed = 2,
    elevationSpeed = 1.2,
    minElevation = -0.1,
    maxElevation = 0.7
  } = {}) {
    this.turretMesh = turretMesh;
    this.rotationSpeed = rotationSpeed;
    this.elevationSpeed = elevationSpeed;
    this.minElevation = minElevation;
    this.maxElevation = maxElevation;
    this.barrelPivot = turretMesh.userData?.barrelPivot ?? turretMesh;
  }

  update(delta, inputManager) {
    if (LEFT_KEYS.some((key) => inputManager.isPressed(key))) {
      this.turretMesh.rotation.y += this.rotationSpeed * delta;
    }
    if (RIGHT_KEYS.some((key) => inputManager.isPressed(key))) {
      this.turretMesh.rotation.y -= this.rotationSpeed * delta;
    }

    if (!this.barrelPivot) {
      return;
    }

    if (UP_KEYS.some((key) => inputManager.isPressed(key))) {
      this.barrelPivot.rotation.x = Math.min(
        this.maxElevation,
        this.barrelPivot.rotation.x + this.elevationSpeed * delta
      );
    }

    if (DOWN_KEYS.some((key) => inputManager.isPressed(key))) {
      this.barrelPivot.rotation.x = Math.max(
        this.minElevation,
        this.barrelPivot.rotation.x - this.elevationSpeed * delta
      );
    }
  }
}
