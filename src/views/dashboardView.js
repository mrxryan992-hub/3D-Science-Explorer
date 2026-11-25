import { AVATAR_OPTIONS, BADGES, MATERIALS, MATERIAL_BY_ID, QUESTIONS } from '../data/scienceData.js';
import { getAuthUser, isAdmin } from '../state/auth.js';
import {
  getAllCategoriesProgress,
  getAnnouncement,
  getJoinedClasses,
  getLevelInfo,
  getMaintenanceState,
  getState,
  getStudentAssignments,
  joinClassByCode,
  leaveClass,
  resetProgress,
  setAccountType,
  setAvatarConfig,
  setExplorerName,
  setGradeBand,
} from '../state/store.js';
import { attachAvatarTilt, renderAvatar3DSvg } from '../components/avatar3d.js';
import { escapeHtml } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';
import { openConfirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

const MASCOT_PORTRAIT = '/src/assets/images/mascot_explorer_3d_light_1795590699442.jpg';

export function renderDashboardView(container, { onNavigate, onOpenMaterial }) {
  const state = getState();
  const authUser = getAuthUser();
  const levelInfo = getLevelInfo();
  const bandFilter = state.gradeBand || 'SMP';
  const categories = getAllCategoriesProgress(bandFilter);
  const announcement = getAnnouncement();
  const maintenance = getMaintenanceState();
  const joinedClasses = getJoinedClasses();
  const assignments = getStudentAssignments();

  const bandMaterials = MATERIALS.filter((m) => m.gradeBand === bandFilter);
  const bandQuestions = QUESTIONS.filter((q) => q.gradeBand === bandFilter);
  const readCount = bandMaterials.filter((m) => Boolean(state.read[m.id])).length;
  const quizCount = bandQuestions.filter((q) => Boolean(state.quiz[q.id])).length;
  const badgeCount = state.badges.length;

  const roleText = isAdmin()
    ? 'Admin Sistem'
    : state.accountType === 'teacher'
      ? 'Guru / Pengajar'
      : `Siswa ${bandFilter}`;
  const identityLine = authUser?.email ? `${roleText} · ${authUser.email}` : roleText;

  container.innerHTML = `
    <section class="page-section">
      ${
        maintenance.enabled
          ? `<div class="surface maintenance-banner" role="alert">
              <strong>Pemeliharaan Sistem:</strong>
              <span>${escapeHtml(maintenance.text || 'Sebagian layanan sedang dalam pemeliharaan terjadwal oleh Admin.')}</span>
            </div>`
          : ''
      }
      ${
        announcement
          ? `<div class="surface announcement-banner" role="note">
              <div class="announcement-content">
                <strong>Pengumuman Lab:</strong>
                <span>${escapeHtml(announcement)}</span>
              </div>
            </div>`
          : ''
      }

      <div class="workspace-toolbar">
        <div class="toolbar-group">
          <span class="control-label">Mode Jenjang:</span>
          <div class="segmented" role="tablist" aria-label="Pilih mode jenjang SMP atau SMA">
            <button type="button" class="seg-btn ${bandFilter === 'SMP' ? 'is-active' : ''}" data-set-band="SMP">SMP · Kelas 7–9</button>
            <button type="button" class="seg-btn ${bandFilter === 'SMA' ? 'is-active' : ''}" data-set-band="SMA">SMA · Kelas 10–12</button>
          </div>
        </div>

        <div class="toolbar-group">
          <span class="control-label">Tampilan Peran:</span>
          <div class="segmented" role="tablist" aria-label="Pilih mode workspace">
            <button type="button" class="seg-btn ${state.accountType === 'student' ? 'is-active' : ''}" data-set-role="student">Siswa</button>
            <button type="button" class="seg-btn ${state.accountType === 'teacher' ? 'is-active' : ''}" data-set-role="teacher">Guru / Pengajar</button>
          </div>
        </div>
      </div>

      <div class="hero-panel surface clay-card">
        <div class="hero-main">
          <div class="avatar-hero-stage" id="dash-avatar-stage" title="Arahkan kursor untuk efek 3D">
            ${renderAvatar3DSvg(state.avatarConfig, 112)}
          </div>
          <div class="level-ring" style="--progress:${levelInfo.percent}" role="img" aria-label="Level ${levelInfo.level}, progres ${levelInfo.percent}%">
            <div class="level-ring-inner">
              <span class="level-num mono">${levelInfo.level}</span>
              <span class="level-label">Level</span>
            </div>
          </div>
          <div class="hero-copy">
            <p class="eyebrow-text">${escapeHtml(identityLine)} · <span class="mono xp-highlight">${state.xp} XP</span></p>
            <h1 class="page-title">${escapeHtml(state.name)}</h1>
            <div class="xp-bar-track" aria-hidden="true">
              <div class="xp-bar-fill" style="width:${levelInfo.percent}%"></div>
            </div>
            <p class="hero-subtext">
              <span class="mono xp-highlight">${levelInfo.xpToNext} XP</span> menuju Level ${levelInfo.level + 1} · <button type="button" class="link-btn" id="dash-go-daily">Tantangan Harian (+20 XP)</button>
            </p>
          </div>
        </div>

        <div class="hero-side-mascot">
          <img
            src="${MASCOT_PORTRAIT}"
            alt="Maskot Penjelajah Sains 3D"
            class="mascot-thumb"
            referrerpolicy="no-referrer"
            onerror="this.style.display='none'"
          />
          <form class="alias-form" id="alias-form">
            <label class="control-label" for="alias-input">Alias Penjelajah</label>
            <div class="alias-row">
              <input
                id="alias-input"
                class="field-input"
                type="text"
                maxlength="24"
                value="${escapeHtml(state.name)}"
                placeholder="Pelajar"
                autocomplete="off"
              />
              <button type="submit" class="btn btn-3d btn-secondary">Simpan</button>
            </div>
          </form>
        </div>
      </div>

      <div class="kpi-strip" aria-label="Ringkasan progres">
        <article class="kpi-cell surface clay-card kpi-blue">
          <div class="kpi-head">
            <span class="kpi-label">Materi ${bandFilter} Selesai</span>
            <span class="kpi-emblem">${iconSvg('book', 16)}</span>
          </div>
          <strong class="kpi-value mono">${readCount}<span class="kpi-denom">/${bandMaterials.length}</span></strong>
          <span class="kpi-sub">Modul bacaan &amp; video</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-violet">
          <div class="kpi-head">
            <span class="kpi-label">Kuis ${bandFilter} Benar</span>
            <span class="kpi-emblem">${iconSvg('check', 16)}</span>
          </div>
          <strong class="kpi-value mono">${quizCount}<span class="kpi-denom">/${bandQuestions.length}</span></strong>
          <span class="kpi-sub">Evaluasi pemahaman</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-green">
          <div class="kpi-head">
            <span class="kpi-label">Total Poin</span>
            <span class="kpi-emblem">${iconSvg('flame', 16)}</span>
          </div>
          <strong class="kpi-value mono">${state.pts}</strong>
          <span class="kpi-sub">Skor kuis kumulatif</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-orange">
          <div class="kpi-head">
            <span class="kpi-label">Badge Terbuka</span>
            <span class="kpi-emblem">${iconSvg('award', 16)}</span>
          </div>
          <strong class="kpi-value mono">${badgeCount}<span class="kpi-denom">/${BADGES.length}</span></strong>
          <span class="kpi-sub">Pencapaian penjelajah</span>
        </article>
      </div>

      <div class="dash-split">
        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Kustomisasi Avatar 3D Pribadi</h2>
            <span class="muted-meta">Tersinkron ke Peringkat</span>
          </div>
          <div class="avatar-customizer-grid">
            <div class="control-group">
              <label class="control-label" for="av-suit">Tema Kostum</label>
              <select id="av-suit" class="field-select">
                ${AVATAR_OPTIONS.suitColor.map((o) => `<option value="${o.key}" ${state.avatarConfig.suitColor === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
              </select>
            </div>
            <div class="control-group">
              <label class="control-label" for="av-hair">Gaya Rambut / Helm</label>
              <select id="av-hair" class="field-select">
                ${AVATAR_OPTIONS.hairStyle.map((o) => `<option value="${o.key}" ${state.avatarConfig.hairStyle === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
              </select>
            </div>
            <div class="control-group">
              <label class="control-label" for="av-visor">Kacamata / Visor</label>
              <select id="av-visor" class="field-select">
                ${AVATAR_OPTIONS.visor.map((o) => `<option value="${o.key}" ${state.avatarConfig.visor === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
              </select>
            </div>
            <div class="control-group">
              <label class="control-label" for="av-acc">Aksesori Sains</label>
              <select id="av-acc" class="field-select">
                ${AVATAR_OPTIONS.accessory.map((o) => `<option value="${o.key}" ${state.avatarConfig.accessory === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
              </select>
            </div>
            <div class="control-group is-span-2">
              <label class="control-label" for="av-skin">Warna Kulit</label>
              <select id="av-skin" class="field-select">
                ${AVATAR_OPTIONS.skinTone.map((o) => `<option value="${o.key}" ${state.avatarConfig.skinTone === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
              </select>
            </div>
          </div>
        </section>

        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Kelas &amp; Tugas dari Guru</h2>
            <span class="muted-meta mono">${joinedClasses.length} kelas</span>
          </div>
          <form class="alias-row form-gap-bottom" id="join-class-form">
            <input id="join-class-code" class="field-input mono" type="text" maxlength="12" placeholder="Masukkan kode kelas (cth: SMP8A)" required />
            <button type="submit" class="btn btn-3d btn-primary">Gabung Kelas</button>
          </form>

          ${
            joinedClasses.length === 0
              ? `<p class="muted-meta">Belum bergabung ke kelas mana pun. Minta kode kelas dari Guru Anda untuk menerima materi dan tugas.</p>`
              : `<ul class="admin-q-list">
                  ${joinedClasses
                    .map(
                      (jc) => `
                    <li class="admin-q-row">
                      <div>
                        <strong>${escapeHtml(jc.classInfo?.name || 'Kelas')}</strong>
                        <p class="muted-meta">${escapeHtml(jc.classInfo?.subject || '')} · ${escapeHtml(jc.classInfo?.gradeBand || '')} · Guru: ${escapeHtml(jc.classInfo?.teacherName || '-')}</p>
                      </div>
                      <button type="button" class="btn btn-ghost btn-sm leave-class-btn" data-mid="${escapeHtml(jc.id)}">Keluar</button>
                    </li>`
                    )
                    .join('')}
                </ul>`
          }

          ${
            assignments.length > 0
              ? `<div class="stack-top-sm">
                  <p class="control-label form-gap-bottom">Tugas Aktif (${assignments.length})</p>
                  <ul class="admin-q-list">
                    ${assignments
                      .map((a) => {
                        const mat = MATERIAL_BY_ID[a.materialId];
                        return `
                        <li class="admin-q-row">
                          <div>
                            <strong>${escapeHtml(a.title)}</strong>
                            <p class="muted-meta">${escapeHtml(mat?.title || 'Materi')} · Tenggat ${escapeHtml(a.dueDate)}</p>
                          </div>
                          ${mat ? `<button type="button" class="btn btn-secondary btn-sm open-assign-mat" data-mat-id="${mat.id}">Kerjakan</button>` : ''}
                        </li>`;
                      })
                      .join('')}
                  </ul>
                </div>`
              : ''
          }
        </section>
      </div>

      <div class="dash-split">
        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Penguasaan Kategori (${bandFilter})</h2>
            <button type="button" class="link-btn" id="dash-go-learn">Buka Materi ${iconSvg('arrowRight', 15)}</button>
          </div>
          <div class="cat-progress-list">
            ${categories
              .map(
                (cat) => `
              <div class="cat-progress-item">
                <div class="cat-progress-meta">
                  <span class="cat-name">${cat.label}</span>
                  <span class="cat-stat mono">${cat.completed}/${cat.total} · ${cat.percent}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${cat.percent}%;background:${cat.gradient}"></div>
                </div>
              </div>`
              )
              .join('')}
          </div>
        </section>

        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Pencapaian</h2>
            <span class="muted-meta mono">${badgeCount} dari ${BADGES.length} terbuka</span>
          </div>
          <ul class="badge-list">
            ${BADGES.map((badge) => {
              const unlocked = state.badges.includes(badge.id);
              return `
                <li class="badge-row ${unlocked ? 'is-unlocked' : 'is-locked'}">
                  <span class="badge-emblem">${iconSvg(unlocked ? badge.icon : 'lock', 18)}</span>
                  <div class="badge-info">
                    <strong>${escapeHtml(badge.name)}</strong>
                    <span>${escapeHtml(badge.description)}</span>
                  </div>
                  <span class="badge-status">${unlocked ? 'Terbuka' : 'Terkunci'}</span>
                </li>
              `;
            }).join('')}
          </ul>
        </section>
      </div>

      <div class="danger-zone">
        <div>
          <h3>Reset Progres Belajar</h3>
          <p class="muted-meta">Mengembalikan XP, materi selesai, kuis, dan badge ke nol.</p>
        </div>
        <button type="button" class="btn btn-danger-outline" id="btn-reset-progress">
          ${iconSvg('trash', 16)}
          <span>Reset Progres</span>
        </button>
      </div>
    </section>
  `;

  attachAvatarTilt(container.querySelector('#dash-avatar-stage'));

  container.querySelectorAll('[data-set-band]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-set-band');
      if (next) {
        setGradeBand(next);
        showToast(`Mode belajar diubah ke ${next}`, 'info');
      }
    });
  });

  container.querySelectorAll('[data-set-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextRole = btn.getAttribute('data-set-role');
      if (nextRole) {
        setAccountType(nextRole);
        showToast(nextRole === 'teacher' ? 'Beralih ke tampilan Guru / Pengajar' : 'Beralih ke tampilan Siswa', 'info');
        if (nextRole === 'teacher') {
          onNavigate('teacher');
        }
      }
    });
  });

  const bindAvatarSelect = (selector, key) => {
    const sel = /** @type {HTMLSelectElement | null} */ (container.querySelector(selector));
    sel?.addEventListener('change', () => {
      setAvatarConfig({ [key]: sel.value });
      showToast('Avatar 3D diperbarui.', 'success');
    });
  };
  bindAvatarSelect('#av-suit', 'suitColor');
  bindAvatarSelect('#av-hair', 'hairStyle');
  bindAvatarSelect('#av-visor', 'visor');
  bindAvatarSelect('#av-acc', 'accessory');
  bindAvatarSelect('#av-skin', 'skinTone');

  container.querySelector('#alias-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const aliasInput = /** @type {HTMLInputElement} */ (container.querySelector('#alias-input'));
    const savedName = setExplorerName(aliasInput.value);
    showToast(`Alias diperbarui menjadi ${savedName}`, 'success');
  });

  container.querySelector('#join-class-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codeInput = /** @type {HTMLInputElement} */ (container.querySelector('#join-class-code'));
    try {
      const cls = await joinClassByCode(codeInput.value);
      if (cls) {
        showToast(`Berhasil bergabung ke kelas ${cls.name}!`, 'success');
        codeInput.value = '';
      }
    } catch (err) {
      showToast(err.message, 'info');
    }
  });

  container.querySelectorAll('.leave-class-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const mid = btn.getAttribute('data-mid');
      if (!mid) return;
      await leaveClass(mid);
      showToast('Keluar dari kelas.', 'info');
    });
  });

  container.querySelectorAll('.open-assign-mat').forEach((btn) => {
    btn.addEventListener('click', () => {
      const matId = Number(btn.getAttribute('data-mat-id'));
      if (matId && onOpenMaterial) onOpenMaterial(matId);
    });
  });

  container.querySelector('#dash-go-learn')?.addEventListener('click', () => onNavigate('learn'));
  container.querySelector('#dash-go-daily')?.addEventListener('click', () => onNavigate('daily'));

  container.querySelector('#btn-reset-progress')?.addEventListener('click', () => {
    openConfirmModal({
      title: 'Reset seluruh progres?',
      description: 'Semua XP, materi selesai, jawaban kuis, dan badge akan dikembalikan ke nol.',
      confirmLabel: 'Ya, Reset Semua',
      onConfirm: () => {
        resetProgress();
        showToast('Progres berhasil direset.', 'info');
      },
    });
  });
}
