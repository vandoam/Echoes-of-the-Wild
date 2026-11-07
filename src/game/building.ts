/**
 * Echoes of the Wild - Building & Placement System
 * Holographic placement preview with collision and 3-12 part procedural structures.
 */
import * as THREE from 'three';
import { PlacedStructure, StructureType } from '../types/game';
import { STRUCTURE_DEFS } from './database';
import { getWoodPlankTexture, getStoneTexture } from './proceduralTextures';
import { sound } from './audio';

export class BuildingManager {
  private scene: THREE.Scene;
  public placedStructures: PlacedStructure[] = [];
  public structureMeshes: Map<string, THREE.Group> = new Map();
  public ghostGroup: THREE.Group | null = null;
  public currentGhostType: StructureType | null = null;
  public ghostRotation: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setGhostType(type: StructureType | null) {
    if (this.ghostGroup) {
      this.scene.remove(this.ghostGroup);
      this.ghostGroup = null;
    }
    this.currentGhostType = type;
    if (!type) return;

    this.ghostGroup = this.createStructureMesh(type, true);
    this.scene.add(this.ghostGroup);
  }

  public rotateGhost() {
    this.ghostRotation = (this.ghostRotation + Math.PI / 4) % (Math.PI * 2);
    if (this.ghostGroup) {
      this.ghostGroup.rotation.y = this.ghostRotation;
    }
  }

