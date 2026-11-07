/**
 * Echoes of the Wild - Creatures, Wildlife & AI State Machines
 * Built with composite 3–12 part Three.js models and responsive animal behavior.
 */
import * as THREE from 'three';
import { CreatureEntity, CreatureType } from '../types/game';
import { sound } from './audio';

export class CreatureManager {
  public creatures: CreatureEntity[] = [];
  public creatureMeshes: Map<string, THREE.Group> = new Map();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnCreature(type: CreatureType, x: number, y: number, z: number): CreatureEntity {
    const id = `creature_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const meshGroup = this.createCreatureMesh(type);
    meshGroup.position.set(x, y, z);
    this.scene.add(meshGroup);
    this.creatureMeshes.set(id, meshGroup);

    let maxHealth = 60;
    let name = 'Cervo Silvestre';
    let speed = 4.5;

    if (type === 'rabbit') {
      maxHealth = 25;
      name = 'Lebre da Floresta';
      speed = 6.0;
    } else if (type === 'wolf') {
      maxHealth = 90;
      name = 'Lobo das Sombras';
      speed = 5.2;
    } else if (type === 'boar') {
      maxHealth = 130;
      name = 'Javali Feroz';
      speed = 4.8;
    } else if (type === 'sentinel') {
      maxHealth = 400;
      name = 'Sentinela Rúnico Ancestral';
      speed = 2.8;
    }

    const entity: CreatureEntity = {
      id,
      type,
      name,
      x,
      y,
      z,
      rotation: Math.random() * Math.PI * 2,
      health: maxHealth,
      maxHealth,
      state: 'idle',
      stateTimer: 2 + Math.random() * 3,
      speed,
      targetX: x,
      targetZ: z,
      territoryX: x,
      territoryZ: z,
      attackCooldown: 0,
      meshGroup,
    };

    this.creatures.push(entity);
    return entity;
  }

  private createCreatureMesh(type: CreatureType): THREE.Group {
    const group = new THREE.Group();
    group.castShadow = true;

    if (type === 'deer') {
      // 1. Torso
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x965a32, roughness: 0.75 });
      const bellyMat = new THREE.MeshStandardMaterial({ color: 0xdfcbb5, roughness: 0.8 });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x4a3627, roughness: 0.5 });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.95, 8), bodyMat);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.85;
      body.castShadow = true;
      group.add(body);

      // 2. Neck & Head
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 6), bodyMat);
      neck.position.set(0.42, 1.15, 0);
      neck.rotation.z = -0.55;
      group.add(neck);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.18), bodyMat);
      head.position.set(0.58, 1.35, 0);
      group.add(head);

      // Ears & Antlers
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), bellyMat);
      earL.position.set(0.55, 1.48, 0.1);
      earL.rotation.z = -0.3;
      group.add(earL);

      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 4), bellyMat);
      earR.position.set(0.55, 1.48, -0.1);
      earR.rotation.z = -0.3;
      group.add(earR);

      // Antlers
      const antlerL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 4), hornMat);
      antlerL.position.set(0.52, 1.58, 0.12);
      antlerL.rotation.z = -0.4;
      antlerL.rotation.x = 0.2;
      group.add(antlerL);

      const antlerR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 4), hornMat);
      antlerR.position.set(0.52, 1.58, -0.12);
      antlerR.rotation.z = -0.4;
      antlerR.rotation.x = -0.2;
      group.add(antlerR);

      // 4 Articulated Legs
      const legPositions = [
        [0.32, -0.15],
        [0.32, 0.15],
        [-0.32, -0.15],
        [-0.32, 0.15],
      ];
      legPositions.forEach(([lx, lz], i) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.75, 6), bodyMat);
        leg.position.set(lx, 0.42, lz);
        leg.castShadow = true;
        leg.name = `leg_${i}`;
        group.add(leg);
      });
    } else if (type === 'rabbit') {
      const rabbitMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.8 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), rabbitMat);
      body.position.y = 0.2;
      body.scale.set(1.1, 0.9, 0.9);
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), rabbitMat);
      head.position.set(0.16, 0.28, 0);
      group.add(head);

      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.06), rabbitMat);
      earL.position.set(0.14, 0.42, 0.05);
      group.add(earL);

      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.06), rabbitMat);
      earR.position.set(0.14, 0.42, -0.05);
      group.add(earR);
    } else if (type === 'wolf') {
      const wolfMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.85, 8), wolfMat);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.6;
      group.add(body);

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 6), wolfMat);
      head.rotation.z = -Math.PI / 2;
      head.position.set(0.55, 0.75, 0);
      group.add(head);

      // Glowing eyes
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
      eyeL.position.set(0.56, 0.78, 0.08);
      group.add(eyeL);

      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
      eyeR.position.set(0.56, 0.78, -0.08);
      group.add(eyeR);

      // Tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.45, 6), wolfMat);
      tail.position.set(-0.52, 0.55, 0);
      tail.rotation.z = 0.8;
      group.add(tail);

      // Legs
      [
        [0.28, -0.14],
        [0.28, 0.14],
        [-0.28, -0.14],
        [-0.28, 0.14],
      ].forEach(([lx, lz], i) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.55, 6), wolfMat);
        leg.position.set(lx, 0.28, lz);
        leg.name = `leg_${i}`;
        group.add(leg);
      });
    } else if (type === 'boar') {
      const boarMat = new THREE.MeshStandardMaterial({ color: 0x452818, roughness: 0.85 });
      const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.3 });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), boarMat);
      body.position.y = 0.55;
      body.scale.set(1.2, 0.9, 0.9);
      group.add(body);

      const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.32, 6), boarMat);
      snout.rotation.z = Math.PI / 2;
      snout.position.set(0.52, 0.52, 0);
      group.add(snout);

      // Tusks
      const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 4), tuskMat);
      tuskL.position.set(0.55, 0.58, 0.12);
      tuskL.rotation.z = -0.5;
      group.add(tuskL);

      const tuskR = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 4), tuskMat);
      tuskR.position.set(0.55, 0.58, -0.12);
      tuskR.rotation.z = -0.5;
      group.add(tuskR);

      // Stout legs
      [
        [0.25, -0.18],
        [0.25, 0.18],
        [-0.25, -0.18],
        [-0.25, 0.18],
      ].forEach(([lx, lz], i) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.38, 6), boarMat);
        leg.position.set(lx, 0.2, lz);
        leg.name = `leg_${i}`;
        group.add(leg);
      });
    } else if (type === 'sentinel') {
      // Ancient Stone Golem Boss
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1f2429, roughness: 0.75, metalness: 0.2 });
      const runeGlowMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.2,
      });

      // Hovering stone torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 1.2, 6), stoneMat);
      torso.position.y = 1.6;
      group.add(torso);

      // Glowing central eye core
      const coreEye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), runeGlowMat);
      coreEye.position.set(0.42, 1.7, 0);
      group.add(coreEye);

      // Floating rotating runic rings
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 8, 24), runeGlowMat);
      ring1.position.y = 1.6;
      ring1.name = 'ring_1';
      group.add(ring1);

      // Floating heavy stone fists
      const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), stoneMat);
      fistL.position.set(0, 1.2, 0.95);
      fistL.name = 'fist_l';
      group.add(fistL);

      const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), stoneMat);
      fistR.position.set(0, 1.2, -0.95);
      fistR.name = 'fist_r';
      group.add(fistR);
    }

    return group;
  }

  public update(
    delta: number,
    playerPos: { x: number; y: number; z: number },
    playerIsCrouching: boolean,
    onPlayerHit: (damage: number) => void
  ) {
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];
      if (c.health <= 0) {
        c.state = 'dead';
        const mesh = this.creatureMeshes.get(c.id);
        if (mesh) {
          mesh.position.y = Math.max(-0.5, mesh.position.y - delta * 1.5);
          mesh.rotation.z += delta * 2;
          if (mesh.position.y <= -0.4) {
            this.scene.remove(mesh);
            this.creatureMeshes.delete(c.id);
            this.creatures.splice(i, 1);
            continue;
          }
        }
      }

      const dx = playerPos.x - c.x;
      const dz = playerPos.z - c.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);
      const detectionRadius = playerIsCrouching ? 6 : 14;

      c.stateTimer -= delta;
      c.attackCooldown = Math.max(0, c.attackCooldown - delta);

      // AI Logic by Type
      if (c.type === 'deer' || c.type === 'rabbit') {
        // Passive Wildlife
        if (distToPlayer < detectionRadius) {
          c.state = 'flee';
          // Run away from player
          const angle = Math.atan2(c.z - playerPos.z, c.x - playerPos.x);
          c.targetX = c.x + Math.cos(angle) * 20;
          c.targetZ = c.z + Math.sin(angle) * 20;
        } else if (c.stateTimer <= 0) {
          c.state = Math.random() > 0.4 ? 'wander' : 'idle';
          c.stateTimer = 3 + Math.random() * 4;
          c.targetX = c.territoryX + (Math.random() - 0.5) * 25;
          c.targetZ = c.territoryZ + (Math.random() - 0.5) * 25;
        }
      } else if (c.type === 'wolf' || c.type === 'boar' || c.type === 'sentinel') {
        // Hostile / Territorial Predators
        if (distToPlayer < (c.type === 'sentinel' ? 22 : detectionRadius)) {
          if (distToPlayer < 2.2) {
            c.state = 'attack';
            if (c.attackCooldown <= 0) {
              c.attackCooldown = 1.4;
              const dmg = c.type === 'sentinel' ? 35 : c.type === 'boar' ? 22 : 18;
              onPlayerHit(dmg);
              sound.playCreatureHit(c.type);
            }
          } else {
            c.state = 'stalk';
            c.targetX = playerPos.x;
            c.targetZ = playerPos.z;
          }
        } else if (c.stateTimer <= 0) {
          c.state = 'wander';
          c.stateTimer = 4 + Math.random() * 3;
          c.targetX = c.territoryX + (Math.random() - 0.5) * 20;
          c.targetZ = c.territoryZ + (Math.random() - 0.5) * 20;
        }
      }

      // Movement Execution
      if (c.state === 'flee' || c.state === 'wander' || c.state === 'stalk') {
        const mx = c.targetX - c.x;
        const mz = c.targetZ - c.z;
        const len = Math.sqrt(mx * mx + mz * mz);

        if (len > 0.3) {
          const moveSpeed = c.state === 'flee' ? c.speed * 1.3 : c.state === 'stalk' ? c.speed * 1.1 : c.speed * 0.5;
          const step = Math.min(len, moveSpeed * delta);
          c.x += (mx / len) * step;
          c.z += (mz / len) * step;

          // Face direction
          c.rotation = Math.atan2(mz, mx);
        }
      }

      // Update 3D Mesh
      const mesh = this.creatureMeshes.get(c.id);
      if (mesh) {
        mesh.position.x = c.x;
        mesh.position.z = c.z;
        mesh.rotation.y = -c.rotation;

        // Subtle animation ticks
        if (c.type === 'sentinel') {
          const ring = mesh.getObjectByName('ring_1');
          if (ring) ring.rotation.z += delta * 1.5;
        } else {
          // Leg swinging when moving
          const isMoving = c.state === 'flee' || c.state === 'wander' || c.state === 'stalk';
          const legPhase = isMoving ? Math.sin(Date.now() * 0.015) * 0.4 : 0;
          const leg0 = mesh.getObjectByName('leg_0');
          const leg1 = mesh.getObjectByName('leg_1');
          if (leg0 && leg1) {
            leg0.rotation.x = legPhase;
            leg1.rotation.x = -legPhase;
          }
        }
      }
    }
  }

  public damageCreatureAt(pos: { x: number; y: number; z: number }, range: number, damage: number): CreatureEntity | null {
    for (const c of this.creatures) {
      if (c.health <= 0) continue;
      const dist = Math.sqrt((c.x - pos.x) ** 2 + (c.z - pos.z) ** 2);
      if (dist <= range) {
        c.health -= damage;
        c.state = 'hurt';
        sound.playCreatureHit(c.type);
        return c;
      }
    }
    return null;
  }
}
