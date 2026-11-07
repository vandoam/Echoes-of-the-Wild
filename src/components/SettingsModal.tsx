/**
 * Echoes of the Wild - Settings & Performance Modal
 */
import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { sound } from '../game/audio';
import { X, Save, RefreshCw, Volume2, Monitor, Cpu } from 'lucide-react';

interface SettingsModalProps {
  engine: GameEngine;
  onClose: () => void;
  onRestart: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ engine, onClose, onRestart }) => {
  const [graphics, setGraphics] = useState<'low' | 'medium' | 'high'>('high');
  const [fps, setFps] = useState<30 | 60>(60);
  const [masterVol, setMasterVol] = useState<number>(80);
  const [sfxVol, setSfxVol] = useState<number>(80);
  const [musicVol, setMusicVol] = useState<number>(60);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    engine.survival.saveToStorage(
      {
        x: engine.playerPos.x,
        y: engine.playerPos.y,
        z: engine.playerPos.z,
        rotation: engine.playerRotY,
      },
      engine.building.placedStructures,
      engine.world.gameTime,
      engine.world.gameDay
    );
    setSaveSuccess(true);
    sound.playPickup();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleVolumeChange = (type: 'master' | 'sfx' | 'music', val: number) => {
    if (type === 'master') setMasterVol(val);
    if (type === 'sfx') setSfxVol(val);
    if (type === 'music') setMusicVol(val);

    sound.setVolumes(masterVol / 100, sfxVol / 100, musicVol / 100);
  };

  const handleGraphicsChange = (q: 'low' | 'medium' | 'high') => {
    setGraphics(q);
    if (q === 'low') {
      engine.renderer.setPixelRatio(1);
      engine.renderer.shadowMap.enabled = false;
    } else if (q === 'medium') {
      engine.renderer.setPixelRatio(1.2);
      engine.renderer.shadowMap.enabled = true;
    } else {
      engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      engine.renderer.shadowMap.enabled = true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-neutral-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-neutral-200">Configurações & Desempenho</h2>
              <p className="text-xs text-neutral-400">Ajustes gráficos, áudio e salvamento de partida.</p>
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
          {/* Graphics Quality */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/10 flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" /> Qualidade Visual (Android / Celular)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleGraphicsChange(q)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    graphics === q
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                  }`}
                >
                  {q === 'low' ? 'Básico (Econômico)' : q === 'medium' ? 'Equilibrado' : 'Alta Definição'}
                </button>
              ))}
            </div>
          </div>

          {/* FPS Target */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-neutral-200 block">Taxa de Quadros Máxima</span>
                <span className="text-[10px] text-neutral-400">30 FPS economiza bateria em celulares intermediários</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {([30, 60] as const).map((rate) => (
                <button
                  key={rate}
                  onClick={() => setFps(rate)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
                    fps === rate ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {rate} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Audio Sliders */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/10 flex flex-col gap-3">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" /> Volume do Jogo
            </span>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Volume Geral</span>
                <span className="font-mono text-neutral-400">{masterVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVol}
                onChange={(e) => handleVolumeChange('master', Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Efeitos Sonoros (SFX)</span>
                <span className="font-mono text-neutral-400">{sfxVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVol}
                onChange={(e) => handleVolumeChange('sfx', Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Save / Reset Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saveSuccess ? 'Partida Salva com Sucesso!' : 'Salvar Partida no Aparelho'}</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja reiniciar todo o progresso do jogo?')) {
                  localStorage.removeItem('echoes_of_the_wild_save');
                  onRestart();
                }
              }}
              className="px-4 py-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 font-bold text-xs flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Novo Jogo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
