/**
 * Echoes of the Wild - Building & Structures Selection Drawer Modal
 */
import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { STRUCTURE_DEFS, ITEMS } from '../game/database';
import { StructureType } from '../types/game';
import { X, Tent, Check, ArrowRight } from 'lucide-react';

interface BuildingModalProps {
  engine: GameEngine;
  onSelectStructure: (type: StructureType) => void;
  onClose: () => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({ engine, onSelectStructure, onClose }) => {
  const [selectedType, setSelectedType] = useState<StructureType>('campfire');

  const structuresList = Object.values(STRUCTURE_DEFS);
  const selectedDef = STRUCTURE_DEFS[selectedType];

  const canAfford = selectedDef.cost.every(
    (c) => engine.survival.getItemCount(c.itemId) >= c.count
  );

  const handleStartPlacement = () => {
    if (!canAfford) return;
    onSelectStructure(selectedType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-neutral-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⛺</span>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-emerald-300">Construção de Acampamento</h2>
              <p className="text-xs text-neutral-400">Erga abrigos, fogueiras, fornalhas e fortificações para garantir sua sobrevivência.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 overflow-y-auto pr-1">
          {/* Structures List */}
          <div className="flex flex-col gap-2">
            {structuresList.map((struct) => {
              const isSelected = selectedType === struct.type;
              const hasMats = struct.cost.every(
                (c) => engine.survival.getItemCount(c.itemId) >= c.count
              );

              return (
                <button
                  key={struct.type}
                  onClick={() => setSelectedType(struct.type)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-md'
                      : 'bg-neutral-950/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-neutral-900 rounded-xl">{struct.icon}</span>
                    <div>
                      <span className="text-sm font-bold text-white block">{struct.name}</span>
                      <span className="text-[11px] text-neutral-400">
                        {struct.cost.map((c) => `${c.count}x ${ITEMS[c.itemId]?.name}`).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    {hasMats ? (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Disponível
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-medium">
                        Faltam materiais
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Structure Inspect Card */}
          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl p-2 bg-neutral-900 rounded-2xl border border-white/10">
                  {selectedDef.icon}
                </span>
                <div>
                  <h3 className="text-base font-bold text-emerald-300 font-serif-title">{selectedDef.name}</h3>
                  <span className="text-[10px] text-neutral-400">Durabilidade: {selectedDef.maxHealth} HP</span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 bg-neutral-900/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                {selectedDef.description}
              </p>

              {/* Cost Breakdown */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Custo de Construção
                </span>
                {selectedDef.cost.map((c) => {
                  const item = ITEMS[c.itemId];
                  const current = engine.survival.getItemCount(c.itemId);
                  const isEnough = current >= c.count;

                  return (
                    <div
                      key={c.itemId}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        isEnough
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                          : 'bg-red-950/20 border-red-500/20 text-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item?.icon}</span>
                        <span className="font-semibold">{item?.name}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {current} / {c.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Place Button */}
            <button
              onClick={handleStartPlacement}
              disabled={!canAfford}
              className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span>{canAfford ? 'Posicionar Estrutura no Mundo' : 'Materiais Insuficientes'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
