import * as THREE from 'three';
import { AbstractTankFactory } from './AbstractTankFactory.js';
import { Tank } from '../entities/Tank.js';
import { TankMovementStrategy } from '../strategies/TankMovementStrategy.js';
import { TurretController } from '../entities/TurretController.js';

const DEFAULT_HULL_COLOR = 0x2a9d8f;
const DEFAULT_TRACK_COLOR = 0x1b4332;
const DEFAULT_TURRET_COLOR = 0xe76f51;
const DEFAULT_BARREL_COLOR = 0xf4a261;

export class StandardTankFactory extends AbstractTankFactory {
  constructor({ arenaBounds }) {
    super();
    this.arenaBounds = arenaBounds;
  }

  createHull({ color = DEFAULT_HULL_COLOR, trackColor = DEFAULT_TRACK_COLOR, scale } = {}) {
    const body = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.8, 4),
      new THREE.MeshStandardMaterial({ color })
    );
    base.castShadow = true;
    base.receiveShadow = true;

    const tracks = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 4.2),
      new THREE.MeshStandardMaterial({ color: trackColor })
    );
    tracks.position.y = -0.5;
    tracks.castShadow = true;
    tracks.receiveShadow = true;

    body.add(tracks);
    body.add(base);

    if (scale) {
      body.scale.set(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
    }

    return body;
  }

  createTurret({
    color = DEFAULT_TURRET_COLOR,
    barrelColor = DEFAULT_BARREL_COLOR,
    barrelLength = 2.5,
    barrelRadius = 0.15,
    domeHeight = 0.7
  } = {}) {
    const turret = new THREE.Group();
    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, domeHeight, 24),
      new THREE.MeshStandardMaterial({ color })
    );
    dome.position.y = domeHeight / 2;
    dome.castShadow = true;
    dome.receiveShadow = true;

    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 20),
      new THREE.MeshStandardMaterial({ color: barrelColor })
    );
    cannon.rotation.x = -Math.PI / 2;
    cannon.position.set(0, dome.position.y, -barrelLength / 2);
    cannon.castShadow = true;

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, dome.position.y, -barrelLength);

    turret.add(dome);
    turret.add(cannon);
    turret.add(muzzle);

    turret.userData.muzzle = muzzle;

    return turret;
  }

  createMovementStrategy(options = {}) {
    return new TankMovementStrategy(options);
  }

  createWeapon(weaponPreset) {
    if (!weaponPreset || typeof weaponPreset.createWeapon !== 'function') {
      throw new Error('weaponPreset with createWeapon() is required.');
    }
    return weaponPreset.createWeapon();
  }

  createTank({ preset, weaponPreset }) {
    const { hullOptions = {}, turretOptions = {}, movement = {}, stats = {}, label, description } = preset;
    const hull = this.createHull(hullOptions);
    const turret = this.createTurret(turretOptions);
    const movementStrategy = this.createMovementStrategy(movement);
    const weapon = this.createWeapon(weaponPreset);

    turret.position.y = turretOptions.heightOffset ?? 0.55;

    const tank = new Tank({
      hullMesh: hull,
      turretMesh: turret,
      weapon,
      movementStrategy,
      arenaBounds: this.arenaBounds,
      attributes: {
        ...stats,
        label,
        description
      }
    });

    const turretController = new TurretController(turret, {
      rotationSpeed: turretOptions.rotationSpeed ?? 2.5
    });
    tank.attachTurretController(turretController);

    return tank;
  }
}
