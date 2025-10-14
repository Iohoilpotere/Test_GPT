import * as THREE from 'three';
import { Entity } from '../../core/entities/Entity.js';

export class Tank extends Entity {
  constructor({
    hullMesh,
    turretMesh,
    weapon,
    movementStrategy,
    arenaBounds,
    attributes = {}
  }) {
    super(hullMesh);
    this.turretMesh = turretMesh;
    this.weapon = weapon;
    this.movementStrategy = movementStrategy;
    this.projectiles = new Set();
    this.arenaBounds = arenaBounds;
    this.attributes = attributes;
    this.mesh.add(this.turretMesh);
  }

  update(delta, inputManager) {
    this.weapon.update(delta);
    this.movementStrategy.move(this, inputManager, delta);
    this.turretController?.update(delta, inputManager);

    this.projectiles.forEach((projectile) => {
      projectile.update(delta);
      if (!projectile.alive) {
        this.projectiles.delete(projectile);
      }
    });
  }

  attachTurretController(controller) {
    this.turretController = controller;
  }

  equipWeapon(weapon) {
    this.weapon = weapon;
  }

  fire(scene) {
    this.turretMesh.updateWorldMatrix(true, false);
    const worldQuaternion = new THREE.Quaternion();
    this.turretMesh.getWorldQuaternion(worldQuaternion);
    const direction = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(worldQuaternion)
      .normalize();
    const muzzleWorldPos = new THREE.Vector3();
    if (this.turretMesh.userData?.muzzle) {
      this.turretMesh.userData.muzzle.getWorldPosition(muzzleWorldPos);
    } else {
      this.turretMesh.localToWorld(muzzleWorldPos.set(0, 0, -1.5));
    }
    const projectile = this.weapon.fire({ scene, origin: muzzleWorldPos, direction });
    if (projectile) {
      this.projectiles.add(projectile);
    }
    return projectile;
  }

  clampToArena() {
    const half = this.arenaBounds / 2;
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -half + 1, half - 1);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -half + 1, half - 1);
  }
}
