// Cover renderer: draws the multi-panel poster onto any canvas at any size.
// Everything is drawn in code — panels, frames, sun, skyline, lettering.
// No game logos, artwork or fonts are used anywhere.

export const GRADES = {
  sunset: { top: 'rgba(255,46,136,0.28)', mid: 'rgba(255,122,24,0.22)', bot: 'rgba(255,201,60,0.20)', tint: '#ff7a3c' },
  neon: { top: 'rgba(124,92,255,0.34)', mid: 'rgba(25,227,194,0.16)', bot: 'rgba(255,46,136,0.26)', tint: '#19e3c2' },
  gold: { top: 'rgba(255,201,60,0.30)', mid: 'rgba(255,150,40,0.20)', bot: 'rgba(120,60,0,0.18)', tint: '#ffc93c' },
  teal: { top: 'rgba(10,40,60,0.34)', mid: 'rgba(25,227,194,0.18)', bot: 'rgba(0,20,30,0.30)', tint: '#19e3c2' },
  rose: { top: 'rgba(255,120,160,0.30)', mid: 'rgba(200,60,140,0.22)', bot: 'rgba(60,10,50,0.24)', tint: '#ff5c8a' },
};

export const LAYOUTS = {
  hero3: { panels: 4, label: 'Hero + three' },
  grid4: { panels: 4, label: 'Four-panel grid' },
  fullbleed: { panels: 1, label: 'Full-bleed poster' },
  tilt3: { panels: 3, label: 'Tilted snapshots' },
};

// Panel rectangles for a layout, in fractions of the cover (x, y, w, h).
export function layoutRects(layout, W, H) {
  const g = Math.round(W * 0.012); // gutter
  switch (layout) {
    case 'grid4': {
      const cw = (W - g * 3) / 2, ch = (H - g * 3) / 2;
      return [
        [g, g, cw, ch], [g * 2 + cw, g, cw, ch],
        [g, g * 2 + ch, cw, ch], [g * 2 + cw, g * 2 + ch, cw, ch],
      ];
    }
    case 'fullbleed':
      return [[0, 0, W, H]];
    case 'tilt3': {
      const pw = W * 0.3, ph = H * 0.62;
      return [
        [W * 0.05, H * 0.08, pw, ph],
        [W * 0.35, H * 0.16, pw, ph],
        [W * 0.65, H * 0.08, pw, ph],
      ];
    }
    case 'hero3':
    default: {
      const heroW = W * 0.62 - g * 1.5;
      const sideW = W - heroW - g * 3;
      const sideH = (H - g * 4) / 3;
      return [
        [g, g, heroW, H - g * 2],
        [heroW + g * 2, g, sideW, sideH],
        [heroW + g * 2, g * 2 + sideH, sideW, sideH],
        [heroW + g * 2, g * 3 + sideH * 2, sideW, sideH],
      ];
    }
  }
}

// Draw one photo into a panel rect, cover-fit, with per-panel zoom and pan.
function drawPanelPhoto(ctx, photo, rect, zoom, dx, dy) {
  const [x, y, w, h] = rect;
  if (!photo) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3b1155');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.round(h * 0.05)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    return;
  }
  const pw = photo.width || photo.naturalWidth;
  const ph = photo.height || photo.naturalHeight;
  const scale = Math.max(w / pw, h / ph) * (zoom || 1);
  const dw = pw * scale, dh = ph * scale;
  const ox = x + (w - dw) / 2 + (dx || 0) * w;
  const oy = y + (h - dh) / 2 + (dy || 0) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(photo, ox, oy, dw, dh);
  ctx.restore();
}

function applyGrade(ctx, rect, grade, W, H) {
  const [x, y, w, h] = rect;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, grade.top);
  g.addColorStop(0.55, grade.mid);
  g.addColorStop(1, grade.bot);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function vignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function grain(ctx, W, H, seed) {
  let a = seed >>> 0;
  const rnd = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  ctx.save();
  ctx.globalAlpha = 0.05;
  const n = Math.round((W * H) / 900);
  for (let i = 0; i < n; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
  }
  ctx.restore();
}

function drawSun(ctx, W, H, grade) {
  const cx = W * 0.5, cy = H * 0.30, r = Math.min(W, H) * 0.11;
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.2);
  g.addColorStop(0, grade.tint + 'cc');
  g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// Bold original title lettering. `style`: sunset | white | neon | bar.
