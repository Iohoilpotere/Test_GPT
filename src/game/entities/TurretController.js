const LEFT_KEYS = ['ArrowLeft'];
const RIGHT_KEYS = ['ArrowRight'];

export class TurretController {
  constructor(turretMesh, { rotationSpeed = 2 } = {}) {
    this.turretMesh = turretMesh;
    this.rotationSpeed = rotationSpeed;
  }

  update(delta, inputManager) {
    if (LEFT_KEYS.some((key) => inputManager.isPressed(key))) {
      this.turretMesh.rotation.y += this.rotationSpeed * delta;
    }
    if (RIGHT_KEYS.some((key) => inputManager.isPressed(key))) {
      this.turretMesh.rotation.y -= this.rotationSpeed * delta;
    }
  }
}
