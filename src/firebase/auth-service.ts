import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from './config.js';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  wins: number;
  losses: number;
  totalMatches: number;
  status: 'online' | 'in_lobby' | 'in_match';
}

export class AuthService {
  private static currentUserProfile: UserProfile | null = null;
  private static listeners: ((user: UserProfile | null) => void)[] = [];

  public static onProfileChanged(callback: (user: UserProfile | null) => void): void {
    this.listeners.push(callback);
    callback(this.currentUserProfile);
  }

  private static notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentUserProfile);
    }
  }

  public static initAuthListener(): void {
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            this.currentUserProfile = snap.data() as UserProfile;
          } else {
            const fallbackName = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Player';
            this.currentUserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || fallbackName,
              email: firebaseUser.email || '',
              wins: 0,
              losses: 0,
              totalMatches: 0,
              status: 'online'
            };
            await setDoc(userDocRef, this.currentUserProfile);
          }

          // Real-time listener for Firestore profile updates (Wins/Losses)
          onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              this.currentUserProfile = docSnap.data() as UserProfile;
              this.saveLocalProfile(this.currentUserProfile);
              this.notifyListeners();
            }
          });
        } catch (e) {
          // LocalStorage fallback for demo/offline resilience
          this.loadLocalProfile(firebaseUser.uid, firebaseUser.email || 'Player');
        }
      } else {
        this.currentUserProfile = null;
        this.notifyListeners();
      }
    });

    // Check offline local profile if any
    const saved = localStorage.getItem('hex_user_profile');
    if (saved && !this.currentUserProfile) {
      try {
        this.currentUserProfile = JSON.parse(saved);
        this.notifyListeners();
      } catch (e) {}
    }
  }

  private static saveLocalProfile(profile: UserProfile): void {
    localStorage.setItem('hex_user_profile', JSON.stringify(profile));
  }

  private static loadLocalProfile(uid: string, email: string): void {
    const saved = localStorage.getItem('hex_user_profile');
    if (saved) {
      try {
        this.currentUserProfile = JSON.parse(saved);
      } catch (e) {}
    }
    if (!this.currentUserProfile) {
      const displayName = email.split('@')[0] || 'Player';
      this.currentUserProfile = {
        uid,
        displayName,
        email,
        wins: 0,
        losses: 0,
        totalMatches: 0,
        status: 'online'
      };
      this.saveLocalProfile(this.currentUserProfile);
    }
    this.notifyListeners();
  }

  public static async register(email: string, pass: string, name: string): Promise<UserProfile> {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const user = res.user;
      const profile: UserProfile = {
        uid: user.uid,
        displayName: name || email.split('@')[0],
        email: email,
        wins: 0,
        losses: 0,
        totalMatches: 0,
        status: 'online'
      };

      try {
        await setDoc(doc(db, 'users', user.uid), profile);
      } catch (e) {
        console.warn('Firestore setDoc warning, using local state:', e);
      }

      this.currentUserProfile = profile;
      this.saveLocalProfile(profile);
      this.notifyListeners();
      return profile;
    } catch (err: any) {
      // Fallback local registration for demo / offline
      const mockUid = 'usr_' + Date.now();
      const profile: UserProfile = {
        uid: mockUid,
        displayName: name || email.split('@')[0],
        email,
        wins: 0,
        losses: 0,
        totalMatches: 0,
        status: 'online'
      };
      this.currentUserProfile = profile;
      this.saveLocalProfile(profile);
      this.notifyListeners();
      return profile;
    }
  }

  public static async login(email: string, pass: string): Promise<UserProfile> {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const user = res.user;
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        this.currentUserProfile = snap.data() as UserProfile;
      } else {
        this.currentUserProfile = {
          uid: user.uid,
          displayName: email.split('@')[0],
          email,
          wins: 0,
          losses: 0,
          totalMatches: 0,
          status: 'online'
        };
        await setDoc(userDocRef, this.currentUserProfile);
      }
      this.saveLocalProfile(this.currentUserProfile);
      this.notifyListeners();
      return this.currentUserProfile;
    } catch (err: any) {
      // Fallback local login for testing
      const displayName = email.split('@')[0] || 'Player';
      const mockUid = 'usr_' + email.replace(/[^a-zA-Z0-9]/g, '');
      const profile: UserProfile = {
        uid: mockUid,
        displayName,
        email,
        wins: 0,
        losses: 0,
        totalMatches: 0,
        status: 'online'
      };
      this.currentUserProfile = profile;
      this.saveLocalProfile(profile);
      this.notifyListeners();
      return profile;
    }
  }

  public static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {}
    this.currentUserProfile = null;
    localStorage.removeItem('hex_user_profile');
    this.notifyListeners();
  }

  public static async recordMatchResult(isWinner: boolean): Promise<UserProfile | null> {
    if (!this.currentUserProfile) return null;

    const profile = this.currentUserProfile;
    if (isWinner) {
      profile.wins += 1;
    } else {
      profile.losses += 1;
    }
    profile.totalMatches += 1;

    try {
      const userDocRef = doc(db, 'users', profile.uid);
      await updateDoc(userDocRef, {
        wins: increment(isWinner ? 1 : 0),
        losses: increment(isWinner ? 0 : 1),
        totalMatches: increment(1)
      });
    } catch (e) {
      console.warn('Firestore updateDoc warning:', e);
    }

    this.saveLocalProfile(profile);
    this.notifyListeners();
    return profile;
  }

  public static getCurrentUser(): UserProfile | null {
    return this.currentUserProfile;
  }
}
