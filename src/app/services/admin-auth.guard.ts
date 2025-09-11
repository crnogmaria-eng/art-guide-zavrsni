import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthGuard implements CanActivate {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);
    private authService = inject(AuthService);

    async canActivate(): Promise<boolean> {
        const user = await this.authService.getCurrentUser();
        if (!user) {
            this.router.navigate(['/login']);
            return false;
        }

        const userRef = doc(this.firestore, `users/${user.uid}`);
        const snap = await getDoc(userRef);
        const role = snap.exists() ? (snap.data() as any).role : null;

        if (role === 'admin') return true;

        // not an admin
        this.router.navigate(['/']);
        return false;
    }
}
