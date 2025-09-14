import { Component, Injector, OnInit, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, doc, updateDoc, deleteDoc, getDocs } from '@angular/fire/firestore';
import { forkJoin, Subscription, take } from 'rxjs';
import { AppUser } from '../../models/AppUser';
import { Ticket } from '../../models/Ticket';
import { Artwork } from '../../models/Artwork';
import { EditAppUser } from '../../models/EditAppUser';
import { Preferenca } from '../../models/Preferenca';
import { ArtLocation } from '../../models/ArtLocation';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit {
  users: Array<EditAppUser> = [];
  artworks: Artwork[] = [];
  locations: ArtLocation[] = [];
  editingUser: (Partial<EditAppUser> | null) = null;
  userSubscription: Subscription | null = null;
  currentUserId: string | null = null;

  constructor(private firestore: Firestore, private injector: Injector, private authService: AuthService) { }

  async ngOnInit() {
    await runInInjectionContext(this.injector, async () => {
      const usersCol = collection(this.firestore, 'users');
      const artistCol = collection(this.firestore, 'artist');
      const locationsCol = collection(this.firestore, 'locations');

      forkJoin([getDocs(usersCol), getDocs(artistCol), getDocs(locationsCol)]).pipe(take(1)).subscribe(([usersSnap, artistsSnap, locationsSnap]) => {
        this.artworks = artistsSnap.docs.map(doc => doc.data() as Artwork);
        this.locations = locationsSnap.docs.map(doc => {
          const data = doc.data() as ArtLocation;
          data.id = doc.id;
          data.date
          return data;
        });

        this.users = usersSnap.docs.map(doc => {
          const data = doc.data() as EditAppUser;
          data.id = doc.id;
          data.preferencesString = (data.preferences || []).join(', ');
          data.ticketsString = ((data.tickets || []).filter(x => this.locations.find(e => e.id == x.locationId))
            .map(x => this.locations.find(e => e.id == x.locationId)?.id)).join(', ');
          return data;
        });
      });

    });

    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUserId = user?.id || null;
    });

  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  // Begin editing a user
  editUser(user: EditAppUser) {
    // expose comma-separated strings for easier editing in inputs
    this.editingUser = user;
  }

  // Save changes from editingUser back to Firestore
  async saveEdit() {
    if (!this.editingUser?.id) return;
    try {
      const userRef = doc(this.firestore, `users/${this.editingUser.id}`);

      const updatedState: AppUser = this.editingUser as AppUser;

      const preferences = (this.editingUser.preferencesString || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s !== '' && Object.values(Preferenca).includes(s as Preferenca));

      const ticketIds = (this.editingUser.ticketsString || '')
        .split(',')
        .map((s: string) => s.trim())
        .map((t: string) => this.locations.find(a => a.id === t)?.id)
        .filter(Boolean);

      const newTickets: Ticket[] = ticketIds.filter(t => t !== '' && !this.editingUser?.tickets?.some(x => x.locationId === t)).map(t => {
        const location = this.locations.find(l => l.id === t);
        return { locationId: location?.id, purchasedAt: new Date().toISOString() } as Ticket;
      });

      const updatedTickets: Ticket[] = (this.editingUser.tickets || []).filter(t => ticketIds.includes(t.locationId));

      updatedState.tickets = [...updatedTickets, ...newTickets];

      updatedState.preferences = preferences;

      this.editingUser.preferencesString = preferences.join(', ');
      this.editingUser.ticketsString = updatedState.tickets.map(x => x.locationId).join(', ');

      await updateDoc(userRef, { ...updatedState });
      if (this.editingUser?.id === this.currentUserId) {
        this.authService.updateUserRef();
      };
      this.editingUser = null;
    } catch (err) {
      console.error('Failed to save user edits', err);
    }
  }

  cancelEdit() {
    this.editingUser = null;
  }

  // Update a single field (useful for role toggles)
  async updateField(userId: string, field: string, value: any) {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      await updateDoc(userRef, { [field]: value });
    } catch (err) {
      console.error('Failed to update field', err);
    }
  }

  // Delete a user document
  async deleteUser(userId: string) {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      await deleteDoc(userRef);
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  }

}
