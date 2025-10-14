import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import { Projectile } from '../projectiles/Projectile.js';

export class CannonWeapon extends Weapon {
  constructor({ cooldown = 0.6, muzzleVelocity = 35 } = {}) {
    super({ cooldown });
    this.muzzleVelocity = muzzleVelocity;
  }

  fire({ scene, origin, direction }) {
    if (!this.canFire()) {
      return null;
    }
    const projectileMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffaa00 })
    );
    projectileMesh.position.copy(origin);
    projectileMesh.castShadow = true;

    const projectile = new Projectile(projectileMesh, direction.clone().multiplyScalar(this.muzzleVelocity));
    scene.add(projectile.mesh);

    this.cooldownTimer = this.cooldown;
    return projectile;
  }
}
