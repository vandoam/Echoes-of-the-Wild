/**
 * Echoes of the Wild - Stylized Humanoid Hero Character Model & Kinematics
 * Built with composite Three.js groups (12+ articulated parts, weapon sockets, dynamic animations).
 */
import * as THREE from 'three';
import { getBarkTexture, getWoodPlankTexture } from './proceduralTextures';

export interface CharacterAnimState {
  isMoving: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isJumping: boolean;
  isSwimming: boolean;
  isAttacking: boolean;
  attackTime: number;
  isDodging: boolean;
  dodgeTime: number;
  isHarvesting: boolean;
  harvestTime: number;
}

export class CharacterController {
  public group: THREE.Group;
  public hips: THREE.Group;
  public spine: THREE.Group;
  public head: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftForearm: THREE.Group;
  public rightForearm: THREE.Group;
  public leftHand: THREE.Group;
  public rightHand: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public leftCalf: THREE.Group;
  public rightCalf: THREE.Group;
  public cloak: THREE.Mesh;
  public weaponSocket: THREE.Group;
  public torchLight: THREE.PointLight;

  private currentEquippedId: string | null = null;
  private animTimer: number = 0;
  private comboStep: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'HeroCharacter';

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdfa07a,
      roughness: 0.65,
      metalness: 0.05,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x422616,
      roughness: 0.8,
      metalness: 0.1,
    });

    const tunicMat = new THREE.MeshStandardMaterial({
      color: 0x2b4c3f, // Deep forest teal
      roughness: 0.75,
      metalness: 0.1,
    });

    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x664126,
      roughness: 0.5,
      metalness: 0.15,
    });

    const bootsMat = new THREE.MeshStandardMaterial({
      color: 0x332014,
      roughness: 0.6,
      metalness: 0.1,
    });

    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.8,
    });

    // 1. Hips / Pelvis (pivot at waist ~0.85m)
    this.hips = new THREE.Group();
    this.hips.position.y = 0.85;
    this.group.add(this.hips);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.16, 0.22, 10),
      tunicMat
    );
    pelvisMesh.castShadow = true;
    this.hips.add(pelvisMesh);

    // Leather belt and brass buckle
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.06, 10),
      leatherMat
    );
    belt.position.y = 0.06;
    belt.castShadow = true;
    this.hips.add(belt);

    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.04),
      goldAccentMat
    );
    buckle.position.set(0, 0.06, 0.18);
    this.hips.add(buckle);

    // Small pouch on right hip
    const pouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.07),
      leatherMat
    );
    pouch.position.set(0.18, 0.02, 0.04);
    pouch.rotation.z = -0.1;
    this.hips.add(pouch);

    // 2. Spine / Torso
    this.spine = new THREE.Group();
    this.spine.position.y = 0.12;
    this.hips.add(this.spine);

    const chestMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.19, 0.38, 10),
      tunicMat
    );
    chestMesh.position.y = 0.19;
    chestMesh.castShadow = true;
    this.spine.add(chestMesh);

    // Cross-body chest leather harness
    const harness = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.4, 0.26),
      leatherMat
    );
    harness.position.y = 0.19;
    harness.rotation.z = 0.55;
    this.spine.add(harness);

    // 3. Head & Hair
    this.head = new THREE.Group();
    this.head.position.y = 0.44;
    this.spine.add(this.head);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.1, 8),
      skinMat
    );
    neck.position.y = 0.03;
    this.head.add(neck);

    // Face skull
    const face = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 10),
      skinMat
    );
    face.position.y = 0.16;
    face.scale.set(0.9, 1.05, 0.95);
    face.castShadow = true;
    this.head.add(face);

    // Stylized Adventurer Hair
    const hairTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 10, 8),
      hairMat
    );
    hairTop.position.set(0, 0.2, -0.02);
    hairTop.scale.set(0.95, 0.85, 1.05);
    this.head.add(hairTop);

    // Flowing hair strands/braid at the back
    const hairBraid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.02, 0.28, 6),
      hairMat
    );
    hairBraid.position.set(0, 0.08, -0.15);
    hairBraid.rotation.x = -0.25;
    this.head.add(hairBraid);

    // 4. Arms
    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.25, 0.34, 0);
    this.spine.add(this.leftArm);

    const leftShoulderPad = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      leatherMat
    );
    this.leftArm.add(leftShoulderPad);

    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.22, 8),
      tunicMat
    );
    leftUpperArm.position.y = -0.11;
    this.leftArm.add(leftUpperArm);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -0.22;
    this.leftArm.add(this.leftForearm);

    const leftForearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.05, 0.2, 8),
      skinMat
    );
    leftForearmMesh.position.y = -0.1;
    this.leftForearm.add(leftForearmMesh);

    // Left hand
    this.leftHand = new THREE.Group();
    this.leftHand.position.y = -0.2;
    this.leftForearm.add(this.leftHand);

    const leftHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.06),
      skinMat
    );
    leftHandMesh.position.y = -0.04;
    this.leftHand.add(leftHandMesh);

    // Right Arm (Weapon Wielding)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.25, 0.34, 0);
    this.spine.add(this.rightArm);

    const rightShoulderPad = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      leatherMat
    );
    this.rightArm.add(rightShoulderPad);

    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.22, 8),
      tunicMat
    );
    rightUpperArm.position.y = -0.11;
    this.rightArm.add(rightUpperArm);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.22;
    this.rightArm.add(this.rightForearm);

    const rightForearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.05, 0.2, 8),
      skinMat
    );
    rightForearmMesh.position.y = -0.1;
    this.rightForearm.add(rightForearmMesh);

    this.rightHand = new THREE.Group();
    this.rightHand.position.y = -0.2;
    this.rightForearm.add(this.rightHand);

    const rightHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.06),
      skinMat
    );
    rightHandMesh.position.y = -0.04;
    this.rightHand.add(rightHandMesh);

    // Weapon Socket attached to right hand
    this.weaponSocket = new THREE.Group();
    this.weaponSocket.position.set(0, -0.06, 0.02);
    this.rightHand.add(this.weaponSocket);

    // Dynamic torch light
    this.torchLight = new THREE.PointLight(0xff9933, 0, 10, 1.5);
    this.torchLight.position.set(0, 0.4, 0);
    this.weaponSocket.add(this.torchLight);

    // 5. Legs
    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.11, -0.08, 0);
    this.hips.add(this.leftLeg);

    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.065, 0.38, 8),
      tunicMat
    );
    leftThigh.position.y = -0.19;
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);

    this.leftCalf = new THREE.Group();
    this.leftCalf.position.y = -0.38;
    this.leftLeg.add(this.leftCalf);

    const leftCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.36, 8),
      bootsMat
    );
    leftCalfMesh.position.y = -0.18;
    leftCalfMesh.castShadow = true;
    this.leftCalf.add(leftCalfMesh);

    // Left Boot Foot
    const leftFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.08, 0.18),
      bootsMat
    );
    leftFoot.position.set(0, -0.36, 0.04);
    leftFoot.castShadow = true;
    this.leftCalf.add(leftFoot);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.11, -0.08, 0);
    this.hips.add(this.rightLeg);

    const rightThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.065, 0.38, 8),
      tunicMat
    );
    rightThigh.position.y = -0.19;
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);

    this.rightCalf = new THREE.Group();
    this.rightCalf.position.y = -0.38;
    this.rightLeg.add(this.rightCalf);

    const rightCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.36, 8),
      bootsMat
    );
    rightCalfMesh.position.y = -0.18;
    rightCalfMesh.castShadow = true;
    this.rightCalf.add(rightCalfMesh);

    const rightFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.08, 0.18),
      bootsMat
    );
    rightFoot.position.set(0, -0.36, 0.04);
    rightFoot.castShadow = true;
    this.rightCalf.add(rightFoot);

    // 6. Flowing Cloak
    const cloakGeom = new THREE.PlaneGeometry(0.38, 0.65, 4, 6);
    const cloakMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    this.cloak = new THREE.Mesh(cloakGeom, cloakMat);
    this.cloak.position.set(0, 0.28, -0.14);
    this.cloak.rotation.x = 0.15;
    this.cloak.castShadow = true;
    this.spine.add(this.cloak);

    // Contact Grounding Shadow Plane
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 16),
      shadowMat
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    this.group.add(shadowPlane);
  }

  public setEquippedItem(itemId: string | null) {
    if (this.currentEquippedId === itemId) return;
    this.currentEquippedId = itemId;

    // Clear old weapon meshes
    while (this.weaponSocket.children.length > 1) {
      const child = this.weaponSocket.children[1];
      this.weaponSocket.remove(child);
    }

    this.torchLight.intensity = 0;

    if (!itemId) return;

    if (itemId === 'stone_axe') {
      const axe = this.createStoneAxeMesh();
      this.weaponSocket.add(axe);
    } else if (itemId === 'bone_spear') {
      const spear = this.createSpearMesh();
      this.weaponSocket.add(spear);
    } else if (itemId === 'iron_pickaxe') {
      const pickaxe = this.createPickaxeMesh();
      this.weaponSocket.add(pickaxe);
    } else if (itemId === 'runic_blade') {
      const blade = this.createRunicBladeMesh();
      this.weaponSocket.add(blade);
    } else if (itemId === 'torch') {
      const torch = this.createTorchMesh();
      this.weaponSocket.add(torch);
      this.torchLight.intensity = 2.2;
    }
  }

  private createStoneAxeMesh(): THREE.Group {
    const group = new THREE.Group();
    // Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x6e4a28, roughness: 0.8 })
    );
    shaft.position.y = 0.15;
    shaft.castShadow = true;
    group.add(shaft);

    // Stone blade
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.5 })
    );
    blade.position.set(0.06, 0.38, 0);
    blade.castShadow = true;
    group.add(blade);

    return group;
  }

  private createSpearMesh(): THREE.Group {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x7c4a1e, roughness: 0.7 })
    );
    shaft.position.y = 0.3;
    group.add(shaft);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.4 })
    );
    tip.position.y = 0.95;
    group.add(tip);

    return group;
  }

  private createPickaxeMesh(): THREE.Group {
    const group = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.022, 0.65, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3b1e, roughness: 0.8 })
    );
    handle.position.y = 0.18;
    group.add(handle);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.06, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8, roughness: 0.25 })
    );
    head.position.y = 0.45;
    head.rotation.z = 0.08;
    group.add(head);

    return group;
  }

  private createRunicBladeMesh(): THREE.Group {
    const group = new THREE.Group();
    // Guard
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 })
    );
    guard.position.y = 0.08;
    group.add(guard);

    // Glowing blade
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.75, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.15,
      })
    );
    blade.position.y = 0.45;
    group.add(blade);

    return group;
  }

  private createTorchMesh(): THREE.Group {
    const group = new THREE.Group();
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.55, 6),
      new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 })
    );
    branch.position.y = 0.15;
    group.add(branch);

    // Flame head
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff4400,
        emissiveIntensity: 1.8,
      })
    );
    flame.position.y = 0.42;
    flame.scale.set(0.8, 1.4, 0.8);
    group.add(flame);

    return group;
  }

  public updateAnimation(delta: number, state: CharacterAnimState) {
    this.animTimer += delta * (state.isSprinting ? 12 : 7);

    // 1. Attack Animation
    if (state.isAttacking) {
      const p = Math.min(1, state.attackTime / 0.45);
      // Combo swing motion
      const swingAngle = Math.sin(p * Math.PI) * 1.8;
      this.rightArm.rotation.x = -1.2 + swingAngle;
      this.rightArm.rotation.y = -0.5 + Math.cos(p * Math.PI) * 0.8;
      this.spine.rotation.y = Math.sin(p * Math.PI) * 0.4;
      return;
    }

    // 2. Harvest Animation (Chopping / Mining)
    if (state.isHarvesting) {
      const p = (state.harvestTime % 0.55) / 0.55;
      const chop = Math.sin(p * Math.PI * 2);
      this.rightArm.rotation.x = -1.6 + (chop > 0 ? chop * 1.4 : chop * 0.4);
      this.rightArm.rotation.z = -0.2;
      this.spine.rotation.x = chop > 0 ? 0.2 : -0.1;
      return;
    }

    // 3. Dodge Roll
    if (state.isDodging) {
      const p = Math.min(1, state.dodgeTime / 0.5);
      this.group.rotation.x = p * Math.PI * 2;
      this.hips.position.y = 0.45 + Math.sin(p * Math.PI) * 0.2;
      this.leftLeg.rotation.x = -0.8;
      this.rightLeg.rotation.x = -0.8;
      return;
    } else {
      this.group.rotation.x = 0;
    }

    // 4. Swimming
    if (state.isSwimming) {
      this.group.rotation.x = THREE.MathUtils.degToRad(65);
      this.hips.position.y = 0.2;
      const stroke = Math.sin(this.animTimer * 0.6);
      this.leftArm.rotation.x = stroke * 0.9;
      this.rightArm.rotation.x = -stroke * 0.9;
      this.leftLeg.rotation.x = -stroke * 0.4;
      this.rightLeg.rotation.x = stroke * 0.4;
      return;
    }

    // Reset base posture
    this.group.rotation.x = 0;
    this.hips.position.y = state.isCrouching ? 0.6 : 0.85;

    // 5. Jump / In Air
    if (state.isJumping) {
      this.leftLeg.rotation.x = -0.4;
      this.rightLeg.rotation.x = 0.3;
      this.leftArm.rotation.x = -0.8;
      this.rightArm.rotation.x = -0.6;
      return;
    }

    // 6. Locomotion (Walk & Run)
    if (state.isMoving) {
      const legStride = Math.sin(this.animTimer);
      const armStride = -legStride;
      const amp = state.isSprinting ? 0.9 : 0.55;

      this.leftLeg.rotation.x = legStride * amp;
      this.rightLeg.rotation.x = -legStride * amp;

      this.leftCalf.rotation.x = Math.max(0, -legStride * amp * 0.8);
      this.rightCalf.rotation.x = Math.max(0, legStride * amp * 0.8);

      this.leftArm.rotation.x = armStride * amp * 0.8;
      this.rightArm.rotation.x = -armStride * amp * 0.8;

      // Vertical bounce
      this.hips.position.y = (state.isCrouching ? 0.6 : 0.85) + Math.abs(Math.sin(this.animTimer * 2)) * 0.04;

      // Cloak sway
      this.cloak.rotation.x = 0.25 + (state.isSprinting ? 0.4 : 0.15) + Math.sin(this.animTimer) * 0.1;
    } else {
      // Idle Breathing
      const breath = Math.sin(this.animTimer * 0.4) * 0.03;
      this.spine.position.y = 0.12 + breath;
      this.head.rotation.y = Math.sin(this.animTimer * 0.2) * 0.08;
      this.leftArm.rotation.x = breath;
      this.rightArm.rotation.x = -breath;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftCalf.rotation.x = 0;
      this.rightCalf.rotation.x = 0;
      this.cloak.rotation.x = 0.15 + breath * 0.5;
    }

    // Crouch posture
    if (state.isCrouching) {
      this.spine.rotation.x = 0.3;
      this.leftLeg.rotation.x += 0.4;
      this.rightLeg.rotation.x += 0.4;
    } else {
      this.spine.rotation.x = 0;
    }
  }
}
