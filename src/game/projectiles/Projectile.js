import * as THREE from 'three';

export class Projectile {
  constructor(
    mesh,
    velocity,
    { acceleration = new THREE.Vector3(0, 0, 0), radius = 0.2 } = {}
  ) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.alive = true;
    this.acceleration = acceleration;
    this.hasAcceleration = acceleration.lengthSq() > 0;
    this.explosionRadius = 0;
    this.radius = radius;
  }

  update(delta) {
    if (!this.alive) return;
    if (this.hasAcceleration) {
      this.velocity.addScaledVector(this.acceleration, delta);
    }

    const displacement = this.velocity.clone().multiplyScalar(delta);
    this.mesh.position.add(displacement);
  }

  destroy() {
    if (!this.alive) return;
    this.alive = false;
    this.mesh.parent?.remove(this.mesh);
  }

  getRadius() {
    return this.radius;
  }
}
