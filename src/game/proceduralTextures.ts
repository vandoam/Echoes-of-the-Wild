/**
 * Echoes of the Wild - Procedural Canvas Textures
 * Zero external image dependencies. Generated in memory with high-definition Canvas 2D.
 */
import * as THREE from 'three';

const textureCache: Record<string, THREE.CanvasTexture> = {};

export function createProceduralCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx, width, height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function getGrassTexture(): THREE.CanvasTexture {
  if (textureCache['grass']) return textureCache['grass'];

  const texture = createProceduralCanvas(512, 512, (ctx, w, h) => {
    // Base green gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#3a7d44');
    grad.addColorStop(0.5, '#42934f');
    grad.addColorStop(1, '#2d6a38');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grass blade flecks
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const length = 3 + Math.random() * 8;
      const angle = (Math.random() - 0.5) * 0.8;
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(74, 168, 88, 0.4)' : 'rgba(38, 92, 48, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(angle) * length, y - Math.cos(angle) * length);
      ctx.stroke();
    }

    // Occasional tiny wild yellow & white flower petals
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? '#fde047' : '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  textureCache['grass'] = texture;
  return texture;
}

export function getStoneTexture(): THREE.CanvasTexture {
  if (textureCache['stone']) return textureCache['stone'];

  const texture = createProceduralCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, w, h);

    // Stone grain noise
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 2 + Math.random() * 6;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(203, 213, 225, 0.2)' : 'rgba(30, 41, 59, 0.25)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cracks
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      let x = Math.random() * w;
      let y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 4; s++) {
        x += (Math.random() - 0.5) * 40;
        y += (Math.random() - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });

  textureCache['stone'] = texture;
  return texture;
}

export function getBarkTexture(): THREE.CanvasTexture {
  if (textureCache['bark']) return textureCache['bark'];

  const texture = createProceduralCanvas(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, 0, w, h);

    // Vertical bark ridges
    for (let x = 0; x < w; x += 6) {
      const shade = 35 + Math.sin(x * 0.2) * 20 + (Math.random() - 0.5) * 15;
      ctx.fillStyle = `rgb(${shade + 40}, ${shade + 20}, ${shade})`;
      ctx.fillRect(x, 0, 5, h);
    }

    for (let i = 0; i < 200; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.fillStyle = 'rgba(30, 18, 12, 0.35)';
      ctx.fillRect(rx, ry, 3, 15 + Math.random() * 25);
    }
  });

  textureCache['bark'] = texture;
  return texture;
}

export function getWoodPlankTexture(): THREE.CanvasTexture {
  if (textureCache['wood_plank']) return textureCache['wood_plank'];

  const texture = createProceduralCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#92613d';
    ctx.fillRect(0, 0, w, h);

    const plankHeight = h / 8;
    for (let i = 0; i < 8; i++) {
      const y = i * plankHeight;
      // Plank tone variation
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, y, w, plankHeight);

      // Plank separator seam
      ctx.strokeStyle = '#3d2314';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Wood grain lines
      ctx.strokeStyle = 'rgba(61, 35, 20, 0.15)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 5 + g * 12);
        ctx.bezierCurveTo(w * 0.3, y + 2 + g * 12, w * 0.7, y + 8 + g * 12, w, y + 6 + g * 12);
        ctx.stroke();
      }

      // Nails
      ctx.fillStyle = '#262626';
      ctx.beginPath();
      ctx.arc(20, y + plankHeight / 2, 3, 0, Math.PI * 2);
      ctx.arc(w - 20, y + plankHeight / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  textureCache['wood_plank'] = texture;
  return texture;
}

export function getRuneStoneTexture(): THREE.CanvasTexture {
  if (textureCache['rune_stone']) return textureCache['rune_stone'];

  const texture = createProceduralCanvas(512, 512, (ctx, w, h) => {
    // Dark ancient basalt
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, w, h);

    // Weathered stone flecks
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70, 75, 90, 0.15)' : 'rgba(10, 10, 15, 0.3)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }

    // Glowing cyan & gold glyphs
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;

    // Outer runic border
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // Central circular rune
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Ancient triangular sigil
    ctx.strokeStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const r = 70;
    for (let a = 0; a < 3; a++) {
      const angle = (a * 2 * Math.PI) / 3 - Math.PI / 2;
      const px = w / 2 + Math.cos(angle) * r;
      const py = h / 2 + Math.sin(angle) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.shadowBlur = 0;
  });

  textureCache['rune_stone'] = texture;
  return texture;
}

export function getParticleTexture(): THREE.CanvasTexture {
  if (textureCache['particle']) return textureCache['particle'];

  const texture = createProceduralCanvas(64, 64, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 220, 120, 0.8)');
    grad.addColorStop(0.7, 'rgba(255, 100, 30, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

  textureCache['particle'] = texture;
  return texture;
}
