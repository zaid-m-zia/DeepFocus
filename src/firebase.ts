import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { Task, FocusSession, StreakState, Badge } from './types';

// The user's exact Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyD0CxlXEvM11uvxC-egAWDmxxN18WtA2gY",
  authDomain: "deepfocus-f3ba5.firebaseapp.com",
  projectId: "deepfocus-f3ba5",
  storageBucket: "deepfocus-f3ba5.firebasestorage.app",
  messagingSenderId: "455559139105",
  appId: "1:455559139105:web:cf78c39b4e912f3d83b860",
  measurementId: "G-8MD60JDE6B"
};

// Initialize Firebase singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Generate human-readable Recovery Code: DF-XXXX-XXXX
export function generateRecoveryCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Clear, unambiguous alphanumeric chars
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DF-${p1}-${p2}`;
}

const LOCAL_RECOVERY_CODE_KEY = 'deepfocus_recovery_code_v1';

export function getLocalRecoveryCode(): string | null {
  try {
    return localStorage.getItem(LOCAL_RECOVERY_CODE_KEY);
  } catch {
    return null;
  }
}

export function setLocalRecoveryCode(code: string): void {
  try {
    localStorage.setItem(LOCAL_RECOVERY_CODE_KEY, code);
  } catch (e) {
    console.error('Failed to store recovery code locally', e);
  }
}

export interface UserCloudData {
  uid: string;
  recoveryCode: string;
  tasks: Task[];
  sessions: FocusSession[];
  streak: StreakState;
  badges?: Badge[];
  updatedAt?: string | null;
}

// Ensure an anonymous user is signed in silently without any visible UI
export async function initAnonymousAuth(onUserReady: (user: User, recoveryCode: string) => void): Promise<() => void> {
  // Test connection in background
  try {
    getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
      // Benign connection probe
    });
  } catch {
    // Ignore offline probe
  }

  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    let activeUser = currentUser;

    if (!activeUser) {
      try {
        const credential = await signInAnonymously(auth);
        activeUser = credential.user;
      } catch (err) {
        console.warn('Anonymous sign in notice:', err);
        return;
      }
    }

    if (activeUser) {
      let code = getLocalRecoveryCode();
      if (!code) {
        code = generateRecoveryCode();
        setLocalRecoveryCode(code);
      }

      // Check if code mapping already exists in Firestore, else record it
      try {
        const codeDocRef = doc(db, 'recoveryCodes', code);
        const codeSnap = await getDoc(codeDocRef);
        if (!codeSnap.exists()) {
          await setDoc(codeDocRef, {
            code,
            uid: activeUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `recoveryCodes/${code}`);
      }

      onUserReady(activeUser, code);
    }
  });

  return unsubscribe;
}

// Sync all data to user's Firestore document
export async function syncUserDataToFirestore(
  user: User,
  recoveryCode: string,
  data: {
    tasks: Task[];
    sessions: FocusSession[];
    streak: StreakState;
    badges: Badge[];
  }
): Promise<boolean> {
  if (!user || !user.uid) return false;

  const payload = {
    uid: user.uid,
    recoveryCode,
    tasks: data.tasks,
    sessions: data.sessions,
    streak: data.streak,
    badges: data.badges,
    updatedAt: new Date().toISOString(),
  };

  try {
    // 1. Write to private /users/{uid} document
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, payload, { merge: true });

    // 2. Update recoveryCode document mapping & snapshot for easy multi-device restore
    if (recoveryCode) {
      const codeDocRef = doc(db, 'recoveryCodes', recoveryCode);
      await setDoc(codeDocRef, {
        code: recoveryCode,
        uid: user.uid,
        backupData: {
          tasks: data.tasks,
          sessions: data.sessions,
          streak: data.streak,
          badges: data.badges,
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    return false;
  }
}

// Fetch user data from Firestore on app load
export async function fetchUserDataFromFirestore(user: User): Promise<UserCloudData | null> {
  if (!user || !user.uid) return null;

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserCloudData;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }
  return null;
}

// Restore data from a human-readable recovery code (DF-XXXX-XXXX)
export async function restoreFromRecoveryCode(codeToRestore: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    tasks: Task[];
    sessions: FocusSession[];
    streak: StreakState;
    badges?: Badge[];
    recoveryCode: string;
  };
}> {
  const normalizedCode = codeToRestore.trim().toUpperCase();
  if (!normalizedCode.startsWith('DF-') || normalizedCode.length < 9) {
    return {
      success: false,
      message: 'Invalid code format. Recovery code must be in the format DF-XXXX-XXXX.',
    };
  }

  try {
    const codeDocRef = doc(db, 'recoveryCodes', normalizedCode);
    const codeSnap = await getDoc(codeDocRef);

    if (!codeSnap.exists()) {
      return {
        success: false,
        message: 'No cloud backup found for this recovery code. Please check for typos.',
      };
    }

    const codeData = codeSnap.data();
    const targetUid = codeData?.uid;
    let backupData = codeData?.backupData;

    // If backupData is not in recovery code doc, try fetching from /users/{targetUid}
    if (!backupData && targetUid) {
      try {
        const targetUserDoc = await getDoc(doc(db, 'users', targetUid));
        if (targetUserDoc.exists()) {
          backupData = targetUserDoc.data();
        }
      } catch {
        // May be restricted if different UID, backupData on recoveryCodes acts as the secure snapshot
      }
    }

    if (!backupData) {
      return {
        success: false,
        message: 'Recovery code located, but backup archive is empty.',
      };
    }

    // Successfully retrieved backup
    setLocalRecoveryCode(normalizedCode);

    return {
      success: true,
      message: 'Cloud backup successfully restored!',
      data: {
        tasks: backupData.tasks || [],
        sessions: backupData.sessions || [],
        streak: backupData.streak || { currentStreak: 0, bestStreak: 0, lastActiveDate: null },
        badges: backupData.badges,
        recoveryCode: normalizedCode,
      },
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `recoveryCodes/${normalizedCode}`);
    return {
      success: false,
      message: 'Unable to connect to cloud backup. Please verify your internet connection and try again.',
    };
  }
}
