import { Routes } from '@angular/router';
import { QuestionnaireComponent } from './components/questionnaire/questionnaire.component';
import { HomeComponent } from './components/home/home.component';
import { ArtistSearchComponent } from './components/artist-search/artist-search.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminAuthGuard } from './services/admin-auth.guard';
import { ManageUsersComponent } from './components/admin-manage-users/manage-users.component';
import { ManageArtistComponent } from './components/admin-manage-artist/manage-artists.component';
import { ManageLocationsComponent } from './components/admin-manage-locations/manage-locations.component';

export const routes: Routes = [
  { path: '', redirectTo: 'questionnaire', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'questionnaire', component: QuestionnaireComponent },
  { path: 'home', component: HomeComponent },
  { path: 'artist-search', component: ArtistSearchComponent },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },

  // Admin-protected management pages
  {
    path: 'admin/manage-users',
    component: ManageUsersComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/manage-artists',
    component: ManageArtistComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/manage-locations',
    component: ManageLocationsComponent,
    canActivate: [AdminAuthGuard]
  },
];
