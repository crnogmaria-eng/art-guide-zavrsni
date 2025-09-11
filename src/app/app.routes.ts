import { Routes } from '@angular/router';
import { QuestionnaireComponent } from './components/questionnaire.component';
import { HomeComponent } from './components/home.component';
import { ArtistSearchComponent } from './components/artist-search.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { AdminAuthGuard } from './services/admin-auth.guard';
import { ManageUsersComponent } from './components/manage-users.component';
import { ManageArtistComponent } from './components/manage-artist.component';
import { ManageQuestionaireComponents } from './components/manage-questionaire.component';

export const routes: Routes = [
  { path: '', redirectTo: 'questionnaire', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'questionnaire', component: QuestionnaireComponent },
  { path: 'home', component: HomeComponent },
  { path: 'artist-search', component: ArtistSearchComponent },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile.component').then(m => m.ProfileComponent)
  },

  // Admin-protected management pages
  {
    path: 'admin/manage-users',
    component: ManageUsersComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/manage-artist',
    component: ManageArtistComponent,
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'admin/manage-questionaire',
    component: ManageQuestionaireComponents,
    canActivate: [AdminAuthGuard]
  },

  // duplicate removed intentionally (keep existing artist-search entry above)
];
