import { mountGravitySim } from '../simulations/gravitySim.js';
import { mountSolarSim } from '../simulations/solarSim.js';
import { mountCircuitSim } from '../simulations/circuitSim.js';

const SIM_TABS = [
  { key: 'g', label: 'Gravitasi Jatuh Bebas' },
  { key: 's', label: 'Tata Surya 3D' },
  { key: 'c', label: 'Rangkaian Listrik' },
];

export function renderSimView(container, viewState) {
  let activeCleanup = null;

  const mountActive = () => {
    if (typeof activeCleanup === 'function') {
      activeCleanup();
      activeCleanup = null;
    }

    const stageEl = container.querySelector('#sim-mount');
    if (!stageEl) return;

    const simKey = viewState.activeSim || 'g';
    if (simKey === 'g') {
      activeCleanup = mountGravitySim(stageEl);
    } else if (simKey === 's') {
      activeCleanup = mountSolarSim(stageEl);
    } else if (simKey === 'c') {
      activeCleanup = mountCircuitSim(stageEl);
    }
  };

  container.innerHTML = `
    <section class="page-section">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Laboratorium Simulasi Interaktif</h1>
          <p class="page-desc">Eksperimen parameter fisika dan astronomi secara langsung untuk membuka badge Penjelajah.</p>
        </div>
        <div class="segmented" role="tablist" aria-label="Pilih simulasi">
          ${SIM_TABS.map(
            (t) =>
              `<button type="button" class="seg-btn ${viewState.activeSim === t.key ? 'is-active' : ''}" data-sim-tab="${t.key}">${t.label}</button>`
          ).join('')}
        </div>
      </div>

      <div id="sim-mount"></div>
    </section>
  `;

  container.querySelectorAll('[data-sim-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextSim = btn.getAttribute('data-sim-tab') || 'g';
      if (nextSim === viewState.activeSim) return;
      viewState.activeSim = nextSim;
      container.querySelectorAll('[data-sim-tab]').forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-sim-tab') === nextSim);
      });
      mountActive();
    });
  });

  mountActive();

  return () => {
    if (typeof activeCleanup === 'function') {
      activeCleanup();
      activeCleanup = null;
    }
  };
}
