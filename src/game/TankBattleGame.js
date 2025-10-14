import * as THREE from 'three';
import { GameLoop } from '../core/engine/GameLoop.js';
import { SceneManager } from '../core/engine/SceneManager.js';
import { InputManager, InputEvents } from '../core/input/InputManager.js';
import { ArenaBuilder } from './ArenaBuilder.js';
import { StandardTankFactory } from './factories/StandardTankFactory.js';
import { GlobalEventBus } from '../core/events/EventBus.js';

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
    this.#createPlayerTank();
    this.#subscribeToLoop();
    this.#bindFire();
  }

  #setupCameraRig() {
    this.cameraPivot = new THREE.Object3D();
    this.sceneManager.scene.add(this.cameraPivot);
    this.cameraPivot.add(this.sceneManager.camera);
    this.sceneManager.camera.position.set(0, 15, 15);
    this.sceneManager.camera.lookAt(0, 0, 0);
  }

  #createPlayerTank() {
    const factory = new StandardTankFactory({ arenaBounds: this.arenaSize });
    this.playerTank = factory.createTank();
    this.playerTank.mesh.position.set(0, 0.5, 0);
    this.sceneManager.scene.add(this.playerTank.mesh);
  }

  #subscribeToLoop() {
    this.gameLoop.subscribe({
      update: (delta) => {
        this.playerTank.update(delta, this.inputManager);
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
        const projectile = this.playerTank.fire(this.sceneManager.scene);
        if (projectile) {
          this.projectiles.add(projectile);
        }
      }
    });
  }

  start() {
    this.gameLoop.start();
  }
}
