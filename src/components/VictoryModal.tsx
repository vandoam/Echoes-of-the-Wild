/**
 * Echoes of the Wild - Victory Epilogue Modal
 */
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Compass, CheckCircle2 } from 'lucide-react';

interface VictoryModalProps {
  onContinueExploring: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ onContinueExploring }) => {
  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white flex flex-col items-center">
        {/* Sunken Beacon Emblem */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 text-3xl mb-4 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          ✨
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-serif-title text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
          O FAROL ETERNO FOI RESTAURADO!
        </h2>

        <p className="text-sm text-neutral-300 mt-3 leading-relaxed">
          Com a união das três Chaves Rúnicas (Sol, Lua e Estrelas), os fluxos de energia primordial foram restaurados à ilha. A névoa sombria se dissipa e as lendas da antiga civilização agora ecoam sob sua guarda.
        </p>

        <div className="my-5 p-3.5 bg-neutral-950/80 rounded-2xl border border-white/10 w-full text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Campanha Principal Concluída com Sucesso
          </div>
          <p className="text-neutral-400 text-[11px]">
            O modo livre infinito está desbloqueado. Você pode continuar construindo grandes fortalezas, domando os biomas e descobrindo todos os segredos do mapa.
          </p>
        </div>

        <button
          onClick={onContinueExploring}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2"
        >
          <Compass className="w-4 h-4" />
          <span>Continuar Explorando o Mundo Aberto</span>
        </button>
      </div>
    </div>
  );
};