  public updateGhostPosition(x: number, y: number, z: number, isValid: boolean) {
    if (!this.ghostGroup) return;
    this.ghostGroup.position.set(x, y, z);
    this.ghostGroup.rotation.y = this.ghostRotation;

    // Set holographic tint
    const ghostColor = isValid ? 0x22c55e : 0xef4444;
    this.ghostGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.color.setHex(ghostColor);
          mat.opacity = 0.55;
          mat.transparent = true;
        }
      }
    });
  }

  public placeStructure(
    type: StructureType,
    x: number,
    y: number,
    z: number,
    rotation: number
  ): PlacedStructure {
    const id = `struct_${type}_${Date.now()}`;
    const def = STRUCTURE_DEFS[type];

    const meshGroup = this.createStructureMesh(type, false);
    meshGroup.position.set(x, y, z);
    meshGroup.rotation.y = rotation;
    this.scene.add(meshGroup);
    this.structureMeshes.set(id, meshGroup);

    const structure: PlacedStructure = {
      id,
      type,
      x,
      y,
      z,
      rotation,
      health: def.maxHealth,
      customData: {
        isOpen: false,
        chestItems: type === 'storage_chest' ? new Array(12).fill(null) : undefined,
        fireFuel: type === 'campfire' ? 100 : undefined,
      },
    };

    this.placedStructures.push(structure);
    sound.playBuild();
    return structure;
  }

  public createStructureMesh(type: StructureType, isGhost: boolean): THREE.Group {
    const group = new THREE.Group();
    const woodTex = getWoodPlankTexture();
    const stoneTex = getStoneTexture();

    const woodMat = new THREE.MeshStandardMaterial({
      map: isGhost ? null : woodTex,
      color: isGhost ? 0x38bdf8 : 0x8b5a2b,
      roughness: 0.8,
      transparent: isGhost,
      opacity: isGhost ? 0.6 : 1,
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      map: isGhost ? null : stoneTex,
      color: isGhost ? 0x38bdf8 : 0x64748b,
      roughness: 0.7,
      transparent: isGhost,
      opacity: isGhost ? 0.6 : 1,
    });

    if (type === 'campfire') {
      // Ring of stones
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stoneMat);
        stone.position.set(Math.cos(angle) * 0.65, 0.12, Math.sin(angle) * 0.65);
        group.add(stone);
      }

      // Crossed logs
      for (let l = 0; l < 4; l++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6), woodMat);
        log.rotation.z = Math.PI / 4;
        log.rotation.y = (l * Math.PI) / 2;
        log.position.y = 0.2;
        group.add(log);
      }

      // Burning ember flame
      if (!isGhost) {
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.5, 6),
          new THREE.MeshBasicMaterial({ color: 0xff6600 })
        );
        flame.position.y = 0.35;
        flame.name = 'CampfireFlame';
        group.add(flame);

        const fireLight = new THREE.PointLight(0xff7700, 2.5, 12, 1.8);
        fireLight.position.y = 0.6;
        fireLight.name = 'FireLight';
        group.add(fireLight);
      }
    } else if (type === 'shelter') {
      // Lean-to Lean shelter with 4 corner posts and slanted thatch roof
      const postGeom = new THREE.CylinderGeometry(0.08, 0.1, 2.2, 6);
      [
        [-1.2, -0.8],
        [1.2, -0.8],
      ].forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeom, woodMat);
        post.position.set(px, 1.1, pz);
        group.add(post);
      });

      // Short back posts
      const shortPostGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6);
      [
        [-1.2, 0.8],
        [1.2, 0.8],
      ].forEach(([px, pz]) => {
        const post = new THREE.Mesh(shortPostGeom, woodMat);
        post.position.set(px, 0.4, pz);
        group.add(post);
      });

      // Slanted roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 2.1), woodMat);
      roof.position.set(0, 1.35, 0);
      roof.rotation.x = 0.55;
      group.add(roof);

      // Bed of dried leaves
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.12, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 })
      );
      bed.position.set(0, 0.08, 0);
      group.add(bed);
    } else if (type === 'workbench') {
      // Tabletop
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.9), woodMat);
      top.position.y = 0.85;
      group.add(top);

      // 4 Legs
      const legGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
      [
        [-0.65, -0.32],
        [0.65, -0.32],
        [-0.65, 0.32],
        [0.65, 0.32],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeom, woodMat);
        leg.position.set(lx, 0.4, lz);
        group.add(leg);
      });

      // Tools on bench
      const vice = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.14), stoneMat);
      vice.position.set(-0.5, 0.98, -0.2);
      group.add(vice);
    } else if (type === 'storage_chest') {
      // Chest Base
      const chestBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.6), woodMat);
      chestBase.position.y = 0.25;
      group.add(chestBase);

      // Chest Lid (hinged)
      const lidGroup = new THREE.Group();
      lidGroup.position.set(0, 0.48, -0.3);
      lidGroup.name = 'ChestLid';
      group.add(lidGroup);

      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.15, 0.62), woodMat);
      lid.position.set(0, 0.08, 0.3);
      lidGroup.add(lid);

      // Iron lock clasp
      const latch = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 })
      );
      latch.position.set(0, 0.32, 0.32);
      group.add(latch);
    } else if (type === 'wood_wall') {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 0.25), woodMat);
      wall.position.y = 1.1;
      group.add(wall);
    } else if (type === 'wood_door') {
      // Doorframe
      const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.25), woodMat);
      frameL.position.set(-1.1, 1.1, 0);
      group.add(frameL);

      const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.25), woodMat);
      frameR.position.set(1.1, 1.1, 0);
      group.add(frameR);

      // Door panel (hinged)
      const doorHinge = new THREE.Group();
      doorHinge.position.set(-1.0, 1.1, 0);
      doorHinge.name = 'DoorHinge';
      group.add(doorHinge);

      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.1, 0.14), woodMat);
      panel.position.set(1.0, 0, 0);
      doorHinge.add(panel);
    } else if (type === 'wood_floor') {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 2.6), woodMat);
      floor.position.y = 0.06;
      group.add(floor);
    } else if (type === 'stone_forge') {
      const kiln = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.6, 8), stoneMat);
      kiln.position.y = 0.8;
      group.add(kiln);

      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0xff3300 }));
      vent.position.set(0, 0.45, 0.85);
      group.add(vent);
    } else if (type === 'spikes') {
      for (let s = 0; s < 4; s++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 5), woodMat);
        spike.position.set(-0.8 + s * 0.5, 0.55, 0);
        spike.rotation.z = -0.25 + (s % 2) * 0.5;
        spike.rotation.x = 0.3;
        group.add(spike);
      }
    }

    return group;
  }

  public interactWithStructure(
    id: string,
    onOpenChest?: (structure: PlacedStructure) => void
  ): { type: string; message: string } | null {
    const s = this.placedStructures.find((item) => item.id === id);
    if (!s) return null;

    const mesh = this.structureMeshes.get(id);

    if (s.type === 'wood_door') {
      s.customData = s.customData || {};
      s.customData.isOpen = !s.customData.isOpen;
      const hinge = mesh?.getObjectByName('DoorHinge');
      if (hinge) {
        hinge.rotation.y = s.customData.isOpen ? Math.PI / 2 : 0;
      }
      return { type: 'door', message: s.customData.isOpen ? 'Porta aberta' : 'Porta trancada' };
    }

    if (s.type === 'storage_chest') {
      s.customData = s.customData || {};
      s.customData.isOpen = true;
      const lid = mesh?.getObjectByName('ChestLid');
      if (lid) lid.rotation.x = -Math.PI / 3;
      if (onOpenChest) onOpenChest(s);
      return { type: 'chest', message: 'Baú aberto' };
    }

    if (s.type === 'campfire') {
      return { type: 'campfire', message: 'Fogueira acesa: Cozinhar & Descansar' };
    }

    if (s.type === 'shelter') {
      return { type: 'shelter', message: 'Abrigo: Descansar & Ponto de Renascimento' };
    }

    if (s.type === 'workbench') {
      return { type: 'workbench', message: 'Bancada de Trabalho: Criação Avançada' };
    }

    return null;
  }

  public getNearestStructure(
    pos: { x: number; y: number; z: number },
    radius: number
  ): PlacedStructure | null {
    let nearest: PlacedStructure | null = null;
    let minDist = radius;

    for (const s of this.placedStructures) {
      const dist = Math.sqrt((s.x - pos.x) ** 2 + (s.z - pos.z) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }
}
