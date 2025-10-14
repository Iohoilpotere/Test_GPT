import * as THREE from 'three';

export class ArenaBuilder {
  constructor({
    size = 40,
    wallHeight = 4,
    floorColor = 0x1a1a1a,
    rampColor = 0x5a5a5a
  } = {}) {
    this.size = size;
    this.wallHeight = wallHeight;
    this.floorColor = floorColor;
    this.rampColor = rampColor;
  }

  build(scene) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(this.size, this.size),
      new THREE.MeshStandardMaterial({ color: this.floorColor })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const wallThickness = 1;
    const wallLength = this.size;

    const createWall = (width, height, depth) =>
      new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);

    const walls = [];
    const half = this.size / 2;
    const positions = [
      { x: 0, y: this.wallHeight / 2, z: -half },
      { x: 0, y: this.wallHeight / 2, z: half },
      { x: -half, y: this.wallHeight / 2, z: 0 },
      { x: half, y: this.wallHeight / 2, z: 0 }
    ];
    const dimensions = [
      [wallLength, this.wallHeight, wallThickness],
      [wallLength, this.wallHeight, wallThickness],
      [wallThickness, this.wallHeight, wallLength],
      [wallThickness, this.wallHeight, wallLength]
    ];

    positions.forEach((pos, index) => {
      const wall = createWall(...dimensions[index]);
      wall.position.set(pos.x, pos.y, pos.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      walls.push(wall);
    });

    const rampAngle = THREE.MathUtils.degToRad(24);
    const rampLength = 10;
    const rampWidth = 6;
    const rampMaterial = new THREE.MeshStandardMaterial({
      color: this.rampColor,
      side: THREE.DoubleSide
    });
    const ramp = new THREE.Mesh(new THREE.PlaneGeometry(rampWidth, rampLength), rampMaterial);
    ramp.rotation.x = -Math.PI / 2 + rampAngle;
    const halfLength = rampLength / 2;
    const verticalOffset = Math.sin(rampAngle) * halfLength;
    ramp.position.set(-half + rampWidth / 1.8, verticalOffset, half - halfLength - 2);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(20, 30, 10);
    directional.castShadow = true;
    directional.shadow.camera.left = -this.size;
    directional.shadow.camera.right = this.size;
    directional.shadow.camera.top = this.size;
    directional.shadow.camera.bottom = -this.size;
    scene.add(directional);

    return { floor, walls, ramps: [ramp] };
  }
}
