import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  BADGES,
  CATEGORIES,
  DEFAULT_AVATAR,
  MATERIALS,
  MATERIAL_BY_ID,
  QUESTIONS,
} from '../data/scienceData.js';
import { OperationType, db, handleFirestoreError } from '../firebase/client.js';
import { getTodayKey } from '../utils/dom.js';
import { consumePendingRegistrationProfile, getAuthUser, syncUsernameMapping } from './auth.js';

const STORAGE_KEY = '3dse_v2';
const XP_PER_LEVEL = 50;

let serverAnnouncement = '';
let maintenanceState = { enabled: false, text: '' };
let customQuestions = [];
let leaderboardEntries = [];
let joinedClasses = [];
let studentAssignments = [];
let unsubExtras = [];

function createDefaultState(defaultName = 'Pelajar') {
  return {
    name: defaultName,
    accountType: 'student',
    gradeBand: 'SMP',
    schoolName: '',
    avatarConfig: { ...DEFAULT_AVATAR },
    xp: 0,
    weeklyXp: 0,
    dailyXp: 0,
    lastDayKey: getTodayKey(),
    pts: 0,
    badges: [],
    read: {},
    quiz: {},
    daily: {},
    sims: {},
    wrong: 0,
  };
}

function sanitizeAvatar(raw) {
  const cfg = raw && typeof raw === 'object' ? raw : {};
  return {
    suitColor: String(cfg.suitColor || DEFAULT_AVATAR.suitColor).slice(0, 24),
    hairStyle: String(cfg.hairStyle || DEFAULT_AVATAR.hairStyle).slice(0, 24),
    visor: String(cfg.visor || DEFAULT_AVATAR.visor).slice(0, 24),
    accessory: String(cfg.accessory || DEFAULT_AVATAR.accessory).slice(0, 24),
    skinTone: String(cfg.skinTone || DEFAULT_AVATAR.skinTone).slice(0, 24),
  };
}

function loadLocalFallback() {
  const defaults = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    const today = getTodayKey();
    const sameDay = parsed.lastDayKey === today;
    return {
      ...defaults,
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim().slice(0, 24) : 'Pelajar',
      accountType: parsed.accountType === 'teacher' ? 'teacher' : 'student',
      gradeBand: parsed.gradeBand === 'SMA' ? 'SMA' : 'SMP',
      schoolName: typeof parsed.schoolName === 'string' ? parsed.schoolName.slice(0, 80) : '',
      avatarConfig: sanitizeAvatar(parsed.avatarConfig),
      xp: Number.isFinite(parsed.xp) && parsed.xp >= 0 ? parsed.xp : 0,
      weeklyXp: Number.isFinite(parsed.weeklyXp) && parsed.weeklyXp >= 0 ? parsed.weeklyXp : 0,
      dailyXp: sameDay && Number.isFinite(parsed.dailyXp) && parsed.dailyXp >= 0 ? parsed.dailyXp : 0,
      lastDayKey: today,
      pts: Number.isFinite(parsed.pts) && parsed.pts >= 0 ? parsed.pts : 0,
      badges: Array.isArray(parsed.badges) ? parsed.badges.slice(0, 8) : [],
      read: parsed.read && typeof parsed.read === 'object' ? parsed.read : {},
      quiz: parsed.quiz && typeof parsed.quiz === 'object' ? parsed.quiz : {},
      daily: parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : {},
      sims: parsed.sims && typeof parsed.sims === 'object' ? parsed.sims : {},
      wrong: Number.isFinite(parsed.wrong) && parsed.wrong >= 0 ? parsed.wrong : 0,
    };
  } catch {
    return defaults;
  }
}

let state = loadLocalFallback();
const listeners = new Set();

function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

function clampString(val, maxLen, fallback = '') {
  const s = String(val || '').trim();
  return (s || fallback).slice(0, maxLen);
}

