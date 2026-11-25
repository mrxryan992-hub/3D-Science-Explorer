import { markSimulationTried } from '../state/store.js';
import { notifyRewardEvents } from '../components/toast.js';
import { formatNumber } from '../utils/dom.js';

export function mountCircuitSim(container) {
  const res = markSimulationTried('c');
  notifyRewardEvents(res);

  let mode = 's'; // 's' seri | 'p' paralel
  let voltage = 6;
  let r1 = 4;
  let r2 = 4;
  let switchClosed = true;
  let phase = 0;
  let lastTs = 0;
  let rafId = 0;

  container.innerHTML = `
    <div class="sim-sandbox">
      <div class="sim-stage-panel">
        <div class="sim-stage-header">
          <div>
            <h3 class="sim-stage-title">Meja Rangkaian Listrik — Hukum Ohm (V = I × R)</h3>
            <p class="sim-stage-sub">Amati aliran muatan, kecerahan lampu, dan pembagian arus secara langsung</p>
          </div>
          <span class="sim-state-tag is-running" id="circ-status">Tertutup · Mengalir</span>
        </div>
        <div class="canvas-wrap">
          <canvas id="circ-canvas" class="sim-canvas" aria-label="Simulasi rangkaian listrik seri dan paralel"></canvas>
        </div>
        <div class="sim-telemetry-strip">
          <div class="telemetry-cell">
            <span class="telemetry-label">Hambatan Total</span>
            <strong class="telemetry-val mono" id="circ-rtot">8,00 Ω</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Arus Total (I)</span>
            <strong class="telemetry-val mono" id="circ-itot">0,75 A</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label">Daya Listrik (P)</span>
            <strong class="telemetry-val mono" id="circ-power">4,5 W</strong>
          </div>
          <div class="telemetry-cell">
            <span class="telemetry-label" id="circ-extra-label">Tegangan V₁ / V₂</span>
            <strong class="telemetry-val mono" id="circ-extra-val">3,0 V / 3,0 V</strong>
          </div>
        </div>
      </div>

      <aside class="sim-control-panel">
        <div class="control-group">
          <span class="control-label">Topologi Rangkaian</span>
          <div class="segmented" role="group" aria-label="Pilih mode rangkaian">
            <button type="button" class="seg-btn is-active" data-mode="s">Seri</button>
            <button type="button" class="seg-btn" data-mode="p">Paralel</button>
          </div>
        </div>

        <div class="control-group">
          <label class="checkbox-row">
            <input type="checkbox" id="circ-switch" checked />
            <span>Sakelar Tertutup (ON)</span>
          </label>
        </div>

        <div class="control-group">
          <div class="control-row-between">
            <label class="control-label" for="circ-v">Tegangan Sumber (V)</label>
            <span class="control-readout mono" id="circ-v-val">6 V</span>
          </div>
          <input id="circ-v" class="field-range" type="range" min="1" max="12" step="1" value="6" />
        </div>

        <div class="control-group">
          <div class="control-row-between">
            <label class="control-label" for="circ-r1">Hambatan R₁</label>
            <span class="control-readout mono" id="circ-r1-val">4 Ω</span>
          </div>
          <input id="circ-r1" class="field-range" type="range" min="1" max="20" step="1" value="4" />
        </div>

        <div class="control-group">
          <div class="control-row-between">
            <label class="control-label" for="circ-r2">Hambatan R₂</label>
            <span class="control-readout mono" id="circ-r2-val">4 Ω</span>
          </div>
          <input id="circ-r2" class="field-range" type="range" min="1" max="20" step="1" value="4" />
        </div>

        <div class="concept-note">
          <h4>Rumus Rangkaian</h4>
          <p class="formula-box mono" id="circ-formula">R_total = R₁ + R₂</p>
          <p class="concept-text" id="circ-explain">
            Pada rangkaian seri, arus melewati jalur tunggal sehingga hambatan dijumlahkan dan arus sama di setiap komponen.
          </p>
        </div>
      </aside>
    </div>
  `;

  const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('#circ-canvas'));
  const ctx = canvas.getContext('2d');
  const modeBtns = container.querySelectorAll('[data-mode]');
  const switchCheck = /** @type {HTMLInputElement} */ (container.querySelector('#circ-switch'));
  const vInput = /** @type {HTMLInputElement} */ (container.querySelector('#circ-v'));
  const r1Input = /** @type {HTMLInputElement} */ (container.querySelector('#circ-r1'));
  const r2Input = /** @type {HTMLInputElement} */ (container.querySelector('#circ-r2'));
  const vVal = container.querySelector('#circ-v-val');
  const r1Val = container.querySelector('#circ-r1-val');
  const r2Val = container.querySelector('#circ-r2-val');
  const rTotEl = container.querySelector('#circ-rtot');
  const iTotEl = container.querySelector('#circ-itot');
  const powerEl = container.querySelector('#circ-power');
  const extraLabel = container.querySelector('#circ-extra-label');
  const extraVal = container.querySelector('#circ-extra-val');
  const formulaEl = container.querySelector('#circ-formula');
  const explainEl = container.querySelector('#circ-explain');
  const statusEl = container.querySelector('#circ-status');

  function computeMetrics() {
    const rTotal = mode === 's' ? r1 + r2 : (r1 * r2) / (r1 + r2);
    const iTotal = switchClosed ? voltage / rTotal : 0;
    const power = voltage * iTotal;
    const i1 = switchClosed ? (mode === 's' ? iTotal : voltage / r1) : 0;
    const i2 = switchClosed ? (mode === 's' ? iTotal : voltage / r2) : 0;
    const v1 = switchClosed ? (mode === 's' ? iTotal * r1 : voltage) : 0;
    const v2 = switchClosed ? (mode === 's' ? iTotal * r2 : voltage) : 0;
    return { rTotal, iTotal, power, i1, i2, v1, v2 };
  }

  function updateUI() {
    const m = computeMetrics();
    vVal.textContent = `${voltage} V`;
    r1Val.textContent = `${r1} Ω`;
    r2Val.textContent = `${r2} Ω`;
    rTotEl.textContent = `${formatNumber(m.rTotal, 2)} Ω`;
    iTotEl.textContent = `${formatNumber(m.iTotal, 2)} A`;
    powerEl.textContent = `${formatNumber(m.power, 1)} W`;

    if (mode === 's') {
      extraLabel.textContent = 'Tegangan V₁ / V₂';
      extraVal.textContent = `${formatNumber(m.v1, 1)} V / ${formatNumber(m.v2, 1)} V`;
      formulaEl.textContent = 'R_total = R₁ + R₂';
      explainEl.textContent =
        'Pada rangkaian seri, arus melewati jalur tunggal sehingga hambatan dijumlahkan dan arus sama di setiap resistor.';
    } else {
      extraLabel.textContent = 'Arus Cabang I₁ / I₂';
      extraVal.textContent = `${formatNumber(m.i1, 2)} A / ${formatNumber(m.i2, 2)} A`;
      formulaEl.textContent = 'R_total = (R₁·R₂) / (R₁+R₂)';
      explainEl.textContent =
        'Pada rangkaian paralel, tegangan sama di setiap cabang. Hambatan total selalu lebih kecil daripada hambatan terkecil.';
    }

    if (!switchClosed) {
      statusEl.textContent = 'Terbuka · Arus 0 A';
      statusEl.className = 'sim-state-tag is-paused';
    } else {
      statusEl.textContent = 'Tertutup · Mengalir';
      statusEl.className = 'sim-state-tag is-running';
    }
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

  function drawResistor(x, y, label, ohm) {
    ctx.fillStyle = '#172036';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 34, y - 14, 68, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${label}: ${ohm}Ω`, x, y);
  }

  function drawBulb(x, y, power) {
    const intensity = Math.min(1, power / 24);
    if (intensity > 0.01) {
      const glow = ctx.createRadialGradient(x, y, 4, x, y, 24 + intensity * 42);
      glow.addColorStop(0, `rgba(253, 224, 71, ${0.75 * intensity})`);
      glow.addColorStop(0.5, `rgba(251, 191, 36, ${0.3 * intensity})`);
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 24 + intensity * 42, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = intensity > 0.01 ? `rgba(254, 240, 138, ${0.25 + 0.65 * intensity})` : '#1E293B';
    ctx.strokeStyle = intensity > 0.01 ? '#FBBF24' : '#64748B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Filament
    ctx.strokeStyle = intensity > 0.01 ? '#FEF9C3' : '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 6);
    ctx.lineTo(x - 4, y - 6);
    ctx.lineTo(x, y + 2);
    ctx.lineTo(x + 4, y - 6);
    ctx.lineTo(x + 9, y + 6);
    ctx.stroke();
  }

  function drawChargeDots(points, offset, speedFactor) {
    if (!switchClosed || speedFactor <= 0) return;
    // Compute total polyline length
    const segments = [];
    let totalLen = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1][0] - points[i][0];
      const dy = points[i + 1][1] - points[i][1];
      const len = Math.hypot(dx, dy);
      segments.push({ p1: points[i], p2: points[i + 1], len });
      totalLen += len;
    }
    const spacing = 36;
    const count = Math.floor(totalLen / spacing);
    ctx.fillStyle = '#22D3EE';
    for (let i = 0; i < count; i++) {
      const dist = ((i * spacing + offset * speedFactor) % totalLen + totalLen) % totalLen;
      let acc = 0;
      for (const seg of segments) {
        if (acc + seg.len >= dist) {
          const t = (dist - acc) / seg.len;
          const px = seg.p1[0] + (seg.p2[0] - seg.p1[0]) * t;
          const py = seg.p1[1] + (seg.p2[1] - seg.p1[1]) * t;
          ctx.beginPath();
          ctx.arc(px, py, 3.2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        acc += seg.len;
      }
    }
  }

  function draw() {
    const w = canvas.clientWidth || 560;
    const h = canvas.clientHeight || 340;
    const m = computeMetrics();

    ctx.fillStyle = '#0B101B';
    ctx.fillRect(0, 0, w, h);

    // Subtle schematic grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 24; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const left = Math.max(70, w * 0.14);
    const right = Math.min(w - 70, w * 0.86);
    const top = 66;
    const bottom = h - 66;
    const midY = (top + bottom) * 0.5;
    const midX = (left + right) * 0.5;

    ctx.strokeStyle = switchClosed ? '#38BDF8' : '#475569';
    ctx.lineWidth = 3;

    if (mode === 's') {
      // Series loop
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left, midY + 20);
      ctx.moveTo(left, midY - 20);
      ctx.lineTo(left, top);
      ctx.stroke();

      drawChargeDots(
        [
          [left, top],
          [right, top],
          [right, bottom],
          [left, bottom],
          [left, top],
        ],
        phase,
        Math.min(180, m.iTotal * 40)
      );

      drawResistor(midX - 58, top, 'R₁', r1);
      drawResistor(midX + 58, top, 'R₂', r2);
    } else {
      // Parallel loop
      const topBranch = top + 20;
      const botBranch = midY + 12;

      ctx.beginPath();
      // Main outer bus
      ctx.moveTo(left, topBranch);
      ctx.lineTo(right, topBranch);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left, midY + 20);
      ctx.moveTo(left, midY - 20);
      ctx.lineTo(left, topBranch);
      // Inner parallel branch
      ctx.moveTo(left + 72, topBranch);
      ctx.lineTo(left + 72, botBranch);
      ctx.lineTo(right - 72, botBranch);
      ctx.lineTo(right - 72, topBranch);
      ctx.stroke();

      drawChargeDots(
        [
          [left + 72, topBranch],
          [right - 72, topBranch],
        ],
        phase,
        Math.min(180, m.i1 * 40)
      );
      drawChargeDots(
        [
          [left + 72, botBranch],
          [right - 72, botBranch],
        ],
        phase,
        Math.min(180, m.i2 * 40)
      );
      drawChargeDots(
        [
          [right - 72, topBranch],
          [right, topBranch],
          [right, bottom],
          [left, bottom],
          [left, topBranch],
          [left + 72, topBranch],
        ],
        phase,
        Math.min(180, m.iTotal * 35)
      );

      drawResistor(midX, topBranch, 'R₁', r1);
      drawResistor(midX, botBranch, 'R₂', r2);
    }

    // Battery on left
    ctx.fillStyle = '#0B101B';
    ctx.fillRect(left - 18, midY - 20, 36, 40);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(left - 16, midY - 8);
    ctx.lineTo(left + 16, midY - 8);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(left - 9, midY + 8);
    ctx.lineTo(left + 9, midY + 8);
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${voltage} V`, left - 22, midY);

    // Switch on bottom-left
    const swX = left + 54;
    ctx.fillStyle = '#0B101B';
    ctx.fillRect(swX - 20, bottom - 12, 40, 24);
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(swX - 16, bottom, 4, 0, Math.PI * 2);
    ctx.arc(swX + 16, bottom, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = switchClosed ? '#34D399' : '#F43F5E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(swX - 16, bottom);
    ctx.lineTo(swX + 14, switchClosed ? bottom : bottom - 16);
    ctx.stroke();

    // Bulb on bottom-center
    drawBulb(midX + 36, bottom, m.power);
  }

  function step(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (switchClosed) {
      phase += dt * 45;
    }
    draw();
    rafId = requestAnimationFrame(step);
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.getAttribute('data-mode') || 's';
      modeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      updateUI();
      draw();
    });
  });

  switchCheck.addEventListener('change', () => {
    switchClosed = switchCheck.checked;
    updateUI();
    draw();
  });

  vInput.addEventListener('input', () => {
    voltage = Number(vInput.value);
    updateUI();
    draw();
  });

  r1Input.addEventListener('input', () => {
    r1 = Number(r1Input.value);
    updateUI();
    draw();
  });

  r2Input.addEventListener('input', () => {
    r2 = Number(r2Input.value);
    updateUI();
    draw();
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateUI();
  rafId = requestAnimationFrame(step);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resizeCanvas);
  };
}
