import * as THREE from 'three';

export class Projectile {
  constructor(mesh, velocity, { lifetime = 3, acceleration = new THREE.Vector3(0, 0, 0) } = {}) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.alive = true;
    this.lifetime = lifetime;
    this.acceleration = acceleration;
    this.hasAcceleration = acceleration.lengthSq() > 0;
    this.explosionRadius = 0;
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
    this.mesh.position.addScaledVector(this.velocity, delta);
  }

  destroy() {
    if (!this.alive) return;
    this.alive = false;
    this.mesh.parent?.remove(this.mesh);
  }
}
