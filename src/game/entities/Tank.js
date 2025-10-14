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
    this.localBoundingBox = new THREE.Box3();
    this.worldBoundingBox = new THREE.Box3();
    this.boundingRadius = 1;
    this.footprintHalfSize = new THREE.Vector2(1, 1);
    this.highlightController = null;
    this.statusManager = null;
    this.terrainSampler = null;
    this.verticalVelocity = 0;
    this.gravity = -30;
    this.isGrounded = false;
    this.#recalculateBoundsInternal();
    this.setHighlightController(highlightController ?? null);
  }

  update(delta, inputManager) {
    this.weapon.update(delta);
    this.movementStrategy?.move(this, inputManager, delta);
    if (inputManager) {
      this.turretController?.update(delta, inputManager);
    }

    this.#applyGravity(delta);

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
    if (this.terrainSampler) {
      this.snapToGround();
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
    const padding = Math.max(0.5, Math.max(this.footprintHalfSize.x, this.footprintHalfSize.y));
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

  getBoundingBox(target = this.worldBoundingBox) {
    this.mesh.updateMatrixWorld(true);
    target.copy(this.localBoundingBox).applyMatrix4(this.mesh.matrixWorld);
    return target;
  }

  recalculateBounds() {
    this.#recalculateBoundsInternal();
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

  setTerrainSampler(sampler) {
    this.terrainSampler = sampler;
    this.snapToGround();
  }

  snapToGround() {
    if (!this.terrainSampler) {
      return;
    }
    const sample = this.terrainSampler.sample(this.mesh.position);
    this.mesh.position.y = sample.height;
    this.verticalVelocity = 0;
    this.isGrounded = true;
  }

  #applyGravity(delta) {
    if (!this.terrainSampler) {
      return;
    }

    const sample = this.terrainSampler.sample(this.mesh.position);
    const targetHeight = sample.height;
    const epsilon = 0.02;
    const position = this.mesh.position;

    if (position.y <= targetHeight + epsilon && this.verticalVelocity <= 0) {
      position.y = targetHeight;
      this.verticalVelocity = 0;
      this.isGrounded = true;
      return;
    }

    this.verticalVelocity += this.gravity * delta;
    position.y += this.verticalVelocity * delta;

    if (position.y <= targetHeight) {
      position.y = targetHeight;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  #recalculateBoundsInternal() {
    const aggregate = new THREE.Box3();
    aggregate.makeEmpty();
    const temp = new THREE.Box3();
    const inverse = new THREE.Matrix4();

    this.mesh.updateMatrixWorld(true);
    inverse.copy(this.mesh.matrixWorld).invert();

    const relevantChildren = this.mesh.children.filter((child) => child !== this.turretMesh);
    if (relevantChildren.length === 0) {
      relevantChildren.push(this.mesh);
    }

    for (const child of relevantChildren) {
      child.updateMatrixWorld(true);
      temp.setFromObject(child);
      temp.applyMatrix4(inverse);
      aggregate.union(temp);
    }

    if (aggregate.isEmpty()) {
      aggregate.setFromObject(this.mesh);
    }

    this.localBoundingBox.copy(aggregate);

    const size = new THREE.Vector3();
    this.localBoundingBox.getSize(size);
    this.boundingRadius = Math.sqrt(size.x * size.x + size.z * size.z) * 0.5;
    this.footprintHalfSize.set(Math.max(size.x / 2, 0.5), Math.max(size.z / 2, 0.5));
  }
}
