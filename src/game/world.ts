/**
 * Echoes of the Wild - Open World Generation, 8 Biomes, Harvestable Nodes & Day/Night Cycle
 */
import * as THREE from 'three';
import { HarvestableNode, RegionInfo } from '../types/game';
import { REGIONS } from './database';
import { getGrassTexture, getStoneTexture, getBarkTexture, getRuneStoneTexture } from './proceduralTextures';

export class WorldManager {
  public scene: THREE.Scene;
  public terrainMesh: THREE.Mesh;
  public waterMesh: THREE.Mesh;
  public harvestNodes: HarvestableNode[] = [];
  public nodeMeshes: Map<string, THREE.Group> = new Map();

  // Day / Night Lighting
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public starsGroup: THREE.Points;

  // Day Night Clock: 0 to 24 hours (starts at 08:00 AM)
  public gameTime: number = 8.5;
  public gameDay: number = 1;
  public timeSpeed: number = 0.05; // ~8 minutes real time for full 24h day

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Terrain Heightfield
    const terrainGeom = new THREE.PlaneGeometry(420, 420, 100, 100);
    terrainGeom.rotateX(-Math.PI / 2);

    const posAttr = terrainGeom.attributes.position;
    const count = posAttr.count;
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = this.getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      // Regional vertex color blending
      const color = this.getTerrainColorAt(vx, vz, vy);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    terrainGeom.computeVertexNormals();
    terrainGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const grassTex = getGrassTexture();
    grassTex.repeat.set(40, 40);

    const terrainMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.name = 'TerrainMesh';
    this.scene.add(this.terrainMesh);

