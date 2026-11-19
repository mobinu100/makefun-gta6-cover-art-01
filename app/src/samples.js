// Procedural sample "photos": three original scenes drawn in code with the 2D canvas,
// so the app works offline with no image files to ship. No real people, no game art.
// Each scene is drawn once at 1200x900 and reused as a panel photo.

// Deterministic tiny PRNG so the scenes look the same on every load.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, c] of stops) g.addColorStop(at, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sunDisc(ctx, x, y, r, core, glow) {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.4);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function palm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -90, 6, -190);
  ctx.stroke();
  ctx.lineWidth = 7;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.14);
    const len = 62 - Math.abs(i - 3) * 7;
    ctx.beginPath();
    ctx.moveTo(6, -190);
    ctx.quadraticCurveTo(6 + Math.cos(a) * len * 0.6, -190 + Math.sin(a) * len * 0.55, 6 + Math.cos(a) * len, -190 + Math.sin(a) * len + 26);
    ctx.stroke();
  }
  ctx.restore();
}

function skyline(ctx, w, baseY, color, rnd, minH, maxH) {
  ctx.fillStyle = color;
  let x = -20;
  while (x < w + 20) {
    const bw = 46 + rnd() * 90;
    const bh = minH + rnd() * (maxH - minH);
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (rnd() > 0.5) { // rooftop antenna
      ctx.fillRect(x + bw / 2 - 2, baseY - bh - 26, 4, 26);
    }
    x += bw + 6 + rnd() * 18;
  }
}

function drawBoulevard(ctx, w, h) {
  sky(ctx, w, h, [[0, '#2b1055'], [0.42, '#c94b7c'], [0.62, '#ff7a3c'], [0.78, '#ffc93c'], [1, '#3a0d33']]);
  sunDisc(ctx, w * 0.62, h * 0.52, 110, '#fff3c4', 'rgba(255,170,80,0.75)');
  // sea shimmer band
  ctx.fillStyle = 'rgba(255,190,90,0.35)';
  ctx.fillRect(0, h * 0.66, w, 6);
  skyline(ctx, w, h * 0.68, '#2a0a2e', mulberry32(7), 40, 150);
  // road
  const road = ctx.createLinearGradient(0, h * 0.68, 0, h);
  road.addColorStop(0, '#241031');
  road.addColorStop(1, '#12081f');
  ctx.fillStyle = road;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 5;
  ctx.setLineDash([34, 30]);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.85);
  ctx.lineTo(w, h * 0.85);
  ctx.stroke();
  ctx.setLineDash([]);
  // convertible silhouette
  ctx.fillStyle = '#0c0616';
  ctx.beginPath();
  ctx.moveTo(w * 0.16, h * 0.8);
  ctx.lineTo(w * 0.24, h * 0.72);
  ctx.lineTo(w * 0.44, h * 0.72);
  ctx.lineTo(w * 0.52, h * 0.8);
  ctx.lineTo(w * 0.5, h * 0.84);
  ctx.lineTo(w * 0.18, h * 0.84);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(w * 0.2, h * 0.795, w * 0.28, 5);
  ctx.beginPath();
  ctx.arc(w * 0.24, h * 0.845, 16, 0, Math.PI * 2);
  ctx.arc(w * 0.44, h * 0.845, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#0c0616';
  ctx.fill();
  palm(ctx, w * 0.08, h * 0.72, 1.15, -0.1, '#12081f');
  palm(ctx, w * 0.9, h * 0.7, 1.3, 0.12, '#12081f');
}

