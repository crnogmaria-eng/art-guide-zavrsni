import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  constructor(private auth: Auth, private authService: AuthService, private injector: Injector) { }

  async savePreferences(preferences: string[]): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    await runInInjectionContext(this.injector, async () => {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userRef, { preferences }, { merge: true });
      this.authService.updateUserRef();

    });

  }
}
