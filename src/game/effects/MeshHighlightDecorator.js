import * as THREE from 'three';

/**
 * Decorator responsible for applying emissive highlights to a mesh hierarchy.
 * It follows the Decorator pattern by encapsulating highlight behaviour without
 * modifying the wrapped mesh objects.
 */
export class MeshHighlightDecorator {
  constructor(root) {
    if (!root) {
      throw new Error('MeshHighlightDecorator requires a root object.');
    }
    this.root = root;
    this.highlights = new Map();
    this.workingColor = new THREE.Color();
    this.tempColor = new THREE.Color();
    this.elapsedScratch = 0;
    this.meshes = [];
    this.#collectMeshes(root);
  }

  #collectMeshes(object) {
    object.traverse((child) => {
      if (child.isMesh) {
        const material = Array.isArray(child.material) ? child.material : [child.material];
        material.forEach((mat) => {
          if (!mat) return;
          if (!mat.userData) {
            mat.userData = {};
          }
          if (!mat.userData.__highlightOriginal) {
            mat.userData.__highlightOriginal = {
              emissive: mat.emissive ? mat.emissive.clone() : null,
              emissiveIntensity: mat.emissiveIntensity ?? 1
            };
          }
        });
        this.meshes.push(child);
      }
    });
  }

  applyHighlight({
    id,
    color,
    intensity = 1,
    duration = 0.4,
    pulse = false
  }) {
    if (!id) {
      throw new Error('Highlights require an id to avoid collisions.');
    }
    const entry = this.highlights.get(id) ?? {};
    entry.color = new THREE.Color(color);
    entry.intensity = intensity;
    entry.duration = duration;
    entry.remaining = duration;
    entry.pulse = pulse;
    entry.elapsed = 0;
    this.highlights.set(id, entry);
  }

  clearHighlight(id) {
    if (id && this.highlights.has(id)) {
      this.highlights.delete(id);
    }
  }

  update(delta) {
    if (this.highlights.size === 0) {
      this.#restoreMeshes();
      return;
    }

    let needsCleanup = false;
    this.workingColor.setRGB(0, 0, 0);
    let accumulatedIntensity = 0;

    for (const [id, highlight] of this.highlights) {
      highlight.elapsed += delta;
      if (highlight.duration && highlight.duration > 0) {
        highlight.remaining = Math.max(0, highlight.remaining - delta);
        if (highlight.remaining === 0) {
          needsCleanup = true;
          continue;
        }
      }

      const baseIntensity = highlight.intensity ?? 1;
      const modulator = highlight.pulse
        ? 0.5 + 0.5 * Math.sin(highlight.elapsed * Math.PI * 2)
        : 1;
      const intensity = baseIntensity * modulator;
      accumulatedIntensity += intensity;
      this.tempColor.copy(highlight.color).multiplyScalar(intensity);
      this.workingColor.add(this.tempColor);
    }

    if (needsCleanup) {
      for (const [id, highlight] of Array.from(this.highlights)) {
        if (highlight.remaining === 0) {
          this.highlights.delete(id);
        }
      }
    }

    if (accumulatedIntensity > 0) {
      this.workingColor.multiplyScalar(1 / accumulatedIntensity);
      this.#applyColor(this.workingColor, Math.min(accumulatedIntensity, 2.5));
    } else {
      this.#restoreMeshes();
    }
  }

  #applyColor(color, intensity) {
    for (const mesh of this.meshes) {
      const materialArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materialArray.forEach((mat) => {
        if (!mat) return;
        if (!mat.emissive) {
          mat.emissive = new THREE.Color(0x000000);
        }
        mat.emissive.copy(color);
        mat.emissiveIntensity = intensity;
      });
    }
  }

  #restoreMeshes() {
    for (const mesh of this.meshes) {
      const materialArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materialArray.forEach((mat) => {
        if (!mat) return;
        const original = mat.userData?.__highlightOriginal;
        if (original?.emissive) {
          mat.emissive.copy(original.emissive);
        }
        if (typeof original?.emissiveIntensity === 'number') {
          mat.emissiveIntensity = original.emissiveIntensity;
        }
      });
    }
  }
}
