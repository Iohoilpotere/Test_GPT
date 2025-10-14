import * as THREE from 'three';
import { Weapon } from './Weapon.js';
import { Projectile } from '../projectiles/Projectile.js';

export class MortarWeapon extends Weapon {
  constructor({
    cooldown = 1.2,
    muzzleVelocity = 16,
    arcHeight = 10,
    damage = 95,
    projectileRange = 18,
    projectileLifetime = 2.2,
    gravity = new THREE.Vector3(0, -18, 0)
  } = {}) {
    super({ cooldown, damage });
    this.muzzleVelocity = muzzleVelocity;
    this.arcHeight = arcHeight;
    this.gravity = gravity.clone?.() ?? gravity;
    this.projectileRange = projectileRange;
    this.projectileLifetime = projectileLifetime;
  }

  fire({ scene, origin, direction }) {
    if (!this.canFire()) {
      return null;
    }

    const arcingDirection = direction.clone();
    arcingDirection.y += this.arcHeight / 20;
    arcingDirection.normalize();

    const projectileMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xff6f59 })
    );
    projectileMesh.position.copy(origin);
    projectileMesh.castShadow = true;

    const velocity = arcingDirection.multiplyScalar(this.muzzleVelocity);
    const projectile = new Projectile(projectileMesh, velocity, {
      lifetime: this.projectileLifetime,
      acceleration: this.gravity?.clone?.() ?? this.gravity,
      maxDistance: this.projectileRange
    });
    projectile.damage = this.damage;
    scene.add(projectile.mesh);

    this.cooldownTimer = this.cooldown;
    return projectile;
  }
}
