import * as THREE from 'three';
import { GameLoop } from '../core/engine/GameLoop.js';
import { SceneManager } from '../core/engine/SceneManager.js';
import { InputManager, InputEvents } from '../core/input/InputManager.js';
import { ArenaBuilder } from './ArenaBuilder.js';
import { StandardTankFactory } from './factories/StandardTankFactory.js';
import { GlobalEventBus } from '../core/events/EventBus.js';
import { TankPresets } from './config/TankPresets.js';
import { WeaponPresets } from './config/WeaponPresets.js';
import { LoadoutMenu } from './ui/LoadoutMenu.js';
import { UIEvents } from './ui/UIEvents.js';

export class TankBattleGame {
  constructor(canvas) {
    this.sceneManager = new SceneManager(canvas);
    this.gameLoop = new GameLoop();
    this.inputManager = InputManager.getInstance(window);
    this.projectiles = new Set();

    this.arenaSize = 40;
    const arenaBuilder = new ArenaBuilder({ size: this.arenaSize });
    arenaBuilder.build(this.sceneManager.scene);

    this.#setupCameraRig();

    this.factory = new StandardTankFactory({ arenaBounds: this.arenaSize });
    this.currentLoadout = { tankId: 'assault', weaponId: 'cannon' };
    this.loadoutMenu = new LoadoutMenu({
      tankPresets: TankPresets,
      weaponPresets: WeaponPresets,
      defaultTankId: this.currentLoadout.tankId,
      defaultWeaponId: this.currentLoadout.weaponId
    });

    this.#respawnTank();
    this.#subscribeToLoop();
    this.#bindFire();
    this.#bindLoadoutEvents();
  }

  #setupCameraRig() {
    this.cameraPivot = new THREE.Object3D();
    this.sceneManager.scene.add(this.cameraPivot);
    this.cameraPivot.add(this.sceneManager.camera);
    this.sceneManager.camera.position.set(0, 15, 15);
    this.sceneManager.camera.lookAt(0, 0, 0);
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
    this.playerTank = tank;

    this.loadoutMenu.markTankSelection(this.currentLoadout.tankId);
    this.loadoutMenu.markWeaponSelection(this.currentLoadout.weaponId);
  }

  #clearProjectiles(tank) {
    this.projectiles.forEach((projectile) => {
      projectile.destroy();
    });
    this.projectiles.clear();

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
        }
        this.projectiles.forEach((projectile) => {
          projectile.update(delta);
          if (!projectile.alive) {
            this.projectiles.delete(projectile);
          }
        });
        this.sceneManager.render();
      }
    });
  }

  #bindFire() {
    GlobalEventBus.subscribe(InputEvents.KEY_DOWN, (code) => {
      if (code === 'Space') {
        const projectile = this.playerTank?.fire(this.sceneManager.scene);
        if (projectile) {
          this.projectiles.add(projectile);
        }
      }
    });
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
    this.loadoutMenu.markWeaponSelection(weaponId);
  }

  start() {
    this.gameLoop.start();
  }
}
