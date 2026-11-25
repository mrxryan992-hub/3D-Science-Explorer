import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { MATERIALS, MATERIAL_BY_ID } from '../data/scienceData.js';
import { OperationType, db, handleFirestoreError } from '../firebase/client.js';
import { getAuthUser } from '../state/auth.js';
import { getState } from '../state/store.js';
import { escapeHtml } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';
import { showToast } from '../components/toast.js';

const TEACHER_STUDIO_IMG = '/src/assets/images/teacher_studio_3d_light_1795590698958.jpg';

function generateClassCode(gradeBand) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${gradeBand}${suffix}`;
}

export function renderTeacherView(container) {
  container.innerHTML = `
    <section class="page-section">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Studio Guru &amp; Pengajar</h1>
          <p class="page-desc">Kelola kelas SMP/SMA, distribusikan materi dan tugas, buat kuis cepat, serta pantau analitik nilai siswa otomatis.</p>
        </div>
      </div>
      <div class="surface clay-card empty-state">
        <p>Memuat data kelas dan analitik siswa...</p>
      </div>
    </section>
  `;

  loadAndRenderTeacher(container);
}

async function loadAndRenderTeacher(container) {
  const authUser = getAuthUser();
  if (!authUser) return;

  try {
    const [clsSnap, memSnap, assignSnap, qSnap] = await Promise.all([
      getDocs(query(collection(db, 'classes'), where('teacherUid', '==', authUser.uid))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'classes')
      ),
      getDocs(query(collection(db, 'classMembers'), where('teacherUid', '==', authUser.uid))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'classMembers')
      ),
      getDocs(query(collection(db, 'assignments'), where('teacherUid', '==', authUser.uid))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'assignments')
      ),
      getDocs(query(collection(db, 'customQuestions'), where('createdByUid', '==', authUser.uid))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'customQuestions')
      ),
    ]);

    const classes = clsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const members = memSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const assignments = assignSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const myQuestions = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    renderTeacherContent(container, { classes, members, assignments, myQuestions });
  } catch (err) {
    container.innerHTML = `
      <section class="page-section">
        <div class="surface clay-card empty-state">
          <p>${escapeHtml(err.message || 'Gagal memuat Studio Guru.')}</p>
        </div>
      </section>
    `;
  }
}

function renderTeacherContent(container, { classes, members, assignments, myQuestions }) {
  const authUser = getAuthUser();
  const state = getState();

  const totalMembers = members.length;
  const avgXp = totalMembers > 0 ? Math.round(members.reduce((sum, m) => sum + (m.xp || 0), 0) / totalMembers) : 0;
  const totalCorrect = members.reduce((sum, m) => sum + (m.completedQuizzes || 0), 0);
  const totalWrong = members.reduce((sum, m) => sum + (m.wrongAttempts || 0), 0);
  const avgAccuracy =
    totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c]));

  container.innerHTML = `
    <section class="page-section">
      <div class="teacher-hero surface clay-card">
        <div class="teacher-hero-copy">
          <p class="eyebrow-text">Workspace Pendidik · ${escapeHtml(state.name)}</p>
          <h1 class="page-title">Studio Pengajaran &amp; Analitik Kelas</h1>
          <p class="page-desc">
            Buat kelas SMP atau SMA dengan kode otomatis, bagikan modul &amp; tenggat tugas, susun kuis interaktif cepat, dan pantau skor siswa secara real-time.
          </p>
        </div>
        <div class="teacher-hero-art">
          <img
            src="${TEACHER_STUDIO_IMG}"
            alt="Ilustrasi 3D meja kerja pengajar digital"
            class="teacher-art-img"
            referrerpolicy="no-referrer"
            onerror="this.style.display='none'"
          />
        </div>
      </div>

      <div class="kpi-strip">
        <article class="kpi-cell surface clay-card kpi-blue">
          <div class="kpi-head">
            <span class="kpi-label">Kelas Aktif</span>
            <span class="kpi-emblem">${iconSvg('layers', 16)}</span>
          </div>
          <strong class="kpi-value mono">${classes.length}</strong>
          <span class="kpi-sub">Ruang belajar SMP &amp; SMA</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-violet">
          <div class="kpi-head">
            <span class="kpi-label">Siswa Terdaftar</span>
            <span class="kpi-emblem">${iconSvg('users', 16)}</span>
          </div>
          <strong class="kpi-value mono">${totalMembers}</strong>
          <span class="kpi-sub">Peserta kelas aktif</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-green">
          <div class="kpi-head">
            <span class="kpi-label">Akurasi Rata-rata</span>
            <span class="kpi-emblem">${iconSvg('check', 16)}</span>
          </div>
          <strong class="kpi-value mono">${avgAccuracy}%</strong>
          <span class="kpi-sub">Ketepatan kuis siswa</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-orange">
          <div class="kpi-head">
            <span class="kpi-label">Tugas Terdistribusi</span>
            <span class="kpi-emblem">${iconSvg('book', 16)}</span>
          </div>
          <strong class="kpi-value mono">${assignments.length}</strong>
          <span class="kpi-sub">Materi &amp; evaluasi</span>
        </article>
      </div>

      <div class="dash-split">
        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Buat Kelas Baru (SMP / SMA)</h2>
          </div>
          <form class="admin-form" id="teacher-create-class">
            <div class="control-group">
              <label class="control-label" for="tc-name">Nama Kelas</label>
              <input id="tc-name" class="field-input" type="text" minlength="2" maxlength="60" required placeholder="Contoh: IPA 8A atau Fisika 11 MIPA" />
            </div>
            <div class="admin-opts-grid">
              <div class="control-group">
                <label class="control-label" for="tc-band">Jenjang</label>
                <select id="tc-band" class="field-select">
                  <option value="SMP">SMP (Kelas 7–9)</option>
                  <option value="SMA">SMA (Kelas 10–12)</option>
                </select>
              </div>
              <div class="control-group">
                <label class="control-label" for="tc-subject">Mata Pelajaran</label>
                <input id="tc-subject" class="field-input" type="text" minlength="2" maxlength="40" required value="IPA Terpadu" />
              </div>
            </div>
            <button type="submit" class="btn btn-3d btn-primary">Buat Kelas &amp; Kode Gabung</button>
          </form>

          ${
            classes.length > 0
              ? `<div class="stack-top-md">
                  <p class="control-label form-gap-bottom">Daftar Kelas Anda</p>
                  <ul class="admin-q-list">
                    ${classes
                      .map(
                        (c) => `
                      <li class="admin-q-row">
                        <div>
                          <strong>${escapeHtml(c.name)}</strong>
                          <p class="muted-meta">${escapeHtml(c.gradeBand)} · ${escapeHtml(c.subject)} · Kode: <span class="mono class-code-tag">${escapeHtml(c.code)}</span></p>
                        </div>
                        <div class="row-actions-inline">
                          <button type="button" class="btn btn-secondary btn-sm copy-code-btn" data-code="${escapeHtml(c.code)}">
                            ${iconSvg('copy', 14)}
                            <span>Salin</span>
                          </button>
                          <button type="button" class="btn btn-danger-outline btn-sm del-class-btn" data-cid="${escapeHtml(c.id)}">Hapus</button>
                        </div>
                      </li>`
                      )
                      .join('')}
                  </ul>
                </div>`
              : ''
          }
        </section>

        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Distribusi Materi &amp; Tugas</h2>
          </div>
          ${
            classes.length === 0
              ? `<p class="muted-meta">Buat minimal 1 kelas terlebih dahulu di sebelah kiri untuk mulai membagikan tugas materi ke siswa.</p>`
              : `<form class="admin-form" id="teacher-create-assign">
                  <div class="control-group">
                    <label class="control-label" for="ta-class">Pilih Kelas Tujuan</label>
                    <select id="ta-class" class="field-select">
                      ${classes.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${c.gradeBand})</option>`).join('')}
                    </select>
                  </div>
                  <div class="control-group">
                    <label class="control-label" for="ta-title">Judul Tugas / Instruksi</label>
                    <input id="ta-title" class="field-input" type="text" minlength="3" maxlength="100" required placeholder="Contoh: Pelajari Simulasi Gravitasi & Jawab Kuis" />
                  </div>
                  <div class="admin-opts-grid">
                    <div class="control-group">
                      <label class="control-label" for="ta-mat">Modul Sains</label>
                      <select id="ta-mat" class="field-select">
                        ${MATERIALS.map((m) => `<option value="${m.id}">[${m.gradeBand}] ${escapeHtml(m.title)}</option>`).join('')}
                      </select>
                    </div>
                    <div class="control-group">
                      <label class="control-label" for="ta-due">Tenggat Waktu</label>
                      <input id="ta-due" class="field-input" type="date" required value="${new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}" />
                    </div>
                  </div>
                  <div class="control-group">
                    <label class="control-label" for="ta-notes">Catatan Guru (opsional)</label>
                    <input id="ta-notes" class="field-input" type="text" maxlength="240" placeholder="Contoh: Selesaikan video interaktif sebelum kuis" />
                  </div>
                  <button type="submit" class="btn btn-3d btn-primary">Kirim Tugas ke Kelas</button>
                </form>`
          }
          ${
            assignments.length > 0
              ? `<div class="stack-top-md">
                  <p class="control-label form-gap-bottom">Tugas Terkirim (${assignments.length})</p>
                  <ul class="admin-q-list">
                    ${assignments
                      .map((a) => {
                        const cls = classMap[a.classId];
                        const mat = MATERIAL_BY_ID[a.materialId];
                        return `
                        <li class="admin-q-row">
                          <div>
                            <strong>${escapeHtml(a.title)}</strong>
                            <p class="muted-meta">${escapeHtml(cls?.name || 'Kelas')} · ${escapeHtml(mat?.title || '')} · Tenggat ${escapeHtml(a.dueDate)}</p>
                          </div>
                          <button type="button" class="btn btn-danger-outline btn-sm del-assign-btn" data-aid="${escapeHtml(a.id)}">Hapus</button>
                        </li>`;
                      })
                      .join('')}
                  </ul>
                </div>`
              : ''
          }
        </section>
      </div>

      <section class="surface clay-card table-card">
        <div class="section-head table-card-head">
          <h2>Analitik Nilai &amp; Perkembangan Siswa Otomatis</h2>
          <span class="muted-meta mono">Rata-rata ${avgXp} XP · ${avgAccuracy}% akurasi</span>
        </div>
        ${
          members.length === 0
            ? `<div class="table-empty-pad"><p class="muted-meta">Belum ada siswa yang bergabung ke kelas Anda. Bagikan kode kelas di atas agar perkembangan nilai dan progres siswa tercatat otomatis di sini.</p></div>`
            : `<table class="lb-table">
                <thead>
                  <tr>
                    <th>Nama Siswa</th>
                    <th>Kelas</th>
                    <th class="num-col">Materi</th>
                    <th class="num-col">Kuis Benar</th>
                    <th class="num-col">Akurasi</th>
                    <th class="num-col">Total XP</th>
                  </tr>
                </thead>
                <tbody>
                  ${members
                    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                    .map((m) => {
                      const cls = classMap[m.classId];
                      const attempts = (m.completedQuizzes || 0) + (m.wrongAttempts || 0);
                      const acc = attempts > 0 ? Math.round(((m.completedQuizzes || 0) / attempts) * 100) : 100;
                      return `
                        <tr>
                          <td><strong>${escapeHtml(m.studentName)}</strong></td>
                          <td class="muted-meta">${escapeHtml(cls?.name || m.gradeBand)}</td>
                          <td class="num-col mono">${m.completedMaterials || 0}/${MATERIALS.length}</td>
                          <td class="num-col mono">${m.completedQuizzes || 0}</td>
                          <td class="num-col mono">${acc}%</td>
                          <td class="num-col mono">${m.xp || 0} XP</td>
                        </tr>`;
                    })
                    .join('')}
                </tbody>
              </table>`
        }
      </section>

      <section class="surface clay-card section-card">
        <div class="section-head">
          <h2>Pembuat Kuis Interaktif Cepat</h2>
          <span class="muted-meta mono">${myQuestions.length} soal dibuat</span>
        </div>
        <form class="admin-form" id="teacher-quick-quiz">
          <div class="admin-opts-grid">
            <div class="control-group">
              <label class="control-label" for="tq-band">Target Jenjang</label>
              <select id="tq-band" class="field-select">
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="Semua">SMP &amp; SMA</option>
              </select>
            </div>
            <div class="control-group">
              <label class="control-label" for="tq-material">Materi Terkait</label>
              <select id="tq-material" class="field-select">
                ${MATERIALS.map((m) => `<option value="${m.id}">[${m.gradeBand}] ${escapeHtml(m.title)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="tq-question">Pertanyaan Kuis</label>
            <input id="tq-question" class="field-input" type="text" minlength="5" maxlength="220" required placeholder="Tulis pertanyaan singkat..." />
          </div>
          <div class="admin-opts-grid">
            <input id="tq-opt0" class="field-input" type="text" minlength="1" maxlength="120" required placeholder="Opsi A" />
            <input id="tq-opt1" class="field-input" type="text" minlength="1" maxlength="120" required placeholder="Opsi B" />
            <input id="tq-opt2" class="field-input" type="text" minlength="1" maxlength="120" required placeholder="Opsi C" />
            <select id="tq-answer" class="field-select" aria-label="Jawaban benar">
              <option value="0">Kunci: Opsi A</option>
              <option value="1">Kunci: Opsi B</option>
              <option value="2">Kunci: Opsi C</option>
            </select>
          </div>
          <div class="control-group">
            <label class="control-label" for="tq-explain">Pembahasan Singkat</label>
            <input id="tq-explain" class="field-input" type="text" minlength="5" maxlength="300" required placeholder="Jelaskan konsep mengapa jawaban tersebut benar..." />
          </div>
          <button type="submit" class="btn btn-3d btn-primary">Publikasikan Soal Kuis</button>
        </form>

        ${
          myQuestions.length > 0
            ? `<ul class="admin-q-list stack-top-md">
                ${myQuestions
                  .map(
                    (q) => `
                  <li class="admin-q-row">
                    <div>
                      <strong>${escapeHtml(q.question)}</strong>
                      <p class="muted-meta">${escapeHtml(q.gradeBand || 'SMP')} · Jawaban: ${escapeHtml(q.options?.[q.answerIndex] || '')}</p>
                    </div>
                    <button type="button" class="btn btn-danger-outline btn-sm del-tq-btn" data-qid="${escapeHtml(q.id)}">
                      ${iconSvg('trash', 15)}
                      <span>Hapus</span>
                    </button>
                  </li>`
                  )
                  .join('')}
              </ul>`
            : ''
        }
      </section>
    </section>
  `;

  container.querySelectorAll('.copy-code-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.getAttribute('data-code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        showToast(`Kode kelas ${code} disalin!`, 'success');
      } catch {
        showToast(`Kode kelas: ${code}`, 'info');
      }
    });
  });

  container.querySelector('#teacher-create-class')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = /** @type {HTMLInputElement} */ (container.querySelector('#tc-name')).value.trim().slice(0, 60);
    const gradeBand = /** @type {HTMLSelectElement} */ (container.querySelector('#tc-band')).value === 'SMA' ? 'SMA' : 'SMP';
    const subject = /** @type {HTMLInputElement} */ (container.querySelector('#tc-subject')).value.trim().slice(0, 40);
    const code = generateClassCode(gradeBand);

    try {
      await addDoc(collection(db, 'classes'), {
        name,
        code,
        gradeBand,
        subject,
        teacherUid: authUser.uid,
        teacherName: (state.name || authUser.displayName || 'Guru').slice(0, 24),
        materialIds: [],
        updatedAt: serverTimestamp(),
      });
      showToast(`Kelas "${name}" dibuat! Kode gabung: ${code}`, 'success');
      loadAndRenderTeacher(container);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    }
  });

  container.querySelectorAll('.del-class-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const cid = btn.getAttribute('data-cid');
      if (!cid) return;
      try {
        await deleteDoc(doc(db, 'classes', cid));
        showToast('Kelas dihapus.', 'info');
        loadAndRenderTeacher(container);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `classes/${cid}`);
      }
    });
  });

  container.querySelector('#teacher-create-assign')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const classId = /** @type {HTMLSelectElement} */ (container.querySelector('#ta-class')).value;
    const title = /** @type {HTMLInputElement} */ (container.querySelector('#ta-title')).value.trim().slice(0, 100);
    const materialId = Number(/** @type {HTMLSelectElement} */ (container.querySelector('#ta-mat')).value);
    const dueDate = /** @type {HTMLInputElement} */ (container.querySelector('#ta-due')).value.trim().slice(0, 20);
    const notes = /** @type {HTMLInputElement} */ (container.querySelector('#ta-notes')).value.trim().slice(0, 240);
    const targetClass = classMap[classId];

    try {
      await addDoc(collection(db, 'assignments'), {
        classId,
        teacherUid: authUser.uid,
        title,
        gradeBand: targetClass?.gradeBand === 'SMA' ? 'SMA' : 'SMP',
        materialId,
        dueDate,
        notes,
        updatedAt: serverTimestamp(),
      });
      showToast('Tugas berhasil didistribusikan ke siswa!', 'success');
      loadAndRenderTeacher(container);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'assignments');
    }
  });

  container.querySelectorAll('.del-assign-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const aid = btn.getAttribute('data-aid');
      if (!aid) return;
      try {
        await deleteDoc(doc(db, 'assignments', aid));
        showToast('Tugas dihapus.', 'info');
        loadAndRenderTeacher(container);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `assignments/${aid}`);
      }
    });
  });

  container.querySelector('#teacher-quick-quiz')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gradeBand = /** @type {HTMLSelectElement} */ (container.querySelector('#tq-band')).value;
    const materialId = Number(/** @type {HTMLSelectElement} */ (container.querySelector('#tq-material')).value);
    const question = /** @type {HTMLInputElement} */ (container.querySelector('#tq-question')).value.trim().slice(0, 220);
    const options = [
      /** @type {HTMLInputElement} */ (container.querySelector('#tq-opt0')).value.trim().slice(0, 120),
      /** @type {HTMLInputElement} */ (container.querySelector('#tq-opt1')).value.trim().slice(0, 120),
      /** @type {HTMLInputElement} */ (container.querySelector('#tq-opt2')).value.trim().slice(0, 120),
    ];
    const answerIndex = Number(/** @type {HTMLSelectElement} */ (container.querySelector('#tq-answer')).value);
    const explanation = /** @type {HTMLInputElement} */ (container.querySelector('#tq-explain')).value.trim().slice(0, 300);

    try {
      await addDoc(collection(db, 'customQuestions'), {
        materialId,
        gradeBand,
        question,
        options,
        answerIndex,
        explanation,
        points: 10,
        createdByUid: authUser.uid,
        createdByName: (state.name || authUser.displayName || 'Guru').slice(0, 24),
        createdAt: serverTimestamp(),
      });
      showToast('Soal kuis interaktif berhasil dipublikasikan!', 'success');
      loadAndRenderTeacher(container);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customQuestions');
    }
  });

  container.querySelectorAll('.del-tq-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const qid = btn.getAttribute('data-qid');
      if (!qid) return;
      try {
        await deleteDoc(doc(db, 'customQuestions', qid));
        showToast('Soal dihapus.', 'info');
        loadAndRenderTeacher(container);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `customQuestions/${qid}`);
      }
    });
  });
}
