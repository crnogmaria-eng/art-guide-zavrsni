import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

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

  constructor(
    private authService: AuthService,
    private router: Router  
  ) {}

  async login() {
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/']); 
    } catch (error: any) {
      this.errorMessage = error.message || 'Greška pri prijavi.';
    }
  }
}

