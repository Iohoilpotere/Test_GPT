import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import { Projectile } from '../projectiles/Projectile.js';

export class MachineGunWeapon extends Weapon {
  constructor({
    cooldown = 0.1,
    muzzleVelocity = 60,
    burst = 1,
    damage = 12,
    projectileRange = 18,
    projectileLifetime = 0.7
  } = {}) {
    super({ cooldown, damage });
    this.muzzleVelocity = muzzleVelocity;
    this.burst = burst;
    this.projectileLifetime = projectileLifetime;
    this.projectileRange = projectileRange;
  }

  fire({ scene, origin, direction }) {
    if (!this.canFire()) {
      return null;
    }

    let lastProjectile = null;
    for (let i = 0; i < this.burst; i += 1) {
      const spread = 0.01 * (i - (this.burst - 1) / 2);
      const shotDirection = direction
        .clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), spread)
        .normalize();

      const projectileMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfff3b0 })
      );
      projectileMesh.position.copy(origin);
      projectileMesh.castShadow = true;

      const projectile = new Projectile(
        projectileMesh,
        shotDirection.multiplyScalar(this.muzzleVelocity),
        { lifetime: this.projectileLifetime, maxDistance: this.projectileRange }
      );
      projectile.damage = this.damage;
      scene.add(projectile.mesh);
      lastProjectile = projectile;
    }

    this.cooldownTimer = this.cooldown;
    return lastProjectile;
  }
}
