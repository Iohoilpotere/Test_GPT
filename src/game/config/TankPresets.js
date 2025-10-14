export const TankPresets = {
  scout: {
    id: 'scout',
    label: 'Ricognitore',
    description: 'Telaio leggero con accelerazione e rotazione elevate, ideale per manovre rapide.',
    hullOptions: {
      color: 0x3da5d9,
      trackColor: 0x1a759f,
      scale: { x: 0.85, y: 0.85, z: 0.9 }
    },
    turretOptions: {
      color: 0x56cfe1,
      barrelColor: 0x90e0ef,
      barrelLength: 2.1,
      barrelRadius: 0.12,
      heightOffset: 0.48,
      rotationSpeed: 3.6
    },
    movement: {
      acceleration: 42,
      maxSpeed: 18,
      rotationSpeed: 3.5
    },
    stats: {
      salute: 80,
      armatura: 25,
      velocita: 18,
      manovrabilita: 95
    }
  },
  assault: {
    id: 'assault',
    label: 'Assaltatore',
    description: 'Equilibrio fra resistenza e mobilità con un profilo versatile.',
    hullOptions: {
      color: 0x2a9d8f,
      trackColor: 0x1b4332,
      scale: { x: 1, y: 1, z: 1 }
    },
    turretOptions: {
      color: 0xe76f51,
      barrelColor: 0xf4a261,
      barrelLength: 2.5,
      barrelRadius: 0.15,
      heightOffset: 0.55,
      rotationSpeed: 2.8
    },
    movement: {
      acceleration: 32,
      maxSpeed: 14,
      rotationSpeed: 2.6
    },
    stats: {
      salute: 120,
      armatura: 55,
      velocita: 14,
      manovrabilita: 70
    }
  },
  juggernaut: {
    id: 'juggernaut',
    label: 'Juggernaut',
    description: 'Corazzato pesante con protezione massima e velocità ridotta.',
    hullOptions: {
      color: 0x5a189a,
      trackColor: 0x240046,
      scale: { x: 1.25, y: 1.1, z: 1.2 }
    },
    turretOptions: {
      color: 0x7b2cbf,
      barrelColor: 0x9d4edd,
      barrelLength: 3.1,
      barrelRadius: 0.2,
      heightOffset: 0.62,
      rotationSpeed: 2.1
    },
    movement: {
      acceleration: 22,
      maxSpeed: 10,
      rotationSpeed: 2.1
    },
    stats: {
      salute: 180,
      armatura: 90,
      velocita: 10,
      manovrabilita: 55
    }
  }
};
