import { markSimulationTried } from '../state/store.js';
import { notifyRewardEvents } from '../components/toast.js';
import { formatNumber } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';

const SOLAR_BODIES = [
  { id: 'mercury', name: 'Merkurius', a: 0.39, period: 0.24, speedKms: 47.4, radiusPx: 5, color: '#A8A29E', orbitColor: 'rgba(168, 162, 158, 0.32)' },
  { id: 'venus', name: 'Venus', a: 0.72, period: 0.61, speedKms: 35.0, radiusPx: 7.5, color: '#FBBF24', orbitColor: 'rgba(251, 191, 36, 0.32)' },
  { id: 'earth', name: 'Bumi', a: 1.0, period: 1.0, speedKms: 29.8, radiusPx: 8, color: '#38BDF8', orbitColor: 'rgba(56, 189, 248, 0.38)' },
  { id: 'mars', name: 'Mars', a: 1.52, period: 1.88, speedKms: 24.1, radiusPx: 6.5, color: '#F87171', orbitColor: 'rgba(248, 113, 113, 0.34)' },
  { id: 'jupiter', name: 'Jupiter', a: 2.35, period: 3.6, speedKms: 13.1, radiusPx: 13, color: '#F59E0B', orbitColor: 'rgba(245, 158, 11, 0.28)', note: 'Skala jarak terkompresi agar tampak dalam satu bidang' },
];

