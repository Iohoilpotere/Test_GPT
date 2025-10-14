import * as THREE from 'three';
import { MovementStrategy } from './MovementStrategy.js';

const FORWARD_KEYS = ['KeyW'];
const BACKWARD_KEYS = ['KeyS'];
const LEFT_KEYS = ['KeyA'];
const RIGHT_KEYS = ['KeyD'];

export class TankMovementStrategy extends MovementStrategy {
  constructor({ acceleration = 25, maxSpeed = 10, rotationSpeed = 2 } = {}) {
    super();
    this.velocity = new THREE.Vector3();
    this.acceleration = acceleration;
    this.maxSpeed = maxSpeed;
    this.rotationSpeed = rotationSpeed;
  }

  move(tank, inputManager, delta) {
    if (!inputManager) {
      this.velocity.multiplyScalar(0.9);
      return;
    }

    const forward = FORWARD_KEYS.some((key) => inputManager.isPressed(key));
    const backward = BACKWARD_KEYS.some((key) => inputManager.isPressed(key));
    const left = LEFT_KEYS.some((key) => inputManager.isPressed(key));
    const right = RIGHT_KEYS.some((key) => inputManager.isPressed(key));

    const direction = new THREE.Vector3();
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const rotated = direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), tank.mesh.rotation.y);
      this.velocity.addScaledVector(rotated, this.acceleration * delta);
    }

    this.velocity.multiplyScalar(0.92);

    if (left) {
      tank.mesh.rotation.y += this.rotationSpeed * delta;
    }
    if (right) {
      tank.mesh.rotation.y -= this.rotationSpeed * delta;
    }

    this.velocity.clampLength(0, this.maxSpeed);
    tank.mesh.position.addScaledVector(this.velocity, delta);

    tank.clampToArena();
  }

  getSpeed() {
    return this.velocity.length();
  }

  reset() {
    this.velocity.set(0, 0, 0);
  }
}
