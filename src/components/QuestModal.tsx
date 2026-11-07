/**
 * Echoes of the Wild - Quest Journal & Progression System Modal
 */
import React from 'react';
import { GameEngine } from '../game/engine';
import { X, CheckCircle2, Circle, Award, BookOpen } from 'lucide-react';
import { ITEMS } from '../game/database';

interface QuestModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ engine, onClose }) => {
  const quests = engine.survival.quests;
  const currentIdx = engine.survival.currentQuestIndex;
  const activeQuest = quests[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-neutral-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-violet-300">Diário do Sobrevivente</h2>
              <p className="text-xs text-neutral-400">Objetivos principais, mistérios da antiga civilização e recompensas.</p>
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
        <div className="flex flex-col gap-4 mt-4 overflow-y-auto pr-1">
          {/* Active Primary Quest Card */}
          {activeQuest && (
            <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                  Capítulo {activeQuest.chapter} · Em Andamento
                </span>
                <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                  Objetivo Principal
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-serif-title">{activeQuest.title}</h3>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{activeQuest.description}</p>
              </div>

              {/* Steps Checklist */}
              <div className="flex flex-col gap-2 mt-1">
                {activeQuest.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      step.completed
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-neutral-900/60 border-white/5 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-500 shrink-0" />
                      )}
                      <span className={step.completed ? 'line-through opacity-80' : 'font-medium'}>
                        {step.text}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-neutral-400">
                      {step.current} / {step.target}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rewards Preview */}
              {activeQuest.rewardItems && activeQuest.rewardItems.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-xs text-neutral-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-neutral-400">Recompensas ao concluir:</span>
                  <div className="flex items-center gap-2">
                    {activeQuest.rewardItems.map((rew) => (
                      <span key={rew.itemId} className="font-bold text-amber-300">
                        {rew.count}x {ITEMS[rew.itemId]?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All Chapters Overview */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Linha do Tempo dos Capítulos
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quests.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                    q.completed
                      ? 'bg-neutral-950/40 border-emerald-500/20 text-neutral-400'
                      : idx === currentIdx
                      ? 'bg-neutral-900 border-violet-500/40 text-white'
                      : 'bg-neutral-950/60 border-white/5 text-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-neutral-500">#{q.chapter}</span>
                    <span className="font-bold">{q.title}</span>
                  </div>
                  {q.completed ? (
                    <span className="text-[10px] text-emerald-400 font-bold">Concluído</span>
                  ) : idx === currentIdx ? (
                    <span className="text-[10px] text-violet-400 font-bold">Ativo</span>
                  ) : (
                    <span className="text-[10px] text-neutral-600">Bloqueado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
