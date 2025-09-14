import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, doc, updateDoc, deleteDoc, getDocs } from '@angular/fire/firestore';
import { forkJoin, take } from 'rxjs';
import { AppUser } from '../../models/AppUser';
import { Ticket } from '../../models/Ticket';
import { Artwork } from '../../models/Artwork';
import { EditAppUser } from '../../models/EditAppUser';
import { Preferenca } from '../../models/Preferenca';

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

  editingUser: (Partial<EditAppUser> | null) = null;

  constructor(private firestore: Firestore) { }

  ngOnInit() {
    const usersCol = collection(this.firestore, 'users');
    const artworksCol = collection(this.firestore, 'artworks');

    forkJoin([getDocs(usersCol), getDocs(artworksCol)]).pipe(take(1)).subscribe(([usersSnap, artworksSnap]) => {
      this.artworks = artworksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Artwork[];

      this.users = usersSnap.docs.map(doc => {
        const data = doc.data() as EditAppUser;
        data.id = doc.id;
        data.preferencesString = (data.preferences || []).join(', ');
        data.ticketsString = ((data.tickets || []).map(x => this.artworks.find(e => e.id == x.artworkId)?.id)).join(', ');
        return data;
      });
    });
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
        .map((t: string) => this.artworks.find(a => a.id === t)?.id)
        .filter(Boolean);

      const newTickets: Ticket[] = ticketIds.filter(t => t !== '' && !this.editingUser?.tickets?.some(x => x.artworkId === t)).map(t => {
        const artwork = this.artworks.find(a => a.id === t);
        return { artworkId: artwork?.id, date: new Date().toISOString(), purchasedAt: new Date().toISOString() } as Ticket;
      });

      const updatedTickets: Ticket[] = (this.editingUser.tickets || []).filter(t => ticketIds.includes(t.artworkId));

      updatedState.tickets = [...updatedTickets, ...newTickets];

      updatedState.preferences = preferences;

      this.editingUser.preferencesString = preferences.join(', ');
      this.editingUser.ticketsString = updatedState.tickets.map(x => x.artworkId).join(', ');

      await updateDoc(userRef, { ...updatedState });
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
