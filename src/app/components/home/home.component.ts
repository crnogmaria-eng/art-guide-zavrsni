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
  isLoggedIn = false;
  currentUserEmail: string | null = null;

  userPreferences: string[] = [];
  filteredLocations: ArtLocation[] = [];
  heroTitle: string = 'Istraži svijet umjetnosti';

  private userSubscription: Subscription | null = null;


  allLocations: ArtLocation[] = [
    { name: 'Muzej Moderne Umjetnosti', address: 'Ulica A 1', styles: [Preferenca.Moderna] },
    { name: 'Galerija Klasike', address: 'Ulica B 2', styles: [Preferenca.Klasicna] },
    { name: 'Street Art Kutak', address: 'Ulica C 3', styles: [Preferenca.Ulicna] },
    { name: 'Foto Izložba', address: 'Ulica D 4', styles: [Preferenca.Fotografija] },
    { name: 'Miješani Stilovi Galerija', address: 'Ulica E 5', styles: [Preferenca.Moderna, Preferenca.Fotografija] },
  ];

  constructor(
    private userService: UserService,
    private router: Router,
    public authService: AuthService,
  ) { }

  ngOnInit(): void {

    this.userSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userPreferences = user.preferences || [];
        this.filterLocations();
      }
    })
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
    this.filteredLocations = this.allLocations.filter(loc =>
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
