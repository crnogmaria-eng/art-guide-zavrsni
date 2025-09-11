import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  private auth: Auth = inject(Auth);

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Nakon refreshanja stranice, dohvati usera i ako postoji, preusmjeri na početnu
    this.authService.currentUser.subscribe(user => {
      if (user) this.router.navigate(['/']);
    });
  }

  async login() {
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Greška pri prijavi.';
    }
  }
}

