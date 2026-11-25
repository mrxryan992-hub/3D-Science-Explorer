import { CATEGORIES, MATERIAL_BY_ID } from '../data/scienceData.js';
import { getAllQuestions, getDailyQuestion, getState, isDailyCompleted, submitQuizAnswer } from '../state/store.js';
import { escapeHtml, formatDateId, getTodayKey } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';
import { notifyRewardEvents } from '../components/toast.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export function renderQuizView(container, viewState, { isDaily, onOpenMaterial }) {
  const state = getState();
  const allQuestions = getAllQuestions();
  const categoryFilter = viewState.quizCategory || 'all';
  const bandFilter = viewState.quizBand || state.gradeBand || 'all';

  const filteredPool = isDaily
    ? [getDailyQuestion()]
    : allQuestions.filter((q) => {
        const mat = MATERIAL_BY_ID[q.materialId];
        if (!mat) return false;
        const qBand = q.gradeBand || mat.gradeBand || 'SMP';
        const matchCat = categoryFilter === 'all' || mat.category === categoryFilter;
        const matchBand = bandFilter === 'all' || qBand === 'Semua' || qBand === bandFilter;
        return matchCat && matchBand;
      });

  const pool = filteredPool.length > 0 ? filteredPool : allQuestions;
  const activeIndex = isDaily ? 0 : viewState.quizIndex % pool.length;
  const question = pool[activeIndex];
  const relatedMaterial = MATERIAL_BY_ID[question.materialId] || MATERIAL_BY_ID[1];
  const category = CATEGORIES[relatedMaterial.category];
  const dailyDone = isDailyCompleted();
  const selected = viewState.selectedOption;
  const feedback = viewState.quizFeedback;

  container.innerHTML = `
    <section class="page-section focus-column">
      ${
        isDaily
          ? `<div class="page-header-row">
              <div>
                <h1 class="page-title">Tantangan Harian (${state.gradeBand})</h1>
                <p class="page-desc">${escapeHtml(formatDateId(getTodayKey()))} · Bonus +20 XP untuk jawaban benar pertama hari ini.</p>
              </div>
              <span class="status-tag ${dailyDone ? 'is-complete' : 'is-active'}">
                ${dailyDone ? `${iconSvg('check', 15)} Bonus hari ini sudah diambil` : `${iconSvg('flame', 15)} Bonus tersedia`}
              </span>
            </div>`
          : `<div class="page-header-row">
              <div>
                <h1 class="page-title">Kuis 3D Interaktif</h1>
                <p class="page-desc">Tantang pemahaman Anda (${allQuestions.length} soal SMP &amp; SMA). Jawaban benar pertama memberi +10 poin &amp; +10 XP.</p>
              </div>
              <span class="muted-meta mono">Soal ${activeIndex + 1} / ${pool.length}</span>
            </div>

            <div class="toolbar">
              <div class="toolbar-cluster">
                <div class="segmented" role="tablist" aria-label="Filter jenjang kuis">
                  <button type="button" class="seg-btn ${bandFilter === 'all' ? 'is-active' : ''}" data-qband="all">Semua Jenjang</button>
                  <button type="button" class="seg-btn ${bandFilter === 'SMP' ? 'is-active' : ''}" data-qband="SMP">SMP</button>
                  <button type="button" class="seg-btn ${bandFilter === 'SMA' ? 'is-active' : ''}" data-qband="SMA">SMA</button>
                </div>

                <div class="segmented" role="tablist" aria-label="Filter kategori kuis">
                  <button type="button" class="seg-btn ${categoryFilter === 'all' ? 'is-active' : ''}" data-qcat="all">Semua Mapel</button>
                  ${Object.values(CATEGORIES)
                    .map(
                      (c) =>
                        `<button type="button" class="seg-btn ${categoryFilter === c.key ? 'is-active' : ''}" data-qcat="${c.key}">${c.label}</button>`
                    )
                    .join('')}
                </div>
              </div>
            </div>`
      }

      <article class="surface clay-card quiz-card">
        <div class="quiz-meta-row">
          <span class="muted-meta">${category.label} · ${escapeHtml(question.gradeBand || relatedMaterial.gradeBand)} · ${escapeHtml(relatedMaterial.title)}</span>
          <button type="button" class="link-btn" id="quiz-open-mat">Lihat Materi Terkait</button>
        </div>

        <h2 class="quiz-question">${escapeHtml(question.question)}</h2>

        <div class="quiz-options" role="radiogroup" aria-label="Pilihan jawaban">
          ${question.options
            .map((opt, idx) => {
              let stateClass = '';
              let statusLabel = '';
              if (selected !== null) {
                if (idx === question.answerIndex) {
                  stateClass = 'is-correct';
                  statusLabel = `<span class="opt-status">${iconSvg('check', 16)} Benar</span>`;
                } else if (idx === selected) {
                  stateClass = 'is-wrong';
                  statusLabel = `<span class="opt-status">${iconSvg('x', 16)} Pilihan Anda</span>`;
                }
              }
              return `
                <button
                  type="button"
                  class="quiz-option btn-3d-subtle ${stateClass}"
                  data-option="${idx}"
                  ${selected !== null ? 'disabled' : ''}
                >
                  <span class="opt-letter mono">${LETTERS[idx]}</span>
                  <span class="opt-text">${escapeHtml(opt)}</span>
                  ${statusLabel}
                </button>
              `;
            })
            .join('')}
        </div>

        ${
          selected !== null && feedback
            ? `<div class="quiz-feedback ${feedback.isCorrect ? 'is-correct' : 'is-wrong'}" role="status">
                <div class="feedback-head">
                  ${iconSvg(feedback.isCorrect ? 'check' : 'x', 18)}
                  <strong>
                    ${
                      feedback.isCorrect
                        ? 'Jawaban Benar!'
                        : `Kurang tepat. Jawaban benar: ${escapeHtml(question.options[question.answerIndex])}`
                    }
                  </strong>
                </div>
                <p class="feedback-explain">${escapeHtml(question.explanation)}</p>
                ${
                  feedback.rewardSummary
                    ? `<p class="feedback-reward mono">${escapeHtml(feedback.rewardSummary)}</p>`
                    : ''
                }
                ${
                  isDaily
                    ? ''
                    : `<div class="feedback-actions">
                        <button type="button" class="btn btn-3d btn-primary" id="quiz-next">Soal Berikutnya ${iconSvg('arrowRight', 16)}</button>
                      </div>`
                }
              </div>`
            : ''
        }
      </article>
    </section>
  `;

  container.querySelectorAll('[data-qband]').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewState.quizBand = btn.getAttribute('data-qband') || 'all';
      viewState.quizIndex = 0;
      viewState.selectedOption = null;
      viewState.quizFeedback = null;
      renderQuizView(container, viewState, { isDaily, onOpenMaterial });
    });
  });

  container.querySelectorAll('[data-qcat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewState.quizCategory = btn.getAttribute('data-qcat') || 'all';
      viewState.quizIndex = 0;
      viewState.selectedOption = null;
      viewState.quizFeedback = null;
      renderQuizView(container, viewState, { isDaily, onOpenMaterial });
    });
  });

  container.querySelector('#quiz-open-mat')?.addEventListener('click', () => {
    onOpenMaterial(relatedMaterial.id);
  });

  container.querySelectorAll('[data-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (viewState.selectedOption !== null) return;
      const optionIdx = Number(btn.getAttribute('data-option'));
      const result = submitQuizAnswer(question.id, optionIdx, isDaily);
      if (!result) return;

      const summaryParts = [];
      if (result.isCorrect) {
        if (result.pointsGained > 0) {
          summaryParts.push(`+${result.pointsGained} poin & +${result.pointsGained} XP`);
        } else if (result.alreadyClaimed) {
          summaryParts.push('Poin soal ini sudah pernah diambil sebelumnya');
        }
        if (result.dailyBonus) {
          summaryParts.push('+20 XP bonus harian');
        }
      }

      viewState.selectedOption = optionIdx;
      viewState.quizFeedback = {
        isCorrect: result.isCorrect,
        rewardSummary: summaryParts.join(' · '),
      };

      notifyRewardEvents(result);
      renderQuizView(container, viewState, { isDaily, onOpenMaterial });
    });
  });

  container.querySelector('#quiz-next')?.addEventListener('click', () => {
    viewState.quizIndex += 1;
    viewState.selectedOption = null;
    viewState.quizFeedback = null;
    renderQuizView(container, viewState, { isDaily, onOpenMaterial });
  });
}
