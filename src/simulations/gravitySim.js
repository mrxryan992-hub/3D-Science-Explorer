import { markSimulationTried } from '../state/store.js';
import { notifyRewardEvents } from '../components/toast.js';
import { formatNumber } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';

const PLANETS = [
  { id: 'earth', name: 'Bumi', g: 9.8, skyTop: '#0B162E', skyBottom: '#132A4A', ground: '#10B981', sphere: '#38BDF8' },
  { id: 'moon', name: 'Bulan', g: 1.62, skyTop: '#070A12', skyBottom: '#141B2D', ground: '#94A3B8', sphere: '#E2E8F0' },
  { id: 'mars', name: 'Mars', g: 3.71, skyTop: '#1A0F14', skyBottom: '#3B1E1A', ground: '#D97706', sphere: '#F59E0B' },
  { id: 'jupiter', name: 'Jupiter', g: 24.79, skyTop: '#1A1320', skyBottom: '#332219', ground: '#EA580C', sphere: '#FBBF24' },
];

const DROP_HEIGHT = 100; // meters

export function mountGravitySim(container) {
  let planet = PLANETS[0];
  let compareEarth = false;
  let speedScale = 1;
  let elapsed = 0;
  let isPlaying = false;
  let isFinished = false;
  let lastTs = 0;
  let rafId = 0;

  container.innerHTML = `
    <div class="sim-sandbox">
      <div class="sim-stage-panel">
        <div class="sim-stage-header">
          <div>
            <h3 class="sim-stage-title">Menara Jatuh Bebas (${DROP_HEIGHT} m)</h3>
            <p class="sim-stage-sub">Mengamati percepatan konstan $y = \\frac{1}{2} g t^2$ tanpa hambatan udara</p>
          </div>
          <span class="sim-state-tag" id="grav-status">Siap</span>
        </div>
        <div class="canvas-wrap">
          <canvas id="grav-canvas" class="sim-canvas" aria-label="Simulasi jatuh bebas gravitasi"></canvas>
        </div>
        <div class="sim-telemetry-strip">
          <div class="telemetry-cell">
            <span class="telemetry-label">Waktu (t)</span>
            <strong class="telemetry-val mono" id="grav-t">0,00 s</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Kecepatan (v)</span>
            <strong class="telemetry-val mono" id="grav-v">0,0 m/s</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Jarak Tempuh (y)</span>
            <strong class="telemetry-val mono" id="grav-y">0,0 m</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Waktu Total Tiba</span>
            <strong class="telemetry-val mono" id="grav-total">${formatNumber(Math.sqrt((2 * DROP_HEIGHT) / planet.g), 2)} s</strong>
          </div>
        </div>
      </div>

      <aside class="sim-control-panel">
        <div class="control-group">
          <label class="control-label" for="grav-planet">Pilih Benda Langit</label>
          <select id="grav-planet" class="field-select">
            ${PLANETS.map((p) => `<option value="${p.id}">${p.name} (g = ${formatNumber(p.g, 2)} m/s²)</option>`).join('')}
          </select>
        </div>

        <div class="control-group">
          <div class="control-row-between">
            <label class="control-label" for="grav-speed">Skala Waktu</label>
            <span class="control-readout mono" id="grav-speed-val">1,0×</span>
          </div>
          <input id="grav-speed" class="field-range" type="range" min="0.25" max="2" step="0.25" value="1" />
        </div>

        <div class="control-group">
          <label class="checkbox-row">
            <input type="checkbox" id="grav-compare" />
            <span>Tampilkan pembanding gravitasi Bumi (9,80 m/s²)</span>
          </label>
        </div>

        <div class="control-actions">
          <button type="button" class="btn btn-primary" id="grav-play">
            ${iconSvg('play', 16)}
            <span id="grav-play-label">Jatuhkan</span>
          </button>
          <button type="button" class="btn btn-secondary" id="grav-reset">
            ${iconSvg('reset', 16)}
            <span>Reset</span>
          </button>
        </div>

        <div class="concept-note">
          <h4>Konsep Kunci</h4>
          <p class="formula-box mono">y = ½ · g · t² &nbsp;|&nbsp; v = g · t</p>
          <p class="concept-text">
            Semakin besar percepatan gravitasi (<em>g</em>), semakin cepat benda mencapai tanah dan semakin besar kecepatan tumbukannya, terlepas dari massa benda.
          </p>
        </div>
      </aside>
    </div>
  `;

  // Fix math string cleanly without raw LaTeX delimiters
  const subEl = container.querySelector('.sim-stage-sub');
  if (subEl) {
    subEl.textContent = 'Mengamati percepatan konstan y = ½ · g · t² tanpa hambatan udara';
  }

  const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('#grav-canvas'));
  const ctx = canvas.getContext('2d');
  const planetSel = /** @type {HTMLSelectElement} */ (container.querySelector('#grav-planet'));
  const speedInput = /** @type {HTMLInputElement} */ (container.querySelector('#grav-speed'));
  const speedVal = container.querySelector('#grav-speed-val');
  const compareCheckbox = /** @type {HTMLInputElement} */ (container.querySelector('#grav-compare'));
  const playBtn = /** @type {HTMLButtonElement} */ (container.querySelector('#grav-play'));
  const playLabel = container.querySelector('#grav-play-label');
  const resetBtn = /** @type {HTMLButtonElement} */ (container.querySelector('#grav-reset'));
  const statusEl = container.querySelector('#grav-status');
  const outT = container.querySelector('#grav-t');
  const outV = container.querySelector('#grav-v');
  const outY = container.querySelector('#grav-y');
  const outTotal = container.querySelector('#grav-total');

  function getTotalTime(g) {
    return Math.sqrt((2 * DROP_HEIGHT) / g);
  }

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(300, Math.floor(rect.width));
    const height = 340;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function updateReadouts() {
    const totalT = getTotalTime(planet.g);
    const t = Math.min(elapsed, totalT);
    const y = Math.min(DROP_HEIGHT, 0.5 * planet.g * t * t);
    const v = planet.g * t;

    outT.textContent = `${formatNumber(t, 2)} s`;
    outV.textContent = `${formatNumber(v, 1)} m/s`;
    outY.textContent = `${formatNumber(y, 1)} m`;
    outTotal.textContent = `${formatNumber(totalT, 2)} s`;

    if (isFinished) {
      statusEl.textContent = 'Mendarat';
      statusEl.className = 'sim-state-tag is-complete';
      playLabel.textContent = 'Ulangi';
    } else if (isPlaying) {
      statusEl.textContent = 'Berjalan';
      statusEl.className = 'sim-state-tag is-running';
      playLabel.textContent = 'Jeda';
    } else if (elapsed > 0) {
      statusEl.textContent = 'Dijeda';
      statusEl.className = 'sim-state-tag is-paused';
      playLabel.textContent = 'Lanjut';
    } else {
      statusEl.textContent = 'Siap';
      statusEl.className = 'sim-state-tag';
      playLabel.textContent = 'Jatuhkan';
    }
  }

  function draw() {
    const w = canvas.clientWidth || 560;
    const h = canvas.clientHeight || 340;
    const topPad = 28;
    const groundY = h - 28;
    const trackH = groundY - topPad;

    // Sky gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, planet.skyTop);
    bg.addColorStop(1, planet.skyBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle stars
    ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
    for (let i = 0; i < 32; i++) {
      const sx = ((i * 137) % (w - 20)) + 10;
      const sy = ((i * 71) % (groundY - 30)) + 10;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Ruler lines 0..100m
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    for (let m = 0; m <= DROP_HEIGHT; m += 25) {
      const lineY = topPad + (m / DROP_HEIGHT) * trackH;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(56, lineY);
      ctx.lineTo(w - 190, lineY);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`${m} m`, 14, lineY);
    }

    // Drop Tower Pillar
    const cx = Math.max(150, (w - 170) * 0.5);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, topPad);
    ctx.lineTo(cx, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ground surface
    ctx.fillStyle = planet.ground;
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, groundY, w, 3);

    // Earth comparison ghost sphere
    if (compareEarth && planet.id !== 'earth') {
      const earthTotal = getTotalTime(9.8);
      const tEarth = Math.min(elapsed, earthTotal);
      const yEarth = Math.min(DROP_HEIGHT, 0.5 * 9.8 * tEarth * tEarth);
      const pyEarth = topPad + (yEarth / DROP_HEIGHT) * trackH - 12;
      const ghostX = cx - 44;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(ghostX, Math.max(topPad, pyEarth), 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#7DD3FC';
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.fillText('Bumi', ghostX - 12, Math.max(topPad, pyEarth) - 18);
    }

    // Primary sphere
    const totalT = getTotalTime(planet.g);
    const t = Math.min(elapsed, totalT);
    const yMeters = Math.min(DROP_HEIGHT, 0.5 * planet.g * t * t);
    const velocity = planet.g * t;
    const sphereR = 14;
    const sphereY = Math.min(groundY - sphereR, topPad + (yMeters / DROP_HEIGHT) * (trackH - sphereR));

    // Velocity vector arrow
    if (velocity > 0.5 && !isFinished) {
      const arrowLen = Math.min(68, velocity * 1.4);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, sphereY + sphereR + 2);
      ctx.lineTo(cx, sphereY + sphereR + arrowLen);
      ctx.stroke();
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(cx, sphereY + sphereR + arrowLen + 6);
      ctx.lineTo(cx - 5, sphereY + sphereR + arrowLen - 2);
      ctx.lineTo(cx + 5, sphereY + sphereR + arrowLen - 2);
      ctx.closePath();
      ctx.fill();
    }

    // 3D-shaded sphere
    const grad = ctx.createRadialGradient(cx - 5, sphereY - 5, 2, cx, sphereY, sphereR);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.35, planet.sphere);
    grad.addColorStop(1, '#0B101B');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, sphereY, sphereR, 0, Math.PI * 2);
    ctx.fill();

    // Mini v(t) live graph on the right side of canvas
    const gx = w - 168;
    const gy = 28;
    const gw = 148;
    const gh = 112;
    ctx.fillStyle = 'rgba(11, 16, 27, 0.78)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1;
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('Grafik v(t)', gx + 8, gy + 14);

    const maxV = planet.g * totalT;
    const padX = gx + 12;
    const padY = gy + 24;
    const plotW = gw - 24;
    const plotH = gh - 36;

    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.beginPath();
    ctx.moveTo(padX, padY);
    ctx.lineTo(padX, padY + plotH);
    ctx.lineTo(padX + plotW, padY + plotH);
    ctx.stroke();

    // Theoretical line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padX, padY + plotH);
    ctx.lineTo(padX + plotW, padY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Active trace
    const progress = totalT > 0 ? t / totalT : 0;
    const px = padX + progress * plotW;
    const py = padY + plotH - progress * plotH;
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX, padY + plotH);
    ctx.lineTo(px, py);
    ctx.stroke();

    ctx.fillStyle = '#22D3EE';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function step(ts) {
    if (!isPlaying) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000) * speedScale;
    lastTs = ts;

    const totalT = getTotalTime(planet.g);
    elapsed += dt;

    if (elapsed >= totalT) {
      elapsed = totalT;
      isPlaying = false;
      isFinished = true;
    }

    updateReadouts();
    draw();

    if (isPlaying) {
      rafId = requestAnimationFrame(step);
    }
  }

  function startOrToggle() {
    const res = markSimulationTried('g');
    notifyRewardEvents(res);

    if (isFinished) {
      elapsed = 0;
      isFinished = false;
    }
    isPlaying = !isPlaying;
    lastTs = 0;
    updateReadouts();
    draw();
    if (isPlaying) {
      rafId = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(rafId);
    }
  }

  function reset() {
    cancelAnimationFrame(rafId);
    isPlaying = false;
    isFinished = false;
    elapsed = 0;
    lastTs = 0;
    updateReadouts();
    draw();
  }

  const handlePlanetChange = () => {
    planet = PLANETS.find((p) => p.id === planetSel.value) || PLANETS[0];
    reset();
  };

  const handleSpeedChange = () => {
    speedScale = Number(speedInput.value);
    speedVal.textContent = `${formatNumber(speedScale, 2).replace(/,00$/, ',0')}×`;
  };

  const handleCompareChange = () => {
    compareEarth = compareCheckbox.checked;
    draw();
  };

  playBtn.addEventListener('click', startOrToggle);
  resetBtn.addEventListener('click', reset);
  planetSel.addEventListener('change', handlePlanetChange);
  speedInput.addEventListener('input', handleSpeedChange);
  compareCheckbox.addEventListener('change', handleCompareChange);
  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  updateReadouts();

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resizeCanvas);
  };
}
