import * as THREE from 'three';

export class TerrainSampler {
  constructor({ surfaces = [], defaultHeight = 0, maxDistance = 100 } = {}) {
    this.surfaces = surfaces;
    this.defaultHeight = defaultHeight;
    this.maxDistance = maxDistance;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = maxDistance * 2;
    this.down = new THREE.Vector3(0, -1, 0);
    this.origin = new THREE.Vector3();
    this.normal = new THREE.Vector3(0, 1, 0);
    this.normalMatrix = new THREE.Matrix3();
  }

  setSurfaces(surfaces = []) {
    this.surfaces = surfaces;
  }

  sample(position) {
    if (!position) {
      return { height: this.defaultHeight, normal: this.normal.clone() };
    }

    this.origin.copy(position);
    this.origin.y = this.maxDistance;
    this.raycaster.set(this.origin, this.down);
    this.raycaster.far = this.maxDistance * 2;
    const intersections = this.raycaster.intersectObjects(this.surfaces, true);

    if (intersections.length > 0) {
      const hit = intersections[0];
      const { point, face, object } = hit;
      if (face && object) {
        this.normal.copy(face.normal);
        this.normalMatrix.getNormalMatrix(object.matrixWorld);
        this.normal.applyMatrix3(this.normalMatrix).normalize();
      } else {
        this.normal.set(0, 1, 0);
      }
      return { height: point.y, normal: this.normal.clone() };
    }

    return { height: this.defaultHeight, normal: this.normal.clone().set(0, 1, 0) };
  }
}
