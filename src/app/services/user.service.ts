import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: Firestore, private auth: Auth) {}

   getCurrentUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        if (user) resolve(user.uid);
        else resolve(null);
      });
    });
  }

  async savePreferences(preferences: string[]): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, { preferences }, { merge: true });
  }

  async getPreferences(): Promise<string[]> {
    const user = this.auth.currentUser;
    if (!user) return [];

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data()['preferences'] || [] : [];
  }
}
