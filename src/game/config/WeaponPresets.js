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
      new ExplosiveShotDecorator(new CannonWeapon({ cooldown: 0.55, muzzleVelocity: 38 }), {
        explosionRadius: 3.2
      }),
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
    createWeapon: () => new MachineGunWeapon({ cooldown: 0.12, muzzleVelocity: 55, burst: 1 }),
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
        new MortarWeapon({ cooldown: 1.4, muzzleVelocity: 26, arcHeight: 12 }),
        { explosionRadius: 5 }
      ),
    stats: {
      danno: 95,
      rateo: 0.7,
      raggio: 5,
      velocitaProiettile: 26
    }
  }
};
