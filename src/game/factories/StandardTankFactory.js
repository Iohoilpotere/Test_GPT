import * as THREE from 'three';
import { AbstractTankFactory } from './AbstractTankFactory.js';
import { Tank } from '../entities/Tank.js';
import { TankMovementStrategy } from '../strategies/TankMovementStrategy.js';
import { CannonWeapon } from '../weapons/CannonWeapon.js';
import { TurretController } from '../entities/TurretController.js';
import { ExplosiveShotDecorator } from '../weapons/ExplosiveShotDecorator.js';

export class StandardTankFactory extends AbstractTankFactory {
  constructor({ arenaBounds }) {
    super();
    this.arenaBounds = arenaBounds;
  }

  createHull({ color = 0x2a9d8f } = {}) {
    const body = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.8, 4),
      new THREE.MeshStandardMaterial({ color })
    );
    base.castShadow = true;
    base.receiveShadow = true;

    const tracks = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x1b4332 })
    );
    tracks.position.y = -0.5;
    tracks.castShadow = true;
    tracks.receiveShadow = true;

    body.add(tracks);
    body.add(base);
    return body;
  }

  createTurret({ color = 0xe76f51 } = {}) {
    const turret = new THREE.Group();
    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 0.7, 24),
      new THREE.MeshStandardMaterial({ color })
    );
    dome.position.y = 0.35;
    dome.castShadow = true;
    dome.receiveShadow = true;

    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 2.5, 20),
      new THREE.MeshStandardMaterial({ color: 0xf4a261 })
    );
    cannon.rotation.x = -Math.PI / 2;
    cannon.position.z = -1.25;
    cannon.position.y = 0.35;
    cannon.castShadow = true;

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 1.25, 0);
    cannon.add(muzzle);

    turret.add(dome);
    turret.add(cannon);

    turret.userData.muzzle = muzzle;

    return turret;
  }

  createWeapon() {
    const baseWeapon = new CannonWeapon({ cooldown: 0.45, muzzleVelocity: 40 });
    return new ExplosiveShotDecorator(baseWeapon, { explosionRadius: 3 });
  }

  createMovementStrategy() {
    return new TankMovementStrategy({ acceleration: 35, maxSpeed: 12, rotationSpeed: 2.5 });
  }

  createTank({ hullOptions = {}, turretOptions = {}, weaponOptions = {} } = {}) {
    const hull = this.createHull(hullOptions);
    const turret = this.createTurret(turretOptions);
    const weapon = weaponOptions.decorator
      ? weaponOptions.decorator(this.createWeapon())
      : this.createWeapon();
    const movementStrategy = this.createMovementStrategy();

    turret.position.y = turretOptions.heightOffset ?? 0.55;

    const tank = new Tank({
      hullMesh: hull,
      turretMesh: turret,
      weapon,
      movementStrategy,
      arenaBounds: this.arenaBounds
    });

    const turretController = new TurretController(turret, {
      rotationSpeed: turretOptions.rotationSpeed ?? 2.5
    });
    tank.attachTurretController(turretController);

    return tank;
  }
}
