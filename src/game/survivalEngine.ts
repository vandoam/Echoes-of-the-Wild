/**
 * Echoes of the Wild - Survival Simulation Engine & Inventory Logic
 */
import {
  SurvivalVitals,
  InventorySlot,
  GameSaveData,
  PlacedStructure,
  Quest,
} from '../types/game';
import { ITEMS, RECIPES, INITIAL_QUESTS } from './database';
import { sound } from './audio';

export class SurvivalEngine {
  public vitals: SurvivalVitals = {
    health: 100,
    maxHealth: 100,
    hunger: 100,
    maxHunger: 100,
    thirst: 100,
    maxThirst: 100,
    stamina: 100,
    maxStamina: 100,
    temperature: 36.8,
    rest: 100,
    isSwimming: false,
    isCrouching: false,
    isSprinting: false,
  };

  public inventory: (InventorySlot | null)[] = new Array(24).fill(null);
  public hotbar: (InventorySlot | null)[] = new Array(5).fill(null);
  public activeHotbarIndex: number = 0;
  public equipped: {
    mainHand: InventorySlot | null;
    armor: InventorySlot | null;
    cloak: InventorySlot | null;
  } = {
    mainHand: null,
    armor: null,
    cloak: null,
  };

  public quests: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
  public currentQuestIndex: number = 0;
  public respawnPoint = { x: -30, y: 1.5, z: 0 };
  public lastCampfirePos: { x: number; y: number; z: number } | null = null;
  public deathCount: number = 0;

  constructor() {
    this.seedStarterKit();
  }

  private seedStarterKit() {
    // Initial starter bag: 2 berries and 1 water
    this.addItem('berries', 3);
    this.addItem('fresh_water', 1);
  }

  public update(
    delta: number,
    envTemp: number,
    isNearCampfire: boolean,
    isHoldingTorch: boolean,
    isMoving: boolean
  ) {
    // 1. Hunger & Thirst Decay
    const hungerDrain = 0.07;
    const thirstDrain = this.vitals.isSprinting ? 0.22 : 0.12;

    this.vitals.hunger = Math.max(0, this.vitals.hunger - delta * hungerDrain);
    this.vitals.thirst = Math.max(0, this.vitals.thirst - delta * thirstDrain);

    // Starvation / Dehydration damage
    if (this.vitals.hunger <= 0 || this.vitals.thirst <= 0) {
      this.vitals.health = Math.max(0, this.vitals.health - delta * 2.5);
    } else if (this.vitals.hunger > 75 && this.vitals.thirst > 75 && this.vitals.health < this.vitals.maxHealth) {
      // Natural health regen when well-fed
      this.vitals.health = Math.min(this.vitals.maxHealth, this.vitals.health + delta * 1.5);
    }

    // 2. Stamina Management
    if (this.vitals.isSprinting && isMoving) {
      this.vitals.stamina = Math.max(0, this.vitals.stamina - delta * 18);
      if (this.vitals.stamina <= 0) {
        this.vitals.isSprinting = false;
      }
    } else {
      // Regain stamina
      this.vitals.stamina = Math.min(this.vitals.maxStamina, this.vitals.stamina + delta * 24);
    }

    // 3. Temperature Regulation
    let effectiveTemp = envTemp;
    if (isNearCampfire) effectiveTemp += 12;
    if (isHoldingTorch) effectiveTemp += 4;
    if (this.equipped.cloak) {
      const cloakItem = ITEMS[this.equipped.cloak.itemId];
      if (cloakItem?.warmFactor) effectiveTemp += cloakItem.warmFactor;
    }

    // Body temperature leans toward effective environmental temp
    const targetBodyTemp = 36.8 + (effectiveTemp - 22) * 0.2;
    this.vitals.temperature += (targetBodyTemp - this.vitals.temperature) * delta * 0.1;

    // Freezing hypothermia
    if (this.vitals.temperature < 33.5) {
      this.vitals.health = Math.max(0, this.vitals.health - delta * 2.0);
    }

    // 4. Rest decay
    this.vitals.rest = Math.max(0, this.vitals.rest - delta * 0.03);
  }

  public consumeStamina(amount: number): boolean {
    if (this.vitals.stamina < amount) return false;
    this.vitals.stamina -= amount;
    return true;
  }

