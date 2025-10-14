import { Weapon } from './Weapon.js';

export class WeaponDecorator extends Weapon {
  constructor(weapon) {
    super({ cooldown: weapon.cooldown });
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
}
