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

    this.arenaSize = 40;
    const arenaBuilder = new ArenaBuilder({ size: this.arenaSize });
    arenaBuilder.build(this.sceneManager.scene);

    this.#setupCameraRig();

    this.factory = new StandardTankFactory({ arenaBounds: this.arenaSize });
    this.currentLoadout = { tankId: 'assault', weaponId: 'cannon' };
    this.hud = new HudOverlay();
    this.loadoutMenu = new LoadoutMenu({
      tankPresets: TankPresets,
      weaponPresets: WeaponPresets,
      defaultTankId: this.currentLoadout.tankId,
      defaultWeaponId: this.currentLoadout.weaponId
    });

    this.enemyController = this.#createEnemyController();
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

    if (tank) {
      tank.projectiles.forEach((projectile) => {
        projectile.destroy();
      });
      tank.projectiles.clear();
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
        this.projectiles.forEach((projectile) => {
          projectile.update(delta);
          if (!projectile.alive) {
            this.projectiles.delete(projectile);
          }
        });
        this.enemyController?.update(delta, {
          onRespawn: (tank) => this.#styleEnemyTank(tank)
        });
        this.#handleProjectileCollisions();
        this.#updateEffects(delta);
        this.#updateHud();
        this.sceneManager.render();
      }
    });
  }

  #handleProjectileCollisions() {
    if (!this.enemyController?.isAlive()) {
      return;
    }
    const enemyPosition = this.enemyController.getPosition();
    const enemyRadius = this.enemyController.getBoundingRadius() + 0.6;

    this.projectiles.forEach((projectile) => {
      if (!projectile.alive) {
        this.projectiles.delete(projectile);
        return;
      }
      const explosionRadius = projectile.explosionRadius ?? 0;
      const collisionRadius = enemyRadius + Math.max(0.5, explosionRadius);
      if (projectile.mesh.position.distanceTo(enemyPosition) <= collisionRadius) {
        const damage = projectile.damage ?? 25;
        this.enemyController.takeDamage(damage, {
          onDeath: (position) => {
            this.#spawnExplosion(position, Math.max(4, explosionRadius * 2 || 4));
          }
        });
        this.#spawnExplosion(projectile.mesh.position, Math.max(2.2, explosionRadius * 1.4 || 2.2));
        projectile.destroy();
        this.projectiles.delete(projectile);
        this.playerTank?.projectiles.delete(projectile);
      }
    });
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