  public takeDamage(amount: number): boolean {
    // Defense mitigation from armor
    let defense = 0;
    if (this.equipped.armor) {
      defense += ITEMS[this.equipped.armor.itemId]?.defense || 0;
    }
    if (this.equipped.cloak) {
      defense += ITEMS[this.equipped.cloak.itemId]?.defense || 0;
    }

    const netDamage = Math.max(4, amount * (1 - defense / 100));
    this.vitals.health = Math.max(0, this.vitals.health - netDamage);
    sound.playHurt();

    return this.vitals.health <= 0;
  }

  public addItem(itemId: string, count: number): boolean {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return false;

    // Try stacking in hotbar first
    if (itemDef.stackable) {
      for (let i = 0; i < this.hotbar.length; i++) {
        const slot = this.hotbar[i];
        if (slot && slot.itemId === itemId && slot.count < itemDef.maxStack) {
          const space = itemDef.maxStack - slot.count;
          const add = Math.min(space, count);
          slot.count += add;
          count -= add;
          if (count <= 0) {
            this.trackQuestProgress(itemId, add);
            return true;
          }
        }
      }
      // Try stacking in inventory
      for (let i = 0; i < this.inventory.length; i++) {
        const slot = this.inventory[i];
        if (slot && slot.itemId === itemId && slot.count < itemDef.maxStack) {
          const space = itemDef.maxStack - slot.count;
          const add = Math.min(space, count);
          slot.count += add;
          count -= add;
          if (count <= 0) {
            this.trackQuestProgress(itemId, add);
            return true;
          }
        }
      }
    }

    // Empty slot in hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { itemId, count };
        this.trackQuestProgress(itemId, count);
        return true;
      }
    }

    // Empty slot in inventory
    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { itemId, count };
        this.trackQuestProgress(itemId, count);
        return true;
      }
    }

    return false; // Inventory full!
  }

  public getItemCount(itemId: string): number {
    let total = 0;
    for (const s of this.hotbar) {
      if (s && s.itemId === itemId) total += s.count;
    }
    for (const s of this.inventory) {
      if (s && s.itemId === itemId) total += s.count;
    }
    return total;
  }

  public removeItem(itemId: string, count: number): boolean {
    if (this.getItemCount(itemId) < count) return false;

    let remaining = count;

    for (let i = 0; i < this.inventory.length && remaining > 0; i++) {
      const slot = this.inventory[i];
      if (slot && slot.itemId === itemId) {
        if (slot.count <= remaining) {
          remaining -= slot.count;
          this.inventory[i] = null;
        } else {
          slot.count -= remaining;
          remaining = 0;
        }
      }
    }

    for (let i = 0; i < this.hotbar.length && remaining > 0; i++) {
      const slot = this.hotbar[i];
      if (slot && slot.itemId === itemId) {
        if (slot.count <= remaining) {
          remaining -= slot.count;
          this.hotbar[i] = null;
        } else {
          slot.count -= remaining;
          remaining = 0;
        }
      }
    }

    return true;
  }

  public useItem(slotIndex: number, isHotbar: boolean = false): { message: string } {
    const slotList = isHotbar ? this.hotbar : this.inventory;
    const slot = slotList[slotIndex];
    if (!slot) return { message: 'Espaço vazio' };

    const item = ITEMS[slot.itemId];
    if (!item) return { message: 'Item desconhecido' };

    // Equippable items
    if (item.equipSlot) {
      if (item.equipSlot === 'mainHand') {
        const current = this.equipped.mainHand;
        this.equipped.mainHand = slot;
        slotList[slotIndex] = current;
      } else if (item.equipSlot === 'armor') {
        const current = this.equipped.armor;
        this.equipped.armor = slot;
        slotList[slotIndex] = current;
      } else if (item.equipSlot === 'cloak') {
        const current = this.equipped.cloak;
        this.equipped.cloak = slot;
        slotList[slotIndex] = current;
      }
      return { message: `${item.name} equipado!` };
    }

    // Consumables (Food, Drinks, Medicine)
    if (item.nutrition || item.thirstRestore || item.healAmount) {
      if (item.nutrition) {
        this.vitals.hunger = Math.min(this.vitals.maxHunger, this.vitals.hunger + item.nutrition);
      }
      if (item.thirstRestore) {
        this.vitals.thirst = Math.min(this.vitals.maxThirst, this.vitals.thirst + item.thirstRestore);
        sound.playDrink();
      } else {
        sound.playEat();
      }
      if (item.healAmount) {
        this.vitals.health = Math.max(0, Math.min(this.vitals.maxHealth, this.vitals.health + item.healAmount));
      }

      slot.count--;
      if (slot.count <= 0) {
        slotList[slotIndex] = null;
      }
      return { message: `Consumiu ${item.name}` };
    }

    return { message: item.name };
  }

  public craftRecipe(recipeId: string): boolean {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    // Verify ingredients
    for (const ing of recipe.ingredients) {
      if (this.getItemCount(ing.itemId) < ing.count) return false;
    }

    // Deduct ingredients
    for (const ing of recipe.ingredients) {
      this.removeItem(ing.itemId, ing.count);
    }

    // Add result
    this.addItem(recipe.outputItemId, recipe.count);
    sound.playPickup();
    this.trackQuestProgress(recipe.outputItemId, recipe.count);

    return true;
  }

  public trackQuestProgress(actionOrItemId: string, amount: number = 1) {
    const currentQuest = this.quests[this.currentQuestIndex];
    if (!currentQuest || currentQuest.completed) return;

    let allCompleted = true;
    for (const step of currentQuest.steps) {
      if (step.id.includes(actionOrItemId) || step.id === actionOrItemId) {
        step.current = Math.min(step.target, step.current + amount);
        if (step.current >= step.target) {
          step.completed = true;
        }
      }
      if (!step.completed) {
        allCompleted = false;
      }
    }

    if (allCompleted) {
      currentQuest.completed = true;
      sound.playQuestFanfare();
      // Auto reward
      if (currentQuest.rewardItems) {
        for (const rew of currentQuest.rewardItems) {
          this.addItem(rew.itemId, rew.count);
        }
      }
      // Advance to next chapter
      if (this.currentQuestIndex < this.quests.length - 1) {
        this.currentQuestIndex++;
      }
    }
  }

  public sleepAtShelter(): { message: string } {
    this.vitals.rest = 100;
    this.vitals.health = Math.min(this.vitals.maxHealth, this.vitals.health + 50);
    this.vitals.hunger = Math.max(20, this.vitals.hunger - 25);
    this.vitals.thirst = Math.max(20, this.vitals.thirst - 30);
    return { message: 'Você descansou profundamente até a manhã seguinte.' };
  }

  public respawnPlayer(): { x: number; y: number; z: number } {
    this.deathCount++;
    this.vitals.health = 70;
    this.vitals.hunger = 60;
    this.vitals.thirst = 60;
    this.vitals.stamina = 100;
    this.vitals.temperature = 36.8;

    return { ...this.respawnPoint };
  }

  public saveToStorage(playerPos: { x: number; y: number; z: number; rotation: number }, structures: PlacedStructure[], gameTime: number, gameDay: number) {
    const data: GameSaveData = {
      version: 1,
      timestamp: Date.now(),
      playerPosition: playerPos,
      vitals: this.vitals,
      inventory: this.inventory,
      hotbar: this.hotbar,
      activeHotbarIndex: this.activeHotbarIndex,
      equipped: this.equipped,
      structures,
      quests: this.quests,
      currentQuestIndex: this.currentQuestIndex,
      gameTime,
      gameDay,
      discoveredRegions: ['forest'],
      settings: {
        graphicsQuality: 'high',
        targetFps: 60,
        masterVolume: 0.8,
        sfxVolume: 0.8,
        musicVolume: 0.6,
        touchSensitivity: 1.0,
        showFps: false,
        cameraDistance: 4.2,
      },
      beaconRestored: false,
    };
    try {
      localStorage.setItem('echoes_of_the_wild_save', JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  public loadFromStorage(): GameSaveData | null {
    try {
      const raw = localStorage.getItem('echoes_of_the_wild_save');
      if (!raw) return null;
      const data: GameSaveData = JSON.parse(raw);
      this.vitals = data.vitals;
      this.inventory = data.inventory;
      this.hotbar = data.hotbar;
      this.activeHotbarIndex = data.activeHotbarIndex;
      this.equipped = data.equipped;
      this.quests = data.quests;
      this.currentQuestIndex = data.currentQuestIndex;
      return data;
    } catch (e) {
      return null;
    }
  }
}
