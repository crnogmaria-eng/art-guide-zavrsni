import { Component, inject, Injector, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of, Subscription } from 'rxjs';
import { AppUser } from '../../models/AppUser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  firestore = inject(Firestore);
  tickets$: Observable<any[]> = of([]);
  preferences: string[] = [];
  userSubscription: Subscription | null = null;

  constructor(private injector: Injector, private authService: AuthService) {
  }

  ngOnInit() {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.setProfileData(user);
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  private async setProfileData(user: AppUser) {
    await runInInjectionContext(this.injector, async () => {
      const ticketsRef = collection(this.firestore, `users/${user.id}/tickets`);
      this.tickets$ = collectionData(ticketsRef, { idField: 'id' });

      const userRef = doc(this.firestore, `users/${user.id}`);
      const snapshot = await getDoc(userRef);
      const userData = snapshot.data() as AppUser;
      this.preferences = userData?.preferences || [];

    });
  }
}
