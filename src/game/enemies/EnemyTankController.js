import * as THREE from 'three';

export class EnemyTankController {
  constructor({
    factory,
    preset,
    weaponPreset,
    spawnPosition = new THREE.Vector3(0, 0, -10),
    scene,
    respawnDelay = 3
  }) {
    this.factory = factory;
    this.preset = preset;
    this.weaponPreset = weaponPreset;
    this.spawnPosition = spawnPosition.clone?.() ?? spawnPosition;
    if (!(this.spawnPosition instanceof THREE.Vector3)) {
      this.spawnPosition = new THREE.Vector3().fromArray(this.spawnPosition);
    }
    this.scene = scene;
    this.respawnDelay = respawnDelay;

    this.tank = null;
    this.alive = false;
    this.respawnTimer = 0;
  }

  ensureSpawned() {
    if (this.alive) {
      return this.tank;
    }
    return this.spawn();
  }

  spawn() {
    if (this.tank) {
      this.scene.remove(this.tank.mesh);
    }
    const tank = this.factory.createTank({ preset: this.preset, weaponPreset: this.weaponPreset });
    tank.attachTurretController(null);
    tank.reset(true);
    tank.mesh.position.copy(this.spawnPosition);
    tank.mesh.rotation.y = Math.PI;
    tank.recalculateBounds();
    tank.resetHealth();
    this.scene.add(tank.mesh);
    this.tank = tank;
    this.alive = true;
    this.respawnTimer = 0;
    return tank;
  }

  update(delta, { onRespawn } = {}) {
    if (this.alive) {
      return;
    }
    if (this.respawnTimer > 0) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        const tank = this.spawn();
        onRespawn?.(tank);
      }
    }
  }

  takeDamage(amount, { onDeath } = {}) {
    if (!this.alive || !this.tank) {
      return 0;
    }
    const applied = this.tank.takeDamage(amount);
    if (this.tank.isDestroyed()) {
      this.#handleDeath(onDeath);
    }
    return applied;
  }

  #handleDeath(onDeath) {
    if (!this.tank) return;
    const deathPosition = this.tank.mesh.position.clone();
    this.scene.remove(this.tank.mesh);
    this.alive = false;
    this.respawnTimer = this.respawnDelay;
    onDeath?.(deathPosition);
  }

  getBoundingRadius() {
    return this.tank?.getBoundingRadius?.() ?? 0;
  }

  getPosition() {
    return this.tank?.mesh.position ?? this.spawnPosition;
  }

  getCurrentHealth() {
    return this.tank?.currentHealth ?? 0;
  }

  getMaxHealth() {
    return this.tank?.maxHealth ?? 0;
  }

  isAlive() {
    return this.alive;
  }

  getTank() {
    return this.tank;
  }
}