export function drawTitle(ctx, text, sub, W, H, opts) {
  const { pos, style, scale } = opts;
  const base = Math.min(W, H) * 0.105 * (scale || 1);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bandH = base * 1.9;
  let by;
  if (pos === 'top') by = bandH * 0.62;
  else if (pos === 'hero') by = H * 0.42;
  else by = H - bandH * 0.62;
  if (style === 'bar') {
    ctx.fillStyle = 'rgba(8,2,16,0.88)';
    ctx.fillRect(0, by - bandH / 2, W, bandH);
  }
  const font = `900 ${base}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.font = font;
  // Fit long titles by shrinking until they fit.
  let size = base;
  while (ctx.measureText(text).width > W * 0.94 && size > base * 0.45) {
    size *= 0.94;
    ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
  const ty = by - (sub ? size * 0.16 : 0);
  if (style === 'sunset') {
    const g = ctx.createLinearGradient(0, ty - size * 0.55, 0, ty + size * 0.55);
    g.addColorStop(0, '#fff3c4');
    g.addColorStop(0.5, '#ff7a18');
    g.addColorStop(1, '#ff2e88');
    ctx.fillStyle = g;
  } else if (style === 'neon') {
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.22;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.strokeText(text, W / 2, ty);
    ctx.fillStyle = '#ffe9f4';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  if (style !== 'neon') {
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.strokeStyle = 'rgba(10,2,20,0.9)';
    ctx.strokeText(text, W / 2, ty);
  }
  ctx.fillText(text, W / 2, ty);
  ctx.shadowBlur = 0;
  if (sub) {
    const subSize = Math.max(14, size * 0.24);
    ctx.font = `italic 700 ${subSize}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = style === 'bar' ? '#ffc93c' : '#ffffff';
    ctx.fillText(sub, W / 2, ty + size * 0.62);
  }
  ctx.restore();
}

// Main entry: render the whole cover onto `canvas` at its own pixel size.
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = layoutRects(state.layout, W, H);
  const panels = state.panels || [];

  // Backdrop: sunset sky + sun + skyline, so even empty panels look like a poster.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.5, '#c94b7c');
  sky.addColorStop(0.75, '#ff7a3c');
  sky.addColorStop(1, '#3a0d33');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  drawSun(ctx, W, H, grade);

  const tilted = state.layout === 'tilt3';
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const panel = panels[i] || {};
    ctx.save();
    if (tilted) {
      const cx = rect[0] + rect[2] / 2, cy = rect[1] + rect[3] / 2;
      ctx.translate(cx, cy);
      ctx.rotate((i - 1) * 0.045);
      ctx.translate(-cx, -cy);
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = W * 0.008;
    }
    // white polaroid-style frame
    const frame = Math.round(W * 0.008);
    ctx.fillStyle = '#fff6ec';
    ctx.fillRect(rect[0] - frame, rect[1] - frame, rect[2] + frame * 2, rect[3] + frame * 2);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    drawPanelPhoto(ctx, panel.photo || null, rect, panel.zoom || 1, panel.dx || 0, panel.dy || 0);
    applyGrade(ctx, rect, grade, W, H);
    // thin inner frame line
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1, W * 0.002);
    ctx.strokeRect(rect[0], rect[1], rect[2], rect[3]);
    ctx.restore();
  }

  if (state.layout === 'fullbleed') {
    // title band shadow so lettering stays readable over the photo
    const bandH = H * 0.2;
    const bg = ctx.createLinearGradient(0, H - bandH, 0, H);
    bg.addColorStop(0, 'rgba(8,2,16,0)');
    bg.addColorStop(1, 'rgba(8,2,16,0.75)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, H - bandH, W, bandH);
  }

  vignette(ctx, W, H);
  grain(ctx, W, H, 1234 + W + H);
  drawTitle(ctx, state.title || 'SUNSET HEIST', state.subtitle || '', W, H, {
    pos: state.titlePos || 'bottom',
    style: state.titleStyle || 'sunset',
    scale: (state.titleSize || 100) / 100,
  });
  return canvas;
}

// Export helper: render at an exact size and hand back a PNG blob.
export function exportCoverPng(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  renderCover(canvas, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
