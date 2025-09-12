import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { AppUser } from '../models/AppUser';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  public currentUser: BehaviorSubject<AppUser | null> = new BehaviorSubject<AppUser | null>(null);

  constructor() {
    // Ako se refresha stranica, zadržati stanje prijavljenog korisnika
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userRef = doc(this.firestore, `users/${user.uid}`);
        const snapshot = await getDoc(userRef);
        const userData: AppUser = snapshot.exists() ? (snapshot.data() as AppUser) : { id: '', email: '', role: 'user', tickets: [], preferences: [] };
        userData.id = user.uid;
        this.currentUser.next(userData);
      } else {
        this.currentUser.next(null);
      }
    });
  }

  public get user(): AppUser | null {
    return this.currentUser.value;
  }

  async login(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    if (userCredential.user) {
      const userRef = doc(this.firestore, `users/${userCredential.user.uid}`);
      const snapshot = await getDoc(userRef);
      const userData = snapshot.data() as AppUser;
      userData.id = userCredential.user.uid;
      console.log(userData);
      this.currentUser.next(userData);
      console.log('Uspješna prijava:', userData);

      this.router.navigate(['/']); // preusmjeri na početnu nakon uspješne prijave
    }
  }

  async updateUserRef() {
    const user = this.auth.currentUser;
    if (user) {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const snapshot = await getDoc(userRef);
      const userData: AppUser = snapshot.data() as AppUser;
      userData.id = user.uid;
      this.currentUser.next(userData);
    }
  }

  async register(email: string, password: string) {
    const userCredentials = await createUserWithEmailAndPassword(this.auth, email, password);

    const user: AppUser = {
      id: userCredentials.user.uid,
      email: email,
      role: 'user',
      tickets: [],
      preferences: []
    }

    const userRef = doc(this.firestore, `users/${userCredentials.user.uid}`);
    await setDoc(userRef, user);

    this.currentUser.next(user);
    this.router.navigate(['/']); // preusmjeri na početnu nakon uspješne registracije
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, user => resolve(user));
    });
  }

  async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }
}

