import * as THREE from 'three';
import { AbstractTankFactory } from './AbstractTankFactory.js';
import { Tank } from '../entities/Tank.js';
import { TankMovementStrategy } from '../strategies/TankMovementStrategy.js';
import { TurretController } from '../entities/TurretController.js';

const DEFAULT_HULL_COLOR = 0x2a9d8f;
const DEFAULT_TRACK_COLOR = 0x1b4332;
const DEFAULT_TURRET_COLOR = 0xe76f51;
const DEFAULT_BARREL_COLOR = 0xf4a261;
const DEFAULT_BARREL_STYLE = {
  shape: 'cylinder',
  color: DEFAULT_BARREL_COLOR,
  length: 2.5,
  radius: 0.15
};

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
    domeHeight = 0.7,
    barrelAccentColor,
    weaponStyle = {},
    minElevation = -0.05,
    maxElevation = 0.75,
    defaultElevation = 0
  } = {}) {
    const turret = new THREE.Group();
    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, domeHeight, 24),
      new THREE.MeshStandardMaterial({ color })
    );
    dome.position.y = domeHeight / 2;
    dome.castShadow = true;
    dome.receiveShadow = true;

    turret.add(dome);
    const barrelPivot = new THREE.Object3D();
    barrelPivot.position.set(0, dome.position.y, 0);
    turret.add(barrelPivot);

    turret.userData.barrelPivot = barrelPivot;
    turret.userData.baseBarrelStyle = {
      ...DEFAULT_BARREL_STYLE,
      color: barrelColor,
      length: barrelLength,
      radius: barrelRadius,
      accentColor: barrelAccentColor
    };
    turret.userData.minElevation = minElevation;
    turret.userData.maxElevation = maxElevation;
    turret.userData.defaultElevation = defaultElevation;

    this.#applyWeaponStyleToTurret(turret, weaponStyle);
    if (typeof defaultElevation === 'number' && weaponStyle.defaultElevation === undefined) {
      barrelPivot.rotation.x = THREE.MathUtils.clamp(defaultElevation, minElevation, maxElevation);
    }

    return turret;
  }

  applyWeaponStyle(tank, weaponPreset) {
    if (!tank?.turretMesh) {
      return;
    }
    this.#applyWeaponStyleToTurret(tank.turretMesh, weaponPreset?.turretStyle);
    if (tank.turretController) {
      tank.turretController.barrelPivot = tank.turretMesh.userData?.barrelPivot ?? tank.turretMesh;
    }
    tank.recalculateBounds?.();
  }

  #applyWeaponStyleToTurret(turret, weaponStyle = {}) {
    const barrelPivot = turret.userData.barrelPivot;
    if (!barrelPivot) return;

    const baseStyle = turret.userData.baseBarrelStyle ?? DEFAULT_BARREL_STYLE;
    const style = {
      ...baseStyle,
      ...weaponStyle
    };

    if (turret.userData.barrelGroup) {
      barrelPivot.remove(turret.userData.barrelGroup);
    }
    if (turret.userData.muzzle) {
      barrelPivot.remove(turret.userData.muzzle);
    }

    const { group, muzzle } = this.#buildBarrelAssembly(style);
    barrelPivot.add(group);
    barrelPivot.add(muzzle);
    turret.userData.barrelGroup = group;
    turret.userData.muzzle = muzzle;
    turret.userData.currentBarrelStyle = style;

    if (typeof style.defaultElevation === 'number') {
      const min = turret.userData.minElevation ?? -Math.PI;
      const max = turret.userData.maxElevation ?? Math.PI;
      barrelPivot.rotation.x = THREE.MathUtils.clamp(style.defaultElevation, min, max);
    }
  }

  #buildBarrelAssembly({
    shape = 'cylinder',
    color = DEFAULT_BARREL_COLOR,
    accentColor,
    length = 2.5,
    radius = 0.15,
    spacing = 0.25
  } = {}) {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({ color });

    switch (shape) {
      case 'dual': {
        const barrelGeometry = new THREE.CylinderGeometry(radius, radius, length, 16);
        for (const offset of [-spacing, spacing]) {
          const barrel = new THREE.Mesh(barrelGeometry, material.clone());
          barrel.rotation.x = -Math.PI / 2;
          barrel.position.set(offset, 0, -length / 2);
          barrel.castShadow = true;
          group.add(barrel);
        }
        if (accentColor) {
          const connector = new THREE.Mesh(
            new THREE.BoxGeometry(spacing * 2 + radius * 1.5, radius * 1.4, length * 0.18),
            new THREE.MeshStandardMaterial({ color: accentColor })
          );
          connector.position.set(0, 0, -(length * 0.35));
          connector.castShadow = true;
          group.add(connector);
        }
        break;
      }
      case 'mortar': {
        const tube = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 1.1, radius * 0.9, length * 0.85, 24),
          material
        );
        tube.rotation.x = -Math.PI / 2;
        tube.position.set(0, 0, -(length * 0.45));
        tube.castShadow = true;
        group.add(tube);

        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(radius, length * 0.4, 24),
          new THREE.MeshStandardMaterial({ color: accentColor ?? color })
        );
        tip.rotation.x = -Math.PI / 2;
        tip.position.set(0, 0, -length * 0.9);
        tip.castShadow = true;
        group.add(tip);
        break;
      }
      default: {
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius, length, 20),
          material
        );
        barrel.rotation.x = -Math.PI / 2;
        barrel.position.set(0, 0, -length / 2);
        barrel.castShadow = true;
        group.add(barrel);

        if (accentColor) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius * 0.9, radius * 0.28, 10, 28),
            new THREE.MeshStandardMaterial({ color: accentColor })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(0, 0, -length * 0.3);
          ring.castShadow = true;
          group.add(ring);
        }
        break;
      }
    }

    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0, -length);

    return { group, muzzle };
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
    const turret = this.createTurret({ ...turretOptions, weaponStyle: weaponPreset?.turretStyle });
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
      rotationSpeed: turretOptions.rotationSpeed ?? 2.5,
      elevationSpeed: turretOptions.elevationSpeed ?? 1.4,
      minElevation: turretOptions.minElevation ?? (turret.userData?.minElevation ?? -0.05),
      maxElevation: turretOptions.maxElevation ?? (turret.userData?.maxElevation ?? 0.75)
    });
    tank.attachTurretController(turretController);

    this.applyWeaponStyle(tank, weaponPreset);

    return tank;
  }
}
