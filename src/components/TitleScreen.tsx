/**
 * Echoes of the Wild - Atmospheric Full-Viewport Title Screen
 */
import React from 'react';
import { Play, Sparkles, Smartphone, Compass, Volume2, Shield } from 'lucide-react';

interface TitleScreenProps {
  hasSavedGame: boolean;
  onStartGame: () => void;
  onOpenAndroidGuide: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedGame,
  onStartGame,
  onOpenAndroidGuide,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 pointer-events-auto bg-gradient-to-t from-black/85 via-black/40 to-black/60 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-neutral-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold">Versão 1.0 · Single-Player & Offline</span>
        </div>

        <button
          onClick={onOpenAndroidGuide}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold active:scale-95 transition-all shadow-lg"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Exportar APK Android</span>
        </button>
      </div>

      {/* Center Hero Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Bespoke inline SVG rune logo lockup */}
        <div className="w-20 h-20 mb-3 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#eab308" strokeWidth="2.5" strokeDasharray="6 4" />
            <polygon points="50,15 85,75 15,75" fill="none" stroke="#38bdf8" strokeWidth="3" />
            <circle cx="50" cy="55" r="14" fill="#0284c7" />
            <path d="M 50,22 L 50,88 M 20,55 L 80,55" stroke="#fbbf24" strokeWidth="2" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-serif-title tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-2xl">
          ECHOES OF THE WILD
        </h1>

        <p className="text-sm sm:text-base font-medium tracking-widest text-neutral-300 uppercase mt-2 max-w-xl">
          Sobrevivência em Mundo Aberto · 8 Regiões · Construção · Mistérios Antigos
        </p>

        {/* Start Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onStartGame}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-base tracking-wide shadow-2xl shadow-amber-500/40 border-2 border-white/60 active:scale-95 transition-all flex items-center gap-3"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>{hasSavedGame ? 'CONTINUAR AVENTURA' : 'INICIAR JORNADA'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 border-t border-white/10 pt-3 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="font-bold text-white">📱 Android:</span> Joystick à esquerda · Olhar à direita · Botões de Ação
          </span>
          <span className="hidden md:inline text-neutral-600">|</span>
          <span className="hidden md:flex items-center gap-1">
            <span className="font-bold text-white">💻 PC:</span> WASD Mover · Espaço Pular · Botão Esquerdo Atacar · E Interagir
          </span>
        </div>

        <span className="text-neutral-500">Echoes of the Wild © 2026 · Todos os direitos reservados</span>
      </div>
    </div>
  );
};
