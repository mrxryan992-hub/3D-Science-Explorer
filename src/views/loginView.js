import {
  getAuthUser,
  getRememberedLogin,
  logoutUser,
  refreshVerificationStatus,
  registerWithEmail,
  requestPasswordReset,
  resendVerificationEmail,
  signInManual,
  signInWithGoogle,
} from '../state/auth.js';
import { escapeHtml } from '../utils/dom.js';
import { iconSvg } from '../utils/icons.js';
import { showToast } from '../components/toast.js';

const LOGIN_HERO_IMAGE = '/src/assets/images/login_hero_3d_light_1795590697312.jpg';

const GOOGLE_G_SVG = `
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"/>
    <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"/>
  </svg>
`;

export function renderLoginView(container) {
  const authUser = getAuthUser();
  const remembered = getRememberedLogin();
  let mode = 'login'; // 'login' | 'register' | 'forgot'
  let registerRole = 'student';
  let registerBand = 'SMP';
  let animRafId = null;

  function stopAnim() {
    if (animRafId) {
      cancelAnimationFrame(animRafId);
      animRafId = null;
    }
  }

  function startOrbitCanvas() {
    stopAnim();
    const canvas = /** @type {HTMLCanvasElement | null} */ (container.querySelector('#login-3d-orbit'));
    const stageCard = /** @type {HTMLElement | null} */ (container.querySelector('#login-3d-stage'));
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pointerX = 0;
    let pointerY = 0;
    let angle = 0;

    if (stageCard && !reducedMotion) {
      stageCard.addEventListener('pointermove', (e) => {
        const rect = stageCard.getBoundingClientRect();
        pointerX = (e.clientX - rect.left) / rect.width - 0.5;
        pointerY = (e.clientY - rect.top) / rect.height - 0.5;
        stageCard.style.transform = `perspective(900px) rotateY(${(pointerX * 7).toFixed(2)}deg) rotateX(${(-pointerY * 7).toFixed(2)}deg)`;
      });
      stageCard.addEventListener('pointerleave', () => {
        pointerX = 0;
        pointerY = 0;
        stageCard.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2 + pointerX * 8;
      const cy = h / 2 + pointerY * 8;

      const rings = [
        { rx: w * 0.36, ry: w * 0.13, tilt: 0.48, color: '#0284C7', speed: 1.1 },
        { rx: w * 0.36, ry: w * 0.13, tilt: -0.52, color: '#059669', speed: -1.4 },
        { rx: w * 0.32, ry: w * 0.12, tilt: 1.55, color: '#F59E0B', speed: 0.9 },
      ];

      rings.forEach((ring, idx) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.tilt);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.rx, ring.ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        const theta = angle * ring.speed + idx * 2.1;
        const px = Math.cos(theta) * ring.rx;
        const py = Math.sin(theta) * ring.ry;
        ctx.globalAlpha = 1;
        ctx.fillStyle = idx === 2 ? '#F97316' : ring.color;
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const nucleusR = Math.max(6, w * 0.1);
      const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, nucleusR);
      grad.addColorStop(0, '#FBBF24');
      grad.addColorStop(0.55, '#10B981');
      grad.addColorStop(1, '#0284C7');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
      ctx.fill();

      if (!reducedMotion) {
        angle += 0.024;
        animRafId = requestAnimationFrame(draw);
      }
    };

    draw();
  }

  function renderVerificationGate() {
    stopAnim();
    container.innerHTML = `
      <section class="auth-shell">
        <div class="auth-intro">
          <div class="clay-stage-card" id="login-3d-stage">
            <img
              src="${LOGIN_HERO_IMAGE}"
              alt="Ilustrasi laboratorium sains 3D"
              class="login-hero-img"
              referrerpolicy="no-referrer"
              onerror="this.style.display='none'"
            />
            <div class="login-stage-footer">
              <div class="login-orbit-stage" title="Model Atom 3D Interaktif">
                <canvas id="login-3d-orbit" width="72" height="72" aria-hidden="true"></canvas>
              </div>
              <div class="login-stage-meta">
                <strong>Aktivasi Akun Penjelajah</strong>
                <span>Verifikasi email menjaga keamanan progres belajar dan kelas Anda.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="surface clay-card auth-card">
          <div class="auth-card-header">
            <h2>Verifikasi Email Diperlukan</h2>
            <p class="muted-meta">
              Tautan verifikasi telah dikirim ke <strong>${escapeHtml(authUser.email)}</strong>. Buka inbox Anda dan klik tautan verifikasi untuk mengaktifkan akun secara aman.
            </p>
          </div>
          <div id="auth-error-box" class="auth-error" role="alert" hidden></div>
          <button type="button" class="btn btn-3d btn-primary btn-full" id="btn-check-verify">
            ${iconSvg('check', 16)}
            <span>Saya Sudah Verifikasi</span>
          </button>
          <button type="button" class="btn btn-secondary btn-full" id="btn-resend-verify">
            Kirim Ulang Email Verifikasi
          </button>
          <button type="button" class="btn btn-ghost btn-full" id="btn-verify-logout">
            Keluar / Ganti Akun
          </button>
        </div>
      </section>
    `;

    startOrbitCanvas();

    const errBox = container.querySelector('#auth-error-box');
    const showErr = (msg) => {
      if (!errBox) return;
      errBox.textContent = msg;
      errBox.removeAttribute('hidden');
    };

    container.querySelector('#btn-check-verify')?.addEventListener('click', async () => {
      try {
        const verified = await refreshVerificationStatus();
        if (verified) {
          showToast('Email berhasil diverifikasi!', 'success');
        } else {
          showErr('Email belum terdeteksi terverifikasi. Pastikan Anda sudah mengklik tautan di email Anda.');
        }
      } catch (err) {
        showErr(err.message);
      }
    });

    container.querySelector('#btn-resend-verify')?.addEventListener('click', async () => {
      try {
        await resendVerificationEmail();
        showToast('Email verifikasi baru telah dikirim.', 'info');
      } catch (err) {
        showErr(err.message);
      }
    });

    container.querySelector('#btn-verify-logout')?.addEventListener('click', async () => {
      await logoutUser();
    });
  }

  function renderMainAuth() {
    if (authUser && !authUser.emailVerified) {
      renderVerificationGate();
      return;
    }

    container.innerHTML = `
      <section class="auth-shell">
        <div class="auth-intro">
          <div class="clay-stage-card" id="login-3d-stage">
            <img
              src="${LOGIN_HERO_IMAGE}"
              alt="Diorama laboratorium sains 3D SMP dan SMA"
              class="login-hero-img"
              referrerpolicy="no-referrer"
              onerror="this.style.display='none'"
            />
            <div class="login-stage-footer">
              <div class="login-orbit-stage" title="Model Atom 3D Interaktif">
                <canvas id="login-3d-orbit" width="72" height="72" aria-hidden="true"></canvas>
              </div>
              <div class="login-stage-meta">
                <strong>Laboratorium Sains Interaktif 3D</strong>
                <span>16 Modul Kurikulum SMP &amp; SMA · Simulasi Fisika &amp; Astronomi · Avatar 3D</span>
              </div>
            </div>
          </div>

          <div class="auth-copy-block">
            <p class="eyebrow-text">Platform Belajar Sains 3D · SMP &amp; SMA</p>
            <h1 class="auth-headline">Jelajahi Sains dengan Visual 3D &amp; Gamifikasi</h1>
            <p class="auth-lead">
              Pembelajaran interaktif yang dirancang terstruktur untuk siswa SMP dan SMA, dilengkapi ruang kerja khusus bagi pengajar dan pengelola sekolah.
            </p>
            <div class="auth-role-grid">
              <div class="auth-role-item">
                <strong>Siswa SMP &amp; SMA</strong>
                <span>Materi 3D, kuis XP, badge prestasi &amp; avatar pribadi.</span>
              </div>
              <div class="auth-role-item">
                <strong>Guru / Pengajar</strong>
                <span>Kelola kelas, bagikan tugas &amp; pantau nilai otomatis.</span>
              </div>
              <div class="auth-role-item">
                <strong>Admin Sekolah</strong>
                <span>Verifikasi sekolah, bank soal &amp; kontrol sistem.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="surface clay-card auth-card">
          <div class="auth-card-header">
            <h2>${mode === 'register' ? 'Daftar Akun Baru' : mode === 'forgot' ? 'Reset Password' : 'Masuk ke Akun Anda'}</h2>
            <p class="muted-meta">
              ${
                mode === 'register'
                  ? 'Buat akun Siswa SMP/SMA atau Guru Pengajar.'
                  : mode === 'forgot'
                    ? 'Masukkan email terdaftar untuk menerima tautan pemulihan.'
                    : 'Akses cepat dengan Gmail atau akun manual Anda.'
              }
            </p>
          </div>

          ${
            mode === 'forgot'
              ? ''
              : `<button type="button" class="btn btn-3d btn-google btn-full" id="btn-google-login">
                  ${GOOGLE_G_SVG}
                  <span>Login dengan Gmail / Google</span>
                </button>

                <div class="auth-divider"><span>atau gunakan username &amp; email</span></div>

                <div class="segmented auth-mode-tabs" role="tablist" aria-label="Pilihan autentikasi">
                  <button type="button" class="seg-btn ${mode === 'login' ? 'is-active' : ''}" data-auth-mode="login">Masuk</button>
                  <button type="button" class="seg-btn ${mode === 'register' ? 'is-active' : ''}" data-auth-mode="register">Daftar Akun Baru</button>
                </div>`
          }

          <div id="auth-error-box" class="auth-error" role="alert" hidden></div>

          ${
            mode === 'login'
              ? `<form class="auth-form" id="manual-login-form">
                  <div class="control-group">
                    <label class="control-label" for="login-identifier">Username atau Email</label>
                    <input
                      id="login-identifier"
                      class="field-input"
                      type="text"
                      value="${escapeHtml(remembered.identifier)}"
                      required
                      autocomplete="username"
                      placeholder="nama@gmail.com atau username"
                    />
                  </div>
                  <div class="control-group">
                    <label class="control-label" for="login-password">Password</label>
                    <div class="password-wrap">
                      <input
                        id="login-password"
                        class="field-input"
                        type="password"
                        required
                        autocomplete="current-password"
                        placeholder="Masukkan password"
                      />
                      <button type="button" class="btn-toggle-pw" id="toggle-login-pw">Lihat</button>
                    </div>
                  </div>
                  <div class="auth-row-between">
                    <label class="checkbox-row">
                      <input type="checkbox" id="login-remember" ${remembered.remember ? 'checked' : ''} />
                      <span>Ingat Saya</span>
                    </label>
                    <button type="button" class="link-btn" id="btn-go-forgot">Lupa Password?</button>
                  </div>
                  <button type="submit" class="btn btn-3d btn-primary btn-full" id="btn-manual-submit">Masuk Sekarang</button>
                </form>`
              : mode === 'register'
                ? `<form class="auth-form" id="register-form">
                    <div class="control-group">
                      <label class="control-label" for="reg-username">Username / Nama Tampilan</label>
                      <input id="reg-username" class="field-input" type="text" minlength="2" maxlength="24" required placeholder="Contoh: RakaEksplorer" />
                    </div>
                    <div class="control-group">
                      <label class="control-label" for="reg-email">Email Aktif</label>
                      <input id="reg-email" class="field-input" type="email" required placeholder="email@sekolah.sch.id / gmail.com" />
                    </div>
                    <div class="control-group">
                      <label class="control-label" for="reg-password">Password (min. 6 karakter)</label>
                      <div class="password-wrap">
                        <input id="reg-password" class="field-input" type="password" minlength="6" required placeholder="Minimal 6 karakter" />
                        <button type="button" class="btn-toggle-pw" id="toggle-reg-pw">Lihat</button>
                      </div>
                    </div>
                    <div class="admin-opts-grid">
                      <div class="control-group">
                        <label class="control-label" for="reg-role">Peran Akun</label>
                        <select id="reg-role" class="field-select">
                          <option value="student" ${registerRole === 'student' ? 'selected' : ''}>Siswa</option>
                          <option value="teacher" ${registerRole === 'teacher' ? 'selected' : ''}>Guru / Pengajar</option>
                        </select>
                      </div>
                      <div class="control-group">
                        <label class="control-label" for="reg-band">Jenjang</label>
                        <select id="reg-band" class="field-select">
                          <option value="SMP" ${registerBand === 'SMP' ? 'selected' : ''}>SMP (Kelas 7–9)</option>
                          <option value="SMA" ${registerBand === 'SMA' ? 'selected' : ''}>SMA (Kelas 10–12)</option>
                        </select>
                      </div>
                    </div>
                    <div class="control-group">
                      <label class="control-label" for="reg-school">Nama Sekolah (opsional)</label>
                      <input id="reg-school" class="field-input" type="text" maxlength="80" placeholder="Contoh: SMA Negeri 1 Nusantara" />
                    </div>
                    <button type="submit" class="btn btn-3d btn-primary btn-full">Buat Akun &amp; Kirim Verifikasi</button>
                  </form>`
                : `<form class="auth-form" id="forgot-form">
                    <div class="control-group">
                      <label class="control-label" for="forgot-email">Email Terdaftar</label>
                      <input id="forgot-email" class="field-input" type="email" required placeholder="Masukkan email akun Anda" />
                    </div>
                    <button type="submit" class="btn btn-3d btn-primary btn-full">Kirim Tautan Reset Password</button>
                    <button type="button" class="btn btn-ghost btn-full" id="btn-back-login">Kembali ke Form Masuk</button>
                  </form>`
          }
        </div>
      </section>
    `;

    startOrbitCanvas();

    const errorBox = container.querySelector('#auth-error-box');
    const showError = (msg) => {
      if (!errorBox) return;
      errorBox.textContent = msg;
      errorBox.removeAttribute('hidden');
    };

    const googleBtn = /** @type {HTMLButtonElement | null} */ (container.querySelector('#btn-google-login'));
    googleBtn?.addEventListener('click', async () => {
      const rememberCheck = /** @type {HTMLInputElement | null} */ (container.querySelector('#login-remember'));
      const remember = rememberCheck ? rememberCheck.checked : true;
      googleBtn.disabled = true;
      try {
        const user = await signInWithGoogle(remember);
        showToast(`Selamat datang, ${user.displayName || user.email}!`, 'success');
      } catch (err) {
        showError(err.message);
        googleBtn.disabled = false;
      }
    });

    container.querySelectorAll('[data-auth-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.getAttribute('data-auth-mode') || 'login';
        renderMainAuth();
      });
    });

    container.querySelector('#btn-go-forgot')?.addEventListener('click', () => {
      mode = 'forgot';
      renderMainAuth();
    });

    container.querySelector('#btn-back-login')?.addEventListener('click', () => {
      mode = 'login';
      renderMainAuth();
    });

    const wirePwToggle = (btnId, inputId) => {
      const btn = container.querySelector(btnId);
      const input = /** @type {HTMLInputElement | null} */ (container.querySelector(inputId));
      btn?.addEventListener('click', () => {
        if (!input) return;
        const isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        btn.textContent = isPw ? 'Tutup' : 'Lihat';
      });
    };
    wirePwToggle('#toggle-login-pw', '#login-password');
    wirePwToggle('#toggle-reg-pw', '#reg-password');

    container.querySelector('#manual-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = /** @type {HTMLButtonElement | null} */ (container.querySelector('#btn-manual-submit'));
      const identifier = /** @type {HTMLInputElement} */ (container.querySelector('#login-identifier')).value;
      const password = /** @type {HTMLInputElement} */ (container.querySelector('#login-password')).value;
      const remember = /** @type {HTMLInputElement} */ (container.querySelector('#login-remember')).checked;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';
      }
      try {
        const user = await signInManual({ identifier, password, rememberMe: remember });
        showToast(`Selamat datang kembali, ${user.displayName || user.email}!`, 'success');
      } catch (err) {
        showError(err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Masuk Sekarang';
        }
      }
    });

    container.querySelector('#register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formEl = /** @type {HTMLFormElement} */ (e.currentTarget);
      const submitBtn = /** @type {HTMLButtonElement | null} */ (formEl.querySelector('button[type="submit"]'));
      const username = /** @type {HTMLInputElement} */ (container.querySelector('#reg-username')).value;
      const email = /** @type {HTMLInputElement} */ (container.querySelector('#reg-email')).value;
      const password = /** @type {HTMLInputElement} */ (container.querySelector('#reg-password')).value;
      registerRole = /** @type {HTMLSelectElement} */ (container.querySelector('#reg-role')).value;
      registerBand = /** @type {HTMLSelectElement} */ (container.querySelector('#reg-band')).value;
      const schoolName = /** @type {HTMLInputElement} */ (container.querySelector('#reg-school')).value;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mendaftarkan Akun...';
      }
      try {
        await registerWithEmail({
          username,
          email,
          password,
          accountType: registerRole,
          gradeBand: registerBand,
          schoolName,
        });
        showToast('Akun dibuat! Periksa email untuk verifikasi.', 'info');
      } catch (err) {
        showError(err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Buat Akun & Kirim Verifikasi';
        }
      }
    });

    container.querySelector('#forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formEl = /** @type {HTMLFormElement} */ (e.currentTarget);
      const submitBtn = /** @type {HTMLButtonElement | null} */ (formEl.querySelector('button[type="submit"]'));
      const email = /** @type {HTMLInputElement} */ (container.querySelector('#forgot-email')).value;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
      }
      try {
        await requestPasswordReset(email);
        showToast('Tautan reset password telah dikirim ke email Anda.', 'success');
        mode = 'login';
        renderMainAuth();
      } catch (err) {
        showError(err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Kirim Tautan Reset Password';
        }
      }
    });
  }

  renderMainAuth();
  return stopAnim;
}
