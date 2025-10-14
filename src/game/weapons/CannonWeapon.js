import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import { Projectile } from '../projectiles/Projectile.js';

export class CannonWeapon extends Weapon {
  constructor({
    cooldown = 0.6,
    muzzleVelocity = 18,
    damage = 65,
    projectileAcceleration = new THREE.Vector3(0, -22, 0),
    projectileRadius = 0.2
  } = {}) {
    super({ cooldown, damage });
    this.muzzleVelocity = muzzleVelocity;
    this.projectileAcceleration = projectileAcceleration.clone?.() ?? projectileAcceleration;
    this.projectileRadius = projectileRadius;
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

    const projectile = new Projectile(projectileMesh, direction.clone().multiplyScalar(this.muzzleVelocity), {
      acceleration: this.projectileAcceleration?.clone?.() ?? this.projectileAcceleration,
      radius: this.projectileRadius
    });
    projectile.damage = this.damage;
    scene.add(projectile.mesh);

    this.cooldownTimer = this.cooldown;
    return projectile;
  }
}
