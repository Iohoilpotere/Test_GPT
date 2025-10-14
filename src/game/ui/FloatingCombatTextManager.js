import * as THREE from 'three';

export class FloatingCombatTextManager {
  constructor() {
    this.entries = new Set();
    this.root = this.#createRoot();
    this.camera = null;
    this.scratchVector = new THREE.Vector3();
  }

  #createRoot() {
    const root = document.createElement('div');
    root.id = 'floating-combat-text';
    document.body.appendChild(root);
    return root;
  }

  spawnText({ amount, position, color = '#ffec99', lifespan = 1.2 }) {
    if (!position) return;
    const entry = {
      element: document.createElement('span'),
      position: position.clone(),
      elapsed: 0,
      lifespan,
      offset: Math.random() * 0.6 + 0.4
    };
    entry.element.className = 'combat-text';
    entry.element.style.setProperty('--combat-text-color', color);
    entry.element.textContent = Math.round(amount).toString();
    this.root.appendChild(entry.element);
    this.entries.add(entry);
    return entry;
  }

  update(camera, delta) {
    this.camera = camera;
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (const entry of Array.from(this.entries)) {
      entry.elapsed += delta;
      if (entry.elapsed >= entry.lifespan) {
        this.root.removeChild(entry.element);
        this.entries.delete(entry);
        continue;
      }

      const worldPos = this.scratchVector.copy(entry.position);
      worldPos.y += entry.offset * (entry.elapsed / entry.lifespan);
      worldPos.project(camera);

      const x = (worldPos.x * 0.5 + 0.5) * width;
      const y = (-worldPos.y * 0.5 + 0.5) * height;
      entry.element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      entry.element.style.opacity = (1 - entry.elapsed / entry.lifespan).toFixed(2);
    }
  }

  clear() {
    for (const entry of this.entries) {
      this.root.removeChild(entry.element);
    }
    this.entries.clear();
  }
}
