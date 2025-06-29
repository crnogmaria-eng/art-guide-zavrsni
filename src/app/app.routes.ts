import { Routes } from '@angular/router';
import { QuestionnaireComponent } from './components/questionnaire.component';
import { HomeComponent } from './components/home.component';
import { ArtistSearchComponent } from './components/artist-search.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';


export const routes: Routes = [
  { path: '', redirectTo: 'questionnaire', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'questionnaire', component: QuestionnaireComponent },
  { path: 'home', component: HomeComponent },
  { path: 'artist-search', component: ArtistSearchComponent },
  {path: 'profile',
  loadComponent: () => import('./components/profile.component').then(m => m.ProfileComponent)},
  { path: 'artist-search', component: ArtistSearchComponent }

];
