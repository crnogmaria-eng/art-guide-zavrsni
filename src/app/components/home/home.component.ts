import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { getDownloadURL, ref } from '@angular/fire/storage';
import { runInInjectionContext, Injector } from '@angular/core';
import { Preferenca } from '../../models/Preferenca';
import { Subscription } from 'rxjs';
import { Firestore, getDocs } from '@angular/fire/firestore';
import { collection } from 'firebase/firestore';
import { ArtLocation } from '../../models/ArtLocation';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  currentUserEmail: string | null = null;
  firestore = inject(Firestore);

  userPreferences: string[] = [];
  filteredLocations: ArtLocation[] = [];
  heroTitle: string = 'Istraži svijet umjetnosti';

  private userSubscription: Subscription | null = null;


  allLocations: ArtLocation[] | null = null;

  constructor(
    private userService: UserService,
    private router: Router,
    public authService: AuthService,
    private injector: Injector
  ) { }

  async ngOnInit() {

    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userPreferences = user.preferences || [];
        this.filterLocations();
      }
    })

    await runInInjectionContext(this.injector, async () => {
      try {
        const locationsCol = collection(this.firestore, 'locations');
        const locationsSnap = await getDocs(locationsCol);
        this.allLocations = locationsSnap.docs.map(d => {
          const location = d.data() as ArtLocation;
          location.id = d.id;
          return location;
        });

        this.filterLocations();
      } catch (err) {
        console.error('Failed to load locations', err);
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }

  private filterLocations() {
    this.filteredLocations = this.allLocations?.filter(loc =>
      loc.styles.some(style => this.userPreferences.includes(style))
    ) || [];
  }

  resetPreferences() {
    this.userService.savePreferences([]).then(() => {
      this.userPreferences = [];
      this.filteredLocations = [];
      this.router.navigate(['/questionnaire']);
    });
  }
}
