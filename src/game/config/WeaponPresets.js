import { CannonWeapon } from '../weapons/CannonWeapon.js';
import { ExplosiveShotDecorator } from '../weapons/ExplosiveShotDecorator.js';
import { MachineGunWeapon } from '../weapons/MachineGunWeapon.js';
import { MortarWeapon } from '../weapons/MortarWeapon.js';

export const WeaponPresets = {
  cannon: {
    id: 'cannon',
    label: 'Cannone HE',
    description: 'Colpo esplosivo a medio rateo, bilanciato per la maggior parte degli scontri.',
    createWeapon: () =>
      new ExplosiveShotDecorator(
        new CannonWeapon({
          cooldown: 0.55,
          muzzleVelocity: 38,
          damage: 65,
          projectileRange: 22,
          projectileLifetime: 0.85
        }),
        {
          explosionRadius: 3.2
        }
      ),
    turretStyle: {
      shape: 'cylinder',
      color: 0xf4a261,
      accentColor: 0x264653,
      length: 3.2,
      radius: 0.18,
      defaultElevation: 0.02
    },
    stats: {
      danno: 65,
      rateo: 1.8,
      raggio: 3.2,
      velocitaProiettile: 38
    }
  },
  machineGun: {
    id: 'machineGun',
    label: 'Mitragliatrice Pesante',
    description: 'Fuoco rapido a bassa potenza per mantenere la pressione sugli avversari.',
    createWeapon: () =>
      new MachineGunWeapon({
        cooldown: 0.12,
        muzzleVelocity: 55,
        burst: 1,
        damage: 15,
        projectileRange: 16,
        projectileLifetime: 0.55
      }),
    turretStyle: {
      shape: 'dual',
      color: 0xd8d8d8,
      accentColor: 0x4cc9f0,
      length: 3.6,
      radius: 0.08,
      spacing: 0.32,
      defaultElevation: 0
    },
    stats: {
      danno: 15,
      rateo: 8,
      raggio: 0.5,
      velocitaProiettile: 55
    }
  },
  mortar: {
    id: 'mortar',
    label: 'Mortaio a Caduta',
    description: 'Granate ad arco con ampia area di effetto e potenza devastante.',
    createWeapon: () =>
      new ExplosiveShotDecorator(
        new MortarWeapon({
          cooldown: 1.4,
          muzzleVelocity: 26,
          arcHeight: 12,
          damage: 95,
          projectileRange: 28,
          projectileLifetime: 2.6
        }),
        { explosionRadius: 5 }
      ),
    turretStyle: {
      shape: 'mortar',
      color: 0x8d99ae,
      accentColor: 0xf2e9e4,
      length: 2.6,
      radius: 0.24,
      defaultElevation: 0.4
    },
    stats: {
      danno: 95,
      rateo: 0.7,
      raggio: 5,
      velocitaProiettile: 26
    }
  }
};
