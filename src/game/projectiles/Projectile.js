import * as THREE from 'three';

export class Projectile {
  constructor(
    mesh,
    velocity,
    {
      lifetime = 3,
      acceleration = new THREE.Vector3(0, 0, 0),
      maxDistance = Infinity
    } = {}
  ) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.alive = true;
    this.lifetime = lifetime;
    this.acceleration = acceleration;
    this.hasAcceleration = acceleration.lengthSq() > 0;
    this.explosionRadius = 0;
    this.maxDistance = maxDistance;
    this.travelledDistance = 0;
  }

  update(delta) {
    if (!this.alive) return;
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }
    if (this.hasAcceleration) {
      this.velocity.addScaledVector(this.acceleration, delta);
    }

    const displacement = this.velocity.clone().multiplyScalar(delta);
    this.mesh.position.add(displacement);
    if (this.maxDistance !== Infinity) {
      this.travelledDistance += displacement.length();
      if (this.travelledDistance >= this.maxDistance) {
        this.destroy();
        return;
      }
    }
  }

  destroy() {
    if (!this.alive) return;
    this.alive = false;
    this.mesh.parent?.remove(this.mesh);
  }
}
