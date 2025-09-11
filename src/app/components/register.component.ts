import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    // Nakon refreshanja stranice, dohvati usera i ako postoji, preusmjeri na početnu
    this.authService.currentUser.subscribe(x => {
      if (x) this.router.navigate(['/']);
    });
  }

  async register() {
    try {
      await this.authService.register(this.email, this.password);
      this.router.navigate(['/questionnaire']);
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }
}
