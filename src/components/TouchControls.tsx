/**
 * Echoes of the Wild - Android Landscape Touch Controls & In-Game HUD
 */
import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/engine';
import { ITEMS } from '../game/database';
import {
  Compass,
  Sun,
  Moon,
  Backpack,
  Hammer,
  Tent,
  Map as MapIcon,
  Scroll,
  Settings,
  Sword,
  ArrowUp,
  RotateCw,
  Check,
  X,
  Smartphone,
  Flame,
} from 'lucide-react';

interface TouchControlsProps {
  engine: GameEngine | null;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenBuilding: () => void;
  onOpenMap: () => void;
  onOpenQuests: () => void;
  onOpenSettings: () => void;
  onOpenAndroidExport: () => void;
  isBuildingMode: boolean;
  onConfirmBuild: () => void;
  onCancelBuild: () => void;
  onRotateBuild: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  engine,
  onOpenInventory,
  onOpenCrafting,
  onOpenBuilding,
  onOpenMap,
  onOpenQuests,
  onOpenSettings,
  onOpenAndroidExport,
  isBuildingMode,
  onConfirmBuild,
  onCancelBuild,
  onRotateBuild,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const touchLookAreaRef = useRef<HTMLDivElement>(null);

  // Left Joystick Touch State
  useEffect(() => {
    const base = joystickBaseRef.current;
    const knob = joystickKnobRef.current;
    if (!base || !knob || !engine) return;

    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchId !== null) return;
      const t = e.changedTouches[0];
      touchId = t.identifier;
      const rect = base.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      updateJoystick(t.clientX, t.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          updateJoystick(t.clientX, t.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          knob.style.transform = `translate(0px, 0px)`;
          engine.input.moveX = 0;
          engine.input.moveZ = 0;
          engine.input.sprint = false;
          break;
        }
      }
    };

    const updateJoystick = (clientX: number, clientY: number) => {
      const dx = clientX - startX;
      const dy = clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const clampedDist = Math.min(dist, maxRadius);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      knob.style.transform = `translate(${kx}px, ${ky}px)`;

      // Normalized input
      const normX = kx / maxRadius;
      const normZ = ky / maxRadius;

      engine.input.moveX = normX;
      engine.input.moveZ = normZ;

      // Sprint trigger when pushed towards outer perimeter (> 85%)
      engine.input.sprint = dist > maxRadius * 0.85;
    };

