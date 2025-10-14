export class Weapon {
  constructor({ cooldown = 0.75 } = {}) {
    if (new.target === Weapon) {
      throw new Error('Weapon is abstract.');
    }
    this.cooldown = cooldown;
    this.cooldownTimer = 0;
  }

  update(delta) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);
    }
  }

  canFire() {
    return this.cooldownTimer === 0;
  }

  fire(context) {
    throw new Error('fire() must be implemented.');
  }
}
