import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  async login(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    if (userCredential.user) {
      this.router.navigate(['/']); // preusmjeri na početnu nakon uspješne prijave
    }
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
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

