/**
 * Echoes of the Wild - Inventory & Equipment Modal
 */
import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { ITEMS } from '../game/database';
import { X, Shield, Sword, Flame, Heart, Droplet, Sparkles } from 'lucide-react';

interface InventoryModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ engine, onClose }) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const selectedSlot = selectedSlotIndex !== null ? engine.survival.inventory[selectedSlotIndex] : null;
  const selectedItem = selectedSlot ? ITEMS[selectedSlot.itemId] : null;

  const handleUseItem = () => {
    if (selectedSlotIndex === null) return;
    const res = engine.survival.useItem(selectedSlotIndex, false);
    setStatusMsg(res.message);
    engine.updateEquippedWeapon();
  };

  const handleDropItem = () => {
    if (selectedSlotIndex === null || !selectedSlot) return;
    engine.survival.inventory[selectedSlotIndex] = null;
    setStatusMsg('Item descartado.');
    setSelectedSlotIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-neutral-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-amber-300">Mochila do Explorador</h2>
              <p className="text-xs text-neutral-400">Gerencie equipamentos, armas, provisões e relíquias coletadas.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 overflow-y-auto pr-1">
          {/* Left Column: Equipment Slots */}
          <div className="flex flex-col gap-3 bg-neutral-950/60 p-3.5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Equipamentos Ativos</span>

            {/* Main Hand Weapon */}
            <div className="flex items-center gap-3 bg-neutral-900/80 p-2.5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-2xl border border-amber-500/30">
                {engine.survival.equipped.mainHand ? (
                  ITEMS[engine.survival.equipped.mainHand.itemId]?.icon
                ) : (
                  <Sword className="w-5 h-5 text-neutral-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-neutral-400 font-semibold block">Mão Principal</span>
                <span className="text-xs font-bold text-white truncate block">
                  {engine.survival.equipped.mainHand
                    ? ITEMS[engine.survival.equipped.mainHand.itemId]?.name
                    : 'Nenhuma arma empunhada'}
                </span>
              </div>
            </div>

            {/* Armor */}
            <div className="flex items-center gap-3 bg-neutral-900/80 p-2.5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-2xl border border-cyan-500/30">
                {engine.survival.equipped.armor ? (
                  ITEMS[engine.survival.equipped.armor.itemId]?.icon
                ) : (
                  <Shield className="w-5 h-5 text-neutral-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-neutral-400 font-semibold block">Armadura</span>
                <span className="text-xs font-bold text-white truncate block">
                  {engine.survival.equipped.armor
                    ? ITEMS[engine.survival.equipped.armor.itemId]?.name
                    : 'Sem armadura'}
                </span>
              </div>
            </div>

            {/* Cloak */}
            <div className="flex items-center gap-3 bg-neutral-900/80 p-2.5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-2xl border border-violet-500/30">
                {engine.survival.equipped.cloak ? (
                  ITEMS[engine.survival.equipped.cloak.itemId]?.icon
                ) : (
                  <Sparkles className="w-5 h-5 text-neutral-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-neutral-400 font-semibold block">Capa / Manto</span>
                <span className="text-xs font-bold text-white truncate block">
                  {engine.survival.equipped.cloak
                    ? ITEMS[engine.survival.equipped.cloak.itemId]?.name
                    : 'Sem manto protetor'}
                </span>
              </div>
            </div>

            {statusMsg && (
              <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-center font-medium">
                {statusMsg}
              </div>
            )}
          </div>

          {/* Middle: 24 Backpack Inventory Slots Grid */}
          <div className="flex flex-col gap-2 bg-neutral-950/60 p-3.5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Mochila ({engine.survival.inventory.filter(Boolean).length}/24)
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {engine.survival.inventory.map((slot, idx) => {
                const item = slot ? ITEMS[slot.itemId] : null;
                const isSelected = selectedSlotIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSlotIndex(idx);
                      setStatusMsg('');
                    }}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500/30 border-2 border-amber-400 shadow-lg'
                        : 'bg-neutral-800/80 border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {item ? (
                      <>
                        <span className="text-2xl">{item.icon}</span>
                        {slot!.count > 1 && (
                          <span className="absolute bottom-1 right-1 text-[10px] font-extrabold text-white bg-black/80 px-1 rounded-sm leading-tight">
                            {slot!.count}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-neutral-700 font-mono">{idx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Item Details */}
          <div className="flex flex-col justify-between bg-neutral-950/60 p-4 rounded-2xl border border-white/10">
            {selectedItem && selectedSlot ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl p-2 bg-neutral-900 rounded-2xl border border-white/10">
                    {selectedItem.icon}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-amber-300 font-serif-title">{selectedItem.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 inline-block mt-0.5">
                      {selectedItem.category}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                  {selectedItem.description}
                </p>

                {/* Item Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedItem.damage && (
                    <div className="flex items-center gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-red-300 border border-red-500/20">
                      <Sword className="w-3.5 h-3.5 text-red-400" />
                      <span>Dano: +{selectedItem.damage}</span>
                    </div>
                  )}
                  {selectedItem.defense && (
                    <div className="flex items-center gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-cyan-300 border border-cyan-500/20">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Defesa: +{selectedItem.defense}</span>
                    </div>
                  )}
                  {selectedItem.nutrition && (
                    <div className="flex items-center gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-amber-300 border border-amber-500/20">
                      <span>🍗</span>
                      <span>Fome: +{selectedItem.nutrition}</span>
                    </div>
                  )}
                  {selectedItem.thirstRestore && (
                    <div className="flex items-center gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-blue-300 border border-blue-500/20">
                      <Droplet className="w-3.5 h-3.5 text-blue-400" />
                      <span>Sede: +{selectedItem.thirstRestore}</span>
                    </div>
                  )}
                  {selectedItem.healAmount && (
                    <div className="flex items-center gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-emerald-300 border border-emerald-500/20">
                      <Heart className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cura: +{selectedItem.healAmount}</span>
                    </div>
                  )}
                  {selectedItem.warmFactor && (
                    <div className="flex items-center gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-orange-300 border border-orange-500/20">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Calor: +{selectedItem.warmFactor}°C</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 text-neutral-500">
                <span className="text-3xl mb-2">👆</span>
                <p className="text-xs">Selecione um item da mochila para inspecionar seus atributos e utilizá-lo.</p>
              </div>
            )}

            {/* Actions Bottom Bar */}
            {selectedSlot && (
              <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-3">
                <button
                  onClick={handleUseItem}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg active:scale-95 transition-all"
                >
                  {selectedItem?.equipSlot ? 'Equipar Item' : 'Usar / Consumir'}
                </button>
                <button
                  onClick={handleDropItem}
                  className="px-3 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-semibold active:scale-95"
                >
                  Descartar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
