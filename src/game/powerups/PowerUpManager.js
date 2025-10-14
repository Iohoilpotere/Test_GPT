import * as THREE from 'three';

export class PowerUpManager {
  constructor({ scene, presets, arenaSize = 40, respawnDelay = 18, onPickup } = {}) {
    this.scene = scene;
    this.presets = presets;
    this.arenaSize = arenaSize;
    this.respawnDelay = respawnDelay;
    this.onPickup = onPickup;
    this.items = [];
    this.rotationSpeed = 1.4;
    this.#initialize();
  }

  #initialize() {
    const half = this.arenaSize / 2 - 2.5;
    const positions = [
      new THREE.Vector3(-half, 0.5, -half),
      new THREE.Vector3(half, 0.5, -half),
      new THREE.Vector3(-half, 0.5, half),
      new THREE.Vector3(half, 0.5, half)
    ];
    const presetList = Object.values(this.presets ?? {});
    for (let i = 0; i < positions.length && i < presetList.length; i += 1) {
      const preset = presetList[i];
      const mesh = this.#createMesh(preset);
      mesh.position.copy(positions[i]);
      this.scene.add(mesh);
      this.items.push({
        preset,
        mesh,
        active: true,
        respawnTimer: 0
      });
    }
  }

  #createMesh(preset) {
    const geometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
    const material = new THREE.MeshStandardMaterial({
      color: preset.color ?? 0xffffff,
      emissive: new THREE.Color(preset.color ?? 0xffffff).multiplyScalar(0.35),
      emissiveIntensity: 1.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const icon = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.08, 8, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(preset.color ?? 0xffffff).multiplyScalar(0.8),
        emissiveIntensity: 1.5
      })
    );
    icon.rotation.x = Math.PI / 2;
    icon.position.y = 0.4;
    mesh.add(icon);
    mesh.userData.radius = 1;
    return mesh;
  }

  update(delta, { playerTank } = {}) {
    for (const item of this.items) {
      if (item.active) {
        item.mesh.rotation.y += this.rotationSpeed * delta;
        this.#checkPickup(item, playerTank);
      } else {
        item.respawnTimer -= delta;
        if (item.respawnTimer <= 0) {
          item.active = true;
          item.mesh.visible = true;
        }
      }
    }
  }

  #checkPickup(item, playerTank) {
    if (!playerTank) return;
    const radius = (playerTank.getBoundingRadius?.() ?? 1.2) + (item.mesh.userData.radius ?? 0.6);
    if (playerTank.mesh.position.distanceTo(item.mesh.position) <= radius) {
      item.active = false;
      item.mesh.visible = false;
      item.respawnTimer = this.respawnDelay;
      const effectFactory = item.preset?.createEffect;
      if (typeof effectFactory === 'function') {
        const effect = effectFactory();
        this.onPickup?.({ preset: item.preset, effect, position: item.mesh.position.clone() });
      }
    }
  }

  dispose() {
    for (const item of this.items) {
      this.scene.remove(item.mesh);
    }
    this.items.length = 0;
  }
}
