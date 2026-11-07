/**
 * Echoes of the Wild - Master Three.js Game Engine & Third-Person Camera
 * Follows Three.js Skill: RoomEnvironment, Software WebGL guard, pre-allocated vectors, smooth damping.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CharacterController, CharacterAnimState } from './character';
import { WorldManager } from './world';
import { CreatureManager } from './creatures';
import { BuildingManager } from './building';
import { SurvivalEngine } from './survivalEngine';
import { sound } from './audio';
import { ITEMS } from './database';

// Pre-allocated math helpers (Zero GC in animation loop)
const _camOffset = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public isSoftwareGl: boolean;

  public character: CharacterController;
  public world: WorldManager;
  public creatures: CreatureManager;
  public building: BuildingManager;
  public survival: SurvivalEngine;

  // Player Kinematics
  public playerPos = { x: -30, y: 1.5, z: 0 };
  public playerVel = { x: 0, y: 0, z: 0 };
  public playerRotY = 0;
  public isGrounded = true;

  // Third-Person Camera Parameters
  public camYaw = 0;
  public camPitch = 0.28; // ~16 degrees downward angle
  public camDistance = 3.6; // Close cinematic third-person view
  public targetCamDistance = 3.6;

  // Animation States
  public animState: CharacterAnimState = {
    isMoving: false,
    isSprinting: false,
    isCrouching: false,
    isJumping: false,
    isSwimming: false,
    isAttacking: false,
    attackTime: 0,
    isDodging: false,
    dodgeTime: 0,
    isHarvesting: false,
    harvestTime: 0,
  };

  // Input states
  public input = {
    moveX: 0,
    moveZ: 0,
    sprint: false,
    jump: false,
    crouch: false,
    attack: false,
    dodge: false,
    interact: false,
  };

  private animationFrameId: number = 0;
  private lastTime: number = performance.now();
  public onStateUpdate?: (engine: GameEngine) => void;
  public contextualAction: { label: string; action: () => void } | null = null;
  public isRunning: boolean = true;

  constructor(container: HTMLElement) {
    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.012);

    this.camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );

    // 4. Procedural Studio PMREM Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Initialize Subsystems
    this.world = new WorldManager(this.scene);
    this.character = new CharacterController();
    this.scene.add(this.character.group);

    this.creatures = new CreatureManager(this.scene);
    this.building = new BuildingManager(this.scene);
    this.survival = new SurvivalEngine();

    // Spawn Initial Fauna
    this.spawnInitialWildlife();

    // Try loading existing save
    const saved = this.survival.loadFromStorage();
    if (saved) {
      this.playerPos.x = saved.playerPosition.x;
      this.playerPos.y = saved.playerPosition.y;
      this.playerPos.z = saved.playerPosition.z;
      this.playerRotY = saved.playerPosition.rotation;
      this.world.gameTime = saved.gameTime;
      this.world.gameDay = saved.gameDay;

      // Rebuild placed structures
      if (saved.structures && saved.structures.length > 0) {
        for (const s of saved.structures) {
          this.building.placeStructure(s.type, s.x, s.y, s.z, s.rotation);
        }
      }
    }

    // Set initial equipped mesh
    this.updateEquippedWeapon();

    // Start Main Loop
    this.startLoop();
  }

  private spawnInitialWildlife() {
    // Starting Forest: Peaceful Deer & Rabbits
    this.creatures.spawnCreature('deer', -40, 1.5, 15);
    this.creatures.spawnCreature('deer', -65, 1.5, -20);
    this.creatures.spawnCreature('rabbit', -25, 1.2, 5);
    this.creatures.spawnCreature('rabbit', -35, 1.2, -15);

    // Wild Plains: Boars & Wolves
    this.creatures.spawnCreature('boar', 55, 1.5, 10);
    this.creatures.spawnCreature('boar', 85, 1.5, -25);
    this.creatures.spawnCreature('wolf', 70, 1.5, 35);
    this.creatures.spawnCreature('wolf', 110, 1.5, -10);

    // Ancient Ruins: Rune Sentinel Guardian Boss
    this.creatures.spawnCreature('sentinel', 110, 3.5, -130);
  }

  public updateEquippedWeapon() {
    const activeHotbarSlot = this.survival.hotbar[this.survival.activeHotbarIndex];
    const equippedMain = this.survival.equipped.mainHand;
    const currentWeaponId = activeHotbarSlot?.itemId || equippedMain?.itemId || null;
    this.character.setEquippedItem(currentWeaponId);
  }

  public handleResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- Player Actions ---

  public triggerAttack() {
    if (this.animState.isAttacking || this.animState.isDodging) return;
    if (!this.survival.consumeStamina(14)) return;

    this.animState.isAttacking = true;
    this.animState.attackTime = 0;
    sound.playSwing();

    // Calculate attack hitbox in front of player
    const activeItem = this.survival.equipped.mainHand || this.survival.hotbar[this.survival.activeHotbarIndex];
    const dmg = activeItem ? ITEMS[activeItem.itemId]?.damage || 15 : 10;

    const hitDist = 2.4;
    const hitX = this.playerPos.x - Math.sin(this.playerRotY) * hitDist;
    const hitZ = this.playerPos.z - Math.cos(this.playerRotY) * hitDist;

    // Check hit on creatures
    const hitCreature = this.creatures.damageCreatureAt({ x: hitX, y: this.playerPos.y, z: hitZ }, 2.0, dmg);
    if (hitCreature) {
      if (hitCreature.health <= 0) {
        // Creature defeated: loot dropped!
        if (hitCreature.type === 'deer' || hitCreature.type === 'boar') {
          this.survival.addItem('raw_meat', 2);
          this.survival.addItem('leather', 2);
          this.survival.trackQuestProgress('hunt_beast', 1);
        } else if (hitCreature.type === 'wolf') {
          this.survival.addItem('raw_meat', 1);
          this.survival.addItem('leather', 3);
        } else if (hitCreature.type === 'sentinel') {
          this.survival.addItem('ancient_shard', 4);
          this.survival.addItem('ancient_key_star', 1);
          this.survival.trackQuestProgress('find_key_star', 1);
        }
      }
    }
  }

  public triggerDodge() {
    if (this.animState.isDodging || this.animState.isSwimming) return;
    if (!this.survival.consumeStamina(20)) return;

    this.animState.isDodging = true;
    this.animState.dodgeTime = 0;
    sound.playDodge();

    // Dodge impulse
    const dodgeSpeed = 12.0;
    this.playerVel.x = -Math.sin(this.playerRotY) * dodgeSpeed;
    this.playerVel.z = -Math.cos(this.playerRotY) * dodgeSpeed;
  }

  public triggerJump() {
    if (!this.isGrounded || this.animState.isSwimming || this.animState.isDodging) return;
    if (!this.survival.consumeStamina(12)) return;

    this.playerVel.y = 8.2;
    this.isGrounded = false;
    this.animState.isJumping = true;
    sound.playJump();
  }

  public triggerHarvest(nodeId: string) {
    if (this.animState.isHarvesting) return;
    if (!this.survival.consumeStamina(8)) return;

    this.animState.isHarvesting = true;
    this.animState.harvestTime = 0;

    const node = this.world.harvestNodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (node.type === 'tree') sound.playChopWood();
    else sound.playClinkStone();

    const result = this.world.harvestNode(nodeId, 35);
    if (result && result.drops) {
      for (const d of result.drops) {
        this.survival.addItem(d.itemId, d.count);
        this.survival.trackQuestProgress(d.itemId, d.count);
      }
      sound.playPickup();
    }
  }

  public triggerInteract() {
    if (this.contextualAction) {
      this.contextualAction.action();
    }
  }

  // --- Main Game Loop ---

  private startLoop() {
    const tick = () => {
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const delta = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

      if (this.isRunning) {
        this.update(delta);
        this.render();
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private update(delta: number) {
    // 1. Camera Direction Vectors
    this.camera.getWorldDirection(_forward);
    _forward.y = 0;
    _forward.normalize();
    _right.crossVectors(_forward, this.camera.up).normalize();

    // 2. Player Movement Input
    _moveDir.set(0, 0, 0);
    if (Math.abs(this.input.moveX) > 0.05 || Math.abs(this.input.moveZ) > 0.05) {
      _moveDir.addScaledVector(_right, this.input.moveX);
      _moveDir.addScaledVector(_forward, -this.input.moveZ);
      _moveDir.normalize();

      // Desired face angle
      const targetAngle = Math.atan2(-_moveDir.x, -_moveDir.z);
      // Smooth angle interpolation
      let angleDiff = targetAngle - this.playerRotY;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.playerRotY += angleDiff * Math.min(1, delta * 14);
    }

    const isMoving = _moveDir.lengthSq() > 0.01;
    this.animState.isMoving = isMoving;
    this.animState.isSprinting = this.input.sprint && isMoving && this.survival.vitals.stamina > 5;
    this.animState.isCrouching = this.input.crouch;

    // Movement Speed
    const baseSpeed = this.animState.isSwimming
      ? 2.8
      : this.animState.isCrouching
      ? 2.2
      : this.animState.isSprinting
      ? 7.2
      : 4.2;

    if (!this.animState.isDodging) {
      this.playerVel.x = _moveDir.x * baseSpeed;
      this.playerVel.z = _moveDir.z * baseSpeed;
    } else {
      // Decelerate dodge
      this.playerVel.x *= 0.94;
      this.playerVel.z *= 0.94;
    }

    // Gravity & Ground Height
    const terrainHeight = this.world.getTerrainHeight(this.playerPos.x, this.playerPos.z);
    const isWater = terrainHeight < 0.3;
    this.animState.isSwimming = isWater;

    if (!isWater) {
      this.playerVel.y -= 19.8 * delta; // Gravity
      this.playerPos.y += this.playerVel.y * delta;

      if (this.playerPos.y <= terrainHeight + 0.05) {
        this.playerPos.y = terrainHeight + 0.05;
        this.playerVel.y = 0;
        this.isGrounded = true;
        this.animState.isJumping = false;
      }
    } else {
      // Buoyancy in lake
      this.playerPos.y = 0.3;
      this.playerVel.y = 0;
      this.isGrounded = true;
      this.animState.isJumping = false;
    }

    // Apply Horizontal Velocity
    this.playerPos.x += this.playerVel.x * delta;
    this.playerPos.z += this.playerVel.z * delta;

    // Clamp inside world boundary (-190 to 190)
    this.playerPos.x = Math.max(-190, Math.min(190, this.playerPos.x));
    this.playerPos.z = Math.max(-190, Math.min(190, this.playerPos.z));

    // Update 3D Character Mesh Transform
    this.character.group.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    this.character.group.rotation.y = this.playerRotY;

    // Update Animations Timers
    if (this.animState.isAttacking) {
      this.animState.attackTime += delta;
      if (this.animState.attackTime >= 0.45) {
        this.animState.isAttacking = false;
      }
    }
    if (this.animState.isDodging) {
      this.animState.dodgeTime += delta;
      if (this.animState.dodgeTime >= 0.5) {
        this.animState.isDodging = false;
      }
    }
    if (this.animState.isHarvesting) {
      this.animState.harvestTime += delta;
      if (this.animState.harvestTime >= 0.6) {
        this.animState.isHarvesting = false;
      }
    }

    this.character.updateAnimation(delta, this.animState);

    // 3. Third-Person Camera Tracking
    this.updateCamera(delta);

    // 4. Update World, Creatures, and Survival
    this.world.update(delta, this.playerPos);

    // Check proximity to campfire
    let isNearCampfire = false;
    for (const s of this.building.placedStructures) {
      if (s.type === 'campfire') {
        const dist = Math.sqrt((s.x - this.playerPos.x) ** 2 + (s.z - this.playerPos.z) ** 2);
        if (dist < 6.5) {
          isNearCampfire = true;
          break;
        }
      }
    }

    const currentRegion = this.world.getRegionAt(this.playerPos.x, this.playerPos.z);
    const isHoldingTorch = this.survival.hotbar[this.survival.activeHotbarIndex]?.itemId === 'torch';

    this.survival.update(delta, currentRegion.temperature, isNearCampfire, isHoldingTorch, isMoving);

    // Handle creature AI and damage to player
    this.creatures.update(delta, this.playerPos, this.animState.isCrouching, (dmg) => {
      const isDead = this.survival.takeDamage(dmg);
      if (isDead) {
        const respawn = this.survival.respawnPlayer();
        this.playerPos.x = respawn.x;
        this.playerPos.y = respawn.y;
        this.playerPos.z = respawn.z;
      }
    });

    // 5. Contextual Interaction Check
    this.checkContextualInteraction();

    // 6. Update Placement Ghost if in building mode
    if (this.building.ghostGroup && this.building.currentGhostType) {
      const placeDist = 3.2;
      const gx = this.playerPos.x - Math.sin(this.playerRotY) * placeDist;
      const gz = this.playerPos.z - Math.cos(this.playerRotY) * placeDist;
      const gy = this.world.getTerrainHeight(gx, gz);
      this.building.updateGhostPosition(gx, gy, gz, true);
    }

    // Notify React HUD
    if (this.onStateUpdate) {
      this.onStateUpdate(this);
    }
  }

  private updateCamera(delta: number) {
    // Pitch limits (prevent camera from flipping)
    this.camPitch = Math.max(-0.2, Math.min(1.2, this.camPitch));

    // Smooth camera distance interpolation
    this.camDistance = THREE.MathUtils.damp(this.camDistance, this.targetCamDistance, 10, delta);

    // Camera offset from character head
    const headHeight = 1.35;
    const targetX = this.playerPos.x;
    const targetY = this.playerPos.y + headHeight;
    const targetZ = this.playerPos.z;

    _camTarget.set(targetX, targetY, targetZ);

    const horizontalDist = Math.cos(this.camPitch) * this.camDistance;
    const verticalDist = Math.sin(this.camPitch) * this.camDistance;

    const eyeX = targetX + Math.sin(this.camYaw) * horizontalDist;
    const eyeY = targetY + verticalDist;
    const eyeZ = targetZ + Math.cos(this.camYaw) * horizontalDist;

    // Prevent camera clipping into terrain
    const minHeight = this.world.getTerrainHeight(eyeX, eyeZ) + 0.45;
    const clampedY = Math.max(minHeight, eyeY);

    _camOffset.set(eyeX, clampedY, eyeZ);

    // Smoothly damp camera position for weight & cinematic feel
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camOffset.x, 14, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camOffset.y, 14, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camOffset.z, 14, delta);

    this.camera.lookAt(_camTarget);
  }

  private checkContextualInteraction() {
    this.contextualAction = null;

    // 1. Check Harvestable Nodes
    let nearestNode: any = null;
    let minNodeDist = 2.8;

    for (const node of this.world.harvestNodes) {
      const dist = Math.sqrt((node.x - this.playerPos.x) ** 2 + (node.z - this.playerPos.z) ** 2);
      if (dist < minNodeDist) {
        minNodeDist = dist;
        nearestNode = node;
      }
    }

    if (nearestNode) {
      const actionText =
        nearestNode.type === 'tree'
          ? 'Cortar Árvore'
          : nearestNode.type === 'rock' || nearestNode.type === 'flint_node' || nearestNode.type === 'iron_node'
          ? 'Minerar Rocha'
          : 'Coletar Frutas';

      this.contextualAction = {
        label: `${actionText} (${nearestNode.name})`,
        action: () => this.triggerHarvest(nearestNode.id),
      };
      return;
    }

    // 2. Check Structures
    const nearestStructure = this.building.getNearestStructure(this.playerPos, 3.2);
    if (nearestStructure) {
      if (nearestStructure.type === 'campfire') {
        this.contextualAction = {
          label: 'Descansar & Cozinhar',
          action: () => {
            // Cook raw meat if present
            if (this.survival.getItemCount('raw_meat') > 0) {
              this.survival.removeItem('raw_meat', 1);
              this.survival.addItem('cooked_meat', 1);
              sound.playEat();
            } else {
              this.survival.sleepAtShelter();
              this.world.gameTime = 7.0; // Wake up at sunrise
            }
          },
        };
        return;
      }

      if (nearestStructure.type === 'shelter') {
        this.contextualAction = {
          label: 'Dormir no Abrigo (Salvar Ponto)',
          action: () => {
            this.survival.sleepAtShelter();
            this.survival.respawnPoint = { ...this.playerPos };
            this.world.gameTime = 7.0;
            sound.playPickup();
          },
        };
        return;
      }

      if (nearestStructure.type === 'wood_door') {
        this.contextualAction = {
          label: nearestStructure.customData?.isOpen ? 'Fechar Porta' : 'Abrir Porta',
          action: () => this.building.interactWithStructure(nearestStructure.id),
        };
        return;
      }
    }

    // 3. Check Water Source (Crystal Lake)
    if (this.animState.isSwimming || this.world.getTerrainHeight(this.playerPos.x, this.playerPos.z) < 0.6) {
      this.contextualAction = {
        label: 'Beber Água Fresca',
        action: () => {
          this.survival.vitals.thirst = Math.min(100, this.survival.vitals.thirst + 45);
          sound.playDrink();
          this.survival.trackQuestProgress('drink_water', 1);
        },
      };
      return;
    }

    // 4. Check Ancient Citadel Altar Beacon
    const altarDist = Math.sqrt((this.playerPos.x - 10) ** 2 + (this.playerPos.z - (-140)) ** 2);
    if (altarDist < 8.0) {
      const hasSunKey = this.survival.getItemCount('ancient_key_sun') > 0;
      const hasMoonKey = this.survival.getItemCount('ancient_key_moon') > 0;
      const hasStarKey = this.survival.getItemCount('ancient_key_star') > 0;

      if (hasSunKey && hasMoonKey && hasStarKey) {
        this.contextualAction = {
          label: '✨ Inserir 3 Chaves e Restaurar o Farol Eterno!',
          action: () => {
            sound.playBeaconRestored();
            this.survival.trackQuestProgress('activate_beacon', 1);
          },
        };
      } else {
        this.contextualAction = {
          label: 'Altar Primordial: Necessita das 3 Chaves Rúnicas',
          action: () => {},
        };
      }
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    this.renderer.dispose();
  }
}
