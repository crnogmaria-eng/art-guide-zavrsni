import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  auth = inject(Auth);
  router = inject(Router);

  get isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
