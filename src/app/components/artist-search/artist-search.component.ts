import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, setDoc, arrayUnion, getDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

import { doc } from '@angular/fire/firestore';

import { Artwork } from '../../models/Artwork';
import { Ticket } from '../../models/Ticket';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-artist-search',
  templateUrl: './artist-search.component.html',
  styleUrls: ['./artist-search.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ArtistSearchComponent {
  query: string = '';
  results: Artwork[] = [];
  selectedArtwork: Artwork | null = null;
  ticketPurchased: boolean = false;

  constructor(private firestore: Firestore, private authService: AuthService) { }

  async search() {
    console.log('Pretražujem za:', this.query);
    const collectionRef = collection(this.firestore, 'artworks');
    const snapshot = await getDocs(collectionRef);
    const allDocs = snapshot.docs.map(doc => {
      const data = doc.data() as Artwork;
      data.id = doc.id;
      return data;
    });

    this.results = allDocs.filter(item =>
      item.name.toLowerCase().includes(this.query.toLowerCase())
    );


    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }

  selectArtwork(artwork: Artwork) {
    this.selectedArtwork = artwork;
    this.ticketPurchased = this.authService.user?.tickets?.some(t => t.artworkId === artwork.id) || false;
  }

  async buyTicket() {
    const user = this.authService.user;
    if (!user || !this.selectedArtwork) return;

    const ticketData: Ticket = {
      artworkId: this.selectedArtwork.id,
      date: new Date().toISOString(),
      purchasedAt: new Date().toISOString()
    };

    console.log('Kupujem kartu za:', user.id);
    const userRef = doc(this.firestore, `users/${user.id}`);
    await setDoc(userRef, { tickets: arrayUnion(ticketData) }, { merge: true });
    await this.authService.updateUserRef();

    this.ticketPurchased = true;
  }

  closeDetails() {
    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }

  closeDetailsByOverlay(event: MouseEvent) {
    this.selectedArtwork = null;
    this.ticketPurchased = false;
  }

}
