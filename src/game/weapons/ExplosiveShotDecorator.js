import { WeaponDecorator } from './WeaponDecorator.js';

export class ExplosiveShotDecorator extends WeaponDecorator {
  constructor(weapon, { explosionRadius = 2 } = {}) {
    super(weapon);
    this.explosionRadius = explosionRadius;
  }

  fire(context) {
    const projectile = this.weapon.fire(context);
    if (projectile) {
      projectile.explosionRadius = this.explosionRadius;
    }
    return projectile;
  }
}
