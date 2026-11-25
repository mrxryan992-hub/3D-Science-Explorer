import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { MATERIALS } from '../data/scienceData.js';
import { OperationType, db, handleFirestoreError } from '../firebase/client.js';
import { getAuthUser } from '../state/auth.js';
import { getAnnouncement, getMaintenanceState } from '../state/store.js';
import { escapeHtml } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';
import { showToast } from '../components/toast.js';

export function renderAdminView(container) {
  container.innerHTML = `
    <section class="page-section">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Panel Pengelola Admin</h1>
          <p class="page-desc">Kelola akun siswa dan guru, verifikasi sekolah, atur konten laboratorium, dan pemeliharaan sistem.</p>
        </div>
      </div>
      <div class="surface clay-card empty-state">
        <p>Memuat data panel admin...</p>
      </div>
    </section>
  `;

  loadAndRenderAdmin(container);
}

async function loadAndRenderAdmin(container) {
  const authUser = getAuthUser();
  if (!authUser?.isAdmin) return;

  try {
    const [qSnap, lbSnap, schoolSnap] = await Promise.all([
      getDocs(query(collection(db, 'customQuestions'), where('points', '==', 10))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'customQuestions')
      ),
      getDocs(query(collection(db, 'leaderboard'), where('isPublic', '==', true))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'leaderboard')
      ),
      getDocs(collection(db, 'schools')).catch(() => ({ docs: [] })),
    ]);

    const customQuestions = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const accounts = lbSnap.docs.map((d) => d.data()).sort((a, b) => (b.xp || 0) - (a.xp || 0));
    const schools = schoolSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    renderAdminContent(container, {
      announcement: getAnnouncement(),
      maintenance: getMaintenanceState(),
      customQuestions,
      accounts,
      schools,
    });
  } catch (err) {
    container.innerHTML = `
      <section class="page-section">
        <div class="surface clay-card empty-state">
          <p>${escapeHtml(err.message || 'Gagal memuat data admin.')}</p>
        </div>
      </section>
    `;
  }
}

