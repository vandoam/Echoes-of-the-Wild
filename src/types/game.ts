/**
 * Echoes of the Wild - Game Types & Interfaces
 */

export type GameState = 
  | 'TITLE'
  | 'PLAYING'
  | 'INVENTORY'
  | 'CRAFTING'
  | 'BUILDING_SELECT'
  | 'MAP'
  | 'QUESTS'
  | 'SETTINGS'
  | 'ANDROID_EXPORT'
  | 'GAME_OVER'
  | 'VICTORY';

export type ItemCategory = 
  | 'resource'
  | 'tool'
  | 'weapon'
  | 'armor'
  | 'food'
  | 'potion'
  | 'material'
  | 'relic';

export type EquipSlot = 'mainHand' | 'armor' | 'cloak';

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  icon: string;
  description: string;
  stackable: boolean;
  maxStack: number;
  equipSlot?: EquipSlot;
  damage?: number;
  harvestType?: 'wood' | 'stone' | 'fiber' | 'all';
  harvestPower?: number;
  defense?: number;
  nutrition?: number;
  thirstRestore?: number;
  warmFactor?: number;
  healAmount?: number;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'ferramentas' | 'armas' | 'sobrevivencia' | 'estruturas';
  outputItemId: string;
  count: number;
  ingredients: { itemId: string; count: number }[];
  requiresWorkbench?: boolean;
  unlockedByDefault?: boolean;
}

export type StructureType = 
  | 'campfire'
  | 'shelter'
  | 'wood_wall'
  | 'wood_door'
  | 'wood_floor'
  | 'storage_chest'
  | 'workbench'
  | 'stone_forge'
  | 'spikes';

export interface StructureDefinition {
  type: StructureType;
  name: string;
  description: string;
  icon: string;
  cost: { itemId: string; count: number }[];
  maxHealth: number;
  interactionType?: 'cook_sleep' | 'sleep' | 'open_door' | 'chest' | 'craft' | 'smelt';
}

export interface PlacedStructure {
  id: string;
  type: StructureType;
  x: number;
  y: number;
  z: number;
  rotation: number;
  health: number;
  customData?: {
    isOpen?: boolean;
    chestItems?: (InventorySlot | null)[];
    fireFuel?: number;
  };
}

export type CreatureType = 'deer' | 'rabbit' | 'wolf' | 'boar' | 'sentinel';

export interface CreatureEntity {
  id: string;
  type: CreatureType;
  name: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  health: number;
  maxHealth: number;
  state: 'idle' | 'wander' | 'flee' | 'alert' | 'stalk' | 'attack' | 'hurt' | 'dead';
  stateTimer: number;
  speed: number;
  targetX: number;
  targetZ: number;
  territoryX: number;
  territoryZ: number;
  attackCooldown: number;
  meshGroup?: any;
}

export interface HarvestableNode {
  id: string;
  type: 'tree' | 'rock' | 'bush' | 'water_source' | 'flint_node' | 'iron_node' | 'ancient_pillar';
  name: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  health: number;
  maxHealth: number;
  requiredTool?: 'axe' | 'pickaxe' | 'any';
  drops: { itemId: string; count: number }[];
  respawnTime?: number;
  mesh?: any;
}

export interface RegionInfo {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  temperature: number; // Base temperature in Celsius
  fogColor: number;
  ambientSound: 'forest' | 'plains' | 'lake' | 'mountains' | 'swamp' | 'cavern' | 'ruins';
  description: string;
}

export interface SurvivalVitals {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  stamina: number;
  maxStamina: number;
  temperature: number; // Current body temp in °C (ideal 36-37)
  rest: number; // 0-100
  isSwimming: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
}

export interface QuestStep {
  id: string;
  text: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  chapter: number;
  title: string;
  description: string;
  steps: QuestStep[];
  rewardText: string;
  rewardItems?: { itemId: string; count: number }[];
  completed: boolean;
  claimed: boolean;
}

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high';
  targetFps: 30 | 60;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  touchSensitivity: number;
  showFps: boolean;
  cameraDistance: number;
}

export interface GameSaveData {
  version: number;
  timestamp: number;
  playerPosition: { x: number; y: number; z: number; rotation: number };
  vitals: SurvivalVitals;
  inventory: (InventorySlot | null)[];
  hotbar: (InventorySlot | null)[];
  activeHotbarIndex: number;
  equipped: {
    mainHand: InventorySlot | null;
    armor: InventorySlot | null;
    cloak: InventorySlot | null;
  };
  structures: PlacedStructure[];
  quests: Quest[];
  currentQuestIndex: number;
  gameTime: number; // 0 to 24 hours
  gameDay: number;
  discoveredRegions: string[];
  settings: GameSettings;
  beaconRestored: boolean;
}
