import { Weapon } from './Weapon.js';

export class WeaponDecorator extends Weapon {
  constructor(weapon) {
    if (!weapon) {
      throw new Error('WeaponDecorator requires a weapon instance.');
    }
    super({ cooldown: weapon.cooldown, damage: weapon.damage });
    this.weapon = weapon;
  }

  update(delta) {
    this.weapon.update(delta);
  }

  canFire() {
    return this.weapon.canFire();
  }

  fire(context) {
    return this.weapon.fire(context);
  }

  get damage() {
    return this.weapon.damage;
  }

  set damage(value) {
    this.weapon.damage = value;
  }
}
