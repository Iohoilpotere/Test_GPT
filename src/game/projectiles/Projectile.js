import * as THREE from 'three';

export class Projectile {
  constructor(mesh, velocity) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.alive = true;
    this.lifetime = 3; // seconds
    this.explosionRadius = 0;
  }

  update(delta) {
    if (!this.alive) return;
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }
    this.mesh.position.addScaledVector(this.velocity, delta);
  }

  destroy() {
    if (!this.alive) return;
    this.alive = false;
    this.mesh.parent?.remove(this.mesh);
  }
}
