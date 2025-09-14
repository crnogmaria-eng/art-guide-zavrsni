import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Preferenca } from '../../models/Preferenca';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css']
})
export class QuestionnaireComponent {
  selectedStyles: string[] = [];
  artStyles = [Preferenca.Moderna, Preferenca.Klasicna, Preferenca.Ulicna, Preferenca.Fotografija];
  userSubscription: Subscription | null = null;
  constructor(private userService: UserService, private router: Router, private authservice: AuthService) { }


  ngOnInit() {
    this.userSubscription = this.authservice.currentUser.subscribe(user => {
      if (user) {
        this.selectedStyles = user.preferences || [];
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  onCheckboxChange(event: Event, style: string) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.toggleStyle(style, isChecked);
  }


  toggleStyle(style: string, isChecked: boolean) {
    if (isChecked) {
      this.selectedStyles.push(style);
    } else {
      this.selectedStyles = this.selectedStyles.filter(s => s !== style);
    }
  }


  async submitPreferences() {
    await this.userService.savePreferences(this.selectedStyles);
    this.router.navigate(['/home']);
  }
}
