/**
 * Echoes of the Wild - World Map & Exploration Waypoints Modal
 */
import React from 'react';
import { GameEngine } from '../game/engine';
import { REGIONS } from '../game/database';
import { X, Navigation, Compass, MapPin } from 'lucide-react';

interface MapModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ engine, onClose }) => {
  const playerPos = engine.playerPos;
  const currentRegion = engine.world.getRegionAt(playerPos.x, playerPos.z);

  // Convert world coords (-200 to 200) into SVG percentage (0% to 100%)
  const worldToMap = (x: number, z: number) => {
    const px = ((x + 200) / 400) * 100;
    const py = ((z + 200) / 400) * 100;
    return { px, py };
  };

  const playerMapPos = worldToMap(playerPos.x, playerPos.z);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-neutral-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-rose-300">Mapa Cartográfico da Ilha</h2>
              <p className="text-xs text-neutral-400">
                Localização atual: <span className="font-bold text-white">{currentRegion.name}</span> · Coordenadas: X: {Math.round(playerPos.x)}, Z: {Math.round(playerPos.z)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Canvas / SVG Display */}
        <div className="relative mt-4 bg-neutral-950 rounded-2xl border border-white/10 overflow-hidden aspect-[16/10] max-h-[55vh] flex items-center justify-center shadow-inner">
          <svg className="w-full h-full" viewBox="0 0 400 400">
            {/* World Ocean Background */}
            <rect x="0" y="0" width="400" height="400" fill="#082f49" />

            {/* Island Coastline Contour */}
            <path
              d="M 50,70 Q 120,30 250,50 T 360,140 Q 380,240 330,320 T 160,370 Q 40,340 30,220 Z"
              fill="#14532d"
              stroke="#22c55e"
              strokeWidth="3"
            />

            {/* Biome Region Patches */}
            {/* 1. Whispering Forest */}
            <circle cx="160" cy="200" r="60" fill="#15803d" opacity="0.7" />
            <text x="140" y="200" fill="#dcfce7" fontSize="10" fontWeight="bold">Floresta</text>

            {/* 2. Wild Plains */}
            <circle cx="270" cy="200" r="50" fill="#a16207" opacity="0.6" />
            <text x="250" y="200" fill="#fef08a" fontSize="10" fontWeight="bold">Planícies</text>

            {/* 3. Crystal Lake */}
            <ellipse cx="180" cy="300" rx="45" ry="35" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <text x="155" y="305" fill="#e0f2fe" fontSize="10" fontWeight="bold">Lago Cristalino</text>

            {/* 4. Rocky Mountains */}
            <polygon points="60,60 140,40 120,130 50,110" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            <text x="65" y="90" fill="#f1f5f9" fontSize="10" fontWeight="bold">Montanhas</text>

            {/* 5. Mystic Swamp */}
            <ellipse cx="290" cy="290" rx="40" ry="30" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
            <text x="270" y="295" fill="#a7f3d0" fontSize="10" fontWeight="bold">Pântano</text>

            {/* 6. Caverns Entrance */}
            <circle cx="80" cy="270" r="25" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
            <text x="65" y="275" fill="#e9d5ff" fontSize="9" fontWeight="bold">Cavernas</text>

            {/* 7. Ancient Ruins */}
            <polygon points="260,70 330,60 340,130 270,140" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
            <text x="280" y="105" fill="#fef3c7" fontSize="10" fontWeight="bold">Ruínas</text>

            {/* 8. Citadel of the Eternal Beacon (Objective) */}
            <circle cx="210" cy="80" r="22" fill="#831843" stroke="#f43f5e" strokeWidth="2" />
            <text x="195" y="85" fill="#fbcfe8" fontSize="9" fontWeight="extrabold">CIDADELA</text>

            {/* Placed Structures Pins */}
            {engine.building.placedStructures.map((s) => {
              const sp = worldToMap(s.x, s.z);
              return (
                <circle
                  key={s.id}
                  cx={(sp.px / 100) * 400}
                  cy={(sp.py / 100) * 400}
                  r="4"
                  fill="#fbbf24"
                  stroke="#000"
                  strokeWidth="1"
                />
              );
            })}

            {/* Player GPS Pin with Directional Arrow */}
            <g
              transform={`translate(${(playerMapPos.px / 100) * 400}, ${(playerMapPos.py / 100) * 400}) rotate(${
                (engine.playerRotY * 180) / Math.PI + 180
              })`}
            >
              {/* Pulsing ring */}
              <circle cx="0" cy="0" r="8" fill="#38bdf8" opacity="0.4" />
              {/* Player Arrow */}
              <polygon points="0,-10 6,6 0,2 -6,6" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
            </g>
          </svg>

          {/* Compass Rose */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-1.5 text-xs text-neutral-300">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Norte</span>
          </div>
        </div>

        {/* Region Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
          {REGIONS.map((r) => (
            <div key={r.id} className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/60 border border-white/5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
              <div className="min-w-0">
                <span className="font-bold text-white truncate block">{r.name}</span>
                <span className="text-[10px] text-neutral-400">{r.temperature}°C</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
