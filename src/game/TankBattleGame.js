import * as THREE from 'three';
import { GameLoop } from '../core/engine/GameLoop.js';
import { SceneManager } from '../core/engine/SceneManager.js';
import { InputManager } from '../core/input/InputManager.js';
import { ArenaBuilder } from './ArenaBuilder.js';
import { StandardTankFactory } from './factories/StandardTankFactory.js';
import { GlobalEventBus } from '../core/events/EventBus.js';
import { TankPresets } from './config/TankPresets.js';
import { WeaponPresets } from './config/WeaponPresets.js';
import { LoadoutMenu } from './ui/LoadoutMenu.js';
import { UIEvents } from './ui/UIEvents.js';
import { EnemyTankController } from './enemies/EnemyTankController.js';
import { HudOverlay } from './ui/HudOverlay.js';
import { ExplosionEffect } from './effects/ExplosionEffect.js';
import { FloatingCombatTextManager } from './ui/FloatingCombatTextManager.js';
import { PowerUpManager } from './powerups/PowerUpManager.js';
import { PowerUpPresets } from './config/PowerUpPresets.js';

const ENEMY_TANK_PRESET = {
  id: 'enemyTarget',
  label: 'Bersaglio corazzato',
  description: 'Bersaglio statico corazzato pensato per testare armamenti in arena.',
  hullOptions: {
    color: 0x9b2226,
    trackColor: 0x370617,
    scale: { x: 1.15, y: 1.05, z: 1.1 }
  },
  turretOptions: {
    color: 0xe63946,
    barrelColor: 0xffb4a2,
    barrelLength: 2.6,
    barrelRadius: 0.18,
    heightOffset: 0.58,
    rotationSpeed: 0
  },
  movement: {
    acceleration: 0,
    maxSpeed: 0,
    rotationSpeed: 0
  },
  stats: {
    salute: 160,
    armatura: 45,
    velocita: 0,
    manovrabilita: 0
  }
};

const ENEMY_WEAPON_APPEARANCE = {
  turretStyle: {
    shape: 'cylinder',
    color: 0xd90429,
    accentColor: 0xffccd5,
    length: 2.8,
    radius: 0.18,
    defaultElevation: 0.04
  }
};

export class TankBattleGame {
  constructor(canvas) {
    this.sceneManager = new SceneManager(canvas);
    this.gameLoop = new GameLoop();
    this.inputManager = InputManager.getInstance(window);
    this.projectiles = new Set();
    this.effects = new Set();
    this.collisionScratch = new THREE.Vector3();

    this.arenaSize = 40;
    const arenaBuilder = new ArenaBuilder({ size: this.arenaSize });
    this.arenaElements = arenaBuilder.build(this.sceneManager.scene);
    this.floorHeight = 0;
    this.wallInnerLimit = Math.max(this.arenaSize / 2 - 0.5, 0);

    this.#setupCameraRig();

    this.factory = new StandardTankFactory({ arenaBounds: this.arenaSize });
    this.currentLoadout = { tankId: 'assault', weaponId: 'cannon' };
    this.hud = new HudOverlay();
    this.combatText = new FloatingCombatTextManager();
    this.loadoutMenu = new LoadoutMenu({
      tankPresets: TankPresets,
      weaponPresets: WeaponPresets,
      defaultTankId: this.currentLoadout.tankId,
      defaultWeaponId: this.currentLoadout.weaponId
    });

    this.enemyController = this.#createEnemyController();
    this.powerUpManager = new PowerUpManager({
      scene: this.sceneManager.scene,
      presets: PowerUpPresets,
      arenaSize: this.arenaSize,
      onPickup: (payload) => this.#handlePowerUpPickup(payload)
    });
    this.#respawnTank();
    this.#subscribeToLoop();
    this.#bindLoadoutEvents();
  }

