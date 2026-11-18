import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  getDocsFromCache,
  getFirestore,
  initializeFirestore,
  limit,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ExamTrack, MockTestResult, PersistedAppState } from './types';

const app = initializeApp(firebaseConfig);

function createFirestoreInstance() {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    try {
      return initializeFirestore(
        app,
        { experimentalForceLongPolling: true },
        firebaseConfig.firestoreDatabaseId
      );
    } catch {
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function isFirestoreOfflineError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    code === 'unavailable' ||
    code === 'firestore/unavailable' ||
    message.includes('client is offline') ||
    message.includes('failed to get document because the client is offline') ||
    message.includes('network error')
  );
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (!isFirestoreOfflineError(error)) {
      console.warn('Firestore startup check notice:', error instanceof Error ? error.message : String(error));
    }
  }
}

void testConnection();
void getRedirectResult(auth).catch(() => null);

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function formatFirebaseAuthError(error: unknown, isHindi = false): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const rawMessage = error instanceof Error ? error.message : String(error);

  switch (code) {
    case 'auth/invalid-email':
      return isHindi ? 'कृपया सही ईमेल पता दर्ज करें।' : 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return isHindi
        ? 'ईमेल या पासवर्ड गलत है। कृपया दोबारा जांचें।'
        : 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return isHindi
        ? 'यह ईमेल पहले से पंजीकृत है। कृपया Sign In करें।'
        : 'This email is already registered. Please Sign In instead.';
    case 'auth/weak-password':
      return isHindi
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
        : 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return isHindi
        ? 'बहुत अधिक प्रयास हुए। कृपया कुछ देर बाद फिर प्रयास करें।'
        : 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return isHindi
        ? 'Firebase Console में यह लॉगिन विकल्प सक्षम नहीं है। कृपया Firebase Console → Authentication → Sign-in method में इसे चालू करें।'
        : 'This sign-in method is not enabled in Firebase Console. Enable it under Authentication → Sign-in method.';
    case 'auth/popup-closed-by-user':
      return isHindi
        ? 'Google साइन-इन विंडो बंद कर दी गई थी। कृपया फिर से प्रयास करें।'
        : 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return isHindi
        ? 'पॉपअप ब्लॉक है — रीडायरेक्ट या ईमेल/पासवर्ड लॉगिन का उपयोग करें।'
        : 'Popup was blocked by browser — try Email/Password login or allow popups.';
    case 'auth/unauthorized-domain':
      return isHindi
        ? 'यह डोमेन Firebase Auth में अधिकृत नहीं है। कृपया ईमेल/पासवर्ड से साइन इन करें या Firebase Console में डोमेन जोड़ें।'
        : 'This domain is not authorized for Google popup in Firebase Console. Use Email/Password sign-in or authorize this domain.';
    case 'auth/network-request-failed':
      return isHindi
        ? 'इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया नेटवर्क जांचें।'
        : 'Network error. Check your internet connection and try again.';
    default:
      return rawMessage || (isHindi ? 'प्रमाणीकरण विफल रहा।' : 'Authentication failed.');
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code || '')
        : '';
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function registerWithEmail(
  displayName: string,
  email: string,
  password: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const cleanName = displayName.trim().slice(0, 100);
  if (cleanName) {
    await updateProfile(result.user, { displayName: cleanName });
  }
  return result.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

function clampString(value: string, minLen: number, maxLen: number, fallback: string): string {
  const cleaned = value.trim().slice(0, maxLen);
  if (cleaned.length < minLen) return fallback;
  return cleaned;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

export function computeEarnedXp(state: PersistedAppState): number {
  const challengeXp = (state.dailyChallenges ?? []).reduce(
    (sum, item) => (item.completed ? sum + item.xpReward : sum),
    0
  );
  const completedChaptersXp = Object.values(state.chapterProgress ?? {}).filter((p) => p.completed).length * 25;
  const testsXp = (state.testHistory ?? []).length * 30;
  return clampNumber(challengeXp + completedChaptersXp + testsXp, 0, 10000000);
}

export async function ensureUserProfile(user: User, state: PersistedAppState): Promise<boolean> {
  const uid = sanitizeId(user.uid);
  const profilePath = `users/${uid}`;
  const profileRef = doc(db, 'users', uid);
  const displayName = clampString(
    user.displayName || user.email?.split('@')[0] || 'Student',
    1,
    100,
    'Student'
  );
  const selectedExamTrack = clampString(state.selectedClassTrack || 'CLASS_12_BOARD', 2, 40, 'CLASS_12_BOARD');
  const xpPoints = computeEarnedXp(state);
  const studyStreakDays = clampNumber(state.studyStreakDays, 0, 10000);
  const biometricEnabled = Boolean(state.biometricLockEnabled);

  try {
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      await setDoc(profileRef, {
        uid,
        displayName,
        selectedExamTrack,
        biometricEnabled,
        studyStreakDays,
        xpPoints,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        profileRef,
        {
          uid,
          displayName,
          selectedExamTrack,
          biometricEnabled,
          studyStreakDays,
          xpPoints,
          createdAt: snap.data().createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    return true;
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      return false;
    }
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

export interface CloudStudySnapshot {
  selectedExamTrack: string;
  studyStreakDays: number;
  xpPoints: number;
  dailyGoalMinutes: number;
  totalFocusMinutes: number;
  totalMockTests: number;
  completedChapterIds: string[];
  isOffline?: boolean;
}

export async function saveMockTestResultToCloud(
  user: User,
  state: PersistedAppState,
  result: MockTestResult
): Promise<boolean> {
  const uid = sanitizeId(user.uid);
  const profileOk = await ensureUserProfile(user, state);
  if (!profileOk) return false;

  const testId = sanitizeId(result.id || `mt_${result.timestamp || Date.now()}`);
  const testPath = `users/${uid}/mockTests/${testId}`;
  const testRef = doc(db, 'users', uid, 'mockTests', testId);

  try {
    const existingSnap = await getDoc(testRef);
    if (existingSnap.exists()) return true;

    await setDoc(testRef, {
      ownerId: uid,
      testId,
      title: clampString(result.title || 'Mock Test', 1, 160, 'Mock Test'),
      track: clampString(result.track || state.selectedClassTrack || 'CLASS_12_BOARD', 2, 40, 'CLASS_12_BOARD'),
      subjectLabel: clampString(result.subjectLabel || 'Full Syllabus', 1, 60, 'Full Syllabus'),
      totalQuestions: clampNumber(result.totalQuestions || 1, 1, 500),
      attempted: clampNumber(result.attempted || 0, 0, 500),
      correct: clampNumber(result.correct || 0, 0, 500),
      incorrect: clampNumber(result.incorrect || 0, 0, 500),
      score: clampNumber(result.score || 0, -500, 2000),
      maxScore: clampNumber(result.maxScore || 1, 1, 2000),
      accuracyPercent: Math.min(100, Math.max(0, Number(result.accuracyPercent) || 0)),
      durationSeconds: clampNumber(result.durationSeconds || 0, 0, 36000),
      takenAtEpochMs: clampNumber(result.timestamp || Date.now(), 0, Number.MAX_SAFE_INTEGER),
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      return false;
    }
    handleFirestoreError(error, OperationType.WRITE, testPath);
  }
}

export async function loadCloudMockTests(user: User): Promise<MockTestResult[]> {
  const uid = sanitizeId(user.uid);
  const testsPath = `users/${uid}/mockTests`;
  const q = query(
    collection(db, 'users', uid, 'mockTests'),
    where('ownerId', '==', uid),
    limit(100)
  );
  const mapDocs = (snapshot: Awaited<ReturnType<typeof getDocs>>): MockTestResult[] => {
    const items: MockTestResult[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      items.push({
        id: typeof data.testId === 'string' ? data.testId : docSnap.id,
        title: typeof data.title === 'string' ? data.title : 'Mock Test',
        track: (typeof data.track === 'string' ? data.track : 'CLASS_12_BOARD') as ExamTrack,
        subjectLabel: typeof data.subjectLabel === 'string' ? data.subjectLabel : 'Full Syllabus',
        totalQuestions: typeof data.totalQuestions === 'number' ? data.totalQuestions : 0,
        attempted: typeof data.attempted === 'number' ? data.attempted : 0,
        correct: typeof data.correct === 'number' ? data.correct : 0,
        incorrect: typeof data.incorrect === 'number' ? data.incorrect : 0,
        score: typeof data.score === 'number' ? data.score : 0,
        maxScore: typeof data.maxScore === 'number' ? data.maxScore : 0,
        accuracyPercent: typeof data.accuracyPercent === 'number' ? data.accuracyPercent : 0,
        durationSeconds: typeof data.durationSeconds === 'number' ? data.durationSeconds : 0,
        timestamp: typeof data.takenAtEpochMs === 'number' ? data.takenAtEpochMs : Date.now(),
      });
    });
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  };

  try {
    const snapshot = await getDocs(q);
    return mapDocs(snapshot);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      try {
        const cached = await getDocsFromCache(q);
        return mapDocs(cached);
      } catch {
        return [];
      }
    }
    handleFirestoreError(error, OperationType.LIST, testsPath);
  }
}

export async function syncStudyStateToCloud(user: User, state: PersistedAppState): Promise<CloudStudySnapshot> {
  const uid = sanitizeId(user.uid);
  const completedChapterIds = Object.entries(state.chapterProgress ?? {})
    .filter(([, p]) => p.completed)
    .map(([id]) => id.slice(0, 80))
    .filter((id) => id.length >= 1)
    .slice(0, 200);

  const totalFocusMinutes = clampNumber(
    (state.focusSessions ?? []).reduce((sum, s) => sum + (s.actualMinutes || 0), 0),
    0,
    10000000
  );

  const payload = {
    ownerId: uid,
    selectedExamTrack: clampString(state.selectedClassTrack || 'CLASS_12_BOARD', 2, 40, 'CLASS_12_BOARD'),
    studyStreakDays: clampNumber(state.studyStreakDays, 0, 10000),
    xpPoints: computeEarnedXp(state),
    dailyGoalMinutes: clampNumber(state.dailyGoalMinutes || 360, 10, 1440),
    totalFocusMinutes,
    totalMockTests: clampNumber((state.testHistory ?? []).length, 0, 1000000),
    completedChapterIds,
  };

  const localFallbackSnapshot: CloudStudySnapshot = {
    selectedExamTrack: payload.selectedExamTrack,
    studyStreakDays: payload.studyStreakDays,
    xpPoints: payload.xpPoints,
    dailyGoalMinutes: payload.dailyGoalMinutes,
    totalFocusMinutes: payload.totalFocusMinutes,
    totalMockTests: payload.totalMockTests,
    completedChapterIds: payload.completedChapterIds,
    isOffline: true,
  };

  const profileOk = await ensureUserProfile(user, state);
  if (!profileOk) {
    return localFallbackSnapshot;
  }

  // Backfill up to 25 recent local mock tests to user's Firebase profile
  const recentTests = (state.testHistory ?? []).slice(0, 25);
  for (const testItem of recentTests) {
    const saved = await saveMockTestResultToCloud(user, state, testItem);
    if (!saved) {
      return localFallbackSnapshot;
    }
  }

  const syncPath = `users/${uid}/studyState/current`;
  const syncRef = doc(db, 'users', uid, 'studyState', 'current');

  try {
    const snap = await getDoc(syncRef);
    await setDoc(syncRef, {
      ...payload,
      createdAt: snap.exists() ? snap.data().createdAt ?? serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      selectedExamTrack: payload.selectedExamTrack,
      studyStreakDays: payload.studyStreakDays,
      xpPoints: payload.xpPoints,
      dailyGoalMinutes: payload.dailyGoalMinutes,
      totalFocusMinutes: payload.totalFocusMinutes,
      totalMockTests: payload.totalMockTests,
      completedChapterIds: payload.completedChapterIds,
      isOffline: false,
    };
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      return localFallbackSnapshot;
    }
    handleFirestoreError(error, OperationType.WRITE, syncPath);
  }
}

export async function loadCloudStudyState(user: User): Promise<CloudStudySnapshot | null> {
  const uid = sanitizeId(user.uid);
  const syncPath = `users/${uid}/studyState/current`;
  const syncRef = doc(db, 'users', uid, 'studyState', 'current');
  const mapSnapshot = (snap: Awaited<ReturnType<typeof getDoc>>): CloudStudySnapshot | null => {
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      selectedExamTrack: typeof data.selectedExamTrack === 'string' ? data.selectedExamTrack : 'CLASS_12_BOARD',
      studyStreakDays: typeof data.studyStreakDays === 'number' ? data.studyStreakDays : 1,
      xpPoints: typeof data.xpPoints === 'number' ? data.xpPoints : 0,
      dailyGoalMinutes: typeof data.dailyGoalMinutes === 'number' ? data.dailyGoalMinutes : 360,
      totalFocusMinutes: typeof data.totalFocusMinutes === 'number' ? data.totalFocusMinutes : 0,
      totalMockTests: typeof data.totalMockTests === 'number' ? data.totalMockTests : 0,
      completedChapterIds: Array.isArray(data.completedChapterIds)
        ? data.completedChapterIds.filter((id: unknown): id is string => typeof id === 'string')
        : [],
    };
  };

  try {
    const snap = await getDoc(syncRef);
    return mapSnapshot(snap);
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      try {
        const cached = await getDocFromCache(syncRef);
        return mapSnapshot(cached);
      } catch {
        return null;
      }
    }
    handleFirestoreError(error, OperationType.GET, syncPath);
  }
}
