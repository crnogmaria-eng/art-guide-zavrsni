import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { getDownloadURL, ref, Storage } from '@angular/fire/storage';
import { runInInjectionContext, Injector } from '@angular/core';


interface ArtLocation {
  name: string;
  address: string;
  styles: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private auth: Auth = inject(Auth);
  isLoggedIn = false;
  currentUserEmail: string | null = null;
  storage = inject(Storage);
  backgroundUrl: string = '';

  userPreferences: string[] = [];
  filteredLocations: ArtLocation[] = [];
  heroTitle: string = 'Istraži svijet umjetnosti';
  


  allLocations: ArtLocation[] = [
    { name: 'Muzej Moderne Umjetnosti', address: 'Ulica A 1', styles: ['Moderna'] },
    { name: 'Galerija Klasike', address: 'Ulica B 2', styles: ['Klasična'] },
    { name: 'Street Art Kutak', address: 'Ulica C 3', styles: ['Ulična'] },
    { name: 'Foto Izložba', address: 'Ulica D 4', styles: ['Fotografija'] },
    { name: 'Miješani Stilovi Galerija', address: 'Ulica E 5', styles: ['Moderna', 'Fotografija'] },
  ];

  constructor(
    private userService: UserService,
    private router: Router,
    public authService: AuthService,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      this.isLoggedIn = !!user;
      this.currentUserEmail = user?.email ?? null;

      if (this.isLoggedIn) {
        this.userPreferences = await this.userService.getPreferences();
        this.filterLocations();
      } else {
        this.userPreferences = [];
        this.filteredLocations = [];
      }
    });
    runInInjectionContext(this.injector, async () => {
  const imageRef = ref(this.storage, 'hero/pozadina.jpg'); 
  this.backgroundUrl = await getDownloadURL(imageRef);
});

  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }

  private filterLocations() {
    this.filteredLocations = this.allLocations.filter(loc =>
      loc.styles.some(style => this.userPreferences.includes(style))
    );
  }

  resetPreferences() {
    this.userService.savePreferences([]).then(() => {
      this.userPreferences = [];
      this.filteredLocations = [];
      this.router.navigate(['/questionnaire']);
    });
  }
}