  #setupCameraRig() {
    this.cameraPivot = new THREE.Object3D();
    this.sceneManager.scene.add(this.cameraPivot);
    this.cameraPivot.add(this.sceneManager.camera);
    this.sceneManager.camera.position.set(0, 15, 15);
    this.sceneManager.camera.lookAt(0, 0, 0);
  }

  #createEnemyController() {
    const spawnHeight = (ENEMY_TANK_PRESET.hullOptions?.scale?.y ?? 1) * 0.5;
    const controller = new EnemyTankController({
      factory: this.factory,
      preset: ENEMY_TANK_PRESET,
      weaponPreset: WeaponPresets.cannon,
      spawnPosition: new THREE.Vector3(0, spawnHeight, -12),
      scene: this.sceneManager.scene,
      respawnDelay: 3
    });
    const tank = controller.ensureSpawned();
    this.#styleEnemyTank(tank);
    return controller;
  }

  #styleEnemyTank(tank) {
    if (!tank) return;
    this.factory.applyWeaponStyle(tank, ENEMY_WEAPON_APPEARANCE);
    tank.recalculateBounds();
  }

  #respawnTank() {
    if (this.playerTank) {
      this.#clearProjectiles(this.playerTank);
      this.sceneManager.scene.remove(this.playerTank.mesh);
    }

    const tankPreset = TankPresets[this.currentLoadout.tankId];
    const weaponPreset = WeaponPresets[this.currentLoadout.weaponId];
    const tank = this.factory.createTank({ preset: tankPreset, weaponPreset });
    const spawnHeight = (tankPreset.hullOptions?.scale?.y ?? 1) * 0.5;
    tank.mesh.position.set(0, spawnHeight, 0);
    this.sceneManager.scene.add(tank.mesh);
    tank.reset();
    this.playerTank = tank;

    this.loadoutMenu.markTankSelection(this.currentLoadout.tankId);
    this.loadoutMenu.markWeaponSelection(this.currentLoadout.weaponId);
    this.hud.updatePlayerStats({ health: tank.currentHealth, maxHealth: tank.maxHealth, speed: 0 });
    this.cameraPivot.position.copy(tank.mesh.position);
  }

  #clearProjectiles(tank) {
    this.projectiles.forEach((projectile) => {
      projectile.destroy();
    });
    this.projectiles.clear();

    this.effects.forEach((effect) => effect.dispose());
    this.effects.clear();
    this.combatText?.clear();

    if (tank) {
      tank.projectiles.forEach((projectile) => {
        projectile.destroy();
      });
      tank.projectiles.clear();
    }
  }

  #handlePowerUpPickup({ preset, effect, position } = {}) {
    if (!this.playerTank) {
      return;
    }
    const manager = this.playerTank.getStatusManager?.();
    if (manager && effect) {
      manager.addEffect(effect);
    }

    if (position) {
      const effectColor = preset?.color ?? 0xffffff;
      const burst = new ExplosionEffect(position.clone(), {
        duration: 0.6,
        maxScale: 2.2,
        color: effectColor
      });
      burst.addToScene(this.sceneManager.scene);
      this.effects.add(burst);
    }
  }

  #subscribeToLoop() {
    this.gameLoop.subscribe({
      update: (delta) => {
        if (this.playerTank) {
          this.playerTank.update(delta, this.inputManager);
          if (this.inputManager.isPressed('Space')) {
            const projectile = this.playerTank.fire(this.sceneManager.scene);
            if (projectile) {
              this.projectiles.add(projectile);
            }
          }
          this.cameraPivot.position.copy(this.playerTank.mesh.position);
          this.sceneManager.camera.lookAt(this.playerTank.mesh.position);
        }
        this.#resolveTankCollision();
        for (const projectile of Array.from(this.projectiles)) {
          projectile.update(delta);
          if (!projectile.alive) {
            this.#removeProjectile(projectile);
          }
        }
        this.enemyController?.update(delta, {
          onRespawn: (tank) => this.#styleEnemyTank(tank)
        });
        this.powerUpManager?.update(delta, { playerTank: this.playerTank });
        this.#handleProjectileCollisions();
        this.#updateEffects(delta);
        this.combatText.update(this.sceneManager.camera, delta);
        this.#updateHud();
        this.sceneManager.render();
      }
    });
  }

  #handleProjectileCollisions() {
    const halfLimit = this.wallInnerLimit ?? this.arenaSize / 2;
    const floorHeight = this.floorHeight ?? 0;

    for (const projectile of Array.from(this.projectiles)) {
      if (!projectile.alive) {
        this.#removeProjectile(projectile);
        continue;
      }

      const radius = projectile.getRadius?.() ?? projectile.radius ?? 0.2;
      const position = projectile.mesh.position;
      let directHit = null;
      let collided = false;

      if (this.enemyController?.isAlive()) {
        const enemyTank = this.enemyController.getTank?.();
        if (enemyTank) {
          const enemyRadius = enemyTank.getBoundingRadius();
          const distance = position.distanceTo(enemyTank.mesh.position);
          if (distance <= enemyRadius + radius) {
            collided = true;
            directHit = { type: 'enemy', tank: enemyTank };
          }
        }
      }

      if (!collided && this.playerTank && projectile.owner !== this.playerTank) {
        const playerRadius = this.playerTank.getBoundingRadius();
        const distance = position.distanceTo(this.playerTank.mesh.position);
        if (distance <= playerRadius + radius) {
          collided = true;
          directHit = { type: 'player', tank: this.playerTank };
        }
      }

      if (!collided && position.y - radius <= floorHeight) {
        collided = true;
      }

      if (
        !collided &&
        (Math.abs(position.x) >= halfLimit - radius || Math.abs(position.z) >= halfLimit - radius)
      ) {
        collided = true;
      }

      if (collided) {
        this.#detonateProjectile(projectile, { position: position.clone(), directHit });
      }
    }
  }

  #detonateProjectile(projectile, { position, directHit } = {}) {
    const explosionRadius = projectile.explosionRadius ?? 0;
    const damage = projectile.damage ?? 0;

    if (explosionRadius > 0) {
      this.#spawnExplosion(position, Math.max(2.2, explosionRadius * 1.4 || 2.2));
      this.#applyAreaDamage(position, explosionRadius, damage, projectile.owner);
    } else if (directHit && damage > 0) {
      this.#applyDirectDamage(directHit, damage, explosionRadius, position);
    }

    if (directHit && explosionRadius === 0 && damage <= 0) {
      // ensure hit feedback even without configured damage values
      this.#spawnExplosion(position, 1.8);
    }

    projectile.destroy();
    this.#removeProjectile(projectile);
  }

  #applyDirectDamage(targetDescriptor, damage, explosionRadius = 0, impactPosition) {
    if (!targetDescriptor?.type || damage <= 0) {
      return;
    }

    if (targetDescriptor.type === 'enemy' && this.enemyController?.isAlive()) {
      const enemyTank = this.enemyController.getTank?.();
      if (!enemyTank) {
        return;
      }
      const applied = this.enemyController.takeDamage(damage, {
        onDeath: (deathPosition) => {
          this.#spawnExplosion(deathPosition, Math.max(4, explosionRadius * 2 || 4));
        }
      });
      if (applied > 0) {
        this.#emitDamageNumber({
          tank: enemyTank,
          amount: applied,
          position: impactPosition ?? enemyTank.mesh.position.clone(),
          type: 'enemy'
        });
      }
    } else if (targetDescriptor.type === 'player' && targetDescriptor.tank) {
      const applied = targetDescriptor.tank.takeDamage(damage);
      if (applied > 0) {
        this.#emitDamageNumber({
          tank: targetDescriptor.tank,
          amount: applied,
          position: impactPosition ?? targetDescriptor.tank.mesh.position.clone(),
          type: 'player'
        });
      }
    }
  }

  #applyAreaDamage(center, radius, damage, sourceTank) {
    if (damage <= 0 || radius <= 0) {
      return;
    }

    if (this.enemyController?.isAlive()) {
      const enemyTank = this.enemyController.getTank?.();
      if (enemyTank) {
        this.#applyAreaDamageToTank(enemyTank, {
          center,
          radius,
          baseDamage: damage,
          type: 'enemy',
          onDeath: (position) => {
            this.#spawnExplosion(position, Math.max(4, radius * 2 || 4));
          }
        });
      }
    }

    if (this.playerTank && sourceTank !== this.playerTank) {
      this.#applyAreaDamageToTank(this.playerTank, {
        center,
        radius,
        baseDamage: damage,
        type: 'player'
      });
    }
  }

  #applyAreaDamageToTank(tank, { center, radius, baseDamage, type, onDeath } = {}) {
    if (!tank) {
      return 0;
    }
    const tankRadius = tank.getBoundingRadius?.() ?? 1;
    const distance = center.distanceTo(tank.mesh.position);
    const effectiveDistance = Math.max(0, distance - tankRadius);
    if (effectiveDistance > radius) {
      return 0;
    }
    const multiplier = this.#calculateAreaFalloff(radius, effectiveDistance);
    const amount = baseDamage * multiplier;
    if (amount <= 0) {
      return 0;
    }
    let applied = 0;
    if (type === 'enemy') {
      applied = this.enemyController.takeDamage(amount, { onDeath });
    } else {
      applied = tank.takeDamage(amount);
    }
    if (applied > 0) {
      const impactPosition = this.#computeImpactPoint(center, tank);
      this.#emitDamageNumber({ tank, amount: applied, position: impactPosition, type });
    }
    return applied;
  }

  #calculateAreaFalloff(radius, distance) {
    if (radius <= 0) {
      return 0;
    }
    const ratio = THREE.MathUtils.clamp(distance / radius, 0, 1);
    const multiplier = 1 - 0.75 * ratio;
    return THREE.MathUtils.clamp(multiplier, 0.25, 1);
  }

  #computeImpactPoint(center, tank) {
    const targetPosition = tank.mesh.position.clone();
    const direction = targetPosition.clone().sub(center);
    if (direction.lengthSq() === 0) {
      direction.set(0, 1, 0);
    } else {
      direction.normalize();
    }
    const radius = tank.getBoundingRadius?.() ?? 1;
    return targetPosition.clone().sub(direction.multiplyScalar(radius * 0.6));
  }

  #emitDamageNumber({ tank, amount, position, type }) {
    if (!tank || amount <= 0) {
      return;
    }
    const anchor = position ? position.clone() : tank.mesh.position.clone();
    const color = type === 'player' ? '#ff6b6b' : '#ffe066';
    this.combatText.spawnText({ amount, position: anchor, color });
  }

  #removeProjectile(projectile) {
    this.projectiles.delete(projectile);
    const owner = projectile.owner;
    if (owner?.projectiles instanceof Set) {
      owner.projectiles.delete(projectile);
    }
  }

  #updateEffects(delta) {
    this.effects.forEach((effect) => {
      effect.update(delta);
      if (!effect.alive) {
        this.effects.delete(effect);
      }
    });
  }

  #updateHud() {
    if (!this.playerTank) {
      return;
    }
    this.hud.updatePlayerStats({
      health: this.playerTank.currentHealth,
      maxHealth: this.playerTank.maxHealth,
      speed: this.playerTank.getCurrentSpeed()
    });
  }

  #resolveTankCollision() {
    if (!this.playerTank || !this.enemyController?.isAlive()) {
      return;
    }
    const enemyTank = this.enemyController.getTank?.();
    if (!enemyTank) {
      return;
    }
    const playerPosition = this.playerTank.mesh.position;
    const enemyPosition = enemyTank.mesh.position;
    this.collisionScratch.copy(playerPosition).sub(enemyPosition);
    let distance = this.collisionScratch.length();
    const minDistance = this.playerTank.getBoundingRadius() + enemyTank.getBoundingRadius();

    if (distance === 0) {
      this.collisionScratch.set(1, 0, 0);
      distance = 0;
    }

    if (distance < minDistance) {
      const penetration = minDistance - distance;
      this.collisionScratch.normalize();
      playerPosition.addScaledVector(this.collisionScratch, penetration);
      this.playerTank.movementStrategy?.resolveCollision?.(this.collisionScratch);
      this.playerTank.clampToArena();
    }
  }

  #spawnExplosion(position, radius = 3) {
    const origin = position.clone?.() ?? new THREE.Vector3().copy(position);
    const effect = new ExplosionEffect(origin, {
      maxScale: Math.max(3, radius * 2)
    });
    effect.addToScene(this.sceneManager.scene);
    this.effects.add(effect);
  }

  #bindLoadoutEvents() {
    GlobalEventBus.subscribe(UIEvents.SELECT_TANK, (tankId) => {
      if (this.currentLoadout.tankId === tankId || !TankPresets[tankId]) return;
      this.currentLoadout.tankId = tankId;
      this.#respawnTank();
    });

    GlobalEventBus.subscribe(UIEvents.SELECT_WEAPON, (weaponId) => {
      if (this.currentLoadout.weaponId === weaponId || !WeaponPresets[weaponId]) return;
      this.currentLoadout.weaponId = weaponId;
      this.#equipWeapon(weaponId);
    });
  }

  #equipWeapon(weaponId) {
    if (!this.playerTank) return;
    const weaponPreset = WeaponPresets[weaponId];
    const weapon = this.factory.createWeapon(weaponPreset);
    this.playerTank.equipWeapon(weapon);
    this.factory.applyWeaponStyle(this.playerTank, weaponPreset);
    this.loadoutMenu.markWeaponSelection(weaponId);
  }

  start() {
    this.gameLoop.start();
  }
}
