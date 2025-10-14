import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import { Projectile } from '../projectiles/Projectile.js';

export class MachineGunWeapon extends Weapon {
  constructor({
    cooldown = 0.1,
    muzzleVelocity = 24,
    burst = 1,
    damage = 12,
    projectileAcceleration = new THREE.Vector3(0, -28, 0),
    projectileRadius = 0.12
  } = {}) {
    super({ cooldown, damage });
    this.muzzleVelocity = muzzleVelocity;
    this.burst = burst;
    this.projectileAcceleration = projectileAcceleration.clone?.() ?? projectileAcceleration;
    this.projectileRadius = projectileRadius;
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

      const projectile = new Projectile(projectileMesh, shotDirection.multiplyScalar(this.muzzleVelocity), {
        acceleration: this.projectileAcceleration?.clone?.() ?? this.projectileAcceleration,
        radius: this.projectileRadius
      });
      projectile.damage = this.damage;
      scene.add(projectile.mesh);
      lastProjectile = projectile;
    }

    this.cooldownTimer = this.cooldown;
    return lastProjectile;
  }
}
