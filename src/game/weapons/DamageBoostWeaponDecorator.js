import { WeaponDecorator } from './WeaponDecorator.js';

export class DamageBoostWeaponDecorator extends WeaponDecorator {
  constructor(weapon, multiplier = 1.2) {
    super(weapon);
    this.multiplier = multiplier;
  }

  fire(context) {
    const projectile = this.weapon.fire(context);
    if (projectile) {
      const baseDamage = projectile.damage ?? this.weapon.damage ?? 0;
      projectile.damage = baseDamage * this.multiplier;
    }
    return projectile;
  }

  get damage() {
    return (this.weapon.damage ?? 0) * this.multiplier;
  }

  set damage(value) {
    this.weapon.damage = value;
  }
}
