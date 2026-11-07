/**
 * Echoes of the Wild - Main Application Shell & React-Three.js Bridge
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameState, StructureType } from './types/game';
import { TouchControls } from './components/TouchControls';
import { TitleScreen } from './components/TitleScreen';
import { InventoryModal } from './components/InventoryModal';
import { CraftingModal } from './components/CraftingModal';
import { BuildingModal } from './components/BuildingModal';
import { MapModal } from './components/MapModal';
import { QuestModal } from './components/QuestModal';
import { SettingsModal } from './components/SettingsModal';
import { AndroidExportModal } from './components/AndroidExportModal';
import { VictoryModal } from './components/VictoryModal';
import { sound } from './game/audio';
import { STRUCTURE_DEFS } from './game/database';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [prevScreen, setPrevScreen] = useState<GameState>('TITLE');
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [isBuildingPlacement, setIsBuildingPlacement] = useState<boolean>(false);
  const [selectedBuildType, setSelectedBuildType] = useState<StructureType | null>(null);
  const [isVictoryAchieved, setIsVictoryAchieved] = useState<boolean>(false);

  // Check saved game on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('echoes_of_the_wild_save');
      if (saved) setHasSavedGame(true);
    } catch (e) {
      // ignore
    }
  }, []);

  // Initialize Three.js Engine once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new GameEngine(container);
    engineRef.current = engine;

    // Hook state update to detect beacon restoration
    engine.onStateUpdate = (eng) => {
      const lastQuest = eng.survival.quests[eng.survival.quests.length - 1];
      if (lastQuest && lastQuest.completed && !isVictoryAchieved) {
        setIsVictoryAchieved(true);
      }
    };

    // Resize listener
    const onResize = () => {
      if (container && engineRef.current) {
        engineRef.current.handleResize(container.clientWidth, container.clientHeight);
      }
    };
    window.addEventListener('resize', onResize);

    // Keyboard & Mouse controls for Desktop testing
    const heldKeys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      heldKeys[e.code] = true;

      if (!engineRef.current) return;
      const eng = engineRef.current;

      if (e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD') {
        const x = (heldKeys['KeyD'] ? 1 : 0) - (heldKeys['KeyA'] ? 1 : 0);
        const z = (heldKeys['KeyS'] ? 1 : 0) - (heldKeys['KeyW'] ? 1 : 0);
        eng.input.moveX = x;
        eng.input.moveZ = z;
      }

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        eng.input.sprint = true;
      }
      if (e.code === 'Space') {
        eng.triggerJump();
      }
      if (e.code === 'KeyC') {
        eng.input.crouch = !eng.input.crouch;
      }
      if (e.code === 'KeyQ') {
        eng.triggerDodge();
      }
      if (e.code === 'KeyE') {
        eng.triggerInteract();
      }
      if (e.code === 'KeyR') {
        if (eng.building.ghostGroup) eng.building.rotateGhost();
      }
      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        setGameState((prev) => (prev === 'INVENTORY' ? 'PLAYING' : 'INVENTORY'));
      }
      if (e.code === 'KeyM') {
        setGameState((prev) => (prev === 'MAP' ? 'PLAYING' : 'MAP'));
      }
      if (e.code === 'KeyJ') {
        setGameState((prev) => (prev === 'QUESTS' ? 'PLAYING' : 'QUESTS'));
      }

      // Hotbar selection 1-5
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        const slotIdx = Number(e.key) - 1;
        eng.survival.activeHotbarIndex = slotIdx;
        eng.survival.useItem(slotIdx, true);
        eng.updateEquippedWeapon();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeys[e.code] = false;
      if (!engineRef.current) return;
      const eng = engineRef.current;

      if (e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyA' || e.code === 'KeyD') {
        const x = (heldKeys['KeyD'] ? 1 : 0) - (heldKeys['KeyA'] ? 1 : 0);
        const z = (heldKeys['KeyS'] ? 1 : 0) - (heldKeys['KeyW'] ? 1 : 0);
        eng.input.moveX = x;
        eng.input.moveZ = z;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        eng.input.sprint = false;
      }
    };

    // Mouse drag camera orbit for PC
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && (e.target as HTMLElement).tagName === 'CANVAS') {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
      if (e.button === 0 && e.shiftKey) {
        engineRef.current?.triggerAttack();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || !engineRef.current) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      const sens = 0.005;
      engineRef.current.camYaw -= dx * sens;
      engineRef.current.camPitch += dy * sens;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!engineRef.current) return;
      engineRef.current.targetCamDistance = Math.max(
        2.2,
        Math.min(6.5, engineRef.current.targetCamDistance + e.deltaY * 0.004)
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    // Periodic Autosave every 25 seconds
    const saveInterval = setInterval(() => {
      if (engineRef.current && gameState !== 'TITLE') {
        engineRef.current.survival.saveToStorage(
          {
            x: engineRef.current.playerPos.x,
            y: engineRef.current.playerPos.y,
            z: engineRef.current.playerPos.z,
            rotation: engineRef.current.playerRotY,
          },
          engineRef.current.building.placedStructures,
          engineRef.current.world.gameTime,
          engineRef.current.world.gameDay
        );
      }
    }, 25000);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      engine.dispose();
    };
  }, []);

  // Building Actions
  const handleSelectStructureToPlace = (type: StructureType) => {
    setSelectedBuildType(type);
    setIsBuildingPlacement(true);
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.building.setGhostType(type);
    }
  };

  const handleConfirmBuild = () => {
    if (!engineRef.current || !selectedBuildType) return;
    const eng = engineRef.current;
    const ghost = eng.building.ghostGroup;
    if (!ghost) return;

    // Verify materials and deduct cost
    const def = STRUCTURE_DEFS[selectedBuildType];
    for (const c of def.cost) {
      eng.survival.removeItem(c.itemId, c.count);
    }

    eng.building.placeStructure(
      selectedBuildType,
      ghost.position.x,
      ghost.position.y,
      ghost.position.z,
      eng.building.ghostRotation
    );

    eng.survival.trackQuestProgress('build_' + selectedBuildType, 1);
    eng.survival.trackQuestProgress('build_campfire', selectedBuildType === 'campfire' ? 1 : 0);
    eng.survival.trackQuestProgress('build_shelter', selectedBuildType === 'shelter' ? 1 : 0);
    eng.survival.trackQuestProgress('build_workbench', selectedBuildType === 'workbench' ? 1 : 0);

    // Clear placement mode
    eng.building.setGhostType(null);
    setIsBuildingPlacement(false);
    setSelectedBuildType(null);
  };

  const handleCancelBuild = () => {
    if (engineRef.current) {
      engineRef.current.building.setGhostType(null);
    }
    setIsBuildingPlacement(false);
    setSelectedBuildType(null);
  };

  const handleRotateBuild = () => {
    if (engineRef.current) {
      engineRef.current.building.rotateGhost();
    }
  };

  const handleRestartGame = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b100d] select-none touch-none">
      {/* 1. Isolated WebGL 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Title Screen Shell */}
      {gameState === 'TITLE' && (
        <TitleScreen
          hasSavedGame={hasSavedGame}
          onStartGame={() => setGameState('PLAYING')}
          onOpenAndroidGuide={() => {
            setPrevScreen('TITLE');
            setGameState('ANDROID_EXPORT');
          }}
        />
      )}

      {/* 3. In-Game Touch Controls & HUD */}
      {gameState === 'PLAYING' && (
        <TouchControls
          engine={engineRef.current}
          onOpenInventory={() => setGameState('INVENTORY')}
          onOpenCrafting={() => setGameState('CRAFTING')}
          onOpenBuilding={() => setGameState('BUILDING_SELECT')}
          onOpenMap={() => setGameState('MAP')}
          onOpenQuests={() => setGameState('QUESTS')}
          onOpenSettings={() => setGameState('SETTINGS')}
          onOpenAndroidExport={() => {
            setPrevScreen('PLAYING');
            setGameState('ANDROID_EXPORT');
          }}
          isBuildingMode={isBuildingPlacement}
          onConfirmBuild={handleConfirmBuild}
          onCancelBuild={handleCancelBuild}
          onRotateBuild={handleRotateBuild}
        />
      )}

      {/* 4. Modals */}
      {gameState === 'INVENTORY' && engineRef.current && (
        <InventoryModal engine={engineRef.current} onClose={() => setGameState('PLAYING')} />
      )}

      {gameState === 'CRAFTING' && engineRef.current && (
        <CraftingModal engine={engineRef.current} onClose={() => setGameState('PLAYING')} />
      )}

      {gameState === 'BUILDING_SELECT' && engineRef.current && (
        <BuildingModal
          engine={engineRef.current}
          onSelectStructure={handleSelectStructureToPlace}
          onClose={() => setGameState('PLAYING')}
        />
      )}

      {gameState === 'MAP' && engineRef.current && (
        <MapModal engine={engineRef.current} onClose={() => setGameState('PLAYING')} />
      )}

      {gameState === 'QUESTS' && engineRef.current && (
        <QuestModal engine={engineRef.current} onClose={() => setGameState('PLAYING')} />
      )}

      {gameState === 'SETTINGS' && engineRef.current && (
        <SettingsModal
          engine={engineRef.current}
          onClose={() => setGameState('PLAYING')}
          onRestart={handleRestartGame}
        />
      )}

      {gameState === 'ANDROID_EXPORT' && (
        <AndroidExportModal onClose={() => setGameState(prevScreen)} />
      )}

      {isVictoryAchieved && (
        <VictoryModal onContinueExploring={() => setIsVictoryAchieved(false)} />
      )}
    </div>
  );
}
