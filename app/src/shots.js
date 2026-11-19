// Deterministic screenshot scenes for the entry's screenshots/.
// ?shot=cover&photo=<id>&caption=<text>&layout=<id>&grade=<id>  → the exported cover, full frame
// ?shot=editor&photo=<id>&caption=<text>                      → the editor with a photo loaded
// The cover is drawn by the app's own renderer, at the window's size, so a
// screenshot of ?shot=cover IS the PNG the app exports (scaled to the gate's limits).
import { renderCover } from './cover.js';
import { sampleScene } from './samples.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (!shot) {
  // Normal use: nothing to do.
} else {
  const studio = window.__viceStudio;
  const photo = params.get('photo') || 'boulevard';
  const caption = params.get('caption') || 'SUNSET HEIST';
  const subtitle = params.get('subtitle') || 'a neon coast story';
  const layout = params.get('layout') || 'hero3';
  const grade = params.get('grade') || 'sunset';

  const waitStudio = () => new Promise((resolve) => {
    if (window.__viceStudio) return resolve(window.__viceStudio);
    const t = setInterval(() => {
      if (window.__viceStudio) { clearInterval(t); resolve(window.__viceStudio); }
    }, 20);
  });

  waitStudio().then((s) => {
    s.setPhoto(photo);
    s.setCaption(decodeURIComponent(caption), decodeURIComponent(subtitle));
    s.setLayout(layout);
    s.state.grade = grade;
    const gradeSel = document.getElementById('grade');
    if (gradeSel) gradeSel.value = grade;
    s.render();
    document.title = `shot:${shot}`;

    if (shot === 'cover') {
      document.body.classList.add('shot');
      const canvas = document.getElementById('preview');
      // Render the cover at the window's pixel size, full frame.
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderCover(canvas, s.state);
      document.title = 'shot:cover:done';
    } else if (shot === 'editor') {
      document.title = 'shot:editor:done';
    }
  });
}
