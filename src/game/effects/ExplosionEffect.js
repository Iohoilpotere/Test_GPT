import * as THREE from 'three';

export class ExplosionEffect {
  constructor(position, { duration = 0.8, maxScale = 5, color = 0xffc857 } = {}) {
    this.duration = duration;
    this.elapsed = 0;
    this.maxScale = maxScale;
    this.alive = true;

    const geometry = new THREE.SphereGeometry(0.5, 12, 12);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }

  update(delta) {
    if (!this.alive) return;
    this.elapsed += delta;
    const progress = THREE.MathUtils.clamp(this.elapsed / this.duration, 0, 1);
    const scale = THREE.MathUtils.lerp(1, this.maxScale, progress);
    this.mesh.scale.setScalar(scale);
    this.mesh.material.opacity = 1 - progress;
    if (progress >= 1) {
      this.dispose();
    }
  }

  dispose() {
    if (!this.alive) return;
    this.alive = false;
    this.mesh.parent?.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