    base.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      base.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [engine]);

  // Right Camera Swipe & Orbit Touch Area
  useEffect(() => {
    const area = touchLookAreaRef.current;
    if (!area || !engine) return;

    let lookTouchId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let initialPinchDist = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch Zoom
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        return;
      }

      if (lookTouchId !== null) return;
      const t = e.changedTouches[0];
      // Only capture right side of the screen
      if (t.clientX < window.innerWidth * 0.35) return;

      lookTouchId = t.identifier;
      lastX = t.clientX;
      lastY = t.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const pinchDelta = initialPinchDist - currentDist;
        initialPinchDist = currentDist;
        engine.targetCamDistance = Math.max(2.2, Math.min(6.5, engine.targetCamDistance + pinchDelta * 0.01));
        return;
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === lookTouchId) {
          const dx = t.clientX - lastX;
          const dy = t.clientY - lastY;
          lastX = t.clientX;
          lastY = t.clientY;

          const sens = 0.006;
          engine.camYaw -= dx * sens;
          engine.camPitch += dy * sens;
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
    };

    area.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      area.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [engine]);

  if (!engine) return null;

  const vitals = engine.survival.vitals;
  const currentRegion = engine.world.getRegionAt(engine.playerPos.x, engine.playerPos.z);
  const hour = Math.floor(engine.world.gameTime);
  const min = Math.floor((engine.world.gameTime % 1) * 60);
  const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  const isNight = hour < 6 || hour >= 19;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 select-none">
      {/* Invisible Right Camera Swipe Area */}
      <div ref={touchLookAreaRef} className="absolute inset-y-0 right-0 w-2/3 pointer-events-auto" />

      {/* TOP HEADER CLUSTER */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Left: Survival Vitals */}
        <div className="flex flex-col gap-1.5 bg-black/60 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-lg min-w-[210px]">
          {/* Health */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-400 w-12 flex items-center gap-1">
              ❤️ <span className="tabular-nums">{Math.round(vitals.health)}</span>
            </span>
            <div className="flex-1 h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                style={{ width: `${(vitals.health / vitals.maxHealth) * 100}%` }}
              />
            </div>
          </div>

          {/* Stamina */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 w-12 flex items-center gap-1">
              ⚡ <span className="tabular-nums">{Math.round(vitals.stamina)}</span>
            </span>
            <div className="flex-1 h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-150"
                style={{ width: `${(vitals.stamina / vitals.maxStamina) * 100}%` }}
              />
            </div>
          </div>

          {/* Hunger & Thirst & Temp Meters */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-[10px]">
            <div className="flex items-center gap-1">
              <span>🍗</span>
              <span className="font-semibold text-amber-300 tabular-nums">{Math.round(vitals.hunger)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span>💧</span>
              <span className="font-semibold text-cyan-300 tabular-nums">{Math.round(vitals.thirst)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🌡️</span>
              <span
                className={`font-semibold tabular-nums ${
                  vitals.temperature < 34 ? 'text-blue-300 font-bold' : 'text-emerald-300'
                }`}
              >
                {vitals.temperature.toFixed(1)}°C
              </span>
            </div>
          </div>
        </div>

        {/* Center: Current Region & Clock */}
        <div className="flex flex-col items-center bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wide text-amber-300 font-serif-title uppercase">
              {currentRegion.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-300 mt-0.5">
            {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="tabular-nums font-mono font-medium">{timeString}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-[11px] text-neutral-400">Dia {engine.world.gameDay}</span>
          </div>
        </div>

        {/* Right: Quick Menu Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenInventory}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 flex items-center justify-center text-white shadow-md"
            title="Inventário"
          >
            <Backpack className="w-5 h-5 text-amber-400" />
          </button>
          <button
            onClick={onOpenCrafting}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 flex items-center justify-center text-white shadow-md"
            title="Criação"
          >
            <Hammer className="w-5 h-5 text-cyan-400" />
          </button>
          <button
            onClick={onOpenBuilding}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 flex items-center justify-center text-white shadow-md"
            title="Construção"
          >
            <Tent className="w-5 h-5 text-emerald-400" />
          </button>
          <button
            onClick={onOpenMap}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 flex items-center justify-center text-white shadow-md"
            title="Mapa"
          >
            <MapIcon className="w-5 h-5 text-rose-400" />
          </button>
          <button
            onClick={onOpenQuests}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 flex items-center justify-center text-white shadow-md"
            title="Missões"
          >
            <Scroll className="w-5 h-5 text-violet-400" />
          </button>
          <button
            onClick={onOpenAndroidExport}
            className="w-10 h-10 rounded-xl bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 active:scale-95 flex items-center justify-center text-white shadow-md"
            title="Exportar Android APK"
          >
            <Smartphone className="w-5 h-5 text-emerald-300" />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 active:scale-95 flex items-center justify-center text-white shadow-md"
            title="Configurações"
          >
            <Settings className="w-5 h-5 text-neutral-300" />
          </button>
        </div>
      </div>

      {/* CONTEXTUAL ACTION BANNER */}
      {engine.contextualAction && (
        <div className="self-center pointer-events-auto animate-bounce mb-2">
          <button
            onClick={() => engine.triggerInteract()}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-sm shadow-2xl border-2 border-white flex items-center gap-2 active:scale-95 transition-transform"
          >
            <Flame className="w-4 h-4" />
            <span>{engine.contextualAction.label}</span>
          </button>
        </div>
      )}

      {/* BUILDING MODE RADIAL / CONTROLS OVERLAY */}
      {isBuildingMode && (
        <div className="self-center pointer-events-auto flex items-center gap-3 bg-black/85 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-cyan-500/50 shadow-2xl mb-3">
          <span className="text-xs font-semibold text-cyan-300">Modo Construção</span>
          <button
            onClick={onRotateBuild}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-white/10 active:scale-95 text-xs flex items-center gap-1.5 font-bold"
          >
            <RotateCw className="w-3.5 h-3.5" /> Girar [R]
          </button>
          <button
            onClick={onConfirmBuild}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs text-white font-extrabold flex items-center gap-1 shadow-lg"
          >
            <Check className="w-3.5 h-3.5" /> Construir
          </button>
          <button
            onClick={onCancelBuild}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs text-white font-bold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
      )}

      {/* BOTTOM CONTROLS CLUSTER */}
      <div className="flex items-end justify-between w-full pointer-events-none">
        {/* Left: Dynamic Virtual Analog Joystick */}
        <div className="pointer-events-auto relative pl-4 pb-4">
          <div
            ref={joystickBaseRef}
            className="w-32 h-32 rounded-full bg-black/45 border-2 border-white/20 backdrop-blur-sm flex items-center justify-center relative touch-none shadow-2xl"
          >
            {/* Center crosshair mark */}
            <div className="w-2 h-2 rounded-full bg-white/30 pointer-events-none" />
            {/* Draggable thumbstick knob */}
            <div
              ref={joystickKnobRef}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white/80 shadow-xl absolute pointer-events-none transition-transform duration-75 flex items-center justify-center"
            >
              <div className="w-5 h-5 rounded-full bg-black/20" />
            </div>
          </div>
        </div>

        {/* Center: Quick Hotbar (Slots 1 to 5) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-2xl mb-1">
          {engine.survival.hotbar.map((slot, idx) => {
            const item = slot ? ITEMS[slot.itemId] : null;
            const isActive = engine.survival.activeHotbarIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => {
                  engine.survival.activeHotbarIndex = idx;
                  engine.survival.useItem(idx, true);
                  engine.updateEquippedWeapon();
                }}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 ${
                  isActive
                    ? 'bg-amber-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-neutral-800/80 border border-white/10'
                }`}
              >
                {item ? (
                  <>
                    <span className="text-xl leading-none">{item.icon}</span>
                    {slot!.count > 1 && (
                      <span className="absolute bottom-1 right-1 text-[10px] font-extrabold text-white bg-black/70 px-1 rounded-sm leading-tight">
                        {slot!.count}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-neutral-600 font-mono">{idx + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Action Buttons Cluster */}
        <div className="pointer-events-auto relative pr-4 pb-4 flex items-end gap-3">
          {/* Crouch Toggle */}
          <button
            onClick={() => {
              engine.input.crouch = !engine.input.crouch;
            }}
            className={`w-12 h-12 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs shadow-lg active:scale-90 transition-all ${
              engine.input.crouch ? 'bg-amber-500 text-black font-extrabold' : 'bg-black/60 text-white'
            }`}
            title="Agachar / Furtividade"
          >
            🤫
          </button>

          {/* Dodge Roll */}
          <button
            onClick={() => engine.triggerDodge()}
            className="w-13 h-13 rounded-full bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/50 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-sm shadow-xl active:scale-90 transition-all"
            title="Esquivar / Rolar"
          >
            🌀
          </button>

          {/* Jump */}
          <button
            onClick={() => engine.triggerJump()}
            className="w-14 h-14 rounded-full bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-400/50 backdrop-blur-md flex items-center justify-center text-white shadow-xl active:scale-90 transition-all"
            title="Pular"
          >
            <ArrowUp className="w-6 h-6 stroke-[3]" />
          </button>

          {/* Attack / Harvest Action (Primary big button) */}
          <button
            onClick={() => engine.triggerAttack()}
            className="w-18 h-18 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 border-2 border-white/80 shadow-2xl flex items-center justify-center text-white active:scale-90 transition-transform"
            title="Atacar / Golpear"
          >
            <Sword className="w-8 h-8 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