export function mountSolarSim(container) {
  const res = markSimulationTried('s');
  notifyRewardEvents(res);

  let simYears = 0;
  let speed = 0.8;
  let isPlaying = true;
  let showLabels = true;
  let selectedId = 'earth';
  let yaw = 0.45;
  let pitch = 0.62;
  let zoom = 1;
  let dragging = false;
  let lastPointer = { x: 0, y: 0 };
  let lastTs = 0;
  let rafId = 0;

  container.innerHTML = `
    <div class="sim-sandbox">
      <div class="sim-stage-panel">
        <div class="sim-stage-header">
          <div>
            <h3 class="sim-stage-title">Tata Surya 3D — Hukum Kepler (T² ∝ a³)</h3>
            <p class="sim-stage-sub">Seret kanvas untuk memutar sudut pandang 3D, gunakan gulir atau tombol untuk zoom</p>
          </div>
          <span class="sim-state-tag is-running" id="solar-status">Mengorbit</span>
        </div>
        <div class="canvas-wrap">
          <canvas id="solar-canvas" class="sim-canvas is-draggable" aria-label="Simulasi tata surya 3D interaktif"></canvas>
        </div>
        <div class="sim-telemetry-strip">
          <div class="telemetry-cell">
            <span class="telemetry-label">Waktu Simulasi</span>
            <strong class="telemetry-val mono" id="solar-yr">0,00 th</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Planet Terpilih</span>
            <strong class="telemetry-val" id="solar-planet-name">Bumi</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Periode Orbit (T)</span>
            <strong class="telemetry-val mono" id="solar-period">1,00 th</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Kecepatan Orbit</span>
            <strong class="telemetry-val mono" id="solar-vel">29,8 km/s</strong>
          </div>
        </div>
      </div>

      <aside class="sim-control-panel">
        <div class="control-group">
          <label class="control-label" for="solar-focus">Inspeksi Planet</label>
          <select id="solar-focus" class="field-select">
            ${SOLAR_BODIES.map((b) => `<option value="${b.id}" ${b.id === selectedId ? 'selected' : ''}>${b.name} (${formatNumber(b.period, 2)} th)</option>`).join('')}
          </select>
        </div>

        <div class="control-group">
          <div class="control-row-between">
            <label class="control-label" for="solar-speed">Kecepatan Waktu</label>
            <span class="control-readout mono" id="solar-speed-val">0,8×</span>
          </div>
          <input id="solar-speed" class="field-range" type="range" min="0.1" max="3" step="0.1" value="0.8" />
        </div>

        <div class="control-group">
          <div class="control-row-between">
            <label class="control-label" for="solar-pitch">Kemiringan 3D (Pitch)</label>
            <span class="control-readout mono" id="solar-pitch-val">36°</span>
          </div>
          <input id="solar-pitch" class="field-range" type="range" min="10" max="85" step="1" value="36" />
        </div>

        <div class="control-group">
          <label class="checkbox-row">
            <input type="checkbox" id="solar-labels" checked />
            <span>Tampilkan label nama planet</span>
          </label>
        </div>

        <div class="control-actions">
          <button type="button" class="btn btn-primary" id="solar-toggle">
            ${iconSvg('pause', 16)}
            <span id="solar-toggle-label">Jeda</span>
          </button>
          <button type="button" class="btn btn-secondary" id="solar-reset-cam">
            ${iconSvg('reset', 16)}
            <span>Reset Kamera</span>
          </button>
        </div>

        <div class="concept-note">
          <h4>Hukum III Kepler</h4>
          <p class="formula-box mono">T² = a³ (dalam tahun & AU)</p>
          <p class="concept-text" id="solar-note">
            Merkurius menyelesaikan 1 orbit dalam 0,24 tahun Bumi karena sangat dekat dengan Matahari, sedangkan Mars membutuhkan 1,88 tahun.
          </p>
        </div>
      </aside>
    </div>
  `;

  const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('#solar-canvas'));
  const ctx = canvas.getContext('2d');
  const focusSel = /** @type {HTMLSelectElement} */ (container.querySelector('#solar-focus'));
  const speedInput = /** @type {HTMLInputElement} */ (container.querySelector('#solar-speed'));
  const speedVal = container.querySelector('#solar-speed-val');
  const pitchInput = /** @type {HTMLInputElement} */ (container.querySelector('#solar-pitch'));
  const pitchVal = container.querySelector('#solar-pitch-val');
  const labelsCheck = /** @type {HTMLInputElement} */ (container.querySelector('#solar-labels'));
  const toggleBtn = /** @type {HTMLButtonElement} */ (container.querySelector('#solar-toggle'));
  const toggleLabel = container.querySelector('#solar-toggle-label');
  const resetCamBtn = /** @type {HTMLButtonElement} */ (container.querySelector('#solar-reset-cam'));
  const statusEl = container.querySelector('#solar-status');
  const yrEl = container.querySelector('#solar-yr');
  const nameEl = container.querySelector('#solar-planet-name');
  const periodEl = container.querySelector('#solar-period');
  const velEl = container.querySelector('#solar-vel');

  function project3D(x, y, z, w, h) {
    // Rotate around Y (yaw) then X (pitch)
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    const fov = 560 * zoom;
    const depth = fov + z2;
    const scale = fov / Math.max(120, depth);
    return {
      sx: w * 0.5 + x1 * scale,
      sy: h * 0.5 + y2 * scale,
      scale,
      z: z2,
    };
  }

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(300, Math.floor(rect.width));
    const height = 360;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function updateInspection() {
    const body = SOLAR_BODIES.find((b) => b.id === selectedId) || SOLAR_BODIES[2];
    nameEl.textContent = body.name;
    periodEl.textContent = `${formatNumber(body.period, 2)} th`;
    velEl.textContent = `${formatNumber(body.speedKms, 1)} km/s`;
    yrEl.textContent = `${formatNumber(simYears, 2)} th`;
  }

  function draw() {
    const w = canvas.clientWidth || 560;
    const h = canvas.clientHeight || 360;

    // Deep space background
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.7);
    bg.addColorStop(0, '#121D35');
    bg.addColorStop(1, '#070B14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Background stars
    ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
    for (let i = 0; i < 48; i++) {
      const sx = ((i * 193) % (w - 16)) + 8;
      const sy = ((i * 97) % (h - 16)) + 8;
      ctx.fillRect(sx, sy, (i % 3 === 0 ? 1.8 : 1.1), (i % 3 === 0 ? 1.8 : 1.1));
    }

    const baseOrbitRadius = Math.min(w, h) * 0.16;

    // Draw 3D orbital rings
    SOLAR_BODIES.forEach((body) => {
      const r = body.a * baseOrbitRadius;
      const isSelected = body.id === selectedId;
      ctx.strokeStyle = isSelected ? 'rgba(6, 182, 212, 0.72)' : body.orbitColor;
      ctx.lineWidth = isSelected ? 1.8 : 1;
      ctx.beginPath();
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const p = project3D(r * Math.cos(theta), 0, r * Math.sin(theta), w, h);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
    });

    // Build render queue for depth sorting (Sun + Planets)
    const renderItems = [];

    const sunProj = project3D(0, 0, 0, w, h);
    renderItems.push({
      type: 'sun',
      z: sunProj.z,
      sx: sunProj.sx,
      sy: sunProj.sy,
      r: 20 * sunProj.scale,
    });

    SOLAR_BODIES.forEach((body) => {
      const r = body.a * baseOrbitRadius;
      const theta = (2 * Math.PI * simYears) / body.period;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const proj = project3D(x, 0, z, w, h);
      renderItems.push({
        type: 'planet',
        body,
        z: proj.z,
        sx: proj.sx,
        sy: proj.sy,
        r: Math.max(3, body.radiusPx * proj.scale),
      });
    });

    // Painter's algorithm: farthest first
    renderItems.sort((a, b) => b.z - a.z);

    renderItems.forEach((item) => {
      if (item.type === 'sun') {
        const glow = ctx.createRadialGradient(item.sx, item.sy, item.r * 0.2, item.sx, item.sy, item.r * 2.1);
        glow.addColorStop(0, '#FEF08A');
        glow.addColorStop(0.4, '#F59E0B');
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, item.r * 2.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, item.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const { body, sx, sy, r } = item;
        const isSelected = body.id === selectedId;

        if (isSelected) {
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        const pGrad = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, r * 0.1, sx, sy, r);
        pGrad.addColorStop(0, '#FFFFFF');
        pGrad.addColorStop(0.35, body.color);
        pGrad.addColorStop(1, '#090D16');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        if (showLabels) {
          ctx.font = '11px "DM Sans", sans-serif';
          ctx.fillStyle = isSelected ? '#67E8F9' : '#CBD5E1';
          ctx.fillText(body.name, sx + r + 6, sy + 4);
        }
      }
    });
  }

  function step(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (isPlaying) {
      simYears += dt * speed * 0.35;
      updateInspection();
    }
    draw();
    rafId = requestAnimationFrame(step);
  }

  const handlePointerDown = (e) => {
    dragging = true;
    lastPointer = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    lastPointer = { x: e.clientX, y: e.clientY };
    yaw += dx * 0.008;
    pitch = Math.max(0.15, Math.min(1.48, pitch + dy * 0.008));
    const deg = Math.round((pitch * 180) / Math.PI);
    pitchInput.value = String(deg);
    pitchVal.textContent = `${deg}°`;
    draw();
  };

  const handlePointerUp = (e) => {
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    zoom = Math.max(0.65, Math.min(1.75, zoom - e.deltaY * 0.001));
    draw();
  };

  const handleToggle = () => {
    isPlaying = !isPlaying;
    toggleLabel.textContent = isPlaying ? 'Jeda' : 'Putar';
    toggleBtn.innerHTML = `${iconSvg(isPlaying ? 'pause' : 'play', 16)}<span id="solar-toggle-label">${isPlaying ? 'Jeda' : 'Putar'}</span>`;
    statusEl.textContent = isPlaying ? 'Mengorbit' : 'Dijeda';
    statusEl.className = isPlaying ? 'sim-state-tag is-running' : 'sim-state-tag is-paused';
  };

  const handleResetCam = () => {
    yaw = 0.45;
    pitch = 0.62;
    zoom = 1;
    pitchInput.value = '36';
    pitchVal.textContent = '36°';
    draw();
  };

  focusSel.addEventListener('change', () => {
    selectedId = focusSel.value;
    updateInspection();
    draw();
  });

  speedInput.addEventListener('input', () => {
    speed = Number(speedInput.value);
    speedVal.textContent = `${formatNumber(speed, 1)}×`;
  });

  pitchInput.addEventListener('input', () => {
    const deg = Number(pitchInput.value);
    pitch = (deg * Math.PI) / 180;
    pitchVal.textContent = `${deg}°`;
    draw();
  });

  labelsCheck.addEventListener('change', () => {
    showLabels = labelsCheck.checked;
    draw();
  });

  toggleBtn.addEventListener('click', handleToggle);
  resetCamBtn.addEventListener('click', handleResetCam);
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  updateInspection();
  rafId = requestAnimationFrame(step);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resizeCanvas);
  };
}
