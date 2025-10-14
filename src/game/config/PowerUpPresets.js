import { DamageBoostWeaponDecorator } from '../weapons/DamageBoostWeaponDecorator.js';
import { SpeedBoostMovementDecorator } from '../strategies/SpeedBoostMovementDecorator.js';

const TEN_SECONDS = 10;

export const PowerUpPresets = {
  repair: {
    id: 'repair',
    label: 'Kit Riparazione',
    color: 0x2ec4b6,
    highlight: { color: 0x2ec4b6, intensity: 1.8, pulse: true },
    duration: TEN_SECONDS,
    createEffect: () => ({
      id: 'repair',
      duration: TEN_SECONDS,
      highlight: { color: 0x2ec4b6, intensity: 1.6, pulse: true },
      onApply: (tank, context) => {
        context.healPerSecond = Math.max(6, tank.maxHealth * 0.05);
      },
      onUpdate: (tank, context, delta) => {
        const healAmount = (context.healPerSecond ?? 6) * delta;
        tank.heal(healAmount);
      }
    })
  },
  damage: {
    id: 'damage',
    label: 'Potenzia Danni',
    color: 0xff922b,
    highlight: { color: 0xff922b, intensity: 1.8, pulse: true },
    duration: TEN_SECONDS,
    createEffect: () => ({
      id: 'damage',
      duration: TEN_SECONDS,
      highlight: { color: 0xff922b, intensity: 1.8, pulse: false },
      onApply: (tank, context) => {
        context.originalWeapon = tank.getWeapon();
        context.decoratedWeapon = new DamageBoostWeaponDecorator(context.originalWeapon, 1.4);
        tank.equipWeapon(context.decoratedWeapon);
      },
      onRemove: (tank, context) => {
        if (tank.getWeapon() === context.decoratedWeapon && context.originalWeapon) {
          tank.equipWeapon(context.originalWeapon);
        }
      }
    })
  },
  speed: {
    id: 'speed',
    label: 'Turbo',
    color: 0x4dabf7,
    highlight: { color: 0x4dabf7, intensity: 1.6, pulse: true },
    duration: TEN_SECONDS,
    createEffect: () => ({
      id: 'speed',
      duration: TEN_SECONDS,
      highlight: { color: 0x4dabf7, intensity: 1.5, pulse: true },
      onApply: (tank, context) => {
        context.originalStrategy = tank.getMovementStrategy();
        context.decoratedStrategy = new SpeedBoostMovementDecorator(context.originalStrategy, {
          speedMultiplier: 1.35,
          turnMultiplier: 1.2
        });
        tank.setMovementStrategy(context.decoratedStrategy);
      },
      onRemove: (tank, context) => {
        if (tank.getMovementStrategy() === context.decoratedStrategy && context.originalStrategy) {
          tank.setMovementStrategy(context.originalStrategy);
        }
      }
    })
  },
  shield: {
    id: 'shield',
    label: 'Scudo Prismatico',
    color: 0xb197fc,
    highlight: { color: 0xb197fc, intensity: 2.1, pulse: false },
    duration: TEN_SECONDS,
    createEffect: () => ({
      id: 'shield',
      duration: TEN_SECONDS,
      highlight: { color: 0xb197fc, intensity: 2.1, pulse: false },
      modifyIncomingDamage: (amount) => amount * 0.5
    })
  }
};
