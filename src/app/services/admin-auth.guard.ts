import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthGuard implements CanActivate {
    private router = inject(Router);
    constructor(private authService: AuthService) { }

    async canActivate(): Promise<boolean> {
        const role = this.authService.currentUser.value?.role;
        if (role === 'admin') return true;

        // korisnik nije administrator
        this.router.navigate(['/']);
        return false;
    }
}