function drawNeonStreet(ctx, w, h) {
  sky(ctx, w, h, [[0, '#05030f'], [0.55, '#12082b'], [1, '#1c0b33']]);
  const rnd = mulberry32(21);
  // distant skyline with lit windows, filling the dark upper half
  ctx.fillStyle = '#0d0722';
  let x = 0;
  while (x < w) {
    const bw = 70 + rnd() * 110;
    const bh = 90 + rnd() * 170;
    ctx.fillRect(x, h * 0.52 - bh, bw, bh);
    x += bw + 8;
  }
  ctx.fillStyle = 'rgba(255,201,60,0.85)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(20 + rnd() * (w - 40), h * 0.2 + rnd() * h * 0.26, 5, 7);
  }
  // side buildings
  ctx.fillStyle = '#0a0618';
  ctx.fillRect(0, 0, w * 0.1, h);
  ctx.fillRect(w * 0.9, 0, w * 0.1, h);
  // neon signs, kept inside the centre crop so square panels keep them whole
  const signs = [
    [w * 0.16, h * 0.14, '#ff2e88', 'DINER'],
    [w * 0.17, h * 0.36, '#19e3c2', '24H'],
    [w * 0.68, h * 0.18, '#ffc93c', 'HOTEL'],
    [w * 0.70, h * 0.40, '#7c5cff', 'BAR'],
  ];
  ctx.textAlign = 'center';
  for (const [sx, sy, c, word] of signs) {
    ctx.save();
    ctx.shadowColor = c;
    ctx.shadowBlur = 24;
    ctx.fillStyle = c;
    ctx.font = '900 46px "Arial Black", Arial, sans-serif';
    ctx.fillText(word, sx + 80, sy + 40);
    ctx.restore();
    // smeared reflection on the wet street below the sign
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(sx + 20 + rnd() * 60, h * (0.66 + i * 0.05), 90 + rnd() * 70, 4);
    }
    ctx.restore();
  }
  // wet street
  const wet = ctx.createLinearGradient(0, h * 0.55, 0, h);
  wet.addColorStop(0, '#160b2e');
  wet.addColorStop(1, '#05030f');
  ctx.fillStyle = wet;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const y = h * (0.6 + rnd() * 0.34);
    ctx.beginPath();
    ctx.moveTo(w * 0.2 + rnd() * w * 0.3, y);
    ctx.lineTo(w * 0.5 + rnd() * w * 0.3, y);
    ctx.stroke();
  }
  // two friends silhouettes laughing on the street, larger and central
  ctx.fillStyle = '#05030f';
  for (const [fx, s] of [[w * 0.44, 1.35], [w * 0.58, 1.28]]) {
    ctx.save();
    ctx.translate(fx, h * 0.96);
    ctx.scale(s, s);
    ctx.beginPath(); // body
    ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-30, -150, -12, -190);
    ctx.lineTo(12, -190); ctx.quadraticCurveTo(30, -150, 26, 0); ctx.closePath();
    ctx.fill();
    ctx.beginPath(); // head
    ctx.arc(0, -218, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // string lights
  ctx.strokeStyle = 'rgba(255,201,60,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.1);
  ctx.quadraticCurveTo(w / 2, h * 0.2, w, h * 0.08);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const lx = t * w;
    const ly = h * 0.1 + Math.sin(t * Math.PI) * h * 0.08;
    ctx.fillStyle = i % 2 ? '#ff2e88' : '#ffc93c';
    ctx.beginPath();
    ctx.arc(lx, ly + 8, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPier(ctx, w, h) {
  sky(ctx, w, h, [[0, '#7ec8e3'], [0.45, '#ffd9a0'], [0.62, '#ff9d5c'], [1, '#2e7f8f']]);
  sunDisc(ctx, w * 0.3, h * 0.4, 90, '#fff8d6', 'rgba(255,220,140,0.8)');
  // sea
  const sea = ctx.createLinearGradient(0, h * 0.55, 0, h);
  sea.addColorStop(0, '#3fc1c9');
  sea.addColorStop(1, '#0f5e6e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  const rnd = mulberry32(33);
  for (let i = 0; i < 26; i++) {
    const y = h * (0.58 + rnd() * 0.36);
    const x = rnd() * w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + rnd() * 70, y);
    ctx.stroke();
  }
  // wooden pier planks
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(0, h * 0.62, w, h * 0.1);
  ctx.fillStyle = '#7d5a38';
  for (let x = 0; x < w; x += 46) ctx.fillRect(x, h * 0.62, 4, h * 0.1);
  ctx.fillStyle = '#4a2f1d';
  ctx.fillRect(0, h * 0.7, w, 8);
  // fisherman silhouette with rod (kept near centre so portrait crops keep him whole)
  ctx.fillStyle = '#1c1210';
  ctx.save();
  ctx.translate(w * 0.56, h * 0.62);
  ctx.beginPath();
  ctx.moveTo(-22, 0); ctx.quadraticCurveTo(-26, -110, -10, -140);
  ctx.lineTo(10, -140); ctx.quadraticCurveTo(26, -110, 22, 0); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -168, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-30, -188, 60, 10); // bucket hat brim
  ctx.fillRect(-16, -206, 32, 22);
  ctx.restore();
  ctx.strokeStyle = '#1c1210';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.56 + 18, h * 0.62 - 130);
  ctx.quadraticCurveTo(w * 0.74, h * 0.42, w * 0.83, h * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.83, h * 0.3);
  ctx.lineTo(w * 0.83, h * 0.52);
  ctx.stroke();
  palm(ctx, w * 0.06, h * 0.66, 0.9, -0.08, '#123a2e');
}

// The three built-in sample scenes, drawn once and cached.
const SCENES = [
  { id: 'boulevard', name: 'Boulevard sunset', draw: drawBoulevard },
  { id: 'neon', name: 'Neon street', draw: drawNeonStreet },
  { id: 'pier', name: 'Pier morning', draw: drawPier },
];

const cache = new Map();

export function sampleScene(id) {
  if (cache.has(id)) return cache.get(id);
  const scene = SCENES.find((s) => s.id === id) ?? SCENES[0];
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  scene.draw(canvas.getContext('2d'), 1200, 900);
  const entry = { id: scene.id, name: scene.name, canvas, width: 1200, height: 900 };
  cache.set(id, entry);
  return entry;
}

export function sampleScenes() {
  return SCENES.map((s) => sampleScene(s.id));
}
