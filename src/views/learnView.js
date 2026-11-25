import { CATEGORIES, MATERIALS, MATERIAL_BY_ID } from '../data/scienceData.js';
import { getState, markMaterialRead } from '../state/store.js';
import { escapeHtml, formatDateId } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';
import { notifyRewardEvents, showToast } from '../components/toast.js';

export function renderLearnView(container, viewState, { onNavigateSim }) {
  const state = getState();
  let videoPlaying = false;
  let videoStep = 0;
  let videoTimer = null;

  function stopVideoTimer() {
    if (videoTimer) {
      clearInterval(videoTimer);
      videoTimer = null;
    }
  }

  if (viewState.activeMaterialId) {
    const material = MATERIAL_BY_ID[viewState.activeMaterialId];
    if (!material) {
      viewState.activeMaterialId = null;
      return renderLearnView(container, viewState, { onNavigateSim });
    }

    const cat = CATEGORIES[material.category];
    const readDate = state.read[material.id];
    const currentIdx = MATERIALS.findIndex((m) => m.id === material.id);
    const prevMat = currentIdx > 0 ? MATERIALS[currentIdx - 1] : null;
    const nextMat = currentIdx < MATERIALS.length - 1 ? MATERIALS[currentIdx + 1] : null;
    const steps = material.videoSteps || [];

    const renderReader = () => {
      const currentStep = steps[videoStep] || { title: material.title, caption: material.subtitle };
      const progressPct = steps.length > 0 ? Math.round(((videoStep + 1) / steps.length) * 100) : 100;

      container.innerHTML = `
        <section class="page-section">
          <div class="reader-topbar">
            <button type="button" class="btn btn-secondary btn-sm" id="reader-back">
              ${iconSvg('arrowLeft', 16)}
              <span>Semua Materi</span>
            </button>
            <span class="muted-meta">${cat.label} · ${material.gradeBand} · ${material.level} · ${material.readTime}</span>
          </div>

          <article class="surface clay-card reader-article">
            <div class="video-explainer-stage">
              <div class="video-visual-box">
                ${material.diagramSvg}
                <div class="video-caption-bar">
                  <strong>${escapeHtml(currentStep.title)}</strong>
                  <p>${escapeHtml(currentStep.caption)}</p>
                </div>
              </div>
              <div class="video-controls-bar">
                <button type="button" class="btn btn-3d btn-primary btn-sm" id="video-toggle">
                  ${iconSvg(videoPlaying ? 'pause' : 'play', 15)}
                  <span>${videoPlaying ? 'Jeda Penjelasan' : 'Putar Video Interaktif'}</span>
                </button>
                <div class="video-step-tabs" role="tablist" aria-label="Bab video interaktif">
                  ${steps
                    .map(
                      (_, idx) =>
                        `<button type="button" class="seg-btn ${videoStep === idx ? 'is-active' : ''}" data-vstep="${idx}">Bab ${idx + 1}</button>`
                    )
                    .join('')}
                </div>
                <div class="video-progress-track" aria-hidden="true">
                  <div class="video-progress-fill" style="width:${progressPct}%;background:${cat.gradient}"></div>
                </div>
              </div>
            </div>

            <div class="reader-body">
              <h1 class="reader-title">${escapeHtml(material.title)}</h1>
              <p class="reader-subtitle">${escapeHtml(material.subtitle)}</p>

              <div class="formula-callout">
                <span class="formula-label">Ringkasan Rumus / Konsep</span>
                <code class="formula-code mono">${escapeHtml(material.keyFormula)}</code>
              </div>

              <p class="reader-prose">${escapeHtml(material.content)}</p>

              <div class="keypoints-block">
                <h2>Poin Penting</h2>
                <ul>
                  ${material.keyPoints.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('')}
                </ul>
              </div>

              <div class="reader-actions">
                ${
                  readDate
                    ? `<span class="status-complete">${iconSvg('check', 16)} Selesai dibaca pada ${escapeHtml(formatDateId(readDate))}</span>`
                    : `<button type="button" class="btn btn-3d btn-primary" id="btn-mark-read">${iconSvg('check', 16)} Tandai Selesai (+10 XP)</button>`
                }
                ${
                  material.simLink
                    ? `<button type="button" class="btn btn-3d btn-secondary" id="btn-open-sim" data-sim="${material.simLink}">${iconSvg('orbit', 16)} Buka Simulasi 3D Terkait</button>`
                    : ''
                }
              </div>
            </div>
          </article>

          <div class="reader-pagination">
            ${
              prevMat
                ? `<button type="button" class="btn btn-ghost" id="btn-prev-mat" data-id="${prevMat.id}">${iconSvg('arrowLeft', 16)} ${escapeHtml(prevMat.title)}</button>`
                : '<span></span>'
            }
            ${
              nextMat
                ? `<button type="button" class="btn btn-ghost" id="btn-next-mat" data-id="${nextMat.id}">${escapeHtml(nextMat.title)} ${iconSvg('arrowRight', 16)}</button>`
                : ''
            }
          </div>
        </section>
      `;

      container.querySelector('#reader-back')?.addEventListener('click', () => {
        stopVideoTimer();
        viewState.activeMaterialId = null;
        renderLearnView(container, viewState, { onNavigateSim });
      });

      container.querySelector('#video-toggle')?.addEventListener('click', () => {
        videoPlaying = !videoPlaying;
        stopVideoTimer();
        if (videoPlaying && steps.length > 0) {
          videoTimer = setInterval(() => {
            videoStep = (videoStep + 1) % steps.length;
            renderReader();
          }, 3600);
        }
        renderReader();
      });

      container.querySelectorAll('[data-vstep]').forEach((btn) => {
        btn.addEventListener('click', () => {
          videoStep = Number(btn.getAttribute('data-vstep') || 0);
          renderReader();
        });
      });

      container.querySelector('#btn-mark-read')?.addEventListener('click', () => {
        const result = markMaterialRead(material.id);
        if (!result.alreadyRead) {
          showToast(`Materi selesai (+${result.xpGained} XP)`, 'success');
          notifyRewardEvents(result);
        }
        renderReader();
      });

      container.querySelector('#btn-open-sim')?.addEventListener('click', (e) => {
        stopVideoTimer();
        const targetSim = /** @type {HTMLElement} */ (e.currentTarget).getAttribute('data-sim');
        if (targetSim) onNavigateSim(targetSim);
      });

      container.querySelector('#btn-prev-mat')?.addEventListener('click', () => {
        stopVideoTimer();
        viewState.activeMaterialId = prevMat.id;
        renderLearnView(container, viewState, { onNavigateSim });
      });

      container.querySelector('#btn-next-mat')?.addEventListener('click', () => {
        stopVideoTimer();
        viewState.activeMaterialId = nextMat.id;
        renderLearnView(container, viewState, { onNavigateSim });
      });
    };

    renderReader();
    return stopVideoTimer;
  }

  const filterCat = viewState.learnCategory || 'all';
  const filterBand = viewState.learnBand || state.gradeBand || 'all';
  const queryText = (viewState.learnQuery || '').trim().toLowerCase();

  const filtered = MATERIALS.filter((m) => {
    const matchCat = filterCat === 'all' || m.category === filterCat;
    const matchBand = filterBand === 'all' || m.gradeBand === filterBand;
    const matchText =
      !queryText ||
      m.title.toLowerCase().includes(queryText) ||
      m.subtitle.toLowerCase().includes(queryText) ||
      m.content.toLowerCase().includes(queryText);
    return matchCat && matchBand && matchText;
  });

  container.innerHTML = `
    <section class="page-section">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Pustaka Materi &amp; Video Interaktif</h1>
          <p class="page-desc">Jelajahi 16 modul sains SMP &amp; SMA lengkap dengan diagram vektor dan pemutar penjelasan interaktif.</p>
        </div>
        <span class="muted-meta mono">${Object.keys(state.read).length}/${MATERIALS.length} selesai</span>
      </div>

      <div class="toolbar">
        <div class="toolbar-cluster">
          <div class="segmented" role="tablist" aria-label="Filter jenjang materi">
            <button type="button" class="seg-btn ${filterBand === 'all' ? 'is-active' : ''}" data-lband="all">Semua Jenjang</button>
            <button type="button" class="seg-btn ${filterBand === 'SMP' ? 'is-active' : ''}" data-lband="SMP">SMP</button>
            <button type="button" class="seg-btn ${filterBand === 'SMA' ? 'is-active' : ''}" data-lband="SMA">SMA</button>
          </div>

          <div class="segmented" role="tablist" aria-label="Filter kategori materi">
            <button type="button" class="seg-btn ${filterCat === 'all' ? 'is-active' : ''}" data-cat="all">Semua Mapel</button>
            ${Object.values(CATEGORIES)
              .map(
                (c) =>
                  `<button type="button" class="seg-btn ${filterCat === c.key ? 'is-active' : ''}" data-cat="${c.key}">${c.label}</button>`
              )
              .join('')}
          </div>
        </div>

        <div class="search-wrap">
          <span class="search-icon">${iconSvg('search', 16)}</span>
          <input
            id="learn-search"
            class="field-input search-input"
            type="search"
            placeholder="Cari topik materi..."
            value="${escapeHtml(viewState.learnQuery || '')}"
            aria-label="Cari topik materi"
          />
        </div>
      </div>

      ${
        filtered.length === 0
          ? `<div class="surface clay-card empty-state">
              <p>Tidak ada materi yang cocok dengan filter Anda.</p>
              <button type="button" class="btn btn-secondary" id="learn-clear-filter">Tampilkan Semua Materi</button>
            </div>`
          : `<div class="material-grid">
              ${filtered
                .map((m) => {
                  const cat = CATEGORIES[m.category];
                  const isRead = Boolean(state.read[m.id]);
                  return `
                    <article class="surface clay-card material-card ${isRead ? 'is-read' : ''}">
                      <div class="material-thumb">${m.diagramSvg}</div>
                      <div class="material-body">
                        <p class="material-meta">${cat.label} · ${m.gradeBand} · ${m.level}${isRead ? ' · Selesai' : ''}</p>
                        <h2 class="material-title">${escapeHtml(m.title)}</h2>
                        <p class="material-sub">${escapeHtml(m.subtitle)}</p>
                        <div class="material-footer">
                          <span class="muted-meta mono">${m.readTime} · Video</span>
                          <button type="button" class="btn btn-3d btn-secondary btn-sm open-material-btn" data-id="${m.id}">
                            ${isRead ? 'Baca Ulang' : 'Mulai Belajar'}
                          </button>
                        </div>
                      </div>
                    </article>
                  `;
                })
                .join('')}
            </div>`
      }
    </section>
  `;

  container.querySelectorAll('[data-lband]').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewState.learnBand = btn.getAttribute('data-lband') || 'all';
      renderLearnView(container, viewState, { onNavigateSim });
    });
  });

  container.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewState.learnCategory = btn.getAttribute('data-cat') || 'all';
      renderLearnView(container, viewState, { onNavigateSim });
    });
  });

  const searchInput = /** @type {HTMLInputElement} */ (container.querySelector('#learn-search'));
  searchInput?.addEventListener('input', () => {
    viewState.learnQuery = searchInput.value;
    renderLearnView(container, viewState, { onNavigateSim });
    const nextInput = /** @type {HTMLInputElement} */ (container.querySelector('#learn-search'));
    if (nextInput) {
      nextInput.focus();
      nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
    }
  });

  container.querySelector('#learn-clear-filter')?.addEventListener('click', () => {
    viewState.learnCategory = 'all';
    viewState.learnBand = 'all';
    viewState.learnQuery = '';
    renderLearnView(container, viewState, { onNavigateSim });
  });

  container.querySelectorAll('.open-material-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      viewState.activeMaterialId = id;
      renderLearnView(container, viewState, { onNavigateSim });
    });
  });

  return stopVideoTimer;
}