function renderAdminContent(container, data) {
  const authUser = getAuthUser();
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const customQuestions = Array.isArray(data.customQuestions) ? data.customQuestions : [];
  const schools = Array.isArray(data.schools) ? data.schools : [];

  const studentCount = accounts.filter((a) => a.accountType !== 'teacher').length;
  const teacherCount = accounts.filter((a) => a.accountType === 'teacher').length;
  const pendingSchools = schools.filter((s) => s.status === 'pending').length;

  container.innerHTML = `
    <section class="page-section">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Panel Pengelola Admin</h1>
          <p class="page-desc">Kelola akun siswa &amp; guru, verifikasi sekolah, konten pembelajaran, dan pemeliharaan sistem.</p>
        </div>
        <span class="muted-meta mono">${studentCount} siswa · ${teacherCount} guru · ${schools.length} sekolah</span>
      </div>

      <div class="kpi-strip">
        <article class="kpi-cell surface clay-card kpi-blue">
          <div class="kpi-head">
            <span class="kpi-label">Akun Siswa</span>
            <span class="kpi-emblem">${iconSvg('users', 16)}</span>
          </div>
          <strong class="kpi-value mono">${studentCount}</strong>
          <span class="kpi-sub">Pengguna aktif tersinkron</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-violet">
          <div class="kpi-head">
            <span class="kpi-label">Akun Guru</span>
            <span class="kpi-emblem">${iconSvg('award', 16)}</span>
          </div>
          <strong class="kpi-value mono">${teacherCount}</strong>
          <span class="kpi-sub">Pendidik terdaftar</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-orange">
          <div class="kpi-head">
            <span class="kpi-label">Verifikasi Sekolah Pending</span>
            <span class="kpi-emblem">${iconSvg('shield', 16)}</span>
          </div>
          <strong class="kpi-value mono">${pendingSchools}</strong>
          <span class="kpi-sub">Menunggu persetujuan</span>
        </article>
        <article class="kpi-cell surface clay-card kpi-green">
          <div class="kpi-head">
            <span class="kpi-label">Soal Tambahan</span>
            <span class="kpi-emblem">${iconSvg('book', 16)}</span>
          </div>
          <strong class="kpi-value mono">${customQuestions.length}</strong>
          <span class="kpi-sub">Konten kuis kustom</span>
        </article>
      </div>

      <div class="dash-split">
        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Verifikasi &amp; Direktori Sekolah</h2>
            <span class="muted-meta mono">${schools.length} terdaftar</span>
          </div>
          <form class="admin-form form-gap-bottom" id="admin-school-form">
            <div class="admin-opts-grid">
              <div class="control-group">
                <label class="control-label" for="sch-name">Nama Sekolah</label>
                <input id="sch-name" class="field-input" type="text" minlength="2" maxlength="80" required placeholder="SMA Negeri 1 Nusantara" />
              </div>
              <div class="control-group">
                <label class="control-label" for="sch-city">Kota / Kab</label>
                <input id="sch-city" class="field-input" type="text" minlength="2" maxlength="50" required placeholder="Jakarta / Bandung" />
              </div>
            </div>
            <div class="admin-opts-grid">
              <div class="control-group">
                <label class="control-label" for="sch-level">Jenjang</label>
                <select id="sch-level" class="field-select">
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMP & SMA">SMP &amp; SMA</option>
                </select>
              </div>
              <div class="control-group form-end-align">
                <button type="submit" class="btn btn-3d btn-primary">Tambah &amp; Verifikasi Sekolah</button>
              </div>
            </div>
          </form>

          ${
            schools.length === 0
              ? `<p class="muted-meta">Belum ada sekolah terdaftar. Tambahkan sekolah resmi atau setujui pengajuan sekolah di sini.</p>`
              : `<ul class="admin-q-list">
                  ${schools
                    .map(
                      (s) => `
                    <li class="admin-q-row">
                      <div>
                        <strong>${escapeHtml(s.name)}</strong>
                        <p class="muted-meta">${escapeHtml(s.city)} · ${escapeHtml(s.level)} · Status: <strong>${escapeHtml(s.status)}</strong></p>
                      </div>
                      <div class="row-actions-inline">
                        ${
                          s.status !== 'verified'
                            ? `<button type="button" class="btn btn-3d btn-secondary btn-sm verify-sch-btn" data-sid="${escapeHtml(s.id)}" data-school='${escapeHtml(JSON.stringify(s))}'>Verifikasi</button>`
                            : ''
                        }
                        <button type="button" class="btn btn-danger-outline btn-sm del-sch-btn" data-sid="${escapeHtml(s.id)}">Hapus</button>
                      </div>
                    </li>`
                    )
                    .join('')}
                </ul>`
          }
        </section>

        <section class="surface clay-card section-card">
          <div class="section-head">
            <h2>Pemeliharaan Sistem &amp; Pengumuman</h2>
          </div>
          <form class="admin-form" id="admin-maintenance-form">
            <label class="checkbox-row">
              <input type="checkbox" id="maint-enabled" ${data.maintenance?.enabled ? 'checked' : ''} />
              <span>Aktifkan Banner Mode Pemeliharaan Sistem</span>
            </label>
            <div class="control-group">
              <label class="control-label" for="maint-text">Pesan Pemeliharaan</label>
              <input
                id="maint-text"
                class="field-input"
                type="text"
                maxlength="240"
                value="${escapeHtml(data.maintenance?.text || '')}"
                placeholder="Contoh: Pembaruan bank soal dijadwalkan pukul 22:00 WIB."
              />
            </div>
            <button type="submit" class="btn btn-3d btn-secondary">Simpan Status Pemeliharaan</button>
          </form>

          <form class="admin-form stack-top-md" id="admin-announcement-form">
            <div class="control-group">
              <label class="control-label" for="admin-announce-text">Pengumuman Global Laboratorium</label>
              <textarea
                id="admin-announce-text"
                class="field-input field-textarea"
                rows="2"
                maxlength="240"
                placeholder="Kosongkan untuk menyembunyikan pengumuman..."
              >${escapeHtml(data.announcement || '')}</textarea>
            </div>
            <button type="submit" class="btn btn-3d btn-primary">Simpan Pengumuman</button>
          </form>

          <form class="admin-form stack-top-md" id="admin-role-form">
            <div class="control-group">
              <label class="control-label" for="admin-uid-input">Berikan Hak Akses Admin (Firebase UID)</label>
              <div class="alias-row">
                <input
                  id="admin-uid-input"
                  class="field-input mono"
                  type="text"
                  minlength="1"
                  maxlength="128"
                  pattern="[a-zA-Z0-9_\\-]+"
                  required
                  placeholder="Salin UID pengguna dari tabel akun di bawah"
                />
                <button type="submit" class="btn btn-secondary">Tambah Admin</button>
              </div>
            </div>
          </form>
        </section>
      </div>

      <section class="surface clay-card section-card">
        <div class="section-head">
          <h2>Manajemen Konten &amp; Bank Soal (${customQuestions.length})</h2>
        </div>
        <form class="admin-form form-gap-bottom" id="admin-question-form">
          <div class="admin-opts-grid">
            <div class="control-group">
              <label class="control-label" for="aq-band">Jenjang</label>
              <select id="aq-band" class="field-select">
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="Semua">SMP &amp; SMA</option>
              </select>
            </div>
            <div class="control-group">
              <label class="control-label" for="aq-material">Materi Terkait</label>
              <select id="aq-material" class="field-select">
                ${MATERIALS.map((m) => `<option value="${m.id}">[${m.gradeBand}] ${escapeHtml(m.title)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="control-group">
            <label class="control-label" for="aq-question">Pertanyaan</label>
            <input id="aq-question" class="field-input" type="text" minlength="5" maxlength="220" required placeholder="Tulis pertanyaan kuis..." />
          </div>
          <div class="admin-opts-grid">
            <input id="aq-opt0" class="field-input" type="text" minlength="1" maxlength="120" required placeholder="Pilihan A" />
            <input id="aq-opt1" class="field-input" type="text" minlength="1" maxlength="120" required placeholder="Pilihan B" />
            <input id="aq-opt2" class="field-input" type="text" minlength="1" maxlength="120" required placeholder="Pilihan C" />
            <select id="aq-answer" class="field-select" aria-label="Jawaban benar">
              <option value="0">Kunci: Opsi A</option>
              <option value="1">Kunci: Opsi B</option>
              <option value="2">Kunci: Opsi C</option>
            </select>
          </div>
          <div class="control-group">
            <label class="control-label" for="aq-explain">Penjelasan Singkat</label>
            <input id="aq-explain" class="field-input" type="text" minlength="5" maxlength="300" required placeholder="Penjelasan mengapa jawaban tersebut benar..." />
          </div>
          <button type="submit" class="btn btn-3d btn-primary">Tambahkan ke Bank Soal</button>
        </form>

        ${
          customQuestions.length === 0
            ? `<p class="muted-meta">Belum ada soal tambahan dari guru atau admin.</p>`
            : `<ul class="admin-q-list">
                ${customQuestions
                  .map(
                    (q) => `
                  <li class="admin-q-row">
                    <div>
                      <strong>${escapeHtml(q.question)}</strong>
                      <p class="muted-meta">${escapeHtml(q.gradeBand || 'SMP')} · Jawaban: ${escapeHtml(q.options?.[q.answerIndex] || '')} · Oleh ${escapeHtml(q.createdByName || 'Admin')}</p>
                    </div>
                    <button type="button" class="btn btn-danger-outline btn-sm del-q-btn" data-qid="${escapeHtml(q.id)}">
                      ${iconSvg('trash', 15)}
                      <span>Hapus</span>
                    </button>
                  </li>
                `
                  )
                  .join('')}
              </ul>`
        }
      </section>

      <section class="surface clay-card table-card">
        <div class="section-head table-card-head">
          <h2>Daftar Akun Siswa &amp; Guru Terdaftar</h2>
          <span class="muted-meta mono">${accounts.length} akun</span>
        </div>
        ${
          accounts.length === 0
            ? `<div class="table-empty-pad"><p class="muted-meta">Belum ada akun yang menyinkronkan profil.</p></div>`
            : `<table class="lb-table">
                <thead>
                  <tr>
                    <th>Nama / Alias</th>
                    <th>Peran</th>
                    <th>Jenjang</th>
                    <th>UID</th>
                    <th class="num-col">Level</th>
                    <th class="num-col">Total XP</th>
                  </tr>
                </thead>
                <tbody>
                  ${accounts
                    .map(
                      (s) => `
                    <tr>
                      <td><strong>${escapeHtml(s.name)}</strong></td>
                      <td>${s.accountType === 'teacher' ? 'Guru' : 'Siswa'}</td>
                      <td class="muted-meta">${escapeHtml(s.gradeBand || 'SMP')}</td>
                      <td>
                        <div class="row-actions-inline">
                          <span class="mono uid-cell" title="${escapeHtml(s.uid)}">${escapeHtml(s.uid)}</span>
                          <button type="button" class="btn btn-ghost btn-sm copy-uid-btn" data-uid="${escapeHtml(s.uid)}" title="Salin UID">
                            ${iconSvg('copy', 13)}
                          </button>
                        </div>
                      </td>
                      <td class="num-col mono">Lv. ${s.level}</td>
                      <td class="num-col mono">${s.xp} XP</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>`
        }
      </section>
    </section>
  `;

  container.querySelectorAll('.copy-uid-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-uid');
      if (!uid) return;
      try {
        await navigator.clipboard.writeText(uid);
        showToast('UID pengguna disalin!', 'success');
      } catch {
        const uidInput = /** @type {HTMLInputElement | null} */ (container.querySelector('#admin-uid-input'));
        if (uidInput) uidInput.value = uid;
        showToast('UID dimasukkan ke kolom Tambah Admin.', 'info');
      }
    });
  });

  container.querySelector('#admin-school-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = /** @type {HTMLInputElement} */ (container.querySelector('#sch-name')).value.trim().slice(0, 80);
    const city = /** @type {HTMLInputElement} */ (container.querySelector('#sch-city')).value.trim().slice(0, 50);
    const level = /** @type {HTMLSelectElement} */ (container.querySelector('#sch-level')).value;
    try {
      await addDoc(collection(db, 'schools'), {
        name,
        city,
        level,
        status: 'verified',
        requestedByUid: authUser.uid,
        verifiedByUid: authUser.uid,
        updatedAt: serverTimestamp(),
      });
      showToast(`Sekolah ${name} diverifikasi.`, 'success');
      loadAndRenderAdmin(container);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schools');
    }
  });

  container.querySelectorAll('.verify-sch-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sid = btn.getAttribute('data-sid');
      const raw = btn.getAttribute('data-school');
      if (!sid || !raw) return;
      const sch = JSON.parse(raw);
      try {
        await updateDoc(doc(db, 'schools', sid), {
          name: sch.name,
          city: sch.city,
          level: sch.level,
          status: 'verified',
          verifiedByUid: authUser.uid,
          updatedAt: serverTimestamp(),
        });
        showToast(`Sekolah ${sch.name} resmi terverifikasi.`, 'success');
        loadAndRenderAdmin(container);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `schools/${sid}`);
      }
    });
  });

  container.querySelectorAll('.del-sch-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sid = btn.getAttribute('data-sid');
      if (!sid) return;
      try {
        await deleteDoc(doc(db, 'schools', sid));
        showToast('Data sekolah dihapus.', 'info');
        loadAndRenderAdmin(container);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `schools/${sid}`);
      }
    });
  });

  container.querySelector('#admin-maintenance-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enabled = /** @type {HTMLInputElement} */ (container.querySelector('#maint-enabled')).checked;
    const text = /** @type {HTMLInputElement} */ (container.querySelector('#maint-text')).value.trim().slice(0, 240);
    try {
      await setDoc(doc(db, 'settings', 'maintenance'), {
        enabled,
        text,
        updatedByUid: authUser.uid,
        updatedAt: serverTimestamp(),
      });
      showToast(enabled ? 'Mode pemeliharaan diaktifkan.' : 'Mode pemeliharaan dinonaktifkan.', 'success');
      loadAndRenderAdmin(container);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/maintenance');
    }
  });

  container.querySelector('#admin-announcement-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = /** @type {HTMLTextAreaElement} */ (container.querySelector('#admin-announce-text')).value.trim().slice(0, 240);
    try {
      await setDoc(doc(db, 'settings', 'announcement'), {
        text,
        updatedByUid: authUser.uid,
        updatedAt: serverTimestamp(),
      });
      showToast('Pengumuman laboratorium diperbarui.', 'success');
      loadAndRenderAdmin(container);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/announcement');
    }
  });

  container.querySelector('#admin-role-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUid = /** @type {HTMLInputElement} */ (container.querySelector('#admin-uid-input')).value.trim();
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(targetUid)) {
      showToast('Format UID tidak valid.', 'info');
      return;
    }
    try {
      await setDoc(doc(db, 'admins', targetUid), {
        uid: targetUid,
        grantedBy: authUser.uid,
        createdAt: serverTimestamp(),
      });
      showToast(`Akses admin diberikan ke UID ${targetUid}.`, 'success');
      /** @type {HTMLInputElement} */ (container.querySelector('#admin-uid-input')).value = '';
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admins/${targetUid}`);
    }
  });

  container.querySelector('#admin-question-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gradeBand = /** @type {HTMLSelectElement} */ (container.querySelector('#aq-band')).value;
    const materialId = Number(/** @type {HTMLSelectElement} */ (container.querySelector('#aq-material')).value);
    const question = /** @type {HTMLInputElement} */ (container.querySelector('#aq-question')).value.trim().slice(0, 220);
    const options = [
      /** @type {HTMLInputElement} */ (container.querySelector('#aq-opt0')).value.trim().slice(0, 120),
      /** @type {HTMLInputElement} */ (container.querySelector('#aq-opt1')).value.trim().slice(0, 120),
      /** @type {HTMLInputElement} */ (container.querySelector('#aq-opt2')).value.trim().slice(0, 120),
    ];
    const answerIndex = Number(/** @type {HTMLSelectElement} */ (container.querySelector('#aq-answer')).value);
    const explanation = /** @type {HTMLInputElement} */ (container.querySelector('#aq-explain')).value.trim().slice(0, 300);

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
        createdByName: (authUser.displayName || 'Admin').slice(0, 24),
        createdAt: serverTimestamp(),
      });
      showToast('Soal baru berhasil ditambahkan.', 'success');
      loadAndRenderAdmin(container);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customQuestions');
    }
  });

  container.querySelectorAll('.del-q-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const qid = btn.getAttribute('data-qid');
      if (!qid) return;
      try {
        await deleteDoc(doc(db, 'customQuestions', qid));
        showToast('Soal dihapus.', 'info');
        loadAndRenderAdmin(container);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `customQuestions/${qid}`);
      }
    });
  });
}
