import * as THREE from 'three';
import { Entity } from '../../core/entities/Entity.js';
import { TankStatusManager } from '../status/TankStatusManager.js';

export class Tank extends Entity {
  constructor({
    hullMesh,
    turretMesh,
    weapon,
    movementStrategy,
    arenaBounds,
    attributes = {},
    highlightController
  }) {
    super(hullMesh);
    this.turretMesh = turretMesh;
    this.weapon = weapon;
    this.movementStrategy = movementStrategy;
    this.projectiles = new Set();
    this.arenaBounds = arenaBounds;
    this.attributes = attributes;
    this.mesh.add(this.turretMesh);
    this.maxHealth = attributes.salute ?? 100;
    this.currentHealth = this.maxHealth;
    this.armor = attributes.armatura ?? 0;
    this.boundingRadius = this.#computeBoundingRadius();
    this.highlightController = null;
    this.statusManager = null;
    this.setHighlightController(highlightController ?? null);
  }

  update(delta, inputManager) {
    this.weapon.update(delta);
    this.movementStrategy?.move(this, inputManager, delta);
    if (inputManager) {
      this.turretController?.update(delta, inputManager);
    }

    this.statusManager?.update(delta);
    this.highlightController?.update(delta);

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
    if (this.weapon) {
      this.weapon.cooldownTimer = 0;
    }
  }

  getWeapon() {
    return this.weapon;
  }

  setMovementStrategy(strategy) {
    this.movementStrategy = strategy;
  }

  getMovementStrategy() {
    return this.movementStrategy;
  }

  reset(keepOrientation = false) {
    this.resetHealth();
    this.projectiles.forEach((projectile) => projectile.destroy());
    this.projectiles.clear();
    this.movementStrategy?.reset?.();
    this.statusManager?.clearAll();
    if (!keepOrientation) {
      this.mesh.rotation.set(0, 0, 0);
      if (this.turretMesh) {
        this.turretMesh.rotation.set(0, 0, 0);
        const pivot = this.turretMesh.userData?.barrelPivot;
        if (pivot) {
          const min = this.turretMesh.userData?.minElevation ?? -Math.PI;
          const max = this.turretMesh.userData?.maxElevation ?? Math.PI;
          const defaultElevation =
            this.turretMesh.userData?.currentBarrelStyle?.defaultElevation ??
            this.turretMesh.userData?.defaultElevation ??
            0;
          pivot.rotation.x = THREE.MathUtils.clamp(defaultElevation, min, max);
        }
      }
    }
  }

  fire(scene) {
    this.turretMesh.updateWorldMatrix(true, false);
    const muzzleWorldPos = new THREE.Vector3();
    const pivotWorldPos = new THREE.Vector3();
    const muzzle = this.turretMesh.userData?.muzzle;
    const pivot = this.turretMesh.userData?.barrelPivot ?? this.turretMesh;

    if (muzzle) {
      muzzle.getWorldPosition(muzzleWorldPos);
    } else {
      this.turretMesh.localToWorld(muzzleWorldPos.set(0, 0, -1.5));
    }

    pivot.getWorldPosition(pivotWorldPos);
    const direction = muzzleWorldPos.clone().sub(pivotWorldPos).normalize();

    const projectile = this.weapon.fire({ scene, origin: muzzleWorldPos, direction });
    if (projectile) {
      projectile.owner = this;
      this.projectiles.add(projectile);
    }
    return projectile;
  }

  clampToArena() {
    const half = this.arenaBounds / 2;
    const padding = Math.max(0.5, this.boundingRadius);
    this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x, -half + padding, half - padding);
    this.mesh.position.z = THREE.MathUtils.clamp(this.mesh.position.z, -half + padding, half - padding);
  }

  resetHealth() {
    this.currentHealth = this.maxHealth;
  }

  takeDamage(amount) {
    if (amount <= 0) return 0;
    const mitigatedAmount = this.statusManager?.modifyIncomingDamage(amount) ?? amount;
    const armor = this.armor ?? 0;
    const mitigation = 100 / (100 + armor);
    const appliedDamage = mitigatedAmount * mitigation;
    this.currentHealth = Math.max(0, this.currentHealth - appliedDamage);
    if (appliedDamage > 0) {
      this.highlightController?.applyHighlight({
        id: 'damage',
        color: 0xff4d6d,
        intensity: 2,
        duration: 0.4,
        pulse: true
      });
    }
    return appliedDamage;
  }

  isDestroyed() {
    return this.currentHealth <= 0;
  }

  getCurrentSpeed() {
    return this.movementStrategy?.getSpeed?.() ?? 0;
  }

  getBoundingRadius() {
    return this.boundingRadius;
  }

  recalculateBounds() {
    this.boundingRadius = this.#computeBoundingRadius();
  }

  heal(amount) {
    if (amount <= 0) return 0;
    const before = this.currentHealth;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    return this.currentHealth - before;
  }

  getStatusManager() {
    return this.statusManager;
  }

  getHighlightController() {
    return this.highlightController;
  }

  setHighlightController(controller) {
    this.highlightController = controller;
    this.statusManager = new TankStatusManager({ tank: this, highlight: this.highlightController });
  }

  #computeBoundingRadius() {
    const aggregate = new THREE.Box3();
    const temp = new THREE.Box3();
    let initialized = false;

    for (const child of this.mesh.children) {
      if (child === this.turretMesh) {
        continue;
      }
      temp.setFromObject(child);
      if (!initialized) {
        aggregate.copy(temp);
        initialized = true;
      } else {
        aggregate.union(temp);
      }
    }

    if (!initialized) {
      aggregate.setFromObject(this.mesh);
    }

    const size = new THREE.Vector3();
    aggregate.getSize(size);
    const footprintRadius = Math.sqrt(size.x * size.x + size.z * size.z) / 2;
    return footprintRadius * 0.95;
  }
}
