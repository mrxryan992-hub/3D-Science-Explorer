import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  OperationType,
  applyAuthPersistence,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase/client.js';

const BOOTSTRAP_ADMIN_EMAIL = 'ryanmuhammad992@gmail.com';
const REMEMBER_PREF_KEY = '3dse_remember_pref';
const USERNAME_ALIAS_MAP_KEY = '3dse_username_aliases';
const PENDING_PROFILE_KEY = '3dse_pending_profile';

let authReady = false;
let currentUser = null;
const authListeners = new Set();

function notifyAuth() {
  authListeners.forEach((fn) => fn({ authReady, user: currentUser }));
}

export function normalizeUsernameKey(raw) {
  return String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 24);
}

// Pure-JS SHA-256 fallback when crypto.subtle is unavailable (non-HTTPS contexts)
function sha256FallbackHex(input) {
  const utf8 = unescape(encodeURIComponent(input));
  const bytes = [];
  for (let i = 0; i < utf8.length; i += 1) {
    bytes.push(utf8.charCodeAt(i));
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }
  for (let i = 7; i >= 0; i -= 1) {
    bytes.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 0xff);
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const rotr = (n, x) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const W = new Array(64);
    for (let i = 0; i < 16; i += 1) {
      const idx = offset + i * 4;
      W[i] = ((bytes[idx] << 24) | (bytes[idx + 1] << 16) | (bytes[idx + 2] << 8) | bytes[idx + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = (rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10)) >>> 0;
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i += 1) {
      const S1 = (rotr(6, e) ^ rotr(11, e) ^ rotr(25, e)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = (rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return H.map((v) => v.toString(16).padStart(8, '0')).join('');
}

async function hashUsernameKey(usernameLower) {
  if (globalThis.crypto?.subtle) {
    try {
      const data = new TextEncoder().encode(usernameLower);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return sha256FallbackHex(usernameLower);
    }
  }
  return sha256FallbackHex(usernameLower);
}

function readUsernameAliases() {
  try {
    const raw = localStorage.getItem(USERNAME_ALIAS_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsernameAlias(username, email) {
  const key = normalizeUsernameKey(username);
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!key || !cleanEmail) return;
  try {
    const map = readUsernameAliases();
    map[key] = cleanEmail;
    localStorage.setItem(USERNAME_ALIAS_MAP_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export async function syncUsernameMapping(username, email, uid, allowBeforeVerify = false) {
  const normKey = normalizeUsernameKey(username);
  const cleanEmail = String(email || '').trim();
  if (normKey.length < 2 || !cleanEmail || !uid) return;

  saveUsernameAlias(normKey, cleanEmail);

  const fbUser = auth.currentUser;
  if (!fbUser || fbUser.uid !== uid) return;
  if (!allowBeforeVerify && !fbUser.emailVerified) return;

  try {
    const hash = await hashUsernameKey(normKey);
    const ref = doc(db, 'usernames', hash);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        usernameLower: normKey,
        email: fbUser.email || cleanEmail,
        updatedAt: serverTimestamp(),
      });
    } else if (snap.data()?.uid === uid && fbUser.emailVerified) {
      await setDoc(ref, {
        uid,
        usernameLower: normKey,
        email: fbUser.email || cleanEmail,
        updatedAt: serverTimestamp(),
      });
    }
  } catch {
    // Non-fatal: local alias cache still works on this device
  }
}

async function resolveEmailByUsername(usernameInput) {
  const normKey = normalizeUsernameKey(usernameInput);
  if (normKey.length < 2) return '';

  const aliasMap = readUsernameAliases();
  if (aliasMap[normKey]) {
    return aliasMap[normKey];
  }

  try {
    const hash = await hashUsernameKey(normKey);
    const snap = await getDoc(doc(db, 'usernames', hash));
    if (snap.exists() && snap.data()?.email) {
      const resolved = String(snap.data().email).trim();
      saveUsernameAlias(normKey, resolved);
      return resolved;
    }
  } catch {
    // Fall through to helpful user prompt
  }

  return '';
}

export function getRememberedLogin() {
  try {
    const raw = localStorage.getItem(REMEMBER_PREF_KEY);
    if (!raw) return { remember: true, identifier: '' };
    const parsed = JSON.parse(raw);
    return {
      remember: Boolean(parsed?.remember),
      identifier: typeof parsed?.identifier === 'string' ? parsed.identifier : '',
    };
  } catch {
    return { remember: true, identifier: '' };
  }
}

function saveRememberedLogin(remember, identifier) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_PREF_KEY, JSON.stringify({ remember: true, identifier: identifier || '' }));
    } else {
      localStorage.removeItem(REMEMBER_PREF_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function consumePendingRegistrationProfile() {
  try {
    const raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_PROFILE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthReady() {
  return authReady;
}

export function getAuthUser() {
  return currentUser;
}

export function isAuthenticated() {
  return Boolean(authReady && currentUser);
}

export function isVerifiedSession() {
  return Boolean(authReady && currentUser && currentUser.emailVerified);
}

export function isAdmin() {
  return Boolean(currentUser?.isAdmin);
}

export function subscribeAuth(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

async function resolveAdminStatus(fbUser) {
  if (!fbUser || !fbUser.emailVerified) return false;
  if (fbUser.email === BOOTSTRAP_ADMIN_EMAIL) {
    return true;
  }
  const path = `admins/${fbUser.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', fbUser.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return false;
  }
}

async function syncAuthState(fbUser) {
  if (!fbUser) {
    currentUser = null;
    authReady = true;
    notifyAuth();
    return;
  }

  let adminFlag = false;
  if (fbUser.emailVerified) {
    try {
      adminFlag = await resolveAdminStatus(fbUser);
    } catch {
      adminFlag = fbUser.email === BOOTSTRAP_ADMIN_EMAIL && fbUser.emailVerified;
    }
  }

  currentUser = {
    uid: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || 'Pelajar',
    photoURL: fbUser.photoURL || '',
    emailVerified: Boolean(fbUser.emailVerified),
    isAdmin: adminFlag,
  };
  authReady = true;
  notifyAuth();
}

onAuthStateChanged(auth, (fbUser) => {
  syncAuthState(fbUser);
});

function formatAuthError(error, fallback) {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Jendela login Google ditutup sebelum selesai.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup login diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Login Email/Password belum diaktifkan di Firebase Console proyek ini. Aktifkan provider Email/Password di Authentication -> Sign-in method, atau gunakan Login Google.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Email/Username atau password tidak sesuai.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan menu Lupa Password.';
  }
  if (code === 'auth/weak-password') {
    return 'Password minimal 6 karakter.';
  }
  if (code === 'auth/invalid-email') {
    return 'Format email tidak valid. Masukkan alamat email aktif Anda.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  }
  return error?.message || fallback;
}

export async function signInWithGoogle(rememberMe = true) {
  try {
    await applyAuthPersistence(rememberMe);
    const credential = await signInWithPopup(auth, googleProvider);
    saveRememberedLogin(rememberMe, credential.user.email || '');
    if (credential.user.displayName && credential.user.email) {
      await syncUsernameMapping(credential.user.displayName, credential.user.email, credential.user.uid);
    }
    return credential.user;
  } catch (error) {
    throw new Error(formatAuthError(error, 'Gagal masuk dengan akun Google.'));
  }
}

export async function signInManual({ identifier, password, rememberMe = true }) {
  const cleanIdentifier = String(identifier || '').trim();
  if (!cleanIdentifier || !password) {
    throw new Error('Masukkan Email/Username dan Password terlebih dahulu.');
  }

  let resolvedEmail = cleanIdentifier;
  if (!cleanIdentifier.includes('@')) {
    const mapped = await resolveEmailByUsername(cleanIdentifier);
    if (!mapped) {
      throw new Error(
        'Username belum ditemukan di database. Pastikan ejaan benar, atau masuk 1 kali memakai alamat email terdaftar agar username tersinkron otomatis.'
      );
    }
    resolvedEmail = mapped;
  }

  try {
    await applyAuthPersistence(rememberMe);
    const credential = await signInWithEmailAndPassword(auth, resolvedEmail, password);
    saveRememberedLogin(rememberMe, cleanIdentifier);
    if (!cleanIdentifier.includes('@')) {
      saveUsernameAlias(cleanIdentifier, credential.user.email || resolvedEmail);
    }
    if (credential.user.displayName) {
      await syncUsernameMapping(
        credential.user.displayName,
        credential.user.email || resolvedEmail,
        credential.user.uid,
        true
      );
    }
    return credential.user;
  } catch (error) {
    throw new Error(formatAuthError(error, 'Gagal masuk dengan email dan password.'));
  }
}

export async function registerWithEmail({
  username,
  email,
  password,
  accountType = 'student',
  gradeBand = 'SMP',
  schoolName = '',
}) {
  const cleanName = String(username || '').trim().slice(0, 24);
  const normKey = normalizeUsernameKey(cleanName);
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (normKey.length < 2) {
    throw new Error('Username minimal 2 karakter.');
  }
  if (!cleanEmail.includes('@')) {
    throw new Error('Masukkan alamat email yang valid.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  try {
    const hash = await hashUsernameKey(normKey);
    const existingSnap = await getDoc(doc(db, 'usernames', hash)).catch(() => null);
    if (existingSnap && existingSnap.exists()) {
      throw new Error('Username ini sudah terdaftar. Pilih username lain atau masuk dengan email Anda.');
    }

    await applyAuthPersistence(true);
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(credential.user, { displayName: cleanName });
    saveUsernameAlias(cleanName, credential.user.email || cleanEmail);
    saveRememberedLogin(true, cleanName);

    try {
      sessionStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          name: cleanName,
          accountType: accountType === 'teacher' ? 'teacher' : 'student',
          gradeBand: gradeBand === 'SMA' ? 'SMA' : 'SMP',
          schoolName: String(schoolName || '').trim().slice(0, 80),
        })
      );
    } catch {
      // Ignore sessionStorage errors
    }

    await syncUsernameMapping(cleanName, credential.user.email || cleanEmail, credential.user.uid, true);
    await sendEmailVerification(credential.user);
    await syncAuthState(credential.user);
    return credential.user;
  } catch (error) {
    throw new Error(formatAuthError(error, 'Gagal mendaftarkan akun baru.'));
  }
}

export async function requestPasswordReset(email) {
  const cleanIdentifier = String(email || '').trim();
  let cleanEmail = cleanIdentifier.toLowerCase();
  if (!cleanEmail.includes('@')) {
    const mapped = await resolveEmailByUsername(cleanIdentifier);
    if (!mapped) {
      throw new Error('Masukkan alamat email terdaftar untuk menerima tautan reset password.');
    }
    cleanEmail = mapped.toLowerCase();
  }
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error) {
    throw new Error(formatAuthError(error, 'Gagal mengirim email reset password.'));
  }
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error('Tidak ada sesi aktif.');
  try {
    await sendEmailVerification(auth.currentUser);
  } catch (error) {
    throw new Error(formatAuthError(error, 'Gagal mengirim ulang email verifikasi.'));
  }
}

export async function refreshVerificationStatus() {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  if (auth.currentUser.emailVerified && auth.currentUser.displayName && auth.currentUser.email) {
    await syncUsernameMapping(auth.currentUser.displayName, auth.currentUser.email, auth.currentUser.uid);
  }
  await syncAuthState(auth.currentUser);
  return Boolean(auth.currentUser?.emailVerified);
}

export async function logoutUser() {
  await signOut(auth);
}
