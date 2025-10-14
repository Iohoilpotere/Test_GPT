export class Entity {
  constructor(mesh) {
    this.mesh = mesh;
    this.components = new Set();
  }

  addComponent(component) {
    this.components.add(component);
  }

  update(delta) {
    this.components.forEach((component) => component.update?.(delta));
  }
}