    // 2. Crystal Lake Water Plane
    const waterGeom = new THREE.PlaneGeometry(130, 110, 24, 24);
    waterGeom.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.78,
    });
    this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
    this.waterMesh.position.set(-20, 0.4, 110);
    this.waterMesh.receiveShadow = true;
    this.waterMesh.name = 'WaterMesh';
    this.scene.add(this.waterMesh);

    // 3. Day / Night Lights
    this.ambientLight = new THREE.AmbientLight(0xdcfce7, 0.35);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e3a1e, 0.55);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    this.sunLight.position.set(80, 120, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;
    const shadowD = 60;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // Celestial Sun & Moon visual spheres
    const sunGeom = new THREE.SphereGeometry(6, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    const moonGeom = new THREE.SphereGeometry(4.5, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e7ff });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // Stars Field
    const starGeom = new THREE.BufferGeometry();
    const starCount = 800;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 450;
      starCoords[i + 1] = 90 + Math.random() * 80;
      starCoords[i + 2] = (Math.random() - 0.5) * 450;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    this.starsGroup = new THREE.Points(
      starGeom,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 })
    );
    this.scene.add(this.starsGroup);

    // Populate Initial World Features
    this.populateHarvestNodes();
    this.buildRuinsAndMonoliths();
  }

  public getTerrainHeight(x: number, z: number): number {
    // 1. Rocky Mountains zone: steep rise in northwest (-160 to -60, -180 to -60)
    if (x < -50 && z < -50) {
      const dist = Math.sqrt((x + 110) ** 2 + (z + 120) ** 2);
      const mountainH = Math.max(0, 32 - dist * 0.35) + Math.sin(x * 0.15) * 2.5 + Math.cos(z * 0.15) * 2.5;
      return mountainH;
    }

    // 2. Crystal Lake depression (-20, 110)
    const lakeDist = Math.sqrt((x + 20) ** 2 + (z - 110) ** 2);
    if (lakeDist < 55) {
      const depth = Math.max(-3.5, -3.5 * (1 - lakeDist / 55));
      return depth;
    }

    // 3. Ancient Ruins elevated plateau
    if (x > 60 && z < -60) {
      const plateau = Math.sin(x * 0.05) * 1.5 + Math.cos(z * 0.05) * 1.5 + 3.0;
      return Math.max(0, plateau);
    }

    // 4. Starting Forest & Plains gentle undulating hills
    const hills = Math.sin(x * 0.04) * 1.4 + Math.cos(z * 0.04) * 1.4 + Math.sin(x * 0.09 + z * 0.08) * 0.8;
    return Math.max(0.1, hills + 0.8);
  }

  private getTerrainColorAt(x: number, z: number, y: number): THREE.Color {
    // High mountain peaks: rocky grey/snow
    if (y > 14) {
      return new THREE.Color(0xd1d5db);
    }
    if (y > 7 && x < -40 && z < -40) {
      return new THREE.Color(0x6b7280);
    }
    // Lake shoreline sand
    if (y < 0.8 && Math.sqrt((x + 20) ** 2 + (z - 110) ** 2) < 65) {
      return new THREE.Color(0xeab308);
    }
    // Mystic Swamp bog green
    if (x > 40 && z > 50) {
      return new THREE.Color(0x274e35);
    }
    // Wild Plains golden savannah
    if (x > 20 && z > -50 && z < 50) {
      return new THREE.Color(0x84cc16);
    }
    // Default lush green forest
    return new THREE.Color(0x38a169);
  }

  public getRegionAt(x: number, z: number): RegionInfo {
    for (const r of REGIONS) {
      if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
        return r;
      }
    }
    return REGIONS[0];
  }

  private populateHarvestNodes() {
    const barkTex = getBarkTexture();
    const stoneTex = getStoneTexture();

    // 1. Whispering Forest Trees & Berries
    for (let i = 0; i < 45; i++) {
      const x = -85 + Math.random() * 95;
      const z = -50 + Math.random() * 95;
      const y = this.getTerrainHeight(x, z);

      if (Math.random() > 0.3) {
        this.addTree(x, y, z, 0.8 + Math.random() * 0.5, barkTex);
      } else {
        this.addBush(x, y, z);
      }
    }

    // 2. Plains Rocks & Flint
    for (let i = 0; i < 28; i++) {
      const x = 30 + Math.random() * 90;
      const z = -50 + Math.random() * 90;
      const y = this.getTerrainHeight(x, z);
      if (Math.random() > 0.4) {
        this.addRock(x, y, z, 'rock', stoneTex);
      } else {
        this.addRock(x, y, z, 'flint_node', stoneTex);
      }
    }

    // 3. Mountain Iron Ore Nodes
    for (let i = 0; i < 18; i++) {
      const x = -140 + Math.random() * 70;
      const z = -160 + Math.random() * 80;
      const y = this.getTerrainHeight(x, z);
      this.addRock(x, y, z, 'iron_node', stoneTex);
    }

    // 4. Swamp Glowing Spores / Mushrooms
    for (let i = 0; i < 20; i++) {
      const x = 50 + Math.random() * 80;
      const z = 70 + Math.random() * 80;
      const y = this.getTerrainHeight(x, z);
      this.addMushroom(x, y, z);
    }
  }

  private addTree(x: number, y: number, z: number, scale: number, barkTex: THREE.CanvasTexture) {
    const id = `node_tree_${this.harvestNodes.length}`;
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.set(scale, scale, scale);

    // Composite Tree: Trunk + 3 Layered Foliage Cones
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.35, 2.2, 7),
      new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.9 })
    );
    trunk.position.y = 1.1;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x228b22 : 0x2e8b57,
      roughness: 0.8,
    });

    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 7), foliageMat);
    cone1.position.y = 2.4;
    cone1.castShadow = true;
    group.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.5, 7), foliageMat);
    cone2.position.y = 3.3;
    cone2.castShadow = true;
    group.add(cone2);

    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 7), foliageMat);
    cone3.position.y = 4.1;
    cone3.castShadow = true;
    group.add(cone3);

    this.scene.add(group);
    this.nodeMeshes.set(id, group);

    this.harvestNodes.push({
      id,
      type: 'tree',
      name: 'Carvalho Silvestre',
      x,
      y,
      z,
      scale,
      health: 100,
      maxHealth: 100,
      requiredTool: 'axe',
      drops: [
        { itemId: 'wood', count: 4 },
        { itemId: 'stick', count: 3 },
      ],
      mesh: group,
    });
  }

  private addRock(x: number, y: number, z: number, type: 'rock' | 'flint_node' | 'iron_node', stoneTex: THREE.CanvasTexture) {
    const id = `node_${type}_${this.harvestNodes.length}`;
    const group = new THREE.Group();
    group.position.set(x, y, z);

    let color = 0x64748b;
    let name = 'Rocha Granítica';
    let drops = [{ itemId: 'stone', count: 4 }];

    if (type === 'flint_node') {
      color = 0x334155;
      name = 'Depósito de Sílex';
      drops = [
        { itemId: 'flint', count: 3 },
        { itemId: 'stone', count: 2 },
      ];
    } else if (type === 'iron_node') {
      color = 0x991b1b;
      name = 'Veio de Minério de Ferro';
      drops = [
        { itemId: 'iron_ore', count: 3 },
        { itemId: 'stone', count: 2 },
      ];
    }

    // Composite Boulder (3 overlapping faceted stones)
    const baseMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color,
      roughness: 0.7,
      metalness: type === 'iron_node' ? 0.4 : 0.1,
    });

    const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), baseMat);
    b1.position.set(0, 0.5, 0);
    b1.scale.set(1.2, 0.8, 1);
    b1.castShadow = true;
    group.add(b1);

    const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), baseMat);
    b2.position.set(0.4, 0.4, 0.2);
    b2.castShadow = true;
    group.add(b2);

    this.scene.add(group);
    this.nodeMeshes.set(id, group);

    this.harvestNodes.push({
      id,
      type,
      name,
      x,
      y,
      z,
      scale: 1,
      health: 80,
      maxHealth: 80,
      requiredTool: 'pickaxe',
      drops,
      mesh: group,
    });
  }

  private addBush(x: number, y: number, z: number) {
    const id = `node_bush_${this.harvestNodes.length}`;
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const bushMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.4 });

    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 7, 7), bushMat);
    b1.position.y = 0.45;
    b1.castShadow = true;
    group.add(b1);

    // Little berry clusters
    for (let i = 0; i < 5; i++) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), berryMat);
      berry.position.set(
        (Math.random() - 0.5) * 0.7,
        0.35 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.7
      );
      group.add(berry);
    }

    this.scene.add(group);
    this.nodeMeshes.set(id, group);

    this.harvestNodes.push({
      id,
      type: 'bush',
      name: 'Arbusto de Frutas Silvestres',
      x,
      y,
      z,
      scale: 1,
      health: 30,
      maxHealth: 30,
      requiredTool: 'any',
      drops: [
        { itemId: 'berries', count: 3 },
        { itemId: 'fiber', count: 3 },
      ],
      mesh: group,
    });
  }

  private addMushroom(x: number, y: number, z: number) {
    const id = `node_shroom_${this.harvestNodes.length}`;
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    );
    stem.position.y = 0.2;
    group.add(stem);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.8,
        roughness: 0.3,
      })
    );
    cap.position.y = 0.38;
    group.add(cap);

    this.scene.add(group);
    this.nodeMeshes.set(id, group);

    this.harvestNodes.push({
      id,
      type: 'bush',
      name: 'Cogumelo Luminescente',
      x,
      y,
      z,
      scale: 1,
      health: 20,
      maxHealth: 20,
      requiredTool: 'any',
      drops: [
        { itemId: 'swamp_mushroom', count: 2 },
        { itemId: 'fiber', count: 1 },
      ],
      mesh: group,
    });
  }

  private buildRuinsAndMonoliths() {
    const runeTex = getRuneStoneTexture();
    const stoneTex = getStoneTexture();

    // 1. Ancient Ruins (60 to 180, -180 to -60)
    for (let i = 0; i < 8; i++) {
      const rx = 80 + i * 12;
      const rz = -120 + (i % 2 === 0 ? 10 : -10);
      const ry = this.getTerrainHeight(rx, rz);

      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 5.5, 1.2),
        new THREE.MeshStandardMaterial({ map: runeTex, roughness: 0.7 })
      );
      pillar.position.set(rx, ry + 2.75, rz);
      pillar.rotation.y = Math.random() * 0.5;
      pillar.castShadow = true;
      this.scene.add(pillar);
    }

    // 2. Citadel of the Eternal Beacon (-40 to 60, -180 to -90)
    const altarGroup = new THREE.Group();
    altarGroup.name = 'CitadelAltar';
    const ax = 10;
    const az = -140;
    const ay = this.getTerrainHeight(ax, az);
    altarGroup.position.set(ax, ay, az);

    // Circular stone dais
    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 9, 0.8, 16),
      new THREE.MeshStandardMaterial({ map: runeTex, roughness: 0.6 })
    );
    dais.position.y = 0.4;
    dais.receiveShadow = true;
    altarGroup.add(dais);

    // Central Primordial Beacon Monolith
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.4, 7.5, 6),
      new THREE.MeshStandardMaterial({
        map: runeTex,
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
      })
    );
    beacon.position.y = 4.1;
    beacon.castShadow = true;
    altarGroup.add(beacon);

    // Beacon Top Floating Crystal Core
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 1.5,
        roughness: 0.1,
      })
    );
    crystal.position.y = 8.5;
    crystal.name = 'BeaconCrystal';
    altarGroup.add(crystal);

    this.scene.add(altarGroup);
  }

  public update(delta: number, playerPos: { x: number; y: number; z: number }) {
    // 1. Advance Game Clock
    this.gameTime = (this.gameTime + delta * this.timeSpeed) % 24;
    if (this.gameTime < delta * this.timeSpeed) {
      this.gameDay++;
    }

    // 2. Celestial Orbit (Sun & Moon)
    // 06:00 is sunrise, 12:00 midday, 18:00 sunset, 00:00 midnight
    const sunAngle = ((this.gameTime - 6) / 24) * Math.PI * 2;
    const sunOrbitDist = 180;
    const sunX = playerPos.x + Math.cos(sunAngle) * sunOrbitDist;
    const sunY = Math.sin(sunAngle) * sunOrbitDist;
    const sunZ = playerPos.z + 40;

    this.sunLight.position.set(sunX, Math.max(10, sunY), sunZ);
    this.sunLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
    this.sunLight.target.updateMatrixWorld();

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.moonMesh.position.set(-sunX, -sunY, sunZ);

    // Is Daytime?
    const isDay = sunY > 0;
    const dayFactor = Math.max(0, Math.min(1, (sunY + 15) / 50));

    // Dynamic light intensities
    this.sunLight.intensity = Math.max(0.1, dayFactor * 1.5);
    this.ambientLight.intensity = 0.2 + dayFactor * 0.35;
    this.hemiLight.intensity = 0.2 + dayFactor * 0.4;

    // Stars visibility
    const starsMat = this.starsGroup.material as THREE.PointsMaterial;
    starsMat.opacity = Math.max(0, 1 - dayFactor * 1.4);

    // Sky and Fog color transitions
    const skyColor = new THREE.Color();
    if (dayFactor > 0.6) {
      // Midday vibrant azure
      skyColor.setHex(0x38bdf8);
    } else if (dayFactor > 0.2) {
      // Sunset / Sunrise warm amber gold
      skyColor.setHex(0xf59e0b);
    } else {
      // Midnight deep mystic indigo
      skyColor.setHex(0x090d16);
    }

    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color.lerp(skyColor, 0.05);
    }

    // Beacon Crystal Rotation
    const crystal = this.scene.getObjectByName('BeaconCrystal');
    if (crystal) {
      crystal.rotation.y += delta * 1.2;
      crystal.position.y = 8.5 + Math.sin(Date.now() * 0.003) * 0.3;
    }
  }

  public harvestNode(nodeId: string, damage: number): { drops: { itemId: string; count: number }[]; destroyed: boolean } | null {
    const node = this.harvestNodes.find((n) => n.id === nodeId);
    if (!node) return null;

    node.health -= damage;
    if (node.health <= 0) {
      const mesh = this.nodeMeshes.get(nodeId);
      if (mesh) {
        this.scene.remove(mesh);
        this.nodeMeshes.delete(nodeId);
      }
      this.harvestNodes = this.harvestNodes.filter((n) => n.id !== nodeId);
      return { drops: node.drops, destroyed: true };
    }
    return { drops: [], destroyed: false };
  }
}