async function syncClassMemberships(user, cleanName) {
  if (!user || joinedClasses.length === 0) return;
  const completedMaterials = Object.keys(state.read).length;
  const completedQuizzes = Object.keys(state.quiz).length;

  for (const membership of joinedClasses) {
    const memberDocId = `${membership.classId}_${user.uid}`;
    const path = `classMembers/${memberDocId}`;
    try {
      await setDoc(
        doc(db, 'classMembers', memberDocId),
        {
          classId: membership.classId,
          teacherUid: membership.teacherUid,
          studentUid: user.uid,
          studentName: cleanName,
          gradeBand: state.gradeBand,
          xp: Math.max(0, Math.min(1000000, Math.floor(state.xp))),
          pts: Math.max(0, Math.min(1000000, Math.floor(state.pts))),
          completedMaterials: Math.min(100, completedMaterials),
          completedQuizzes: Math.min(250, completedQuizzes),
          wrongAttempts: Math.max(0, Math.min(1000000, Math.floor(state.wrong))),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

async function persistToFirestore() {
  const user = getAuthUser();
  if (!user || !user.emailVerified) return;

  const cleanName = clampString(state.name, 24, clampString(user.displayName, 24, 'Pelajar'));
  const level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
  const cleanAvatar = sanitizeAvatar(state.avatarConfig);

  const userPath = `users/${user.uid}`;
  const lbPath = `leaderboard/${user.uid}`;

  const userPayload = {
    uid: user.uid,
    name: cleanName,
    accountType: state.accountType === 'teacher' ? 'teacher' : 'student',
    gradeBand: state.gradeBand === 'SMA' ? 'SMA' : 'SMP',
    schoolName: clampString(state.schoolName, 80, ''),
    avatarConfig: cleanAvatar,
    xp: Math.max(0, Math.min(1000000, Math.floor(state.xp))),
    pts: Math.max(0, Math.min(1000000, Math.floor(state.pts))),
    wrong: Math.max(0, Math.min(1000000, Math.floor(state.wrong))),
    badges: Array.isArray(state.badges) ? state.badges.slice(0, 8) : [],
    read: state.read || {},
    quiz: state.quiz || {},
    daily: state.daily || {},
    sims: state.sims || {},
    updatedAt: serverTimestamp(),
  };

  const lbPayload = {
    uid: user.uid,
    name: cleanName,
    accountType: userPayload.accountType,
    gradeBand: userPayload.gradeBand,
    avatarConfig: cleanAvatar,
    xp: userPayload.xp,
    weeklyXp: Math.max(0, Math.min(1000000, Math.floor(state.weeklyXp || userPayload.xp))),
    dailyXp: Math.max(0, Math.min(1000000, Math.floor(state.dailyXp || 0))),
    level,
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), userPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  try {
    await setDoc(doc(db, 'leaderboard', user.uid), lbPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, lbPath);
  }

  await syncClassMemberships(user, cleanName).catch(() => {});
}

export function stopUserSync() {
  unsubExtras.forEach((fn) => fn());
  unsubExtras = [];
  serverAnnouncement = '';
  maintenanceState = { enabled: false, text: '' };
  customQuestions = [];
  leaderboardEntries = [];
  joinedClasses = [];
  studentAssignments = [];
}

export async function startUserSync(user) {
  stopUserSync();
  if (!user || !user.emailVerified) return;

  const pendingProfile = consumePendingRegistrationProfile();
  const userPath = `users/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      state = {
        ...createDefaultState(),
        name: clampString(data.name, 24, clampString(user.displayName, 24, 'Pelajar')),
        accountType: data.accountType === 'teacher' ? 'teacher' : 'student',
        gradeBand: data.gradeBand === 'SMA' ? 'SMA' : 'SMP',
        schoolName: typeof data.schoolName === 'string' ? data.schoolName.slice(0, 80) : '',
        avatarConfig: sanitizeAvatar(data.avatarConfig),
        xp: Number.isFinite(data.xp) ? data.xp : 0,
        weeklyXp: Number.isFinite(data.xp) ? data.xp : 0,
        dailyXp: 0,
        lastDayKey: getTodayKey(),
        pts: Number.isFinite(data.pts) ? data.pts : 0,
        wrong: Number.isFinite(data.wrong) ? data.wrong : 0,
        badges: Array.isArray(data.badges) ? data.badges.slice(0, 8) : [],
        read: data.read && typeof data.read === 'object' ? data.read : {},
        quiz: data.quiz && typeof data.quiz === 'object' ? data.quiz : {},
        daily: data.daily && typeof data.daily === 'object' ? data.daily : {},
        sims: data.sims && typeof data.sims === 'object' ? data.sims : {},
      };
      persistLocal();
    } else {
      const fallbackName = clampString(pendingProfile?.name || user.displayName, 24, 'Pelajar');
      state = {
        ...createDefaultState(fallbackName),
        accountType: pendingProfile?.accountType === 'teacher' ? 'teacher' : 'student',
        gradeBand: pendingProfile?.gradeBand === 'SMA' ? 'SMA' : 'SMP',
        schoolName: pendingProfile?.schoolName || '',
      };
      persistLocal();
      await persistToFirestore();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (user.email) {
    syncUsernameMapping(state.name, user.email, user.uid).catch(() => {});
    if (user.displayName && user.displayName !== state.name) {
      syncUsernameMapping(user.displayName, user.email, user.uid).catch(() => {});
    }
  }

  // Subscribe to laboratory announcement
  const announcePath = 'settings/announcement';
  const unsubAnnounce = onSnapshot(
    doc(db, 'settings', 'announcement'),
    (snap) => {
      serverAnnouncement = snap.exists() ? String(snap.data().text || '') : '';
      notify();
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, announcePath);
    }
  );

  // Subscribe to system maintenance notice
  const maintPath = 'settings/maintenance';
  const unsubMaint = onSnapshot(
    doc(db, 'settings', 'maintenance'),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        maintenanceState = { enabled: Boolean(d.enabled), text: String(d.text || '') };
      } else {
        maintenanceState = { enabled: false, text: '' };
      }
      notify();
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, maintPath);
    }
  );

  // Subscribe to custom questions created by Teachers/Admins
  const qPath = 'customQuestions';
  const unsubQuestions = onSnapshot(
    query(collection(db, 'customQuestions'), where('points', '==', 10)),
    (snapshot) => {
      customQuestions = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      notify();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, qPath);
    }
  );

  // Subscribe to public non-PII leaderboard
  const lbPath = 'leaderboard';
  const unsubLb = onSnapshot(
    query(collection(db, 'leaderboard'), where('isPublic', '==', true)),
    (snapshot) => {
      leaderboardEntries = snapshot.docs
        .map((d) => d.data())
        .sort((a, b) => (b.xp || 0) - (a.xp || 0));
      notify();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, lbPath);
    }
  );

  // Subscribe to classes joined by this student
  const memberPath = 'classMembers';
  const unsubMembers = onSnapshot(
    query(collection(db, 'classMembers'), where('studentUid', '==', user.uid)),
    async (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const enriched = [];
      for (const row of rows) {
        try {
          const cSnap = await getDoc(doc(db, 'classes', row.classId));
          if (cSnap.exists()) {
            enriched.push({ ...row, classInfo: { id: cSnap.id, ...cSnap.data() } });
          }
        } catch {
          // Ignore deleted classes
        }
      }
      joinedClasses = enriched;
      notify();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, memberPath);
    }
  );

  // Subscribe to assignments matching SMP/SMA
  const assignPath = 'assignments';
  const unsubAssign = onSnapshot(
    query(collection(db, 'assignments'), where('gradeBand', 'in', ['SMP', 'SMA'])),
    (snapshot) => {
      studentAssignments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      notify();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, assignPath);
    }
  );

  unsubExtras.push(unsubAnnounce, unsubMaint, unsubQuestions, unsubLb, unsubMembers, unsubAssign);
  notify();
}

function evaluateBadges() {
  const unlocked = [];
  for (const badge of BADGES) {
    if (!state.badges.includes(badge.id) && badge.check(state)) {
      state.badges.push(badge.id);
      unlocked.push(badge);
    }
  }
  return unlocked;
}

function addXp(amount) {
  const today = getTodayKey();
  if (state.lastDayKey !== today) {
    state.dailyXp = 0;
    state.lastDayKey = today;
  }
  if (amount <= 0) return { leveledUp: false, newLevel: getLevelInfo().level };
  const prevLevel = getLevelInfo().level;
  state.xp += amount;
  state.weeklyXp = (state.weeklyXp || 0) + amount;
  state.dailyXp = (state.dailyXp || 0) + amount;
  const nextLevel = getLevelInfo().level;
  return {
    leveledUp: nextLevel > prevLevel,
    newLevel: nextLevel,
  };
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAnnouncement() {
  return serverAnnouncement;
}

export function getMaintenanceState() {
  return maintenanceState;
}

export function getLeaderboardEntries() {
  return leaderboardEntries;
}

export function getJoinedClasses() {
  return joinedClasses;
}

export function getStudentAssignments() {
  const classIds = new Set(joinedClasses.map((c) => c.classId));
  return studentAssignments.filter((a) => classIds.has(a.classId));
}

export function getAllQuestions() {
  return [...QUESTIONS, ...customQuestions];
}

export function getLevelInfo() {
  const level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
  const xpInLevel = state.xp % XP_PER_LEVEL;
  const percent = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  return {
    level,
    xpInLevel,
    xpToNext: XP_PER_LEVEL - xpInLevel,
    xpPerLevel: XP_PER_LEVEL,
    percent,
  };
}

export function getCategoryProgress(categoryKey, gradeBandFilter = null) {
  const mats = MATERIALS.filter(
    (m) => m.category === categoryKey && (!gradeBandFilter || m.gradeBand === gradeBandFilter)
  );
  const qs = QUESTIONS.filter(
    (q) =>
      MATERIAL_BY_ID[q.materialId].category === categoryKey &&
      (!gradeBandFilter || q.gradeBand === gradeBandFilter)
  );
  const total = mats.length + qs.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed =
    mats.filter((m) => Boolean(state.read[m.id])).length +
    qs.filter((q) => Boolean(state.quiz[q.id])).length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

export function getAllCategoriesProgress(gradeBandFilter = null) {
  return Object.keys(CATEGORIES).map((key) => ({
    ...CATEGORIES[key],
    ...getCategoryProgress(key, gradeBandFilter),
  }));
}

export function getDailyQuestion() {
  const today = getTodayKey();
  const bandPool = QUESTIONS.filter((q) => q.gradeBand === state.gradeBand);
  const source = bandPool.length > 0 ? bandPool : QUESTIONS;
  const hash = [...today].reduce((acc, ch) => acc + ch.charCodeAt(0) * 7, 0);
  return source[hash % source.length];
}

export function isDailyCompleted() {
  return Boolean(state.daily[getTodayKey()]);
}

export function setExplorerName(rawName) {
  state.name = clampString(rawName, 24, 'Pelajar');
  persistLocal();
  persistToFirestore().catch(() => {});
  const user = getAuthUser();
  if (user?.email && user?.emailVerified) {
    syncUsernameMapping(state.name, user.email, user.uid).catch(() => {});
  }
  notify();
  return state.name;
}

export function setGradeBand(band) {
  state.gradeBand = band === 'SMA' ? 'SMA' : 'SMP';
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();
  return state.gradeBand;
}

export function setAccountType(type) {
  state.accountType = type === 'teacher' ? 'teacher' : 'student';
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();
  return state.accountType;
}

export function setSchoolName(rawSchool) {
  state.schoolName = clampString(rawSchool, 80, '');
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();
  return state.schoolName;
}

export function setAvatarConfig(partialCfg) {
  state.avatarConfig = sanitizeAvatar({ ...state.avatarConfig, ...partialCfg });
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();
  return state.avatarConfig;
}

export async function joinClassByCode(rawCode) {
  const user = getAuthUser();
  if (!user || !user.emailVerified) throw new Error('Anda harus masuk dengan email terverifikasi.');
  const code = String(rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (code.length < 4 || code.length > 12) {
    throw new Error('Kode kelas harus 4–12 karakter huruf/angka.');
  }

  let matchedClass = null;
  try {
    const snap = await getDocs(query(collection(db, 'classes'), where('gradeBand', 'in', ['SMP', 'SMA'])));
    const found = snap.docs.find((docSnap) => String(docSnap.data().code || '').toUpperCase() === code);
    if (found) {
      matchedClass = { id: found.id, ...found.data() };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'classes');
  }

  if (!matchedClass) {
    throw new Error(`Kelas dengan kode "${code}" tidak ditemukan.`);
  }

  const memberDocId = `${matchedClass.id}_${user.uid}`;
  const memberPath = `classMembers/${memberDocId}`;
  try {
    await setDoc(doc(db, 'classMembers', memberDocId), {
      classId: matchedClass.id,
      teacherUid: matchedClass.teacherUid,
      studentUid: user.uid,
      studentName: clampString(state.name, 24, 'Pelajar'),
      gradeBand: state.gradeBand,
      xp: Math.max(0, Math.min(1000000, Math.floor(state.xp))),
      pts: Math.max(0, Math.min(1000000, Math.floor(state.pts))),
      completedMaterials: Math.min(100, Object.keys(state.read).length),
      completedQuizzes: Math.min(250, Object.keys(state.quiz).length),
      wrongAttempts: Math.max(0, Math.min(1000000, Math.floor(state.wrong))),
      updatedAt: serverTimestamp(),
    });
    return matchedClass;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, memberPath);
    return null;
  }
}

export async function leaveClass(memberDocId) {
  const path = `classMembers/${memberDocId}`;
  try {
    await deleteDoc(doc(db, 'classMembers', memberDocId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function markMaterialRead(materialId) {
  if (state.read[materialId]) {
    return { alreadyRead: true, xpGained: 0, leveledUp: false, unlockedBadges: [] };
  }
  state.read[materialId] = getTodayKey();
  const levelResult = addXp(10);
  const unlockedBadges = evaluateBadges();
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();
  return {
    alreadyRead: false,
    xpGained: 10,
    ...levelResult,
    unlockedBadges,
  };
}

export function submitQuizAnswer(questionId, selectedIndex, isDaily) {
  const question = getAllQuestions().find((q) => String(q.id) === String(questionId));
  if (!question) return null;

  const isCorrect = selectedIndex === question.answerIndex;
  let xpGained = 0;
  let pointsGained = 0;
  let dailyBonus = false;
  let alreadyClaimed = false;

  if (isCorrect) {
    if (!state.quiz[questionId]) {
      state.quiz[questionId] = 1;
      state.pts += question.points;
      pointsGained = question.points;
      xpGained += question.points;
    } else {
      alreadyClaimed = true;
    }

    const today = getTodayKey();
    if (isDaily && !state.daily[today]) {
      state.daily[today] = 1;
      xpGained += 20;
      dailyBonus = true;
    }
  } else {
    state.wrong += 1;
  }

  const levelResult = addXp(xpGained);
  const unlockedBadges = evaluateBadges();
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();

  return {
    isCorrect,
    xpGained,
    pointsGained,
    dailyBonus,
    alreadyClaimed,
    ...levelResult,
    unlockedBadges,
  };
}

export function markSimulationTried(simKey) {
  if (state.sims[simKey]) {
    return { unlockedBadges: [] };
  }
  state.sims[simKey] = 1;
  const unlockedBadges = evaluateBadges();
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();
  return { unlockedBadges };
}

export function resetProgress() {
  const user = getAuthUser();
  const defaultName = user ? clampString(user.displayName, 24, 'Pelajar') : 'Pelajar';
  const keptAccount = state.accountType;
  const keptGrade = state.gradeBand;
  const keptAvatar = state.avatarConfig;
  const keptSchool = state.schoolName;
  state = {
    ...createDefaultState(defaultName),
    accountType: keptAccount,
    gradeBand: keptGrade,
    avatarConfig: keptAvatar,
    schoolName: keptSchool,
  };
  persistLocal();
  persistToFirestore().catch(() => {});
  notify();
}

export function syncInitialBadges() {
  const unlocked = evaluateBadges();
  if (unlocked.length > 0) persistLocal();
  return unlocked;
}
