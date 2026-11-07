/**
 * Echoes of the Wild - Crafting & Recipe Workshop Modal
 */
import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { RECIPES, ITEMS } from '../game/database';
import { CraftingRecipe } from '../types/game';
import { X, Hammer, Check, Sparkles, AlertCircle } from 'lucide-react';

interface CraftingModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({ engine, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'ferramentas' | 'armas' | 'sobrevivencia'>('ferramentas');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(RECIPES[0].id);
  const [craftMsg, setCraftMsg] = useState<{ text: string; success: boolean } | null>(null);

  const filteredRecipes = RECIPES.filter((r) => r.category === selectedCategory);
  const selectedRecipe = RECIPES.find((r) => r.id === selectedRecipeId) || filteredRecipes[0];
  const outputItem = selectedRecipe ? ITEMS[selectedRecipe.outputItemId] : null;

  // Check if player has all ingredients
  const canCraft = selectedRecipe
    ? selectedRecipe.ingredients.every((ing) => engine.survival.getItemCount(ing.itemId) >= ing.count)
    : false;

  const handleCraft = () => {
    if (!selectedRecipe || !canCraft) return;

    const ok = engine.survival.craftRecipe(selectedRecipe.id);
    if (ok) {
      setCraftMsg({ text: `${outputItem?.name} fabricado com sucesso!`, success: true });
    } else {
      setCraftMsg({ text: 'Materiais insuficientes!', success: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-neutral-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔨</span>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-cyan-300">Oficina de Criação</h2>
              <p className="text-xs text-neutral-400">Combine recursos naturais para forjar ferramentas, armas e artigos de sobrevivência.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mt-4 border-b border-white/10 pb-2">
          {(['ferramentas', 'armas', 'sobrevivencia'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                const first = RECIPES.find((r) => r.category === cat);
                if (first) setSelectedRecipeId(first.id);
                setCraftMsg(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              {cat === 'sobrevivencia' ? 'Sobrevivência' : cat}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 overflow-y-auto pr-1">
          {/* Recipes List */}
          <div className="flex flex-col gap-2">
            {filteredRecipes.map((recipe) => {
              const item = ITEMS[recipe.outputItemId];
              const isSelected = selectedRecipeId === recipe.id;
              const hasIngredients = recipe.ingredients.every(
                (ing) => engine.survival.getItemCount(ing.itemId) >= ing.count
              );

              return (
                <button
                  key={recipe.id}
                  onClick={() => {
                    setSelectedRecipeId(recipe.id);
                    setCraftMsg(null);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-md'
                      : 'bg-neutral-950/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-neutral-900 rounded-xl">{item?.icon}</span>
                    <div>
                      <span className="text-sm font-bold text-white block">{recipe.name}</span>
                      <span className="text-[11px] text-neutral-400">
                        {recipe.ingredients.map((ing) => `${ing.count}x ${ITEMS[ing.itemId]?.name}`).join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasIngredients ? (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Pronto
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-medium flex items-center gap-1">
                        Faltam itens
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Recipe Details */}
          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            {selectedRecipe && outputItem ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl p-2 bg-neutral-900 rounded-2xl border border-white/10">
                    {outputItem.icon}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-cyan-300 font-serif-title">{outputItem.name}</h3>
                    <span className="text-[10px] text-neutral-400">Resultado: {selectedRecipe.count}x unidade</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 bg-neutral-900/60 p-3 rounded-xl border border-white/5">
                  {outputItem.description}
                </p>

                {/* Ingredients Checklist */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Materiais Necessários
                  </span>
                  {selectedRecipe.ingredients.map((ing) => {
                    const ingItem = ITEMS[ing.itemId];
                    const currentCount = engine.survival.getItemCount(ing.itemId);
                    const isEnough = currentCount >= ing.count;

                    return (
                      <div
                        key={ing.itemId}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                          isEnough
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                            : 'bg-red-950/20 border-red-500/20 text-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{ingItem?.icon}</span>
                          <span>{ingItem?.name}</span>
                        </div>
                        <span className="font-mono font-bold">
                          {currentCount} / {ing.count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {craftMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold text-center mt-2 ${
                      craftMsg.success
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {craftMsg.text}
                  </div>
                )}
              </div>
            ) : null}

            {/* Craft Button */}
            <button
              onClick={handleCraft}
              disabled={!canCraft}
              className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 ${
                canCraft
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{canCraft ? 'Fabricar Item' : 'Materiais Insuficientes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
