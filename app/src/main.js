// Vice Cover Studio — editor wiring. Vanilla JS, no libraries, no network.
// State: one photo (image/canvas) per panel, with zoom + pan; caption + grade + layout.

import { renderCover, exportCoverPng, LAYOUTS, layoutRects } from './cover.js';
import { sampleScene, sampleScenes } from './samples.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

// --- state ---------------------------------------------------------------
const state = {
  layout: 'hero3',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'a neon coast story',
  titlePos: 'bottom',
  titleStyle: 'sunset',
  titleSize: 100,
  panels: [], // { photo, zoom, dx, dy } per layout panel
  selected: 0,
};

const library = []; // uploaded photos: { name, img }
const samples = sampleScenes();

function panelCount() {
  return (LAYOUTS[state.layout] || LAYOUTS.hero3).panels;
}

function ensurePanels() {
  const n = panelCount();
  while (state.panels.length < n) {
    const photo = samples[state.panels.length % samples.length];
    state.panels.push({ photo: photo.canvas, zoom: 1, dx: 0, dy: 0, source: photo.id });
  }
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
}

// --- rendering -----------------------------------------------------------
function render() {
  ensurePanels();
  renderCover(preview, state);
  document.querySelectorAll('.panel-chip').forEach((chip, i) => {
    chip.classList.toggle('active', i === state.selected);
  });
  const sel = state.panels[state.selected];
  $('zoom').value = Math.round((sel.zoom || 1) * 100);
  $('zoomVal').textContent = `${Math.round((sel.zoom || 1) * 100)}%`;
}

// --- thumbnails ----------------------------------------------------------
function rebuildThumbs() {
  const row = $('thumbRow');
  row.innerHTML = '';
  const add = (label, img, source) => {
    const t = document.createElement('img');
    t.className = 'thumb';
    t.alt = label;
    t.title = label;
    t.src = img instanceof HTMLCanvasElement ? img.toDataURL('image/jpeg', 0.85) : img.src;
    t.addEventListener('click', () => {
      const panel = state.panels[state.selected];
      panel.photo = img instanceof HTMLCanvasElement ? img : img;
      panel.source = source;
      panel.zoom = 1; panel.dx = 0; panel.dy = 0;
      row.querySelectorAll('.thumb').forEach((el) => el.classList.remove('active'));
      t.classList.add('active');
      render();
    });
    row.appendChild(t);
    return t;
  };
  for (const s of samples) add(`Sample: ${s.name}`, s.canvas, s.id);
  for (const up of library) add(`Uploaded: ${up.name}`, up.img, up.name);
}

function rebuildPanelBar() {
  const bar = $('panelBar');
  bar.innerHTML = '';
  ensurePanels();
  for (let i = 0; i < state.panels.length; i++) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'panel-chip';
    chip.textContent = `Panel ${i + 1}`;
    chip.addEventListener('click', () => { state.selected = i; render(); });
    bar.appendChild(chip);
  }
}

// --- photo upload --------------------------------------------------------
$('upload').addEventListener('change', (e) => {
  const files = [...e.target.files];
  let pending = files.length;
  if (!pending) return;
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      library.push({ name: file.name, img });
      if (--pending === 0) {
        rebuildThumbs();
        const panel = state.panels[state.selected];
        panel.photo = library[library.length - 1].img;
        panel.source = file.name;
        panel.zoom = 1; panel.dx = 0; panel.dy = 0;
        render();
      }
    };
    img.onerror = () => { if (--pending === 0) rebuildThumbs(); };
    img.src = url;
  }
  e.target.value = '';
});

// --- controls ------------------------------------------------------------
$('layout').addEventListener('change', (e) => { state.layout = e.target.value; rebuildPanelBar(); render(); });
$('grade').addEventListener('change', (e) => { state.grade = e.target.value; render(); });
$('title').addEventListener('input', (e) => { state.title = e.target.value.toUpperCase(); render(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
$('titlePos').addEventListener('change', (e) => { state.titlePos = e.target.value; render(); });
$('titleStyle').addEventListener('change', (e) => { state.titleStyle = e.target.value; render(); });
$('titleSize').addEventListener('input', (e) => {
  state.titleSize = Number(e.target.value);
  $('titleSizeVal').textContent = `${state.titleSize}%`;
  render();
});
$('zoom').addEventListener('input', (e) => {
  const panel = state.panels[state.selected];
  panel.zoom = Number(e.target.value) / 100;
  $('zoomVal').textContent = `${e.target.value}%`;
  render();
});
$('reframe').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.zoom = 1; panel.dx = 0; panel.dy = 0;
  render();
});

// --- drag to pan the selected panel's photo -------------------------------
let dragging = null;
function canvasPoint(e) {
  const r = preview.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
preview.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  // Pick the panel under the pointer (preview is square; layout math is in fractions).
  const rects = layoutRects(state.layout, 1, 1);
  for (let i = 0; i < rects.length; i++) {
    const [x, y, w, h] = rects[i];
    if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) {
      state.selected = i;
      render();
      break;
    }
  }
  const panel = state.panels[state.selected];
  dragging = { x: e.clientX, y: e.clientY, dx: panel.dx, dy: panel.dy };
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const r = preview.getBoundingClientRect();
  const panel = state.panels[state.selected];
  panel.dx = dragging.dx + (e.clientX - dragging.x) / r.width;
  panel.dy = dragging.dy + (e.clientY - dragging.y) / r.height;
  panel.dx = Math.max(-0.6, Math.min(0.6, panel.dx));
  panel.dy = Math.max(-0.6, Math.min(0.6, panel.dy));
  render();
});
preview.addEventListener('pointerup', () => { dragging = null; });

// --- export --------------------------------------------------------------
document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const w = Number(btn.dataset.w), h = Number(btn.dataset.h);
    $('exportStatus').textContent = `Rendering ${w} × ${h}…`;
    try {
      const blob = await exportCoverPng(state, w, h);
      const url = URL.createObjectURL(blob);
      const a = $('downloadLink');
      a.href = url;
      a.download = `vice-cover-${w}x${h}.png`;
      a.click();
      $('exportStatus').textContent = `Exported ${w} × ${h} PNG — check your downloads.`;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      $('exportStatus').textContent = `Export failed: ${err.message}`;
    }
  });
});

// --- shot mode hook (shots.js calls this) --------------------------------
window.__viceStudio = {
  state,
  render,
  setPhoto: (id) => {
    const s = sampleScene(id);
    ensurePanels();
    state.panels.forEach((p) => { p.photo = s.canvas; p.source = s.id; });
    render();
  },
  setCaption: (title, subtitle) => {
    if (title) { state.title = title; $('title').value = title; }
    if (subtitle !== undefined) { state.subtitle = subtitle; $('subtitle').value = subtitle; }
    render();
  },
  setLayout: (layout) => {
    if (LAYOUTS[layout]) { state.layout = layout; $('layout').value = layout; rebuildPanelBar(); render(); }
  },
  exportPng: exportCoverPng,
};

// --- boot ----------------------------------------------------------------
rebuildThumbs();
rebuildPanelBar();
render();
